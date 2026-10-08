import sqlite3
from contextlib import contextmanager

from app.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS games (
    game_id         TEXT PRIMARY KEY,
    session_id      TEXT NOT NULL,
    fen             TEXT NOT NULL,
    pgn             TEXT NOT NULL DEFAULT '',
    player_color    TEXT NOT NULL CHECK(player_color IN ('white','black')),
    difficulty      INTEGER NOT NULL,
    commentary_style TEXT NOT NULL DEFAULT 'coach' CHECK(commentary_style IN ('coach','commentator')),
    status          TEXT NOT NULL DEFAULT 'in_progress'
                    CHECK(status IN ('in_progress','checkmate','stalemate','draw','resigned')),
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS moves (
    move_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id         TEXT NOT NULL REFERENCES games(game_id),
    ply             INTEGER NOT NULL,
    mover           TEXT NOT NULL CHECK(mover IN ('player','ai')),
    uci             TEXT NOT NULL,
    san             TEXT NOT NULL,
    fen_before      TEXT NOT NULL,
    fen_after       TEXT NOT NULL,
    eval_cp         INTEGER,
    eval_mate       INTEGER,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS commentary_cache (
    cache_key           TEXT PRIMARY KEY,
    fen                 TEXT NOT NULL,
    commentary_style    TEXT NOT NULL,
    phase               TEXT NOT NULL CHECK(phase IN ('before','after')),
    source              TEXT NOT NULL CHECK(source IN ('gemini','template')),
    text                TEXT NOT NULL,
    verified_facts_json TEXT NOT NULL,
    created_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_moves_game ON moves(game_id, ply);
CREATE INDEX IF NOT EXISTS idx_games_session ON games(session_id, status);
"""


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.database_path_resolved, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()


_conn: sqlite3.Connection | None = None


def get_db() -> sqlite3.Connection:
    """FastAPI dependency yielding a shared, lazily-initialized connection."""
    global _conn
    if _conn is None:
        init_db()
        _conn = get_connection()
    return _conn


@contextmanager
def db_cursor():
    conn = get_db()
    cur = conn.cursor()
    try:
        yield cur
        conn.commit()
    finally:
        cur.close()
