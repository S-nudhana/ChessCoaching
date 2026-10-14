import { Crown } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer({ transparent = false }: { transparent?: boolean }) {
  const year = new Date().getFullYear();

  return (
    <footer className={`border-t border-border pt-10 ${transparent ? "" : "bg-background"}`}>
      <div className="grid grid-cols-1 gap-12 pb-12 md:grid-cols-[1.35fr_0.75fr_0.95fr_1fr] md:gap-8">
        <div className="max-w-sm">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="font-semibold">Chess Coach</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            A quieter way to improve at chess: play against a real engine, then understand
            what changed through clear, checked commentary.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
              No account
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
              No ads
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
              Free to play
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Explore
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link className="transition-colors hover:text-primary hover:underline hover:underline-offset-4" to="/">
                Home
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-primary hover:underline hover:underline-offset-4" to="/how-to-play">
                How to play
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-primary hover:underline hover:underline-offset-4" to="/about">
                About us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Inside the coach
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><span className="mr-2 font-mono text-xs text-primary">01</span>Adjustable engine strength</li>
            <li><span className="mr-2 font-mono text-xs text-primary">02</span>Coach or Commentator voice</li>
            <li><span className="mr-2 font-mono text-xs text-primary">03</span>Verified board explanations</li>
          </ul>
        </div>

        <div className="max-w-xs">
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Built with care
          </h4>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Stockfish chooses the moves. Gemini helps tell the story. Every explanation is
            checked against the position before it reaches you.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Created as a university project exploring explainable AI in chess coaching.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} Chess Coach</p>
        <p>Stockfish · Gemini · React · FastAPI · SQLite</p>
      </div>
      <div className="relative left-1/2 -mb-6 w-screen -translate-x-1/2 bg-primary py-3">
        <p className="mx-auto max-w-6xl px-6 text-center text-[0.7rem] text-primary-foreground/80">
          Not affiliated with Stockfish or Google. Chess piece glyphs rendered via Unicode.
        </p>
      </div>
    </footer>
  );
}
