import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Crown,
  Flag,
  Lightbulb,
  MousePointer,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { NewGameDialog } from "@/components/NewGameDialog";
import { PageDots } from "@/components/PageDots";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PIECES = [
  {
    symbol: "♙",
    name: "Pawn",
    value: "1 point",
    movement: "Moves forward one square and captures one square diagonally.",
    tip: "On its first move, a pawn may move two squares.",
  },
  {
    symbol: "♘",
    name: "Knight",
    value: "3 points",
    movement: "Moves in an L-shape: two squares in one direction, then one to the side.",
    tip: "The knight is the only piece that can jump over others.",
  },
  {
    symbol: "♗",
    name: "Bishop",
    value: "3 points",
    movement: "Moves any number of squares diagonally.",
    tip: "A bishop stays on the same color square for the whole game.",
  },
  {
    symbol: "♖",
    name: "Rook",
    value: "5 points",
    movement: "Moves any number of squares along a rank or file.",
    tip: "Rooks become especially powerful on open files.",
  },
  {
    symbol: "♕",
    name: "Queen",
    value: "9 points",
    movement: "Moves any number of squares horizontally, vertically, or diagonally.",
    tip: "The queen combines the movement of a rook and a bishop.",
  },
  {
    symbol: "♔",
    name: "King",
    value: "The game revolves around it",
    movement: "Moves one square in any direction.",
    tip: "The king may never move into check.",
  },
];

function PieceCard({
  symbol,
  name,
  value,
  movement,
  tip,
}: (typeof PIECES)[number]) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-3xl leading-none text-primary"
          >
            {symbol}
          </span>
          <div>
            <CardTitle>{name}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{value}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed">{movement}</p>
        <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Remember: </span>
          {tip}
        </p>
      </CardContent>
    </Card>
  );
}

