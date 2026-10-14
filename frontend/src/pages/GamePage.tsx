import { BoardPanel } from "@/components/BoardPanel";
import { CommentaryPanel } from "@/components/CommentaryPanel";
import { GameControls } from "@/components/GameControls";
import { GameOverDialog } from "@/components/GameOverDialog";
import { MoveHistory } from "@/components/MoveHistory";
import { PageDots } from "@/components/PageDots";

export function GamePage() {
  return (
    <>
      <div className="relative">
        <PageDots />
        <main className="grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-6">
            <BoardPanel />
            <MoveHistory />
          </div>
          <div className="flex flex-col gap-6">
            <CommentaryPanel />
            <GameControls />
          </div>
        </main>
      </div>
      <GameOverDialog />
    </>
  );
}
