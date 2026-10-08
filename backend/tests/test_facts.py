import chess
import pytest

from app.analysis.facts import (
    compute_attacked_pieces,
    compute_material,
    compute_piece_list,
    build_verified_facts,
)
from app.engine.stockfish_pool import stockfish_pool

RUY_LOPEZ_FEN = "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3"


def test_compute_material_starting_position():
    board = chess.Board()
    material, diff = compute_material(board)
    assert material == {"white": 39, "black": 39}
    assert diff == 0


def test_compute_piece_list_starting_position():
    board = chess.Board()
    pieces = compute_piece_list(board)
    assert len(pieces["white"]) == 16
    assert len(pieces["black"]) == 16
    assert "Ke1" in pieces["white"]
    assert "Ke8" in pieces["black"]


def test_compute_attacked_pieces_ruy_lopez():
    board = chess.Board(RUY_LOPEZ_FEN)
    attacked = compute_attacked_pieces(board)
    squares = {a.square for a in attacked}
    # Bb5 pins/attacks Nc6; Nf3 attacks the e5 pawn.
    assert "c6" in squares
    assert "e5" in squares


@pytest.mark.asyncio
async def test_build_verified_facts_ruy_lopez():
    facts = await build_verified_facts(RUY_LOPEZ_FEN, stockfish_pool, depth=8)
    assert facts.material_diff == 0
    assert facts.turn == "black"
    assert facts.is_check is False
    assert facts.legal_move_count > 0
    assert any(a.square == "c6" for a in facts.attacked_pieces)
    assert facts.eval_cp is not None or facts.eval_mate is not None
