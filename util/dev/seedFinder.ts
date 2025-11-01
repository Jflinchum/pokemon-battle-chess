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
  let resets = 0;

  while (!filter(pokemonPieces) && resets < 500) {
    battleManager.reset();
    pokemonPieces = battleManager.chessPieces;
    prng = battleManager.prng;
    resets += 1;
  }

  if (resets >= 500) {
    return undefined;
  }

  return prng?.startingSeed;
};

// Example of usage
// console.log(
//   findSeed((pieces) =>
//     pieces.some((piece) => piece.pkmn.species.toLocaleLowerCase() === "ho-oh"),
//   ),
// );
