import { Square, PieceSymbol, Color } from "chess.js";

export type ChessBoardSquare = { square: Square; type: PieceSymbol; color: Color } | null;


export type MoveAttempt = {
  fromSquare: Square,
  toSquare: Square,
  promotion?: PieceSymbol,
  capturedPieceSquare?: Square,
  fromCastledRookSquare?: Square,
  toCastledRookSquare?: Square,
}