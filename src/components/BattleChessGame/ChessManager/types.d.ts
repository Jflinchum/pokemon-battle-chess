import { PokemonSet } from "@pkmn/data";
import { Square, PieceSymbol, Color, Chess } from "chess.js";
import { WeatherId, TerrainId } from '../../../../shared/types/PokemonTypes';

export type ChessBoardSquare = { square: Square; type: PieceSymbol; color: Color } | null;

export type PokemonChessBoardSquare = {
  square: Square;
  type?: PieceSymbol;
  color?: Color;
  pokemon?: PokemonSet;
  modifier?: WeatherId | TerrainId;
};

export type MoveAttempt = {
  fromSquare: Square,
  toSquare: Square,
  promotion?: PieceSymbol,
  capturedPieceSquare?: Square,
  fromCastledRookSquare?: Square,
  toCastledRookSquare?: Square,
}