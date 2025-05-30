import { PokemonSet } from "@pkmn/data";
import { Square, PieceSymbol, Color } from "chess.js";
import { SquareModifier } from "../../../../shared/models/PokemonBattleChessManager";

export type ChessBoardSquare = {
  square: Square;
  type: PieceSymbol;
  color: Color;
} | null;

export type PokemonChessBoardSquare = {
  square: Square;
  type?: PieceSymbol;
  color?: Color;
  pokemon?: PokemonSet;
  modifiers?: SquareModifier["modifiers"];
};

export type MoveAttempt = {
  fromSquare: Square;
  toSquare: Square;
  promotion?: PieceSymbol;
  capturedPieceSquare?: Square;
  fromCastledRookSquare?: Square;
  toCastledRookSquare?: Square;
};
