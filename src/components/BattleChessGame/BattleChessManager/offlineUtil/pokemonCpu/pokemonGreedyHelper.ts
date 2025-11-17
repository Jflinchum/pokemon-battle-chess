import { Battle, Pokemon, Side } from "@pkmn/client";
import { Move, PokemonSet } from "@pkmn/data";
import { Dex } from "@pkmn/dex";
import { Color, Square } from "chess.js";
import { PokemonBattleChessManager } from "../../../../../../shared/models/PokemonBattleChessManager";
import {
  TerrainId,
  WeatherId,
} from "../../../../../../shared/types/PokemonTypes";
import { getTypeEffectiveness } from "../../../../../util/pokemonUtil";

const isPokemonPhysicalAttacker = (pokemon: Pokemon) => {
  const physicalMoves = [];
  const specialMoves = [];

  pokemon.set?.moves.forEach((move) => {
    const dexMove = Dex.moves.get(move);
    if (dexMove.category === "Physical") physicalMoves.push(dexMove);
    else if (dexMove.category === "Special") specialMoves.push(dexMove);
  });

  if (physicalMoves.length === specialMoves.length) {
    return pokemon.species.baseStats.atk > pokemon.species.baseStats.spa;
  }

  return physicalMoves.length > specialMoves.length;
};

const isPokemonSpecialAttacker = (pokemon: Pokemon) => {
  return !isPokemonPhysicalAttacker(pokemon);
};

export const isScreenEffective = (move: Move, opponentPokemon: Pokemon) => {
  if (move.id === "reflect" && isPokemonPhysicalAttacker(opponentPokemon)) {
    return true;
  }
  if (move.id === "lightscreen" && isPokemonSpecialAttacker(opponentPokemon)) {
    return true;
  }
  return false;
};

export const isFakeoutEffective = (
  move: Move,
  currentPokemon: Pokemon,
  opponentPokemon: Pokemon,
) => {
  return (
    move.id === "fakeout" &&
    getTypeEffectiveness(move, currentPokemon, opponentPokemon).notImmune
  );
};

export const isStatusEffective = (move: Move, opponentPokemon: Pokemon) => {
  if (
    move.category === "Status" &&
    move.status &&
    !opponentPokemon.status &&
    !Dex.getImmunity(move, opponentPokemon)
  ) {
    if (move.status === "brn" && isPokemonPhysicalAttacker(opponentPokemon)) {
      return false;
    }

    return true;
  }
};

export const isWishProtectEffective = (move: Move, side: Side) => {
  return move.id === "protect" && side.wisher;
};

export const isHealingEffective = (move: Move, currentPokemon: Pokemon) => {
  return move.flags.heal && currentPokemon.maxhp / 2 > currentPokemon.hp;
};

const doesPriorityMoveWork = (move: Move, battle: Battle) => {
  if (
    (move.id === "fakeout" || move.id === "firstimpression") &&
    battle.turn !== 1
  ) {
    return false;
  }
  if ((battle.field.terrainState.id as TerrainId) === "psychicterrain") {
    return false;
  }

  return true;
};

export const isPriorityMoveEffective = (
  move: Move,
  battle: Battle,
  opponentPokemon: Pokemon,
) => {
  if (
    move.priority > 0 &&
    doesPriorityMoveWork(move, battle) &&
    opponentPokemon.maxhp / 6 > opponentPokemon.hp
  ) {
    return true;
  }
  return false;
};

export const isSetupEffective = (move: Move, currentPokemon: Pokemon) => {
  // Any setup moves that also decrease stats should be handled for sets that include whiteherb
  if (Object.values(move.boosts || {}).find((val) => val < 0)) return false;
  const spaBoost = move.boosts?.spa || 0;
  const atkBoost = move.boosts?.atk || 0;
  if (spaBoost && (currentPokemon.boosts?.spa || 0 >= 6)) {
    return false;
  }

  if (atkBoost && (currentPokemon.boosts.atk || 0 >= 6)) {
    return false;
  }

  if (
    (spaBoost > 0 || atkBoost > 0) &&
    currentPokemon.maxhp * (3 / 4) < currentPokemon.hp
  ) {
    return true;
  }
  return false;
};

