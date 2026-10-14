import { useEffect, useRef, useState } from "react";
import { Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewGameDialog } from "@/components/NewGameDialog";
import { useGame } from "@/context/GameContext";
import type { GameStatus, PlayerColor } from "@/types/game";

const TERMINAL_STATUSES: ReadonlySet<GameStatus | "none"> = new Set([
  "checkmate",
  "stalemate",
  "draw",
  "resigned",
]);

function resultCopy(status: GameStatus | "none", fen: string, playerColor: PlayerColor) {
  if (status === "checkmate") {
    const activeColor = fen.split(" ")[1] === "w" ? "white" : "black";
    const winner: PlayerColor = activeColor === "white" ? "black" : "white";
    const playerWon = winner === playerColor;
    return {
      title: playerWon ? "You won!" : "You lost",
      description: playerWon
        ? "Checkmate — you delivered the final blow."
        : "Checkmate — the AI found the final blow.",
    };
  }
  if (status === "resigned") {
    return { title: "Game over", description: "You resigned the game." };
  }
  if (status === "stalemate") {
    return {
      title: "Draw",
      description: "Stalemate — no legal moves, but the king isn't in check.",
    };
  }
  return { title: "Draw", description: "The game ended in a draw." };
}

export function GameOverDialog() {
  const { gameId, status, fen, playerColor } = useGame();
  const [open, setOpen] = useState(false);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    const prev = prevStatusRef.current;
    if (TERMINAL_STATUSES.has(status) && status !== prev) {
      setOpen(true);
    }
    prevStatusRef.current = status;
  }, [status, gameId]);

  if (!TERMINAL_STATUSES.has(status)) return null;

  const { title, description } = resultCopy(status, fen, playerColor);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep reviewing the board
          </Button>
          <NewGameDialog
            trigger={
              <Button>
                Start new game
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
