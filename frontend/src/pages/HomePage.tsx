import { useNavigate } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Landing } from "@/components/Landing";
import { PageDots } from "@/components/PageDots";
import { useGame } from "@/context/GameContext";

export function HomePage() {
  const { gameId } = useGame();
  const navigate = useNavigate();

  return (
    <>
      <div className="relative">
        <PageDots />
        <Landing
          hasActiveGame={!!gameId}
          onResume={() => navigate("/play")}
          onStarted={() => navigate("/play")}
        />
      </div>
      <Footer />
    </>
  );
}
