import { Color, PieceSymbol, Square } from "chess.js";

export type ChessBoardSquare = {
  square: Square;
  type: PieceSymbol;
  color: Color;
} | null;
