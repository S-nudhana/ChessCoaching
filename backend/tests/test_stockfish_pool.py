import chess
import pytest

from app.engine import difficulty
from app.engine.stockfish_pool import stockfish_pool

START_FEN = chess.Board().fen()


@pytest.mark.asyncio
@pytest.mark.parametrize("level", [1, 2, 3, 4, 5])
async def test_get_ai_move_returns_legal_move_at_every_level(level):
    skill_level, uci_elo = difficulty.resolve(level)
    result = await stockfish_pool.get_ai_move(START_FEN, skill_level, uci_elo, think_time=0.1)
    board = chess.Board(START_FEN)
    assert result.move in board.legal_moves


@pytest.mark.asyncio
async def test_evaluate_returns_a_score():
    info = await stockfish_pool.evaluate(START_FEN, depth=8)
    score = info["score"].white()
    assert score.is_mate() or score.score() is not None


def test_difficulty_resolve_unknown_level_raises():
    with pytest.raises(ValueError):
        difficulty.resolve(99)


def test_difficulty_levels_span_expected_range():
    levels = difficulty.DIFFICULTY_LEVELS
    assert len(levels) == 5
    assert levels[0]["skill_level"] < levels[-1]["skill_level"]
    assert levels[-1]["uci_elo"] is None  # Expert = uncapped full strength
