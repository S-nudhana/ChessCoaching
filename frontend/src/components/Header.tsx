import { Crown } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { NewGameDialog } from "@/components/NewGameDialog";
import { useGame } from "@/context/GameContext";

export function Header() {
  const { gameId } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const onGamePage = location.pathname === "/play";

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Crown className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold tracking-tight">Chess Coach</span>
      </button>

      <nav aria-label="Primary navigation" className="ml-auto flex items-center gap-1">
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isActive
              ? "bg-secondary text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`
          }
        >
          About
        </NavLink>
        <NavLink
          to="/how-to-play"
          className={({ isActive }) =>
            `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isActive
              ? "bg-secondary text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`
          }
        >
          How to play
        </NavLink>
      </nav>

      {gameId && onGamePage && <NewGameDialog />}
    </header>
  );
}
