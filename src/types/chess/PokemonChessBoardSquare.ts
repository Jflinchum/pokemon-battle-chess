import { Square, PieceSymbol, Color } from "chess.js";
import { SquareModifier } from "../../../shared/models/PokemonBattleChessManager";
import { PokemonSet } from "@pkmn/data";

export type PokemonChessBoardSquare = {
  square: Square;
  type?: PieceSymbol;
  color?: Color;
  pokemon?: PokemonSet;
  modifiers?: SquareModifier["modifiers"];
};
