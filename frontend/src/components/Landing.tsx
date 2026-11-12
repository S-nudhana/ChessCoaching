import { BookOpen, Cpu, Crown, MessagesSquare, MousePointer, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewGameDialog } from "@/components/NewGameDialog";

const PREVIEW_BOARD: Array<{ square: string; piece: string | null }> = [
  // A mid-game position used by the landing-page preview.
  { square: "a8", piece: "♜" }, { square: "b8", piece: null }, { square: "c8", piece: "♝" }, { square: "d8", piece: "♛" },
  { square: "e8", piece: "♚" }, { square: "f8", piece: "♝" }, { square: "g8", piece: null }, { square: "h8", piece: "♜" },
  { square: "a7", piece: "♟" }, { square: "b7", piece: "♟" }, { square: "c7", piece: "♟" }, { square: "d7", piece: null },
  { square: "e7", piece: null }, { square: "f7", piece: "♟" }, { square: "g7", piece: "♟" }, { square: "h7", piece: "♟" },
  { square: "a6", piece: null }, { square: "b6", piece: null }, { square: "c6", piece: "♞" }, { square: "d6", piece: null },
  { square: "e6", piece: null }, { square: "f6", piece: "♞" }, { square: "g6", piece: null }, { square: "h6", piece: null },
  { square: "a5", piece: null }, { square: "b5", piece: null }, { square: "c5", piece: null }, { square: "d5", piece: "♙" },
  { square: "e5", piece: null }, { square: "f5", piece: null }, { square: "g5", piece: null }, { square: "h5", piece: null },
  { square: "a4", piece: null }, { square: "b4", piece: null }, { square: "c4", piece: null }, { square: "d4", piece: null },
  { square: "e4", piece: "♙" }, { square: "f4", piece: null }, { square: "g4", piece: null }, { square: "h4", piece: null },
  { square: "a3", piece: null }, { square: "b3", piece: null }, { square: "c3", piece: "♘" }, { square: "d3", piece: null },
  { square: "e3", piece: null }, { square: "f3", piece: null }, { square: "g3", piece: null }, { square: "h3", piece: null },
  { square: "a2", piece: "♙" }, { square: "b2", piece: "♙" }, { square: "c2", piece: "♙" }, { square: "d2", piece: null },
  { square: "e2", piece: null }, { square: "f2", piece: "♙" }, { square: "g2", piece: "♙" }, { square: "h2", piece: "♙" },
  { square: "a1", piece: "♖" }, { square: "b1", piece: null }, { square: "c1", piece: "♗" }, { square: "d1", piece: "♕" },
  { square: "e1", piece: "♔" }, { square: "f1", piece: "♗" }, { square: "g1", piece: "♘" }, { square: "h1", piece: "♖" },
];

function isLightSquare(square: string): boolean {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(square[1]);
  return (file + rank) % 2 === 1;
}

function isWhitePiece(piece: string): boolean {
  return piece.charCodeAt(0) >= 9812 && piece.charCodeAt(0) <= 9817;
}

