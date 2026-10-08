import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from typing import Literal, Optional

from app.analysis.facts import VerifiedFacts


def make_cache_key(fen: str, style: str, phase: str) -> str:
    return hashlib.sha256(f"{fen}|{style}|{phase}".encode()).hexdigest()


def lookup(conn: sqlite3.Connection, fen: str, style: str, phase: str) -> Optional[sqlite3.Row]:
    key = make_cache_key(fen, style, phase)
    row = conn.execute(
        "SELECT text, source FROM commentary_cache WHERE cache_key = ?",
        (key,),
    ).fetchone()
    return row


def store(
    conn: sqlite3.Connection,
    fen: str,
    style: str,
    phase: Literal["before", "after"],
    text: str,
    source: Literal["gemini", "template"],
    facts: VerifiedFacts,
) -> None:
    key = make_cache_key(fen, style, phase)
    conn.execute(
        """INSERT OR REPLACE INTO commentary_cache
           (cache_key, fen, commentary_style, phase, source, text, verified_facts_json, created_at)
           VALUES (?,?,?,?,?,?,?,?)""",
        (
            key,
            fen,
            style,
            phase,
            source,
            text,
            json.dumps(facts.to_dict()),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()
