import asyncio
import logging
import threading

import chess
import chess.engine

from app.config import settings

logger = logging.getLogger(__name__)


class StockfishPool:
    """Wraps a single persistent SimpleEngine instance.

    chess.engine.SimpleEngine's UCI I/O is blocking, so every call is routed
    through run_in_executor. Access is serialized with a threading.Lock held
    *inside* the executor thread (not an asyncio.Lock awaited from the event
    loop) so this works correctly no matter which event loop calls in -- an
    asyncio.Lock is bound to the loop that first awaits it, which hangs if a
    later call comes from a different loop (e.g. separate test functions each
    getting their own loop).
    """

    def __init__(self, path: str):
        self._path = path
        self._engine: chess.engine.SimpleEngine | None = None
        self._thread_lock = threading.Lock()
        self._last_config: tuple[int, int | None] | None = None

    def _ensure_sync(self) -> chess.engine.SimpleEngine:
        if self._engine is None:
            self._engine = chess.engine.SimpleEngine.popen_uci(self._path)
            self._last_config = None
            logger.info("Stockfish engine started (%s)", self._path)
        return self._engine

    async def _run_blocking(self, fn, *args):
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._locked, fn, *args)

    def _locked(self, fn, *args):
        with self._thread_lock:
            return fn(*args)

    def _configure_sync(self, skill_level: int, uci_elo: int | None) -> None:
        engine = self._ensure_sync()
        config = (skill_level, uci_elo)
        if config == self._last_config:
            return
        if uci_elo is not None:
            engine.configure({"UCI_LimitStrength": True, "UCI_Elo": uci_elo, "Skill Level": skill_level})
        else:
            engine.configure({"UCI_LimitStrength": False, "Skill Level": skill_level})
        self._last_config = config

    def _best_move_sync(
        self, fen: str, skill_level: int, uci_elo: int | None, think_time: float
    ) -> chess.engine.PlayResult:
        self._configure_sync(skill_level, uci_elo)
        board = chess.Board(fen)
        return self._engine.play(board, chess.engine.Limit(time=think_time))

    def _analyse_sync(self, fen: str, depth: int) -> chess.engine.InfoDict:
        engine = self._ensure_sync()
        # Full strength for objective evaluation, regardless of play-move difficulty.
        config = (20, None)
        if config != self._last_config:
            engine.configure({"UCI_LimitStrength": False, "Skill Level": 20})
            self._last_config = config
        board = chess.Board(fen)
        return engine.analyse(board, chess.engine.Limit(depth=depth))

    def _quit_sync(self) -> None:
        if self._engine is not None:
            self._engine.quit()
            self._engine = None

    async def get_ai_move(
        self, fen: str, skill_level: int, uci_elo: int | None, think_time: float = 0.5
    ) -> chess.engine.PlayResult:
        return await self._run_blocking(self._best_move_sync, fen, skill_level, uci_elo, think_time)

    async def evaluate(self, fen: str, depth: int = 12) -> chess.engine.InfoDict:
        return await self._run_blocking(self._analyse_sync, fen, depth)

    async def shutdown(self) -> None:
        await self._run_blocking(self._quit_sync)


stockfish_pool = StockfishPool(settings.stockfish_path)
