import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { clearStoredGameId, getStoredGameId, setStoredGameId } from "@/lib/storage";
import type {
  CommentaryResult,
  CommentaryStyle,
  GameStatus,
  MoveHistoryItem,
  PlayerColor,
} from "@/types/game";

interface GameState {
  gameId: string | null;
  fen: string;
  playerColor: PlayerColor;
  difficulty: number;
  commentaryStyle: CommentaryStyle;
  commentaryBefore: CommentaryResult | null;
  commentaryAfter: CommentaryResult | null;
  moveHistory: MoveHistoryItem[];
  status: GameStatus | "none";
  isAiThinking: boolean;
  isRestoring: boolean;
  isExplainingMove: boolean;
}

type Action =
  | { type: "RESTORE_START" }
  | { type: "RESTORE_NONE" }
  | {
      type: "GAME_STARTED";
      payload: {
        gameId: string;
        fen: string;
        playerColor: PlayerColor;
        difficulty: number;
        commentaryStyle: CommentaryStyle;
        status: GameStatus;
        openingMove: { ply: number; uci: string; san: string } | null;
      };
    }
  | {
      type: "GAME_RESTORED";
      payload: {
        gameId: string;
        fen: string;
        playerColor: PlayerColor;
        difficulty: number;
        commentaryStyle: CommentaryStyle;
        status: GameStatus;
        moves: MoveHistoryItem[];
      };
    }
  | { type: "MOVE_SUBMITTED" }
  | {
      type: "MOVE_RESOLVED";
      payload: {
        fen: string;
        status: GameStatus;
        commentaryBefore: CommentaryResult | null;
        commentaryAfter: CommentaryResult | null;
        playerMove: MoveHistoryItem;
        aiMove: MoveHistoryItem | null;
      };
    }
  | { type: "MOVE_FAILED" }
  | { type: "STYLE_CHANGED"; payload: CommentaryStyle }
  | { type: "RESIGNED" }
  | { type: "OWN_MOVE_COMMENTARY_LOADING" }
  | { type: "OWN_MOVE_COMMENTARY_RESOLVED"; payload: CommentaryResult }
  | { type: "OWN_MOVE_COMMENTARY_FAILED" };

const initialState: GameState = {
  gameId: null,
  fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  playerColor: "white",
  difficulty: 3,
  commentaryStyle: "coach",
  commentaryBefore: null,
  commentaryAfter: null,
  moveHistory: [],
  status: "none",
  isAiThinking: false,
  isRestoring: true,
  isExplainingMove: false,
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "RESTORE_START":
      return { ...state, isRestoring: true };
    case "RESTORE_NONE":
      return { ...state, isRestoring: false };
    case "GAME_STARTED": {
      const { openingMove, ...rest } = action.payload;
      return {
        ...initialState,
        isRestoring: false,
        ...rest,
        moveHistory: openingMove
          ? [{ ply: openingMove.ply, mover: "ai", uci: openingMove.uci, san: openingMove.san }]
          : [],
      };
    }
    case "GAME_RESTORED": {
      const { moves, ...rest } = action.payload;
      return {
        ...initialState,
        isRestoring: false,
        ...rest,
        moveHistory: moves,
      };
    }
    case "MOVE_SUBMITTED":
      return { ...state, isAiThinking: true };
    case "MOVE_RESOLVED": {
      const moves = [...state.moveHistory, action.payload.playerMove];
      if (action.payload.aiMove) moves.push(action.payload.aiMove);
      return {
        ...state,
        fen: action.payload.fen,
        status: action.payload.status,
        commentaryBefore: action.payload.commentaryBefore,
        commentaryAfter: action.payload.commentaryAfter,
        moveHistory: moves,
        isAiThinking: false,
      };
    }
    case "MOVE_FAILED":
      return { ...state, isAiThinking: false };
    case "STYLE_CHANGED":
      return { ...state, commentaryStyle: action.payload };
    case "RESIGNED":
      return { ...state, status: "resigned" };
    case "OWN_MOVE_COMMENTARY_LOADING":
      return { ...state, isExplainingMove: true };
    case "OWN_MOVE_COMMENTARY_RESOLVED":
      return { ...state, commentaryAfter: action.payload, isExplainingMove: false };
    case "OWN_MOVE_COMMENTARY_FAILED":
      return { ...state, isExplainingMove: false };
    default:
      return state;
  }
}

