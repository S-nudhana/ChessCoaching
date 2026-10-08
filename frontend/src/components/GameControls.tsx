import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StyleToggle } from "@/components/StyleToggle";
import { useGame } from "@/context/GameContext";

export function GameControls() {
  const {
    gameId,
    status,
    commentaryStyle,
    changeStyle,
    resign,
    requestOwnMoveCommentary,
    moveHistory,
    isExplainingMove,
  } = useGame();

  const hasActiveGame = !!gameId && status === "in_progress";
  const hasPlayerMove = moveHistory.some((m) => m.mover === "player");

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label>Commentary style</Label>
        <StyleToggle value={commentaryStyle} onChange={changeStyle} disabled={!gameId} />
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          disabled={!hasActiveGame || !hasPlayerMove || isExplainingMove}
          onClick={() => void requestOwnMoveCommentary()}
        >
          {isExplainingMove ? "Explaining…" : "Explain my last move"}
        </Button>
        <Button variant="destructive" disabled={!hasActiveGame} onClick={() => void resign()}>
          Resign
        </Button>
      </div>
      {status !== "none" && status !== "in_progress" && (
        <p className="text-sm font-medium text-muted-foreground">
          Game over: {status.replace("_", " ")}
        </p>
      )}
    </div>
  );
}
