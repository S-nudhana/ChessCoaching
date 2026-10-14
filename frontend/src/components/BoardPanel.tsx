import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

import { Card, CardContent } from "@/components/ui/card";
import { useGame } from "@/context/GameContext";

export function BoardPanel() {
  const { fen, playerColor, status, isAiThinking, submitMove } = useGame();
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null);

  // Once the authoritative fen catches up (server round-trip resolved),
  // drop the optimistic override and let the real state take over.
  useEffect(() => {
    setOptimisticFen(null);
  }, [fen]);

  const displayFen = optimisticFen ?? fen;

  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const gameOver = status !== "in_progress" && status !== "none";
  const piecesDraggable = !isAiThinking && !gameOver && optimisticFen === null;

  function handleDrop({
    piece,
    sourceSquare,
    targetSquare,
  }: {
    piece: { pieceType: string };
    sourceSquare: string;
    targetSquare: string | null;
  }): boolean {
    if (!targetSquare || !piecesDraggable) return false;

    const isPawn = piece.pieceType.toLowerCase().endsWith("p");
    const isPromotionRank = targetSquare.endsWith("8") || targetSquare.endsWith("1");

    let move;
    try {
      move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPawn && isPromotionRank ? "q" : undefined,
      });
    } catch {
      return false;
    }
    if (!move) return false;

    // Show the player's own move immediately instead of waiting on the full
    // move+AI-reply+commentary round trip, which is what caused the piece to
    // flicker back to its old square before jumping straight to the AI's
    // post-reply position.
    setOptimisticFen(chess.fen());

    const uci = `${move.from}${move.to}${move.promotion ?? ""}`;
    submitMove(uci).then((ok) => {
      if (!ok) setOptimisticFen(null);
    });
    return true;
  }

  return (
    <Card className="p-2">
      <CardContent className="p-0">
        <div className="mx-auto w-full max-w-[480px]">
          <Chessboard
            options={{
              position: displayFen,
              onPieceDrop: handleDrop,
              boardOrientation: playerColor,
              allowDragging: piecesDraggable,
              id: "chess-coaching-board",
              lightSquareStyle: { backgroundColor: "#ebe5d8" },
              darkSquareStyle: { backgroundColor: "#435347" },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
