import { Pokemon } from "@pkmn/client";
import { Move, TypeName } from "@pkmn/data";
import { Dex } from "@pkmn/dex";

export const getTypeEffectiveness = (
  move: Move,
  currentPokemon?: Pokemon | null,
  opponentPokemon?: Pokemon | null,
) => {
  if (!currentPokemon || !opponentPokemon) {
    return {};
  }

  const abilityModifier =
    modifyTypeAbilities[currentPokemon.set?.ability.toLowerCase() || ""];
  let type = abilityModifier
    ? abilityModifier(move, currentPokemon)
    : move.type;

  const moveModifier = modifyTypeMoves[move.id || ""];
  type = moveModifier ? moveModifier(move, currentPokemon) : type;

  const effectiveness = Dex.getEffectiveness(type, opponentPokemon);
  const abilityImmunity = immunityAbilities[
    opponentPokemon.set?.ability.toLowerCase() || ""
  ]?.(move, currentPokemon);

  let notImmune;
  if (abilityImmunity === false) {
    notImmune = abilityImmunity;
  } else {
    notImmune = Dex.getImmunity(move, opponentPokemon);
  }

  return {
    effectiveness,
    notImmune,
  };
};

const modifyTypeMoves: Record<
  string,
  (move: Move, pokemon: Pokemon) => TypeName
> = {
  revelationdance: (_, pokemon: Pokemon) => {
    const oricorioType = pokemon.types.filter((type) => type !== "Flying")[0];
    return oricorioType || "Normal";
  },
  ivycudgel: (_, pokemon: Pokemon) => {
    const ogerponType = pokemon.types.filter((type) => type !== "Grass")[0];

    return ogerponType || "Grass";
  },
};

// Taken from onModifyType
// https://github.com/pkmn/ps/blob/e9c53799548ca8ba182efed51449d56afbb21f03/sim/data/abilities.ts#L1547
export const modifyTypeAbilities: Record<
  string,
  (move: Move, pokemon: Pokemon) => TypeName
> = {
  pixilate: (move: Move, pokemon: Pokemon) => {
    const noModifyType = [
      "judgment",
      "multiattack",
      "naturalgift",
      "revelationdance",
      "technoblast",
      "terrainpulse",
      "weatherball",
    ];
    if (
      move.type === "Normal" &&
      !noModifyType.includes(move.id) &&
      !(move.name === "Tera Blast" && pokemon.isTerastallized)
    ) {
      return "Fairy";
    }
    return move.type;
  },
  aerilate: (move: Move, pokemon: Pokemon) => {
    const noModifyType = [
      "judgment",
      "multiattack",
      "naturalgift",
      "revelationdance",
      "technoblast",
      "terrainpulse",
      "weatherball",
    ];
    if (
      move.type === "Normal" &&
      !noModifyType.includes(move.id) &&
      !(move.name === "Tera Blast" && pokemon.terastallized)
    ) {
      return "Flying";
    }
    return move.type;
  },
  galvanize: (move: Move, pokemon: Pokemon) => {
    const noModifyType = [
      "judgment",
      "multiattack",
      "naturalgift",
      "revelationdance",
      "technoblast",
      "terrainpulse",
      "weatherball",
    ];
    if (
      move.type === "Normal" &&
      !noModifyType.includes(move.id) &&
      !(move.name === "Tera Blast" && pokemon.terastallized)
    ) {
      return "Electric";
    }
    return move.type;
  },
  liquidvoice: (move: Move) => {
    if (move.flags["sound"]) {
      return "Water";
    }
    return move.type;
  },
  normalize: (move: Move, pokemon: Pokemon) => {
    const noModifyType = [
      "hiddenpower",
      "judgment",
      "multiattack",
      "naturalgift",
      "revelationdance",
      "struggle",
      "technoblast",
      "terrainpulse",
      "weatherball",
    ];
    if (
      !noModifyType.includes(move.id) &&
      !(move.name === "Tera Blast" && pokemon.terastallized)
    ) {
      return "Normal";
    }
    return move.type;
  },
  multitype: (move: Move, pokemon: Pokemon) => {
    if (move.name === "Judgment") {
      return pokemon.types[0];
    }
    return move.type;
  },
  refrigerate: (move: Move, pokemon: Pokemon) => {
    const noModifyType = [
      "judgment",
      "multiattack",
      "naturalgift",
      "revelationdance",
      "technoblast",
      "terrainpulse",
      "weatherball",
    ];
    if (
      move.type === "Normal" &&
      !noModifyType.includes(move.id) &&
      !(move.name === "Tera Blast" && pokemon.terastallized)
    ) {
      return "Ice";
    }
    return move.type;
  },
};

/**
 * To stay consistent with pokemon showdown's implementation, getting a pokemon's immunity
 * actually returns if they're not immune
 */
const immunityAbilities: Record<
  string,
  (move: Move, target: Pokemon) => boolean
> = {
  "sap sipper": (move: Move) => {
    return move.type !== "Grass";
  },
  levitate: (move: Move) => {
    return move.type !== "Ground";
  },
  "motor drive": (move: Move) => {
    return move.type !== "Electric";
  },
  soundproof: (move: Move) => {
    return !move.flags["sound"];
  },
  "storm drain": (move: Move) => {
    return move.type !== "Water";
  },
  "volt absorb": (move: Move) => {
    return move.type !== "Electric";
  },
  "water absorb": (move: Move) => {
    return move.type !== "Water";
  },
  "well baked body": (move: Move) => {
    return move.type !== "Fire";
  },
  "wonder guard": (move: Move, target: Pokemon) => {
    return Dex.getEffectiveness(move, target) > 0;
  },
  bulletproof: (move: Move) => {
    return !move.flags["bullet"];
  },
  "dry skin": (move: Move) => {
    return move.type !== "Water";
  },
  "earth eater": (move: Move) => {
    return move.type !== "Ground";
  },
  "flash fire": (move: Move) => {
    return move.type !== "Fire";
  },
  "lightning rod": (move: Move) => {
    return move.type !== "Electric";
  },
};

const damagingMovesThatHaveNoBasePower = [
  "seismictoss",
  "beatup",
  "gyroball",
  "heavyslam",
  "heatcrash",
  "grassknot",
  "lowkick",
  "return",
];
export const doesMoveDoDamage = (move: Move) => {
  return (
    move.basePower > 0 || damagingMovesThatHaveNoBasePower.includes(move.id)
  );
};
