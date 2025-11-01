import { PRNG } from "@pkmn/sim";
import {
  PokemonBattleChessManager,
  PokemonPiece,
} from "../../shared/models/PokemonBattleChessManager";

/**
 * Generates chess boards until it finds a seed that satisfies a given filter
 */
export const findSeed = (
  filter: (pokemonPieces: PokemonPiece[]) => boolean,
) => {
  let pokemonPieces: PokemonPiece[] = [];
  let prng: PRNG | undefined = undefined;
  const battleManager = new PokemonBattleChessManager({ format: "random" });

  while (!filter(pokemonPieces)) {
    battleManager.reset();
    pokemonPieces = battleManager.chessPieces;
    prng = battleManager.prng;
  }

  return prng?.startingSeed;
};

// Example of usage
// console.log(
//   findSeed((pieces) =>
//     pieces.some((piece) => piece.pkmn.species.toLocaleLowerCase() === "ho-oh"),
//   ),
// );