function MiniBoard() {
  const squares = [
    "♜", "", "♝", "♛", "♚", "♝", "", "♜",
    "♟", "♟", "♟", "", "", "♟", "♟", "♟",
    "", "", "♞", "", "", "♞", "", "",
    "", "", "", "♙", "", "", "", "",
    "", "", "", "", "♙", "", "", "",
    "", "", "♘", "", "", "", "", "",
    "♙", "♙", "♙", "", "", "♙", "♙", "♙",
    "♖", "", "♗", "♕", "♔", "♗", "♘", "♖",
  ];

  return (
    <div className="grid aspect-square w-full max-w-[360px] grid-cols-8 overflow-hidden rounded-xl border border-border shadow-sm">
      {squares.map((piece, index) => {
        const isLight = (Math.floor(index / 8) + (index % 8)) % 2 === 0;
        const isWhitePiece = piece && piece.charCodeAt(0) >= 9812 && piece.charCodeAt(0) <= 9817;

        return (
          <div
            key={`${piece}-${index}`}
            className={`flex items-center justify-center text-[clamp(1.25rem,5vw,2rem)] leading-none ${isLight ? "bg-[#ebe5d8]" : "bg-[#435347]"
              }`}
          >
            {piece && (
              <span
                className={isWhitePiece
                  ? "text-[#fbfbf8] drop-shadow-[0_1px_1px_rgba(0,0,0,0.55)]"
                  : "text-[#1a1a18] drop-shadow-[0_1px_0_rgba(255,255,255,0.25)]"}
              >
                {piece}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function HowToPlayPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="relative">
        <PageDots />
        <main className="flex flex-col gap-6 pb-16">
          <div className="pt-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <section className="grid grid-cols-1 items-start gap-10 pt-0 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:pt-4">
            <div>
              <Badge variant="outline" className="mb-4">
                <BookOpen className="mr-1 h-3.5 w-3.5" />
                Chess basics
              </Badge>
              <h1 className="font-heading text-4xl font-medium leading-[1.1] tracking-tight text-balance md:text-5xl">
                How to play chess
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                Chess is a strategy game for two players. Take turns moving your pieces,
                protect your king, and look for a way to checkmate your opponent’s king.
                Every piece moves differently, so strong play comes from learning how they
                work together, controlling important squares, and thinking ahead before
                you commit to a move. This guide walks you through the board, the pieces,
                the rules, and a few simple principles to help you feel confident in your
                first game.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <NewGameDialog
                  onStarted={() => navigate("/play")}
                  trigger={
                    <Button size="lg">
                    Start playing <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  }
                />
                <span className="text-sm text-muted-foreground">Learn by playing against the coach.</span>
              </div>
            </div>

            <Card className="border-foreground/15 bg-background/65">
              <CardContent className="flex flex-col items-center gap-5 pt-6">
                <MiniBoard />
                <div className="w-full border-t border-border/80 pt-4">
                  <div className="flex items-start gap-3">
                    <Crown className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-heading text-lg">The goal</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Put the enemy king in <span className="font-semibold text-foreground">checkmate</span>:
                        it is under attack and has no legal escape.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="mb-6 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                The big picture
              </p>
              <h2 className="mt-2 font-heading text-3xl">A game in three steps</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Every chess game follows the same simple rhythm. The strategy comes from
                choosing the best move within that rhythm.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <MousePointer className="h-5 w-5" />
                  </div>
                  <p className="font-mono text-xs font-semibold text-primary">01 / SET UP</p>
                  <h3 className="mt-2 font-heading text-xl">White moves first</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Each player starts with sixteen pieces on a board of sixty-four squares.
                    White always makes the opening move.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="font-mono text-xs font-semibold text-primary">02 / TAKE TURNS</p>
                  <h3 className="mt-2 font-heading text-xl">Make one legal move</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Move one piece at a time. You can capture an opposing piece by moving
                    onto its square, but never leave your own king in check.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <p className="font-mono text-xs font-semibold text-primary">03 / FINISH</p>
                  <h3 className="mt-2 font-heading text-xl">Checkmate the king</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Attack the opposing king so it cannot escape. That is checkmate, and the
                    player who delivers it wins.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Learn the board
                </p>
                <h2 className="mt-2 font-heading text-3xl">Know your pieces</h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
                Every piece has its own movement pattern. Use them together to control the board.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PIECES.map((piece) => <PieceCard key={piece.name} {...piece} />)}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Three rules to remember
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="font-medium">Check</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Your king is in check when an opponent’s piece attacks it. You must respond
                    immediately by moving the king, blocking the attack, or capturing the attacker.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Checkmate</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    If the king is in check and none of those responses is legal, the game ends.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Draw</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    A game can also end without a winner, such as when a player has no legal move
                    but their king is not in check. This is called stalemate.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Lightbulb className="h-5 w-5 text-accent-foreground" />
                  Beginner’s checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-semibold text-primary">1</span>
                    <p className="text-sm leading-relaxed"><span className="font-medium">Control the center.</span> Squares near the middle let your pieces influence more of the board.</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-semibold text-primary">2</span>
                    <p className="text-sm leading-relaxed"><span className="font-medium">Develop your pieces.</span> Bring knights and bishops into the game before moving the same piece repeatedly.</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-semibold text-primary">3</span>
                    <p className="text-sm leading-relaxed"><span className="font-medium">Keep your king safe.</span> Castling is a special move that can tuck the king behind a line of pawns.</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-semibold text-primary">4</span>
                    <p className="text-sm leading-relaxed"><span className="font-medium">Check before you move.</span> Ask what your opponent threatens and whether your move leaves a piece unprotected.</p>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section className="rounded-2xl bg-primary px-6 py-10 text-primary-foreground md:px-12 md:py-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-primary-foreground/75">
                  <Flag className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-[0.16em]">Ready for a game?</span>
                </div>
                <h2 className="mt-3 font-heading text-3xl md:text-4xl">The fastest way to learn is to play.</h2>
                <p className="mt-3 text-sm leading-relaxed text-primary-foreground/75">
                  Choose your color and difficulty, then play at your own pace. Chess Coach
                  explains what changed after every move.
                </p>
              </div>
              <NewGameDialog
                onStarted={() => navigate("/play")}
                trigger={
                  <Button size="lg" className="shrink-0 bg-background text-primary hover:bg-background/90">
                  Play chess <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </section>
        </main>
      </div>
      <Footer transparent />
    </>
  );
}
