import sqlite3
import uuid
from datetime import datetime, timezone

import chess
from fastapi import APIRouter, Depends, Header, HTTPException

from app.analysis.commentary_service import get_combined_commentary, get_single_commentary
from app.analysis.facts import build_verified_facts
from app.db import get_db
from app.engine import difficulty
from app.engine.stockfish_pool import stockfish_pool
from app.models import (
    ChangeStyleRequest,
    GameStateResponse,
    MoveHistoryItem,
    MoveResult,
    MoveTurnResponse,
    NewGameRequest,
    NewGameResponse,
    OwnMoveCommentaryRequest,
    PlayerMoveRequest,
    ResignRequest,
)

router = APIRouter(prefix="/game", tags=["game"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _status_of(board: chess.Board) -> str:
    if board.is_checkmate():
        return "checkmate"
    if board.is_stalemate():
        return "stalemate"
    if board.is_insufficient_material() or board.can_claim_draw():
        return "draw"
    return "in_progress"


def _move_result(board: chess.Board, move: chess.Move, eval_cp: int | None = None, eval_mate: int | None = None) -> MoveResult:
    san = board.san(move)
    board.push(move)
    result = MoveResult(
        uci=move.uci(),
        san=san,
        fen_after=board.fen(),
        eval_cp=eval_cp,
        eval_mate=eval_mate,
        is_check=board.is_check(),
        is_checkmate=board.is_checkmate(),
        is_stalemate=board.is_stalemate(),
        is_draw=board.is_insufficient_material() or board.can_claim_draw(),
    )
    return result


def _record_move(
    conn: sqlite3.Connection,
    game_id: str,
    ply: int,
    mover: str,
    uci: str,
    san: str,
    fen_before: str,
    fen_after: str,
    eval_cp: int | None,
    eval_mate: int | None,
) -> None:
    conn.execute(
        """INSERT INTO moves (game_id, ply, mover, uci, san, fen_before, fen_after, eval_cp, eval_mate, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (game_id, ply, mover, uci, san, fen_before, fen_after, eval_cp, eval_mate, _now()),
    )
    conn.commit()


def _load_game(conn: sqlite3.Connection, game_id: str, session_id: str) -> sqlite3.Row:
    row = conn.execute(
        "SELECT * FROM games WHERE game_id = ? AND session_id = ?", (game_id, session_id)
    ).fetchone()
    if row is None:
        raise HTTPException(404, detail="Game not found")
    return row


def _ply_count(conn: sqlite3.Connection, game_id: str) -> int:
    row = conn.execute("SELECT COUNT(*) AS c FROM moves WHERE game_id = ?", (game_id,)).fetchone()
    return row["c"]


@router.post("/new", response_model=NewGameResponse)
async def new_game(
    req: NewGameRequest,
    session_id: str = Header(..., alias="X-Session-Id"),
    conn: sqlite3.Connection = Depends(get_db),
):
    game_id = str(uuid.uuid4())
    board = chess.Board()
    ai_opening: MoveResult | None = None

    if req.player_color == "black":
        skill_level, uci_elo = difficulty.resolve(req.difficulty)
        play_result = await stockfish_pool.get_ai_move(board.fen(), skill_level, uci_elo)
        fen_before = board.fen()
        ai_opening = _move_result(board, play_result.move)
        _record_move(conn, game_id, 1, "ai", ai_opening.uci, ai_opening.san, fen_before, ai_opening.fen_after, None, None)

    now = _now()
    conn.execute(
        """INSERT INTO games
           (game_id, session_id, fen, pgn, player_color, difficulty, commentary_style, status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (
            game_id,
            session_id,
            board.fen(),
            "",
            req.player_color,
            req.difficulty,
            req.commentary_style,
            _status_of(board),
            now,
            now,
        ),
    )
    conn.commit()

    return NewGameResponse(
        game_id=game_id,
        fen=board.fen(),
        player_color=req.player_color,
        difficulty=req.difficulty,
        commentary_style=req.commentary_style,
        status=_status_of(board),
        ai_opening_move=ai_opening,
    )


@router.get("/{game_id}", response_model=GameStateResponse)
async def get_game(
    game_id: str,
    session_id: str = Header(..., alias="X-Session-Id"),
    conn: sqlite3.Connection = Depends(get_db),
):
    game = _load_game(conn, game_id, session_id)
    rows = conn.execute(
        "SELECT ply, mover, uci, san FROM moves WHERE game_id = ? ORDER BY ply ASC", (game_id,)
    ).fetchall()
    moves = [MoveHistoryItem(ply=r["ply"], mover=r["mover"], uci=r["uci"], san=r["san"]) for r in rows]
    return GameStateResponse(
        game_id=game["game_id"],
        fen=game["fen"],
        pgn=game["pgn"],
        status=game["status"],
        difficulty=game["difficulty"],
        commentary_style=game["commentary_style"],
        player_color=game["player_color"],
        moves=moves,
    )


@router.post("/move", response_model=MoveTurnResponse)
async def make_move(
    req: PlayerMoveRequest,
    session_id: str = Header(..., alias="X-Session-Id"),
    conn: sqlite3.Connection = Depends(get_db),
):
    game = _load_game(conn, req.game_id, session_id)
    if game["status"] != "in_progress":
        raise HTTPException(400, detail=f"Game is already over ({game['status']})")

    board = chess.Board(game["fen"])
    try:
        move = chess.Move.from_uci(req.uci)
    except ValueError as exc:
        raise HTTPException(400, detail=f"Malformed move: {exc}") from exc

    if move not in board.legal_moves:
        raise HTTPException(400, detail="Illegal move")

    ply = _ply_count(conn, req.game_id) + 1
    fen_before_player = board.fen()
    player_result = _move_result(board, move)
    _record_move(
        conn, req.game_id, ply, "player", player_result.uci, player_result.san,
        fen_before_player, player_result.fen_after, None, None,
    )

    status = _status_of(board)
    if status != "in_progress":
        conn.execute(
            "UPDATE games SET fen = ?, status = ?, updated_at = ? WHERE game_id = ?",
            (board.fen(), status, _now(), req.game_id),
        )
        conn.commit()
        facts_after = await build_verified_facts(board.fen(), stockfish_pool)
        _, commentary_after, rate_limited = await get_combined_commentary(
            conn, game["commentary_style"], facts_after, player_result.san, facts_after
        )
        return MoveTurnResponse(
            player_move=player_result,
            ai_move=None,
            commentary_before=None,
            commentary_after=commentary_after,
            game_status=status,
            rate_limited=rate_limited,
        )

    skill_level, uci_elo = difficulty.resolve(game["difficulty"])
    facts_before = await build_verified_facts(board.fen(), stockfish_pool)

    fen_before_ai = board.fen()
    play_result = await stockfish_pool.get_ai_move(fen_before_ai, skill_level, uci_elo)
    ai_result = _move_result(board, play_result.move)
    ply += 1
    _record_move(
        conn, req.game_id, ply, "ai", ai_result.uci, ai_result.san,
        fen_before_ai, ai_result.fen_after, None, None,
    )

    status = _status_of(board)
    conn.execute(
        "UPDATE games SET fen = ?, status = ?, updated_at = ? WHERE game_id = ?",
        (board.fen(), status, _now(), req.game_id),
    )
    conn.commit()

    facts_after = await build_verified_facts(board.fen(), stockfish_pool)
    commentary_before, commentary_after, rate_limited = await get_combined_commentary(
        conn, game["commentary_style"], facts_before, ai_result.san, facts_after
    )

    return MoveTurnResponse(
        player_move=player_result,
        ai_move=ai_result,
        commentary_before=commentary_before,
        commentary_after=commentary_after,
        game_status=status,
        rate_limited=rate_limited,
    )


@router.post("/resign")
async def resign(
    req: ResignRequest,
    session_id: str = Header(..., alias="X-Session-Id"),
    conn: sqlite3.Connection = Depends(get_db),
):
    _load_game(conn, req.game_id, session_id)
    conn.execute(
        "UPDATE games SET status = 'resigned', updated_at = ? WHERE game_id = ?", (_now(), req.game_id)
    )
    conn.commit()
    return {"game_id": req.game_id, "status": "resigned"}


@router.patch("/style")
async def change_style(
    req: ChangeStyleRequest,
    session_id: str = Header(..., alias="X-Session-Id"),
    conn: sqlite3.Connection = Depends(get_db),
):
    _load_game(conn, req.game_id, session_id)
    conn.execute(
        "UPDATE games SET commentary_style = ?, updated_at = ? WHERE game_id = ?",
        (req.commentary_style, _now(), req.game_id),
    )
    conn.commit()
    return {"game_id": req.game_id, "commentary_style": req.commentary_style}


@router.post("/commentary/own-move")
async def own_move_commentary(
    req: OwnMoveCommentaryRequest,
    session_id: str = Header(..., alias="X-Session-Id"),
    conn: sqlite3.Connection = Depends(get_db),
):
    game = _load_game(conn, req.game_id, session_id)
    move_row = conn.execute(
        "SELECT * FROM moves WHERE game_id = ? AND ply = ?", (req.game_id, req.ply)
    ).fetchone()
    if move_row is None:
        raise HTTPException(404, detail="Move not found")

    facts = await build_verified_facts(move_row["fen_after"], stockfish_pool)
    commentary = await get_single_commentary(
        conn, game["commentary_style"], facts, last_move_san=move_row["san"], phase="after"
    )
    return commentary
