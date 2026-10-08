const GAME_ID_KEY = "chess-coaching-game-id";

export function getStoredGameId(): string | null {
  return sessionStorage.getItem(GAME_ID_KEY);
}

export function setStoredGameId(gameId: string): void {
  sessionStorage.setItem(GAME_ID_KEY, gameId);
}

export function clearStoredGameId(): void {
  sessionStorage.removeItem(GAME_ID_KEY);
}