interface GameContextValue extends GameState {
  startNewGame: (
    playerColor: PlayerColor,
    difficulty: number,
    commentaryStyle: CommentaryStyle,
  ) => Promise<void>;
  submitMove: (uci: string) => Promise<boolean>;
  changeStyle: (style: CommentaryStyle) => Promise<void>;
  resign: () => Promise<void>;
  requestOwnMoveCommentary: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const storedId = getStoredGameId();
    if (!storedId) {
      dispatch({ type: "RESTORE_NONE" });
      return;
    }
    dispatch({ type: "RESTORE_START" });
    api
      .getGame(storedId)
      .then((resp) => {
        dispatch({
          type: "GAME_RESTORED",
          payload: {
            gameId: resp.game_id,
            fen: resp.fen,
            playerColor: resp.player_color,
            difficulty: resp.difficulty,
            commentaryStyle: resp.commentary_style,
            status: resp.status,
            moves: resp.moves,
          },
        });
      })
      .catch(() => {
        clearStoredGameId();
        dispatch({ type: "RESTORE_NONE" });
      });
  }, []);

  const startNewGame = useCallback(
    async (playerColor: PlayerColor, difficulty: number, commentaryStyle: CommentaryStyle) => {
      try {
        const resp = await api.startNewGame(playerColor, difficulty, commentaryStyle);
        setStoredGameId(resp.game_id);
        dispatch({
          type: "GAME_STARTED",
          payload: {
            gameId: resp.game_id,
            fen: resp.fen,
            playerColor: resp.player_color,
            difficulty: resp.difficulty,
            commentaryStyle: resp.commentary_style,
            status: resp.status,
            openingMove: resp.ai_opening_move
              ? { ply: 1, uci: resp.ai_opening_move.uci, san: resp.ai_opening_move.san }
              : null,
          },
        });
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not start a new game.");
      }
    },
    [],
  );

  const submitMove = useCallback(
    async (uci: string): Promise<boolean> => {
      if (!state.gameId) return false;
      dispatch({ type: "MOVE_SUBMITTED" });
      try {
        const resp = await api.submitMove(state.gameId, uci);
        const nextPly = state.moveHistory.length + 1;
        const playerMove: MoveHistoryItem = {
          ply: nextPly,
          mover: "player",
          uci: resp.player_move.uci,
          san: resp.player_move.san,
        };
        const aiMove: MoveHistoryItem | null = resp.ai_move
          ? { ply: nextPly + 1, mover: "ai", uci: resp.ai_move.uci, san: resp.ai_move.san }
          : null;
        dispatch({
          type: "MOVE_RESOLVED",
          payload: {
            fen: resp.ai_move ? resp.ai_move.fen_after : resp.player_move.fen_after,
            status: resp.game_status,
            commentaryBefore: resp.commentary_before,
            commentaryAfter: resp.commentary_after,
            playerMove,
            aiMove,
          },
        });
        if (resp.rate_limited) {
          toast.warning("Gemini rate limit reached — showing a quick summary instead.");
        }
        return true;
      } catch (err) {
        dispatch({ type: "MOVE_FAILED" });
        toast.error(err instanceof ApiError ? err.message : "Could not submit move.");
        return false;
      }
    },
    [state.gameId, state.moveHistory.length],
  );

  const changeStyle = useCallback(
    async (style: CommentaryStyle) => {
      if (!state.gameId) {
        dispatch({ type: "STYLE_CHANGED", payload: style });
        return;
      }
      try {
        await api.changeCommentaryStyle(state.gameId, style);
        dispatch({ type: "STYLE_CHANGED", payload: style });
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not change commentary style.");
      }
    },
    [state.gameId],
  );

  const resign = useCallback(async () => {
    if (!state.gameId) return;
    try {
      await api.resignGame(state.gameId);
      dispatch({ type: "RESIGNED" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not resign.");
    }
  }, [state.gameId]);

  const isExplainingRef = useRef(false);

  const requestOwnMoveCommentary = useCallback(async () => {
    if (!state.gameId || state.moveHistory.length === 0 || isExplainingRef.current) return;
    const lastPlayerMove = [...state.moveHistory].reverse().find((m) => m.mover === "player");
    if (!lastPlayerMove) return;
    isExplainingRef.current = true;
    dispatch({ type: "OWN_MOVE_COMMENTARY_LOADING" });
    try {
      const commentary = await api.explainOwnMove(state.gameId, lastPlayerMove.ply);
      dispatch({ type: "OWN_MOVE_COMMENTARY_RESOLVED", payload: commentary });
    } catch (err) {
      dispatch({ type: "OWN_MOVE_COMMENTARY_FAILED" });
      toast.error(err instanceof ApiError ? err.message : "Could not fetch commentary.");
    } finally {
      isExplainingRef.current = false;
    }
  }, [state.gameId, state.moveHistory]);

  return (
    <GameContext.Provider
      value={{
        ...state,
        startNewGame,
        submitMove,
        changeStyle,
        resign,
        requestOwnMoveCommentary,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
