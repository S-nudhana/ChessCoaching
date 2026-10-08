from dataclasses import asdict, dataclass

import chess

from app.engine.stockfish_pool import StockfishPool

PIECE_VALUES = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 0,
}


@dataclass
class AttackedPiece:
    square: str
    piece: str
    color: str
    attacked_by: list[str]


@dataclass
class VerifiedFacts:
    fen: str
    turn: str
    material: dict
    material_diff: int
    piece_list: dict
    is_check: bool
    checking_pieces: list[str]
    attacked_pieces: list[AttackedPiece]
    legal_move_count: int
    is_checkmate: bool
    is_stalemate: bool
    is_insufficient_material: bool
    eval_cp: int | None
    eval_mate: int | None
    best_move_san: str | None

    def to_dict(self) -> dict:
        d = asdict(self)
        return d


def compute_material(board: chess.Board) -> tuple[dict, int]:
    totals = {"white": 0, "black": 0}
    for piece_type, value in PIECE_VALUES.items():
        totals["white"] += len(board.pieces(piece_type, chess.WHITE)) * value
        totals["black"] += len(board.pieces(piece_type, chess.BLACK)) * value
    return totals, totals["white"] - totals["black"]


def compute_piece_list(board: chess.Board) -> dict:
    out = {"white": [], "black": []}
    for square, piece in board.piece_map().items():
        side = "white" if piece.color == chess.WHITE else "black"
        out[side].append(f"{piece.symbol().upper()}{chess.square_name(square)}")
    return out


def compute_attacked_pieces(board: chess.Board) -> list[AttackedPiece]:
    results = []
    for square, piece in board.piece_map().items():
        attackers = board.attackers(not piece.color, square)
        if attackers:
            results.append(
                AttackedPiece(
                    square=chess.square_name(square),
                    piece=piece.symbol().upper(),
                    color="white" if piece.color == chess.WHITE else "black",
                    attacked_by=[chess.square_name(a) for a in attackers],
                )
            )
    return results


async def build_verified_facts(fen: str, stockfish_pool: StockfishPool, depth: int = 12) -> VerifiedFacts:
    board = chess.Board(fen)
    material, diff = compute_material(board)

    info = await stockfish_pool.evaluate(fen, depth=depth)
    pov_score = info["score"].white()
    eval_cp = pov_score.score() if not pov_score.is_mate() else None
    eval_mate = pov_score.mate() if pov_score.is_mate() else None

    best_move_san = None
    pv = info.get("pv")
    if pv:
        try:
            best_move_san = board.san(pv[0])
        except (ValueError, AssertionError):
            best_move_san = None

    return VerifiedFacts(
        fen=fen,
        turn="white" if board.turn == chess.WHITE else "black",
        material=material,
        material_diff=diff,
        piece_list=compute_piece_list(board),
        is_check=board.is_check(),
        checking_pieces=[chess.square_name(s) for s in board.checkers()] if board.is_check() else [],
        attacked_pieces=compute_attacked_pieces(board),
        legal_move_count=board.legal_moves.count(),
        is_checkmate=board.is_checkmate(),
        is_stalemate=board.is_stalemate(),
        is_insufficient_material=board.is_insufficient_material(),
        eval_cp=eval_cp,
        eval_mate=eval_mate,
        best_move_san=best_move_san,
    )
