import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThoughtLine } from "@/components/ThoughtLine";
import { useGame } from "@/context/GameContext";
import type { CommentaryResult, CommentarySource } from "@/types/game";

const SOURCE_LABEL: Record<CommentarySource, string> = {
  gemini: "Gemini",
  cache: "Cached",
  template: "Summary (fallback)",
};

const SOURCE_VARIANT: Record<CommentarySource, "default" | "secondary" | "outline"> = {
  gemini: "default",
  cache: "secondary",
  template: "outline",
};

// The two halves of a turn: the engine picking its reply, then Gemini writing
// the commentary for the exchange. Each step is appended as that phase starts,
// so the last one in the list is always the one currently running.
const ENGINE_STEPS = ["Reading the position", "Choosing a reply"];
const COMMENTARY_STEPS = [...ENGINE_STEPS, "Reviewing the exchange", "Writing the analysis"];
const EMPTY_TRACE: { gameId: string | null; steps: string[] } = { gameId: null, steps: [] };

function SourceBadge({ source }: { source: CommentarySource }) {
  return <Badge variant={SOURCE_VARIANT[source]}>{SOURCE_LABEL[source]}</Badge>;
}

function Phase({ label, commentary }: { label: string; commentary: CommentaryResult | null }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {commentary && <SourceBadge source={commentary.source} />}
      </div>
      <p className="text-sm leading-relaxed">{commentary?.text}</p>
    </div>
  );
}

export function CommentaryPanel() {
  const { gameId, commentaryBefore, commentaryAfter, isAiThinking, isCommentaryLoading } = useGame();
  // The trace is tagged with the game it belongs to, so starting or restoring a
  // game shows no thought line until that game actually thinks.
  const [trace, setTrace] = useState<{ gameId: string | null; steps: string[] }>(EMPTY_TRACE);

  const thinking = isAiThinking || isCommentaryLoading;

  // Grow the trace as the turn progresses; the next move restarts it.
  useEffect(() => {
    if (isAiThinking) setTrace({ gameId, steps: ENGINE_STEPS });
    else if (isCommentaryLoading) setTrace({ gameId, steps: COMMENTARY_STEPS });
  }, [gameId, isAiThinking, isCommentaryLoading]);

  const steps = trace.gameId === gameId ? trace.steps : EMPTY_TRACE.steps;
  const hasCommentary = !!(commentaryBefore || commentaryAfter);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Board Analysis</CardTitle>
        {steps.length > 0 && (
          <CardAction>
            <ThoughtLine
              working={thinking}
              steps={steps}
              // Kept short: the head never wraps, and a long label here would
              // squeeze the card title instead.
              label={isAiThinking ? "Thinking…" : "Writing…"}
              glyph="sparkle"
              fontSize={13}
              breathPeriod={1.8}
              settleDuration={400}
              // A literal color, not `currentColor`: the shimmer paints the
              // label with a gradient while setting its own color to
              // transparent, which would swallow `currentColor` whole.
              color="var(--muted-foreground)"
              className="mt-1"
            />
          </CardAction>
        )}
      </CardHeader>
      {!thinking && (
        <CardContent className="space-y-4">
          {hasCommentary ? (
            <>
              {commentaryBefore && <Phase label="Before the move" commentary={commentaryBefore} />}
              {commentaryAfter && <Phase label="After the move" commentary={commentaryAfter} />}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Make a move to see the board analysis here.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
