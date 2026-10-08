"""Difficulty level -> Stockfish strength mapping.

Stockfish 19's UCI_Elo option only accepts 1320-3190 (its own enforced floor/ceiling),
so "Beginner" uses the lowest allowed Elo cap combined with Skill Level 0 rather than
simulating a weaker player below the engine's own floor.
"""

DIFFICULTY_LEVELS = [
    {"level": 1, "label": "Beginner", "skill_level": 0, "uci_elo": 1320},
    {"level": 2, "label": "Novice", "skill_level": 5, "uci_elo": 1600},
    {"level": 3, "label": "Intermediate", "skill_level": 10, "uci_elo": 2000},
    {"level": 4, "label": "Advanced", "skill_level": 15, "uci_elo": 2500},
    {"level": 5, "label": "Expert", "skill_level": 20, "uci_elo": None},
]

_BY_LEVEL = {entry["level"]: entry for entry in DIFFICULTY_LEVELS}


def resolve(level: int) -> tuple[int, int | None]:
    entry = _BY_LEVEL.get(level)
    if entry is None:
        raise ValueError(f"Unknown difficulty level: {level}")
    return entry["skill_level"], entry["uci_elo"]
