import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DifficultySelector } from "@/components/DifficultySelector";
import { StyleToggle } from "@/components/StyleToggle";
import { useGame } from "@/context/GameContext";
import type { CommentaryStyle, PlayerColor } from "@/types/game";

export function NewGameDialog({
  trigger,
  onStarted,
}: {
  trigger?: ReactNode;
  onStarted?: () => void;
}) {
  const { startNewGame, status } = useGame();
  const [open, setOpen] = useState(false);
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");
  const [difficulty, setDifficulty] = useState(3);
  const [commentaryStyle, setCommentaryStyle] = useState<CommentaryStyle>("coach");

  const hasActiveGame = status === "in_progress";

  async function handleStart() {
    const ok = await startNewGame(playerColor, difficulty, commentaryStyle);
    if (!ok) return;
    setOpen(false);
    onStarted?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            New Game / Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Game</DialogTitle>
          <DialogDescription>
            {hasActiveGame
              ? "Starting a new game discards the current board and commentary."
              : "Choose your color, the AI's difficulty, and the commentary style."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-2">
          <div className="space-y-1.5">
            <Label>Play as</Label>
            <ToggleGroup
              type="single"
              value={playerColor}
              onValueChange={(v) => v && setPlayerColor(v as PlayerColor)}
              className="w-full"
            >
              <ToggleGroupItem value="white" className="flex-1">
                White
              </ToggleGroupItem>
              <ToggleGroupItem value="black" className="flex-1">
                Black
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
          <div className="space-y-1.5">
            <Label>Commentary style</Label>
            <StyleToggle value={commentaryStyle} onChange={setCommentaryStyle} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleStart}>
            Start New Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
