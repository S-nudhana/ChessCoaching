import logging
import sqlite3

from app.analysis.facts import VerifiedFacts
from app.analysis.gemini_client import GeminiError, GeminiRateLimitError, call_gemini
from app.analysis.template_fallback import render_phase_template, render_template
from app.analysis.validator import validate_commentary
from app.cache import commentary_cache
from app.models import CommentaryResult

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 2  # first try + one regenerate


async def get_combined_commentary(
    conn: sqlite3.Connection,
    style: str,
    facts_before: VerifiedFacts,
    ai_move_san: str,
    facts_after: VerifiedFacts,
) -> tuple[CommentaryResult, CommentaryResult, bool]:
    """Cache -> Gemini (validate, regenerate once) -> template."""
    cached_before = commentary_cache.lookup(conn, facts_before.fen, style, "before")
    cached_after = commentary_cache.lookup(conn, facts_after.fen, style, "after")
    if cached_before and cached_after:
        logger.info(f"Commentary cache hit for style={style}, FEN={facts_before.fen[:20]}...")
        return (
            CommentaryResult(phase="before", text=cached_before["text"], source="cache", style=style),
            CommentaryResult(phase="after", text=cached_after["text"], source="cache", style=style),
            False,
        )

    logger.info(f"Commentary cache miss for style={style}, move={ai_move_san}")
    rate_limited = False
    result_text: dict | None = None

    for attempt in range(MAX_ATTEMPTS):
        try:
            logger.debug(f"Attempt {attempt + 1}/{MAX_ATTEMPTS}: Calling Gemini for style={style}")
            candidate = await call_gemini(style, facts_before, ai_move_san, facts_after)
        except GeminiRateLimitError:
            logger.warning(f"Gemini rate limited on attempt {attempt + 1}")
            rate_limited = True
            break
        except GeminiError as e:
            logger.warning(f"Gemini error on attempt {attempt + 1}: {e}")
            continue

        ok_before, errors_before = validate_commentary(candidate.get("before", ""), facts_before)
        ok_after, errors_after = validate_commentary(candidate.get("after", ""), facts_after)

        if ok_before and ok_after:
            logger.info(f"Gemini validation PASSED on attempt {attempt + 1}")
            result_text = candidate
            break
        else:
            logger.info(f"Gemini validation FAILED on attempt {attempt + 1}")
            if errors_before:
                logger.warning(f"  Before errors: {errors_before}")
            if errors_after:
                logger.warning(f"  After errors: {errors_after}")

    if result_text is not None:
        source = "gemini"
        before_text, after_text = result_text["before"], result_text["after"]
        logger.info(f"Using Gemini for style={style}")
    else:
        source = "template"
        fallback = render_template(style, facts_before, ai_move_san, facts_after)
        before_text, after_text = fallback["before"], fallback["after"]
        logger.warning(f"FALLBACK TRIGGERED: Using template for style={style} (Gemini attempts exhausted)")

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
        logger.info(f"Single commentary cache hit for style={style}, phase={phase}")
        return CommentaryResult(phase=phase, text=cached["text"], source="cache", style=style)

    logger.info(f"Single commentary cache miss for style={style}, phase={phase}, move={last_move_san}")
    text: str | None = None
    for attempt in range(MAX_ATTEMPTS):
        try:
            logger.debug(f"Attempt {attempt + 1}/{MAX_ATTEMPTS}: Calling Gemini for style={style}, phase={phase}")
            candidate = await call_gemini(style, facts, last_move_san or "", facts)
        except (GeminiRateLimitError, GeminiError) as exc:
            logger.warning(f"Gemini error on attempt {attempt + 1}: {exc}")
            break

        phase_text = candidate.get(phase, "")
        ok, errors = validate_commentary(phase_text, facts)
        if ok:
            logger.info(f"Gemini validation PASSED on attempt {attempt + 1}")
            text = phase_text
            break
        logger.warning(f"Gemini validation FAILED on attempt {attempt + 1}: {errors}")

    source = "gemini" if text is not None else "template"
    if text is None:
        logger.warning(f"FALLBACK TRIGGERED: Using template for style={style}, phase={phase}")
        text = render_phase_template(facts, style, last_move_san=last_move_san)
    else:
        logger.info(f"Using Gemini for style={style}, phase={phase}")

    commentary_cache.store(conn, facts.fen, style, phase, text, source, facts)
    return CommentaryResult(phase=phase, text=text, source=source, style=style)
