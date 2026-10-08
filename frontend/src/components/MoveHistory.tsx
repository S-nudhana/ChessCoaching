import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useGame } from "@/context/GameContext";

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
      row.white = move.san;
    } else {
      row.black = move.san;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
          Move history
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-40">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No moves yet.</p>
          ) : (
            <Table>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.moveNumber}>
                    <TableCell className="w-10 font-mono text-muted-foreground">
                      {row.moveNumber}.
                    </TableCell>
                    <TableCell className="font-mono">{row.white ?? ""}</TableCell>
                    <TableCell className="font-mono">{row.black ?? ""}</TableCell>
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