function PreviewBoard() {
  return (
    <div className="mx-auto grid aspect-square w-full max-w-[324px] grid-cols-8 overflow-hidden rounded-xl border border-[#d2cec2] shadow-[0_10px_24px_rgba(35,48,37,0.12)]">
      {PREVIEW_BOARD.map(({ square, piece }) => (
        <div
          key={square}
          className={`flex items-center justify-center text-2xl leading-none ${isLightSquare(square) ? "bg-[#ebe5d8]" : "bg-[#435347]"
            }`}
        >
          {piece && (
            <span
              className={isWhitePiece(piece)
                ? "text-[#fbfbf8] drop-shadow-[0_1px_1px_rgba(0,0,0,0.55)]"
                : "text-[#1a1a18] drop-shadow-[0_1px_0_rgba(255,255,255,0.25)]"}
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
        <CardTitle className="text-lg">Board Analysis</CardTitle>
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex flex-col items-center text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground transition-colors group-hover:bg-primary/90">
        {icon}
      </div>
      <h3 className="max-w-xs font-heading text-[1.35rem] leading-tight">{title}</h3>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
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
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-semibold text-primary-foreground">
          {n}
        </span>
        {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="pb-5">
        <p className="text-sm leading-tight">{label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
  tone,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "olive" | "brass" | "stone";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${tone === "brass"
            ? "bg-accent/55 text-accent-foreground"
            : tone === "stone"
              ? "bg-primary/10 text-primary"
              : "bg-secondary text-primary"
            }`}
        >
          {icon}
        </div>
        <p className="font-mono text-xs font-semibold text-primary">{number} / STEP</p>
        <h3 className="mt-2 font-heading text-xl">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
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
        <div>
          <Badge variant="outline" className="mb-4">
            Dual-AI chess coaching
          </Badge>
          <h1 className="font-heading text-4xl font-medium leading-[1.1] tracking-tight text-balance md:text-5xl">
            Play chess. Understand every move.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Stockfish plays strong, adjustable-strength chess against you. Gemini explains what
            changed before and after every move — checked against the engine first, so you get
            real analysis instead of a confident-sounding guess.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            {hasActiveGame ? (
              <>
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
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
                    <Button size="lg">
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
      <section className="rounded-2xl bg-card/35 px-4 py-12 sm:px-8 md:py-16">
        <h2 className="mb-12 text-center font-heading text-3xl">What makes this different</h2>
        <div className="grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Cpu className="h-7 w-7 stroke-[1.5]" />}
            title="An opponent that scales with you"
            description="Stockfish plays at five strength levels, from beginner-friendly up to full engine power, via adjustable skill and Elo caps."
          />
          <FeatureCard
            icon={<MessagesSquare className="h-7 w-7 stroke-[1.5]" />}
            title="Two commentary voices"
            description="Switch between an encouraging Coach and an energetic live Commentator — same facts, different delivery, any time mid-game."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-7 w-7 stroke-[1.5]" />}
            title="Verified, not hallucinated"
            description="Every explanation is checked against material count, piece positions, and the engine's own evaluation before it's shown to you."
          />
          <FeatureCard
            icon={<BookOpen className="h-7 w-7 stroke-[1.5]" />}
            title="Learn from every move"
            description="Before-and-after explanations turn each game into a clear lesson you can apply to the next position."
          />
          <FeatureCard
            icon={<Sparkles className="h-7 w-7 stroke-[1.5]" />}
            title="Find your level"
            description="Five difficulty levels give you room to build confidence without feeling outmatched from the start."
          />
          <FeatureCard
            icon={<Crown className="h-7 w-7 stroke-[1.5]" />}
            title="A calmer way to play"
            description="No account, no ads, and no distractions — just a focused board and useful feedback when you need it."
          />
        </div>
      </section>

      {/* Why trust the commentary */}
      <section className="grid grid-cols-1 gap-10 rounded-xl bg-card/55 md:grid-cols-2">
        <div>
          <h2 className="font-heading text-2xl">Why trust the commentary?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Large language models are fluent, but they can misread a position, name a
            piece that isn't there, or get the material count wrong — and in a teaching
            tool, wrong commentary is worse than no commentary at all. So nothing reaches
            you unchecked.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Before Gemini ever sees the board, the engine side computes the actual facts —
            material count, attacked pieces, checks, and Stockfish's own evaluation.
            Gemini's answer is checked against those facts before it's shown. If it doesn't hold
            up, it gets one chance to try again; if it still fails, you see a plain summary
            built directly from the verified facts instead of a guess.
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
          />
          <PipelineStep
            n="5"
            label="Cache it for next time"
            detail="Saved per position and style, so an identical spot reuses the verified answer instead of asking Gemini again."
            isLast
          />
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-xl bg-card/55">
        <h2 className="mb-6 font-heading text-2xl">How it works</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <StepCard
            number="1"
            icon={<MousePointer className="h-5 w-5" />}
            tone="olive"
            title="Set up your game"
            description="Pick your color, the AI's difficulty, and whether you want a Coach or a Commentator."
          />
          <StepCard
            number="2"
            icon={<Cpu className="h-5 w-5" />}
            tone="brass"
            title="Play your move"
            description="Drag a piece. Stockfish replies instantly at the strength you chose."
          />
          <StepCard
            number="3"
            icon={<MessagesSquare className="h-5 w-5" />}
            tone="stone"
            title="Read what changed"
            description="See what the move accomplished and what to watch for next, in the voice you picked."
          />
        </div>
      </section>
    </div>
  );
}
