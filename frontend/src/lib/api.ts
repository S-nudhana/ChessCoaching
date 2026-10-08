import { getSessionId } from "@/lib/sessionId";
import {
  ApiError,
  type CommentaryResult,
  type CommentaryStyle,
  type DifficultyLevel,
  type GameStateResponse,
  type MoveTurnResponse,
  type NewGameResponse,
  type PlayerColor,
} from "@/types/game";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSessionId(),
      ...options.headers,
    },
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

export function getDifficultyLevels(): Promise<DifficultyLevel[]> {
  return request("/api/difficulty-levels");
}

export function startNewGame(
  playerColor: PlayerColor,
  difficulty: number,
  commentaryStyle: CommentaryStyle,
): Promise<NewGameResponse> {
  return request("/api/game/new", {
    method: "POST",
    body: JSON.stringify({
      player_color: playerColor,
      difficulty,
      commentary_style: commentaryStyle,
    }),
  });
}

export function getGame(gameId: string): Promise<GameStateResponse> {
  return request(`/api/game/${gameId}`);
}

export function submitMove(gameId: string, uci: string): Promise<MoveTurnResponse> {
  return request("/api/game/move", {
    method: "POST",
    body: JSON.stringify({ game_id: gameId, uci }),
  });
}

export function resignGame(gameId: string): Promise<{ game_id: string; status: string }> {
  return request("/api/game/resign", {
    method: "POST",
    body: JSON.stringify({ game_id: gameId }),
  });
}

export function changeCommentaryStyle(
  gameId: string,
  commentaryStyle: CommentaryStyle,
): Promise<{ game_id: string; commentary_style: CommentaryStyle }> {
  return request("/api/game/style", {
    method: "PATCH",
    body: JSON.stringify({ game_id: gameId, commentary_style: commentaryStyle }),
  });
}

export function explainOwnMove(gameId: string, ply: number): Promise<CommentaryResult> {
  return request("/api/game/commentary/own-move", {
    method: "POST",
    body: JSON.stringify({ game_id: gameId, ply }),
  });
}

export { ApiError };
