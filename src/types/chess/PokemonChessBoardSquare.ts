import { PokemonSet } from "@pkmn/data";
import { Color, PieceSymbol, Square } from "chess.js";
import { SquareModifier } from "../../../shared/models/PokemonBattleChessManager";

export type PokemonChessBoardSquare = {
  square: Square;
  type?: PieceSymbol;
  color?: Color;
  pokemon?: PokemonSet;
  modifiers?: SquareModifier["modifiers"];
};
