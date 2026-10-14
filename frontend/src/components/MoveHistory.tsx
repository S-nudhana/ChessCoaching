import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useGame } from "@/context/GameContext";

const PIECE_NAMES: Record<string, string> = {
  K: "King",
  Q: "Queen",
  R: "Rook",
  B: "Bishop",
  N: "Knight",
};

const SAN_PATTERN = /^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=([QRBN]))?([+#])?$/;

function humanizeSan(san: string): string {
  const clean = san.trim();

  if (clean.startsWith("O-O-O")) {
    return `Castles queenside${clean.endsWith("#") ? ", checkmate" : clean.endsWith("+") ? ", check" : ""}`;
  }
  if (clean.startsWith("O-O")) {
    return `Castles kingside${clean.endsWith("#") ? ", checkmate" : clean.endsWith("+") ? ", check" : ""}`;
  }

  const match = clean.match(SAN_PATTERN);
  if (!match) return clean;

  const [, piece, , , capture, dest, promo, suffix] = match;
  const pieceName = piece ? PIECE_NAMES[piece] : "Pawn";

  let text: string;
  if (promo) {
    text = capture
      ? `Pawn takes and promotes to ${PIECE_NAMES[promo]} on ${dest}`
      : `Pawn promotes to ${PIECE_NAMES[promo]} on ${dest}`;
  } else {
    text = capture ? `${pieceName} takes on ${dest}` : `${pieceName} to ${dest}`;
  }
  if (suffix === "+") text += ", check";
  if (suffix === "#") text += ", checkmate";
  return text;
}

export function MoveHistory() {
  const { moveHistory } = useGame();

  const rows: { moveNumber: number; white?: string; black?: string }[] = [];
  for (const move of moveHistory) {
    const moveNumber = Math.ceil(move.ply / 2);
    let row = rows[moveNumber - 1];
    if (!row) {
      row = { moveNumber };
      rows[moveNumber - 1] = row;
    }
    if (move.ply % 2 === 1) {
      row.white = humanizeSan(move.san);
    } else {
      row.black = humanizeSan(move.san);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg uppercase tracking-wide">
          Move history
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-56">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No moves yet.</p>
          ) : (
            <Table>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.moveNumber} className="align-top">
                    <TableCell className="w-8 text-muted-foreground">{row.moveNumber}.</TableCell>
                    <TableCell className="whitespace-normal">{row.white ?? ""}</TableCell>
                    <TableCell className="whitespace-normal">{row.black ?? ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
