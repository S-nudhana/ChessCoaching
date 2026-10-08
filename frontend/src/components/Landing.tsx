import { Cpu, MessagesSquare, ShieldCheck, Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewGameDialog } from "@/components/NewGameDialog";

const PREVIEW_BOARD: Array<{ square: string; piece: string | null }> = [
  // Ruy Lopez after 1.e4 e5 2.Nf3 Nc6 3.Bb5 — same reference position used
  // elsewhere in the app, kept consistent rather than inventing a new one.
  { square: "a8", piece: "♜" }, { square: "b8", piece: "♞" }, { square: "c8", piece: "♝" }, { square: "d8", piece: "♛" },
  { square: "e8", piece: "♚" }, { square: "f8", piece: "♝" }, { square: "g8", piece: "♞" }, { square: "h8", piece: "♜" },
  { square: "a7", piece: "♟" }, { square: "b7", piece: "♟" }, { square: "c7", piece: "♟" }, { square: "d7", piece: "♟" },
  { square: "e7", piece: null }, { square: "f7", piece: "♟" }, { square: "g7", piece: "♟" }, { square: "h7", piece: "♟" },
  { square: "a6", piece: null }, { square: "b6", piece: null }, { square: "c6", piece: "♞" }, { square: "d6", piece: null },
  { square: "e6", piece: null }, { square: "f6", piece: null }, { square: "g6", piece: null }, { square: "h6", piece: null },
  { square: "a5", piece: null }, { square: "b5", piece: "♗" }, { square: "c5", piece: null }, { square: "d5", piece: null },
  { square: "e5", piece: "♟" }, { square: "f5", piece: null }, { square: "g5", piece: null }, { square: "h5", piece: null },
  { square: "a4", piece: null }, { square: "b4", piece: null }, { square: "c4", piece: null }, { square: "d4", piece: null },
  { square: "e4", piece: "♙" }, { square: "f4", piece: null }, { square: "g4", piece: null }, { square: "h4", piece: null },
  { square: "a3", piece: null }, { square: "b3", piece: null }, { square: "c3", piece: null }, { square: "d3", piece: null },
  { square: "e3", piece: null }, { square: "f3", piece: "♘" }, { square: "g3", piece: null }, { square: "h3", piece: null },
  { square: "a2", piece: "♙" }, { square: "b2", piece: "♙" }, { square: "c2", piece: "♙" }, { square: "d2", piece: "♙" },
  { square: "e2", piece: null }, { square: "f2", piece: "♙" }, { square: "g2", piece: "♙" }, { square: "h2", piece: "♙" },
  { square: "a1", piece: "♖" }, { square: "b1", piece: "♘" }, { square: "c1", piece: "♗" }, { square: "d1", piece: "♕" },
  { square: "e1", piece: "♔" }, { square: "f1", piece: null }, { square: "g1", piece: null }, { square: "h1", piece: "♖" },
];

function isLightSquare(square: string): boolean {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(square[1]);
  return (file + rank) % 2 === 1;
}

