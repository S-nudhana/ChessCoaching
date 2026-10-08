import uuid
from datetime import datetime, timezone

import chess
import pytest

from app.analysis import commentary_service
from app.analysis.facts import build_verified_facts
from app.analysis.gemini_client import GeminiRateLimitError
from app.engine.stockfish_pool import stockfish_pool

SESSION = "pytest-session"
HEADERS = {"X-Session-Id": SESSION}


def _insert_game(conn, fen, player_color="white", difficulty=5, status="in_progress"):
    game_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """INSERT INTO games
           (game_id, session_id, fen, pgn, player_color, difficulty, commentary_style, status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (game_id, SESSION, fen, "", player_color, difficulty, "coach", status, now, now),
    )
    conn.commit()
    return game_id


def test_new_game_and_move_flow(client):
    resp = client.post(
        "/api/game/new",
        json={"player_color": "white", "difficulty": 3, "commentary_style": "coach"},
        headers=HEADERS,
    )
    assert resp.status_code == 200
    game_id = resp.json()["game_id"]

    resp = client.post("/api/game/move", json={"game_id": game_id, "uci": "e2e4"}, headers=HEADERS)
    assert resp.status_code == 200
    body = resp.json()
    assert body["player_move"]["san"] == "e4"
    assert body["ai_move"] is not None
    assert body["commentary_after"]["source"] in ("gemini", "template", "cache")
    assert body["game_status"] == "in_progress"


def test_illegal_move_rejected(client):
    resp = client.post(
        "/api/game/new",
        json={"player_color": "white", "difficulty": 3, "commentary_style": "coach"},
        headers=HEADERS,
    )
    game_id = resp.json()["game_id"]
    resp = client.post("/api/game/move", json={"game_id": game_id, "uci": "e2e5"}, headers=HEADERS)
    assert resp.status_code == 400


def test_castling(client, test_conn):
    fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"
    game_id = _insert_game(test_conn, fen)
    resp = client.post("/api/game/move", json={"game_id": game_id, "uci": "e1g1"}, headers=HEADERS)
    assert resp.status_code == 200
    after = resp.json()["player_move"]["fen_after"]
    board = chess.Board(after)
    assert board.piece_at(chess.G1).piece_type == chess.KING
    assert board.piece_at(chess.F1).piece_type == chess.ROOK


def test_en_passant(client, test_conn):
    fen = "8/8/8/3pP3/8/8/8/4K2k w - d6 0 1"
    game_id = _insert_game(test_conn, fen)
    resp = client.post("/api/game/move", json={"game_id": game_id, "uci": "e5d6"}, headers=HEADERS)
    assert resp.status_code == 200
    after = resp.json()["player_move"]["fen_after"]
    board = chess.Board(after)
    assert board.piece_at(chess.D5) is None  # captured en passant
    assert board.piece_at(chess.D6).piece_type == chess.PAWN


def test_promotion(client, test_conn):
    fen = "8/4P3/8/8/8/8/8/4K2k w - - 0 1"
    game_id = _insert_game(test_conn, fen)
    resp = client.post("/api/game/move", json={"game_id": game_id, "uci": "e7e8q"}, headers=HEADERS)
    assert resp.status_code == 200
    after = resp.json()["player_move"]["fen_after"]
    board = chess.Board(after)
    assert board.piece_at(chess.E8).piece_type == chess.QUEEN


@pytest.mark.asyncio
async def test_accuracy_check_regenerates_then_falls_back_to_template(test_conn, monkeypatch):
    facts = await build_verified_facts(chess.Board().fen(), stockfish_pool, depth=6)
    call_count = {"n": 0}

    async def fake_call_gemini(style, facts_before, ai_move_san, facts_after):
        call_count["n"] += 1
        # e4 is a valid chess square but empty in the starting position, so this
        # must fail validation (no piece there per verified facts).
        return {"before": "The knight on e4 is hanging.", "after": "The knight on e4 is hanging."}

    monkeypatch.setattr(commentary_service, "call_gemini", fake_call_gemini)

    before, after, rate_limited = await commentary_service.get_combined_commentary(
        test_conn, "coach", facts, "e4", facts
    )
    assert call_count["n"] == 2  # first try + one regenerate
    assert before.source == "template"
    assert after.source == "template"
    assert rate_limited is False


@pytest.mark.asyncio
async def test_rate_limit_skips_regenerate_and_falls_back(test_conn, monkeypatch):
    facts = await build_verified_facts(chess.Board().fen(), stockfish_pool, depth=6)
    call_count = {"n": 0}

    async def fake_call_gemini(*args, **kwargs):
        call_count["n"] += 1
        raise GeminiRateLimitError("quota exceeded")

    monkeypatch.setattr(commentary_service, "call_gemini", fake_call_gemini)

    before, after, rate_limited = await commentary_service.get_combined_commentary(
        test_conn, "coach", facts, "e4", facts
    )
    assert call_count["n"] == 1  # no wasted regenerate attempt after a rate-limit error
    assert before.source == "template"
    assert rate_limited is True


@pytest.mark.asyncio
async def test_cache_avoids_duplicate_gemini_calls(test_conn, monkeypatch):
    facts = await build_verified_facts(chess.Board().fen(), stockfish_pool, depth=6)
    call_count = {"n": 0}

    async def fake_call_gemini(style, facts_before, ai_move_san, facts_after):
        call_count["n"] += 1
        return {"before": "Material is balanced and both sides are developing normally.", "after": "Material is balanced and both sides are developing normally."}

    monkeypatch.setattr(commentary_service, "call_gemini", fake_call_gemini)

    await commentary_service.get_combined_commentary(test_conn, "coach", facts, "e4", facts)
    assert call_count["n"] == 1

    before2, after2, _ = await commentary_service.get_combined_commentary(test_conn, "coach", facts, "e4", facts)
    assert call_count["n"] == 1  # second call hit the cache, no new Gemini call
    assert before2.source == "cache"
    assert after2.source == "cache"


def test_refresh_restores_state(client):
    resp = client.post(
        "/api/game/new",
        json={"player_color": "white", "difficulty": 3, "commentary_style": "coach"},
        headers=HEADERS,
    )
    game_id = resp.json()["game_id"]
    client.post("/api/game/move", json={"game_id": game_id, "uci": "e2e4"}, headers=HEADERS)

    resp = client.get(f"/api/game/{game_id}", headers=HEADERS)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["moves"]) == 2  # player move + AI reply
    assert body["status"] == "in_progress"
