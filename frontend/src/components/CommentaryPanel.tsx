import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { commentaryBefore, commentaryAfter, isAiThinking } = useGame();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Board Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAiThinking ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : commentaryBefore || commentaryAfter ? (
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
    </Card>
  );
}
