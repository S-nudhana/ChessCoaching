import { useEffect, useState } from "react";
import { Crown } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { BoardPanel } from "@/components/BoardPanel";
import { CommentaryPanel } from "@/components/CommentaryPanel";
import { GameControls } from "@/components/GameControls";
import { Landing } from "@/components/Landing";
import { MoveHistory } from "@/components/MoveHistory";
import { NewGameDialog } from "@/components/NewGameDialog";
import { GameProvider, useGame } from "@/context/GameContext";

function AppShell() {
  const { gameId, isRestoring } = useGame();
  const [viewingHome, setViewingHome] = useState(false);

  // A freshly-started game should always land on the board, even if the
  // player got to the dialog from the "viewing home while a game exists" state.
  useEffect(() => {
    if (gameId) setViewingHome(false);
  }, [gameId]);

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Restoring your game…
      </div>
    );
  }

  const showLanding = !gameId || viewingHome;

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between border-b border-border pb-4">
        <button
          type="button"
          onClick={() => setViewingHome(true)}
          className="flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Crown className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <span className=" text-lg font-semibold tracking-tight">Dual-AI Chess Coach</span>
        </button>
        {gameId && !showLanding && <NewGameDialog />}
      </header>

      {showLanding ? (
        <Landing
          hasActiveGame={!!gameId}
          onResume={() => setViewingHome(false)}
          onStarted={() => setViewingHome(false)}
        />
      ) : (
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
      )}
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <AppShell />
      <Toaster />
    </GameProvider>
  );
}

export default App;