function PreviewBoard() {
  return (
    <div className="mx-auto grid aspect-square w-full max-w-[280px] grid-cols-8 overflow-hidden rounded-md border border-border shadow-sm">
      {PREVIEW_BOARD.map(({ square, piece }) => (
        <div
          key={square}
          className={`flex items-center justify-center text-xl leading-none ${
            isLightSquare(square) ? "bg-[#efe6d2]" : "bg-[#4a6d53]"
          }`}
        >
          {piece && (
            <span
              className={
                piece === piece.toUpperCase()
                  ? "text-[#fbfbf8] drop-shadow-[0_1px_1px_rgba(0,0,0,0.55)]"
                  : "text-[#1a1a18] drop-shadow-[0_1px_0_rgba(255,255,255,0.25)]"
              }
            >
              {piece}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function PreviewCommentary() {
  return (
    <Card className="mt-4 text-left">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Board Analysis</CardTitle>
        <Badge>Gemini</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">
          That's the Ruy Lopez — the bishop on b5 pins your knight on c6 to the king's
          defense of e5. If the knight moves, the pawn falls.
        </p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "green" | "amber";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${
            accent === "green"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
          }`}
        >
          {icon}
        </div>
        <h3 className="mb-1.5 font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function PipelineStep({
  n,
  label,
  detail,
  isLast,
}: {
  n: string;
  label: string;
  detail: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 font-mono text-xs font-semibold text-white dark:bg-emerald-600">
          {n}
        </span>
        {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="pb-5">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-600 font-mono text-sm font-semibold text-emerald-700 dark:border-emerald-400 dark:text-emerald-400">
        {number}
      </span>
      <div>
        <h4 className="font-heading font-semibold leading-tight">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function Landing({
  hasActiveGame,
  onResume,
  onStarted,
}: {
  hasActiveGame: boolean;
  onResume: () => void;
  onStarted: () => void;
}) {
  return (
    <div className="flex flex-col gap-20 pb-16">
      {/* Hero */}
      <section className="relative grid grid-cols-1 items-center gap-12 pt-6 md:grid-cols-2 md:gap-16 md:pt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-0 -z-10 h-[420px] w-[420px] rounded-full bg-emerald-300/10 blur-[100px] sm:bg-emerald-300/25"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-0 -z-10 h-[320px] w-[320px] rounded-full bg-amber-200/10 blur-[90px] sm:bg-amber-200/25"
        />
        <div>
          <Badge variant="outline" className="mb-4">
            Dual-AI chess coaching
          </Badge>
          <h1 className="font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-balance md:text-5xl">
            Play chess. Understand every move.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Stockfish plays strong, adjustable-strength chess against you. Gemini explains
            what changed before and after every move — checked against the engine first,
            so you get real analysis instead of a confident-sounding guess.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            {hasActiveGame ? (
              <>
                <Button
                  size="lg"
                  className="bg-emerald-700 text-white hover:bg-emerald-800"
                  onClick={onResume}
                >
                  Resume your game
                </Button>
                <NewGameDialog
                  onStarted={onStarted}
                  trigger={
                    <Button size="lg" variant="outline">
                      Start a new game
                    </Button>
                  }
                />
              </>
            ) : (
              <>
                <NewGameDialog
                  onStarted={onStarted}
                  trigger={
                    <Button size="lg" className="bg-emerald-700 text-white hover:bg-emerald-800">
                      Start playing — it's free
                    </Button>
                  }
                />
                <span className="text-sm text-muted-foreground">
                  No sign-up. Runs entirely in your browser.
                </span>
              </>
            )}
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Difficulty</dt>
              <dd className="font-mono text-lg font-semibold">5 levels</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Voices</dt>
              <dd className="font-mono text-lg font-semibold">Coach / Live</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Cost</dt>
              <dd className="font-mono text-lg font-semibold">Free</dd>
            </div>
          </dl>
        </div>

        <div>
          <PreviewBoard />
          <PreviewCommentary />
        </div>
      </section>

      {/* Features */}
      <section className="rounded-2xl border border-border bg-muted/30 p-8 md:p-10">
        <h2 className="mb-6 font-heading text-xl font-semibold">What makes this different</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <FeatureCard
            icon={<Cpu className="h-5 w-5" />}
            accent="green"
            title="An opponent that scales with you"
            description="Stockfish plays at five strength levels, from beginner-friendly up to full engine power, via adjustable skill and Elo caps."
          />
          <FeatureCard
            icon={<MessagesSquare className="h-5 w-5" />}
            accent="amber"
            title="Two commentary voices"
            description="Switch between an encouraging Coach and an energetic live Commentator — same facts, different delivery, any time mid-game."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            accent="green"
            title="Verified, not hallucinated"
            description="Every explanation is checked against material count, piece positions, and the engine's own evaluation before it's shown to you."
          />
        </div>
      </section>

      {/* Why trust the commentary */}
      <section className="grid grid-cols-1 gap-10 rounded-xl border border-border bg-muted/30 p-8 md:grid-cols-2 md:p-10">
        <div>
          <h2 className="font-heading text-xl font-semibold">Why trust the commentary?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Large language models are fluent, but they can misread a position, name a
            piece that isn't there, or get the material count wrong — and in a teaching
            tool, wrong commentary is worse than no commentary at all. So nothing reaches
            you unchecked.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Before Gemini ever sees the board, the engine side computes the actual
            facts — material count, attacked pieces, checks, Stockfish's own evaluation.
            Gemini's answer is checked against those facts before it's shown. If it
            doesn't hold up, it gets one chance to try again; if it still fails, you see
            a plain summary built directly from the verified facts instead of a guess.
          </p>
        </div>
        <div>
          <PipelineStep
            n="1"
            label="Compute verified facts"
            detail="Material count, attacked pieces, checks, and the engine's evaluation."
          />
          <PipelineStep
            n="2"
            label="Ask Gemini"
            detail="Prompted with only those facts, and told explicitly to say when it's unsure."
          />
          <PipelineStep
            n="3"
            label="Check the answer"
            detail="Every square, piece, and claim is matched against the facts above."
          />
          <PipelineStep
            n="4"
            label="Show it — or fall back"
            detail="Passes the check → shown. Fails twice → a fact-based summary instead."
            isLast
          />
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-6 font-heading text-xl font-semibold">How it works</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <Step
            number="1"
            title="Set up your game"
            description="Pick your color, the AI's difficulty, and whether you want a Coach or a Commentator."
          />
          <Step
            number="2"
            title="Play your move"
            description="Drag a piece. Stockfish replies instantly at the strength you chose."
          />
          <Step
            number="3"
            title="Read what changed"
            description="See what the move accomplished and what to watch for next, in the voice you picked."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border pt-10">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span className="font-semibold">Dual-AI Chess Coach</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              A free chess coaching tool pairing a classical chess engine with an LLM
              narrator — checked against the board before you ever see it.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Powered by
            </h4>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li>Stockfish — move selection</li>
              <li>Google Gemini — board analysis</li>
              <li>React, FastAPI &amp; SQLite</li>
            </ul>
          </div>
          <div className="max-w-xs">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              About
            </h4>
            <p className="mt-3 text-sm text-muted-foreground">
              Built as a university senior project exploring explainable AI in chess
              coaching. No account, no ads, no data sold.
            </p>
          </div>
        </div>
        <p className="mt-10 pb-2 text-xs text-muted-foreground">
          Not affiliated with Stockfish or Google. Chess piece glyphs rendered via Unicode.
        </p>
      </footer>
    </div>
  );
}
