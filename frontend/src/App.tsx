import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/Header";
import { GameProvider, useGame } from "@/context/GameContext";
import { GamePage } from "@/pages/GamePage";
import { AboutPage } from "@/pages/AboutPage";
import { HomePage } from "@/pages/HomePage";
import { HowToPlayPage } from "@/pages/HowToPlayPage";

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const { gameId } = useGame();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <HomePage />
            </PageTransition>
          }
        />
        <Route
          path="/play"
          element={
            gameId ? (
              <PageTransition>
                <GamePage />
              </PageTransition>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/how-to-play"
          element={
            <PageTransition>
              <HowToPlayPage />
            </PageTransition>
          }
        />
        <Route
          path="/about"
          element={
            <PageTransition>
              <AboutPage />
            </PageTransition>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppShell() {
  const { gameId, isRestoring } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const didInitialRedirect = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  // On the very first load, a restored in-progress game should land on the
  // board rather than the landing page — but only once, so clicking the logo
  // to peek at the landing page later doesn't get bounced straight back.
  useEffect(() => {
    if (isRestoring || didInitialRedirect.current) return;
    didInitialRedirect.current = true;
    if (gameId && location.pathname === "/") {
      navigate("/play", { replace: true });
    }
  }, [isRestoring, gameId, location.pathname, navigate]);

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Restoring your game…
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <Header />
      <AnimatedRoutes />
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
      <Toaster />
    </GameProvider>
  );
}

export default App;
