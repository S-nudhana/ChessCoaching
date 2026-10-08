from fastapi import APIRouter

from app.engine.difficulty import DIFFICULTY_LEVELS
from app.models import DifficultyLevel

router = APIRouter(tags=["settings"])


@router.get("/difficulty-levels", response_model=list[DifficultyLevel])
async def get_difficulty_levels():
    return [DifficultyLevel(**entry) for entry in DIFFICULTY_LEVELS]
