from typing import Literal, Optional

from pydantic import BaseModel, Field


class NewGameRequest(BaseModel):
    player_color: Literal["white", "black"] = "white"
    difficulty: int = Field(ge=1, le=5, default=3)
    commentary_style: Literal["coach", "commentator"] = "coach"


class MoveResult(BaseModel):
    uci: str
    san: str
    fen_after: str
    eval_cp: Optional[int] = None
    eval_mate: Optional[int] = None
    is_check: bool = False
    is_checkmate: bool = False
    is_stalemate: bool = False
    is_draw: bool = False


class CommentaryResult(BaseModel):
    phase: Literal["before", "after"]
    text: str
    source: Literal["gemini", "template", "cache"]
    style: Literal["coach", "commentator"]


class NewGameResponse(BaseModel):
    game_id: str
    fen: str
    player_color: str
    difficulty: int
    commentary_style: str
    status: str
    ai_opening_move: Optional[MoveResult] = None


class PlayerMoveRequest(BaseModel):
    game_id: str
    uci: str


class MoveTurnResponse(BaseModel):
    player_move: MoveResult
    ai_move: Optional[MoveResult] = None
    commentary_before: Optional[CommentaryResult] = None
    commentary_after: Optional[CommentaryResult] = None
    game_status: str
    rate_limited: bool = False


class DifficultyLevel(BaseModel):
    level: int
    label: str
    skill_level: int
    uci_elo: Optional[int] = None


class ChangeStyleRequest(BaseModel):
    game_id: str
    commentary_style: Literal["coach", "commentator"]


class OwnMoveCommentaryRequest(BaseModel):
    game_id: str
    ply: int


class ResignRequest(BaseModel):
    game_id: str


class MoveHistoryItem(BaseModel):
    ply: int
    mover: Literal["player", "ai"]
    uci: str
    san: str


class GameStateResponse(BaseModel):
    game_id: str
    fen: str
    pgn: str
    status: str
    difficulty: int
    commentary_style: str
    player_color: str
    moves: list[MoveHistoryItem]
