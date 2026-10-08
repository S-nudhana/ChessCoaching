from app.analysis.facts import AttackedPiece, VerifiedFacts
from app.analysis.validator import validate_commentary


def make_facts(**overrides) -> VerifiedFacts:
    base = dict(
        fen="startpos",
        turn="white",
        material={"white": 39, "black": 39},
        material_diff=0,
        piece_list={"white": ["Pe4", "Ke1"], "black": ["Pe5", "Ke8"]},
        is_check=False,
        checking_pieces=[],
        attacked_pieces=[],
        legal_move_count=20,
        is_checkmate=False,
        is_stalemate=False,
        is_insufficient_material=False,
        eval_cp=20,
        eval_mate=None,
        best_move_san="Nf3",
    )
    base.update(overrides)
    return VerifiedFacts(**base)


def test_valid_commentary_passes():
    facts = make_facts()
    ok, errors = validate_commentary(
        "Material is even and both sides control the center with pawns on e4 and e5.", facts
    )
    assert ok
    assert errors == []


def test_bogus_square_fails():
    facts = make_facts()
    ok, errors = validate_commentary("Watch the knight on d5, it's unprotected.", facts)
    assert not ok
    assert any("d5" in e for e in errors)


def test_wrong_material_count_fails():
    facts = make_facts(material={"white": 39, "black": 30}, material_diff=9)
    ok, errors = validate_commentary("White is ahead by 15 points of material.", facts)
    assert not ok
    assert any("15" in e for e in errors)


def test_correct_material_count_passes():
    facts = make_facts(material={"white": 39, "black": 30}, material_diff=9)
    ok, errors = validate_commentary("White is ahead by 9 points of material.", facts)
    assert ok


def test_eval_contradiction_fails():
    facts = make_facts(eval_cp=-400)
    ok, errors = validate_commentary("White is clearly winning this position.", facts)
    assert not ok
    assert any("eval" in e.lower() for e in errors)


def test_eval_agreement_passes():
    facts = make_facts(eval_cp=-400)
    ok, errors = validate_commentary("Black is winning this position.", facts)
    assert ok


def test_attacked_piece_square_is_valid():
    facts = make_facts(
        piece_list={"white": ["Pe4", "Ke1"], "black": ["Nc6", "Ke8"]},
        attacked_pieces=[AttackedPiece(square="c6", piece="N", color="black", attacked_by=["e4"])],
    )
    ok, errors = validate_commentary("The knight on c6 is hanging.", facts)
    assert ok
