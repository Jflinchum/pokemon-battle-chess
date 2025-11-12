import { Pokemon } from "@pkmn/client";
import { Move, PokemonSet, TypeName } from "@pkmn/data";
import { Dex, Species } from "@pkmn/dex";

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
    ? abilityModifier({
        move,
        terastallized: currentPokemon.terastallized,
        holdItem: currentPokemon.item,
      })
    : move.type;

  const moveModifier = modifyTypeMoves[move.id || ""];
  type = moveModifier ? moveModifier(currentPokemon) : type;

  const effectiveness = Dex.getEffectiveness(type, opponentPokemon);
  const abilityImmunity = immunityAbilities[
    opponentPokemon.set?.ability.toLowerCase() || ""
  ]?.(move, Dex.species.get(currentPokemon.species.name));

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

export const getTypeEffectivenessFromSet = (
  move: Move,
  currentPokemon?: PokemonSet<string> | null,
  opponentPokemon?: PokemonSet<string> | null,
) => {
  if (!currentPokemon || !opponentPokemon) {
    return {};
  }

  const abilityModifier =
    modifyTypeAbilities[currentPokemon.ability.toLowerCase() || ""];
  let type = abilityModifier
    ? abilityModifier({ move, holdItem: currentPokemon.item })
    : move.type;

  const moveModifier = modifyTypeMoves[move.id || ""];
  type = moveModifier
    ? moveModifier(Dex.species.get(currentPokemon.species))
    : type;

  const effectiveness = Dex.getEffectiveness(
    type,
    Dex.species.get(opponentPokemon.species),
  );
  const abilityImmunity = immunityAbilities[
    opponentPokemon.ability.toLowerCase() || ""
  ]?.(move, Dex.species.get(currentPokemon.species));

  let notImmune;
  if (abilityImmunity === false) {
    notImmune = abilityImmunity;
  } else {
    notImmune = Dex.getImmunity(move, Dex.species.get(opponentPokemon.species));
  }

  return {
    effectiveness,
    notImmune,
  };
};

const modifyTypeMoves: Record<
  string,
  (pokemon: { types: TypeName[] }) => TypeName
> = {
  revelationdance: (pokemon) => {
    const oricorioType = pokemon.types.filter((type) => type !== "Flying")[0];
    return oricorioType || "Normal";
  },
  ivycudgel: (pokemon) => {
    const ogerponType = pokemon.types.filter((type) => type !== "Grass")[0];

    return ogerponType || "Grass";
  },
};

// Taken from onModifyType
// https://github.com/pkmn/ps/blob/e9c53799548ca8ba182efed51449d56afbb21f03/sim/data/abilities.ts#L1547
export const modifyTypeAbilities: Record<
  string,
  ({
    move,
    terastallized,
  }: {
    move: Move;
    terastallized?: TypeName;
    holdItem?: string;
  }) => TypeName
> = {
  pixilate: ({ move, terastallized }) => {
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
      !(move.name === "Tera Blast" && terastallized)
    ) {
      return "Fairy";
    }
    return move.type;
  },
  aerilate: ({ move, terastallized }) => {
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
      !(move.name === "Tera Blast" && terastallized)
    ) {
      return "Flying";
    }
    return move.type;
  },
  galvanize: ({ move, terastallized }) => {
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
      !(move.name === "Tera Blast" && terastallized)
    ) {
      return "Electric";
    }
    return move.type;
  },
  liquidvoice: ({ move }) => {
    if (move.flags["sound"]) {
      return "Water";
    }
    return move.type;
  },
  normalize: ({ move, terastallized }) => {
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
      !(move.name === "Tera Blast" && terastallized)
    ) {
      return "Normal";
    }
    return move.type;
  },
  multitype: ({ move, holdItem }) => {
    if (move.name === "Judgment" && holdItem) {
      return plateTypeMapping[holdItem];
    }
    return move.type;
  },
  refrigerate: ({ move, terastallized }) => {
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
      !(move.name === "Tera Blast" && terastallized)
    ) {
      return "Ice";
    }
    return move.type;
  },
};

const plateTypeMapping: Record<string, TypeName> = {
  "blank plate": "Normal",
  "fist plate": "Fighting",
  "sky plate": "Flying",
  "toxic plate": "Poison",
  "earth plate": "Ground",
  "stone plate": "Rock",
  "insect plate": "Bug",
  "spooky plate": "Ghost",
  "iron plate": "Steel",
  "flame plate": "Fire",
  "splash plate": "Water",
  "meadow plate": "Grass",
  "zap plate": "Electric",
  "mind plate": "Psychic",
  "icicle plate": "Ice",
  "draco plate": "Dragon",
  "dread plate": "Dark",
  "pixie plate": "Fairy",
};

/**
 * To stay consistent with pokemon showdown's implementation, getting a pokemon's immunity
 * actually returns if they're not immune
 */
const immunityAbilities: Record<
  string,
  (move: Move, target: Species) => boolean
> = {
  "sap sipper": (move) => {
    return move.type !== "Grass";
  },
  levitate: (move) => {
    return move.type !== "Ground";
  },
  "motor drive": (move) => {
    return move.type !== "Electric";
  },
  soundproof: (move) => {
    return !move.flags["sound"];
  },
  "storm drain": (move) => {
    return move.type !== "Water";
  },
  "volt absorb": (move) => {
    return move.type !== "Electric";
  },
  "water absorb": (move) => {
    return move.type !== "Water";
  },
  "well baked body": (move) => {
    return move.type !== "Fire";
  },
  "wonder guard": (move, target) => {
    return Dex.getEffectiveness(move, target) > 0;
  },
  bulletproof: (move) => {
    return !move.flags["bullet"];
  },
  "dry skin": (move) => {
    return move.type !== "Water";
  },
  "earth eater": (move) => {
    return move.type !== "Ground";
  },
  "flash fire": (move) => {
    return move.type !== "Fire";
  },
  "lightning rod": (move) => {
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
