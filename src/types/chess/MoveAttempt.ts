import { Square, PieceSymbol } from "chess.js";

export type MoveAttempt = {
  fromSquare: Square;
  toSquare: Square;
  promotion?: PieceSymbol;
  capturedPieceSquare?: Square;
  fromCastledRookSquare?: Square;
  toCastledRookSquare?: Square;
};
