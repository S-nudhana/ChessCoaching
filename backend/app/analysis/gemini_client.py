import json
import logging

from google import genai
from google.genai import errors, types

from app.analysis.facts import VerifiedFacts
from app.config import settings

logger = logging.getLogger(__name__)

COACH_SYSTEM = (
    "You are a friendly, encouraging chess coach explaining a position to a beginner or "
    "intermediate student. Use simple language, point out one or two lessons the student "
    "can learn, and suggest what to watch for next."
)
COMMENTATOR_SYSTEM = (
    "You are an enthusiastic live chess commentator narrating a game for spectators. "
    "Use vivid, energetic language and build tension, but remain factually precise."
)

_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "before": {"type": "string"},
        "after": {"type": "string"},
    },
    "required": ["before", "after"],
}

_FACTS_BLOCK = """FEN: {fen}
Side to move: {turn}
Material: White {mat_w} point(s), Black {mat_b} point(s) (difference: {diff:+d}, positive favors White)
White pieces on board: {pieces_w}
Black pieces on board: {pieces_b}
In check: {in_check}{checking_clause}
Pieces currently attacked / undefended: {attacked_clause}
Stockfish evaluation: {eval_clause}
Stockfish's suggested best move: {best_move}"""


def _format_eval(facts: VerifiedFacts) -> str:
    if facts.eval_mate is not None:
        side = "White" if facts.eval_mate > 0 else "Black"
        return f"mate in {abs(facts.eval_mate)} for {side}"
    if facts.eval_cp is None:
        return "unavailable"
    return f"{facts.eval_cp / 100:+.2f} pawns (positive favors White)"


def _format_attacked(facts: VerifiedFacts) -> str:
    if not facts.attacked_pieces:
        return "none"
    return "; ".join(
        f"{p.piece} on {p.square} (attacked by piece on {p.attacked_by[0]})" for p in facts.attacked_pieces
    )


def _format_facts_block(facts: VerifiedFacts) -> str:
    checking_clause = f" (checking pieces: {', '.join(facts.checking_pieces)})" if facts.is_check else ""
    return _FACTS_BLOCK.format(
        fen=facts.fen,
        turn=facts.turn,
        mat_w=facts.material["white"],
        mat_b=facts.material["black"],
        diff=facts.material_diff,
        pieces_w=", ".join(facts.piece_list["white"]),
        pieces_b=", ".join(facts.piece_list["black"]),
        in_check=facts.is_check,
        checking_clause=checking_clause,
        attacked_clause=_format_attacked(facts),
        eval_clause=_format_eval(facts),
        best_move=facts.best_move_san or "unavailable",
    )


def build_prompt(style: str, facts_before: VerifiedFacts, ai_move_san: str, facts_after: VerifiedFacts) -> str:
    return f"""You MUST only reference facts given below. Do not invent pieces, squares, or threats
that are not listed. If you are not confident about something, say so explicitly rather than guessing.

POSITION BEFORE THE AI's MOVE:
{_format_facts_block(facts_before)}

THE AI's MOVE PLAYED: {ai_move_san}

POSITION AFTER THE AI's MOVE:
{_format_facts_block(facts_after)}

Write two short (3-5 sentence, under 80 words each) commentary passages:
- "before": assess the position before the move (material balance, piece activity, king safety,
  pawn structure if notable).
- "after": explain what the move accomplished and the key threat or opportunity now on the board.

Do not mention any square or piece that is not listed above. Respond ONLY as JSON matching the
provided schema."""


class GeminiRateLimitError(Exception):
    pass


class GeminiError(Exception):
    pass


_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY is not configured")
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


async def call_gemini(style: str, facts_before: VerifiedFacts, ai_move_san: str, facts_after: VerifiedFacts) -> dict:
    system_instruction = COACH_SYSTEM if style == "coach" else COMMENTATOR_SYSTEM
    prompt = build_prompt(style, facts_before, ai_move_san, facts_after)

    try:
        client = _get_client()
    except ValueError as exc:
        raise GeminiError(f"Gemini client misconfigured: {exc}") from exc

    try:
        response = await client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=_RESPONSE_SCHEMA,
                temperature=0.6,
            ),
        )
    except errors.ClientError as exc:
        if getattr(exc, "code", None) == 429:
            raise GeminiRateLimitError(str(exc)) from exc
        raise GeminiError(str(exc)) from exc
    except errors.APIError as exc:
        raise GeminiError(str(exc)) from exc

    text = response.text
    if text is None:
        raise GeminiError("Gemini returned no text")
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiError(f"Gemini returned invalid JSON: {exc}") from exc

    if "before" not in parsed or "after" not in parsed:
        raise GeminiError("Gemini JSON response missing 'before'/'after' keys")
    return parsed
