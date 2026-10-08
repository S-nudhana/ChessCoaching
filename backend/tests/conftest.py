import sqlite3
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import SCHEMA  # noqa: E402
from app.engine.stockfish_pool import stockfish_pool  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _shutdown_stockfish_after_session():
    # SimpleEngine keeps a non-daemon background thread alive, which otherwise
    # prevents the pytest process from exiting once the suite finishes.
    yield
    import asyncio

    asyncio.run(stockfish_pool.shutdown())


@pytest.fixture
def test_conn():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    conn.commit()
    yield conn
    conn.close()


@pytest.fixture
def client(test_conn):
    from app.db import get_db
    from app.main import app

    app.dependency_overrides[get_db] = lambda: test_conn
    from fastapi.testclient import TestClient

    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