export const doesItemSynergizeWithMove = (
  move: Move,
  currentPokemon: Pokemon,
) => {
  if (currentPokemon.item === "powerherb" && move.flags.charge) {
    return true;
  }

  if (
    currentPokemon.item === "whiteherb" &&
    Object.values(move?.boosts || {}).filter((stat) => stat < 0).length
  ) {
    return true;
  }

  if (currentPokemon.item === "throatspray" && move.flags.sound) {
    return true;
  }

  return false;
};

export const getMoveSynergiesWithWeather = (move: Move, weather: WeatherId) => {
  if (weather === "sunnyday") {
    if (move.type === "Fire" || move.id === "solarbeam") {
      return 1;
    }

    if (move.type === "Water") {
      return -1;
    }
  }

  if (
    move.type === "Water" ||
    (move.id === "electroshot" && weather === "raindance")
  ) {
    if (
      move.type === "Water" ||
      move.id === "electroshot" ||
      move.id === "thunder"
    ) {
      return 1;
    }

    if (move.type === "Fire") {
      return -1;
    }
  }

  return 0;
};

export const getMoveSynergiesWithTerrain = (move: Move, terrain: TerrainId) => {
  if (terrain === "electricterrain") {
    if (move.type === "Electric") {
      return 1;
    }
  }

  if (terrain === "psychicterrain") {
    if (move.type === "Psychic") {
      return 1;
    }

    if (move.priority > 0) {
      return -3;
    }
  }

  if (terrain === "grassyterrain") {
    if (move.type === "Grass") {
      return 1;
    }

    if (move.id === "earthquake") {
      return -1;
    }
  }

  if (terrain === "mistyterrain") {
    if (move.type === "Dragon") {
      return -1;
    }
  }

  return 0;
};

export const getDraftOptions = (
  color: Color,
  pokemonManager: PokemonBattleChessManager,
): { square: Square; priority: number }[] => {
  let draftOptions: { square: Square; priority: number }[] = [];
  if (color === "w") {
    draftOptions = [
      { square: "a1", priority: 5 },
      { square: "b1", priority: 3 },
      { square: "c1", priority: 3 },
      { square: "d1", priority: 8 },
      { square: "e1", priority: 10 },
      { square: "f1", priority: 3 },
      { square: "g1", priority: 3 },
      { square: "h1", priority: 5 },
      { square: "a2", priority: 1 },
      { square: "b2", priority: 1 },
      { square: "c2", priority: 1 },
      { square: "d2", priority: 1 },
      { square: "e2", priority: 1 },
      { square: "f2", priority: 1 },
      { square: "g2", priority: 1 },
      { square: "h2", priority: 1 },
    ];
  } else {
    draftOptions = [
      { square: "a7", priority: 1 },
      { square: "b7", priority: 1 },
      { square: "c7", priority: 1 },
      { square: "d7", priority: 1 },
      { square: "e7", priority: 1 },
      { square: "f7", priority: 1 },
      { square: "g7", priority: 1 },
      { square: "h7", priority: 1 },
      { square: "a8", priority: 5 },
      { square: "b8", priority: 3 },
      { square: "c8", priority: 3 },
      { square: "d8", priority: 8 },
      { square: "e8", priority: 10 },
      { square: "f8", priority: 3 },
      { square: "g8", priority: 3 },
      { square: "h8", priority: 5 },
    ];
  }

  draftOptions = draftOptions.filter(
    (draftOption) =>
      pokemonManager.chessPieces.length === 0 ||
      !pokemonManager.chessPieces.find(
        (piece) => piece.square === draftOption.square,
      ),
  );

  return draftOptions;
};

export const getHighestBst = (pieces: { set: PokemonSet; index: number }[]) => {
  if (pieces.length === 0) {
    return;
  }
  let highestBstPiece = pieces[0];

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const dexPokemon = Dex.species.get(piece.set.species);
    if (dexPokemon.bst > Dex.species.get(highestBstPiece.set.species).bst) {
      highestBstPiece = piece;
    }
  }

  return highestBstPiece;
};
