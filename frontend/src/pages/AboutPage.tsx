import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Cpu,
  Crown,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { NewGameDialog } from "@/components/NewGameDialog";
import { PageDots } from "@/components/PageDots";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function StoryCard({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
          {icon}
        </div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h3 className="mt-2 font-heading text-xl">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  );
}

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="relative">
        <PageDots />
        <main className="flex flex-col gap-8 pb-16">
          <div className="pt-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <section className="grid grid-cols-1 items-center gap-10 pt-0 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:pt-4">
            <div>
              <Badge variant="outline" className="mb-4">
                <Crown className="mr-1 h-3.5 w-3.5" />
                Our story
              </Badge>
              <h1 className="font-heading text-4xl font-medium leading-[1.08] tracking-tight text-balance md:text-5xl">
                Chess is easier to love when every move teaches you something.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                Chess Coach started with a simple question: what if playing a strong opponent
                could feel like having a patient teacher beside you? We built this site to make
                the space between “that move was good” and “now I understand why” a little smaller.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <NewGameDialog
                  onStarted={() => navigate("/play")}
                  trigger={
                    <Button size="lg">
                      Play a game <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  }
                />
                <Link className="text-sm text-muted-foreground transition-colors hover:text-primary" to="/how-to-play">
                  Read the basics
                </Link>
              </div>
            </div>

            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 border-b border-border pb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-heading text-xl">Strong play, clear thinking</p>
                    <p className="text-sm text-muted-foreground">The idea behind Chess Coach</p>
                  </div>
                </div>
                <p className="mt-5 text-lg leading-relaxed">
                  The engine finds the move. The coach helps you see the idea.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Engine</p>
                    <p className="mt-1 text-sm font-medium">Stockfish</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Voice</p>
                    <p className="mt-1 text-sm font-medium">Coach or live</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="mb-7 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Why we built it</p>
              <h2 className="mt-2 font-heading text-3xl">Good tools should make difficult things feel more understandable.</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <StoryCard icon={<Cpu className="h-5 w-5" />} eyebrow="01 / The engine" title="Strength without the mystery">
                Engines are excellent at finding strong moves, but a line of notation does not always explain the idea behind one. We wanted the strength of Stockfish without making the learning feel opaque.
              </StoryCard>
              <StoryCard icon={<MessagesSquare className="h-5 w-5" />} eyebrow="02 / The voice" title="Commentary that meets you where you are">
                A useful explanation should sound like a coach, not a database. You can choose an encouraging Coach or a more energetic Commentator while keeping the same underlying facts.
              </StoryCard>
              <StoryCard icon={<ShieldCheck className="h-5 w-5" />} eyebrow="03 / The check" title="Fluent is not the same as true">
                Language models can sound confident when they are wrong. That is why the board facts are computed first and every explanation is checked before it is shown.
              </StoryCard>
            </div>
          </section>

          <section className="grid grid-cols-1 items-start gap-10 rounded-2xl bg-card/35 px-6 py-10 md:grid-cols-[0.8fr_1.2fr] md:px-10 md:py-12">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="mt-5 font-heading text-3xl">Built as a learning project, made for real games.</h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Chess Coach began as a university project exploring explainable AI: how can we
                combine a classical engine with a conversational model without pretending the
                model is always right?
              </p>
              <p>
                The answer is a deliberately small loop. Stockfish plays the position. The
                analysis layer records what is actually on the board. Gemini turns those facts
                into a human explanation. A validator checks the result. If the explanation does
                not hold up, the app falls back to a plain summary built from the facts.
              </p>
              <p>
                It is not meant to replace a chess coach or a thoughtful opponent. It is meant to
                give you a better next question after every move.
              </p>
            </div>
          </section>

          <section className="rounded-2xl bg-primary px-6 py-10 text-primary-foreground md:px-12 md:py-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">The next move is yours</p>
                <h2 className="mt-3 font-heading text-3xl md:text-4xl">Come see what your game can teach you.</h2>
              </div>
              <NewGameDialog
                onStarted={() => navigate("/play")}
                trigger={
                  <Button size="lg" className="shrink-0 bg-background text-primary hover:bg-background/90">
                    Start playing <ArrowRight className="ml-1 h-4 w-4" />
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
