import sqlite3

from app.analysis.facts import VerifiedFacts
from app.analysis.gemini_client import GeminiError, GeminiRateLimitError, call_gemini
from app.analysis.template_fallback import render_phase_template, render_template
from app.analysis.validator import validate_commentary
from app.cache import commentary_cache
from app.models import CommentaryResult

MAX_ATTEMPTS = 2  # first try + one regenerate


async def get_combined_commentary(
    conn: sqlite3.Connection,
    style: str,
    facts_before: VerifiedFacts,
    ai_move_san: str,
    facts_after: VerifiedFacts,
) -> tuple[CommentaryResult, CommentaryResult, bool]:
    """Returns (before, after, rate_limited). Cache -> Gemini (validate, regenerate once) -> template."""
    cached_before = commentary_cache.lookup(conn, facts_before.fen, style, "before")
    cached_after = commentary_cache.lookup(conn, facts_after.fen, style, "after")
    if cached_before and cached_after:
        return (
            CommentaryResult(phase="before", text=cached_before["text"], source="cache", style=style),
            CommentaryResult(phase="after", text=cached_after["text"], source="cache", style=style),
            False,
        )

    rate_limited = False
    result_text: dict | None = None

    for _attempt in range(MAX_ATTEMPTS):
        try:
            candidate = await call_gemini(style, facts_before, ai_move_san, facts_after)
        except GeminiRateLimitError:
            rate_limited = True
            break
        except GeminiError:
            continue

        ok_before, _ = validate_commentary(candidate.get("before", ""), facts_before)
        ok_after, _ = validate_commentary(candidate.get("after", ""), facts_after)
        if ok_before and ok_after:
            result_text = candidate
            break

    if result_text is not None:
        source = "gemini"
        before_text, after_text = result_text["before"], result_text["after"]
    else:
        source = "template"
        fallback = render_template(style, facts_before, ai_move_san, facts_after)
        before_text, after_text = fallback["before"], fallback["after"]

    commentary_cache.store(conn, facts_before.fen, style, "before", before_text, source, facts_before)
    commentary_cache.store(conn, facts_after.fen, style, "after", after_text, source, facts_after)

    return (
        CommentaryResult(phase="before", text=before_text, source=source, style=style),
        CommentaryResult(phase="after", text=after_text, source=source, style=style),
        rate_limited,
    )


async def get_single_commentary(
    conn: sqlite3.Connection,
    style: str,
    facts: VerifiedFacts,
    last_move_san: str | None = None,
    phase: str = "after",
) -> CommentaryResult:
    """Used for the lazy 'explain my own move' endpoint — single-phase, no pairing needed."""
    cached = commentary_cache.lookup(conn, facts.fen, style, phase)
    if cached:
        return CommentaryResult(phase=phase, text=cached["text"], source="cache", style=style)

    text: str | None = None
    for _attempt in range(MAX_ATTEMPTS):
        try:
            candidate = await call_gemini(style, facts, last_move_san or "", facts)
        except (GeminiRateLimitError, GeminiError):
            break
        phase_text = candidate.get(phase, "")
        ok, _ = validate_commentary(phase_text, facts)
        if ok:
            text = phase_text
            break

    source = "gemini" if text is not None else "template"
    if text is None:
        text = render_phase_template(facts, style, last_move_san=last_move_san)

    commentary_cache.store(conn, facts.fen, style, phase, text, source, facts)
    return CommentaryResult(phase=phase, text=text, source=source, style=style)
