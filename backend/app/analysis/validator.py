import re

from app.analysis.facts import VerifiedFacts

_SQUARE_RE = re.compile(r"\b([a-h][1-8])\b")
_MATERIAL_RE = re.compile(r"\b(\d{1,2})\s*(?:points?|pawns?(?:\s*worth)?)\b", re.IGNORECASE)
_WHITE_BETTER_RE = re.compile(r"\bwhite\b[^.]{0,25}\b(?:better|winning|favou?red|advantage)\b", re.IGNORECASE)
_BLACK_BETTER_RE = re.compile(r"\bblack\b[^.]{0,25}\b(?:better|winning|favou?red|advantage)\b", re.IGNORECASE)
_EVAL_CONTRADICTION_THRESHOLD_CP = 150


def validate_commentary(text: str, facts: VerifiedFacts) -> tuple[bool, list[str]]:
    """Checks an LLM commentary string against independently-computed facts.

    Returns (ok, errors). Any non-empty errors list means the text must not be shown as-is.
    """
    errors: list[str] = []
    lower = text.lower()

    valid_squares = {entry[1:] for entry in facts.piece_list["white"] + facts.piece_list["black"]}
    for square in set(_SQUARE_RE.findall(lower)):
        if square not in valid_squares:
            errors.append(f"Mentions square {square}, which has no piece on it per verified facts.")

    plausible_material = {
        str(facts.material["white"]),
        str(facts.material["black"]),
        str(abs(facts.material_diff)),
    }
    for amount in _MATERIAL_RE.findall(lower):
        if amount not in plausible_material:
            errors.append(f"Mentions material value {amount}, which doesn't match computed material.")

    if facts.eval_cp is not None:
        claims_white_better = bool(_WHITE_BETTER_RE.search(lower))
        claims_black_better = bool(_BLACK_BETTER_RE.search(lower))
        if claims_white_better and facts.eval_cp < -_EVAL_CONTRADICTION_THRESHOLD_CP:
            errors.append("Claims White is better but the Stockfish evaluation favors Black.")
        if claims_black_better and facts.eval_cp > _EVAL_CONTRADICTION_THRESHOLD_CP:
            errors.append("Claims Black is better but the Stockfish evaluation favors White.")

    return (len(errors) == 0, errors)
