export type CommentaryStyle = "coach" | "commentator";
export type PlayerColor = "white" | "black";
export type GameStatus = "in_progress" | "checkmate" | "stalemate" | "draw" | "resigned";
export type CommentarySource = "gemini" | "template" | "cache";

export interface MoveResult {
  uci: string;
  san: string;
  fen_after: string;
  eval_cp: number | null;
  eval_mate: number | null;
  is_check: boolean;
  is_checkmate: boolean;
  is_stalemate: boolean;
  is_draw: boolean;
}

export interface CommentaryResult {
  phase: "before" | "after";
  text: string;
  source: CommentarySource;
  style: CommentaryStyle;
}

export interface NewGameResponse {
  game_id: string;
  fen: string;
  player_color: PlayerColor;
  difficulty: number;
  commentary_style: CommentaryStyle;
  status: GameStatus;
  ai_opening_move: MoveResult | null;
}

export interface MoveTurnResponse {
  player_move: MoveResult;
  ai_move: MoveResult | null;
  game_status: GameStatus;
}

export interface TurnCommentaryResponse {
  commentary_before: CommentaryResult | null;
  commentary_after: CommentaryResult | null;
  rate_limited: boolean;
}

export interface DifficultyLevel {
  level: number;
  label: string;
  skill_level: number;
  uci_elo: number | null;
}

export interface MoveHistoryItem {
  ply: number;
  mover: "player" | "ai";
  uci: string;
  san: string;
}

export interface GameStateResponse {
  game_id: string;
  fen: string;
  pgn: string;
  status: GameStatus;
  difficulty: number;
  commentary_style: CommentaryStyle;
  player_color: PlayerColor;
  moves: MoveHistoryItem[];
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}
