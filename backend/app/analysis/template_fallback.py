from app.analysis.facts import VerifiedFacts


def _material_phrase(facts: VerifiedFacts) -> str:
    if facts.material_diff == 0:
        return "Material is currently even."
    leader = "White" if facts.material_diff > 0 else "Black"
    return f"{leader} is ahead by {abs(facts.material_diff)} point(s) of material."


def _eval_phrase(facts: VerifiedFacts) -> str:
    if facts.eval_mate is not None:
        side = "White" if facts.eval_mate > 0 else "Black"
        return f"The engine finds a forced mate for {side} in {abs(facts.eval_mate)}."
    if facts.eval_cp is None:
        return ""
    side = "White" if facts.eval_cp >= 0 else "Black"
    return f"The engine evaluates the position at roughly {abs(facts.eval_cp) / 100:.1f} pawns in {side}'s favor."


def _check_phrase(facts: VerifiedFacts) -> str:
    return f" {facts.turn.capitalize()} is in check." if facts.is_check else ""


def _attacked_phrase(facts: VerifiedFacts) -> str:
    count = len(facts.attacked_pieces)
    if count == 0:
        return " No pieces are currently hanging."
    if count == 1:
        p = facts.attacked_pieces[0]
        return f" Watch out: the {p.piece} on {p.square} is currently under attack."
    pieces = ", ".join(f"{p.piece} on {p.square}" for p in facts.attacked_pieces[:3])
    return f" Watch out: {pieces} are currently under attack."


def render_phase_template(facts: VerifiedFacts, style: str, last_move_san: str | None = None) -> str:
    prefix = "Coach's note: " if style == "coach" else "Commentary: "
    material = _material_phrase(facts)
    if last_move_san:
        body = f"After {last_move_san}, {material[0].lower()}{material[1:]}"
    else:
        body = material
    return f"{prefix}{body}{_check_phrase(facts)}{_attacked_phrase(facts)} {_eval_phrase(facts)}".strip()


def render_template(
    style: str, facts_before: VerifiedFacts, ai_move_san: str, facts_after: VerifiedFacts
) -> dict:
    return {
        "before": render_phase_template(facts_before, style),
        "after": render_phase_template(facts_after, style, last_move_san=ai_move_san),
    }
