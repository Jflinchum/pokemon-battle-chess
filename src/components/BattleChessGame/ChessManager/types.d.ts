import { PokemonSet } from "@pkmn/data";
import { Square, PieceSymbol, Color, Chess } from "chess.js";

export type ChessBoardSquare = { square: Square; type: PieceSymbol; color: Color } | null;

export type PokemonChessBoardSquare = ChessBoardSquare & {
  pokemon: PokemonSet;
} | null;

export type MoveAttempt = {
  fromSquare: Square,
  toSquare: Square,
  promotion?: PieceSymbol,
  capturedPieceSquare?: Square,
  fromCastledRookSquare?: Square,
  toCastledRookSquare?: Square,
}