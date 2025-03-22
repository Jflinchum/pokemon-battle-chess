import { Square, PieceSymbol, Color } from "chess.js";

export type ChessBoardSquare = { square: Square; type: PieceSymbol; color: Color } | null;