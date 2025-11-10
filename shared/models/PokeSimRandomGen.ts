import { Move, SpeciesName, TypeName } from "@pkmn/data";
import { Dex, PokemonSet, Species } from "@pkmn/dex";
import { PRNG } from "@pkmn/sim";
import { fastPop } from "../util/fastPop.js";

type RandomSet = {
  level: number;
  baseSpecies: string;
  sets: {
    role: string;
    movepool: string[];
    abilities: string[];
    teraTypes: string[];
  }[];
};

/**
 * Below is taken directly from @pkmn/random and heavily modified. This is
 * necessary for a few reasons:
 * - @pkmn/random includes learnsets/datasets from all gens when importing it, when we only need the latest gen. Should improve load time performance by omitting the other gens
 * - Pokemon Battle Chess is a unique variant where hazards aren't useful at all. By splitting out generation logic, we can filter out those moves/heavy duty boots
 * - @pkmn/random generates teams of 6, not solo pokemon. It also takes team details into account when generating these pokemon (if the team has a rain setter, include swift swim). We don't need that in Pokemon Battle Chess
 */

// Moves that restore HP:
const RECOVERY_MOVES = [
  "healorder",
  "milkdrink",
  "moonlight",
  "morningsun",
  "recover",
  "roost",
  "shoreup",
  "slackoff",
  "softboiled",
  "strengthsap",
  "synthesis",
];
// Moves that drop stats:
const CONTRARY_MOVES = [
  "armorcannon",
  "closecombat",
  "leafstorm",
  "makeitrain",
  "overheat",
  "spinout",
  "superpower",
  "vcreate",
];
// Moves that boost Attack:
const PHYSICAL_SETUP = [
  "bellydrum",
  "bulkup",
  "coil",
  "curse",
  "dragondance",
  "honeclaws",
  "howl",
  "meditate",
  "poweruppunch",
  "swordsdance",
  "tidyup",
  "victorydance",
];
// Moves which boost Special Attack:
const SPECIAL_SETUP = [
  "calmmind",
  "chargebeam",
  "geomancy",
  "nastyplot",
  "quiverdance",
  "tailglow",
  "takeheart",
  "torchsong",
];
// Moves that boost Attack AND Special Attack:
const MIXED_SETUP = [
  "clangoroussoul",
  "growth",
  "happyhour",
  "holdhands",
  "noretreat",
  "shellsmash",
  "workup",
];
// Some moves that only boost Speed:
const SPEED_SETUP = [
  "agility",
  "autotomize",
  "flamecharge",
  "rockpolish",
  "snowscape",
  "trailblaze",
];
// Conglomerate for ease of access
const SETUP = [
  "acidarmor",
  "agility",
  "autotomize",
  "bellydrum",
  "bulkup",
  "calmmind",
  "clangoroussoul",
  "coil",
  "cosmicpower",
  "curse",
  "dragondance",
  "flamecharge",
  "growth",
  "honeclaws",
  "howl",
  "irondefense",
  "meditate",
  "nastyplot",
  "noretreat",
  "poweruppunch",
  "quiverdance",
  "rockpolish",
  "shellsmash",
  "shiftgear",
  "swordsdance",
  "tailglow",
  "takeheart",
  "tidyup",
  "trailblaze",
  "workup",
  "victorydance",
];
const SPEED_CONTROL = [
  "electroweb",
  "glare",
  "icywind",
  "lowsweep",
  "nuzzle",
  "quash",
  "tailwind",
  "thunderwave",
  "trickroom",
];
// Moves that shouldn't be the only STAB moves:
const NO_STAB = [
  "accelerock",
  "aquajet",
  "bounce",
  "breakingswipe",
  "bulletpunch",
  "chatter",
  "chloroblast",
  "clearsmog",
  "covet",
  "dragontail",
  "doomdesire",
  "electroweb",
  "eruption",
  "explosion",
  "fakeout",
  "feint",
  "flamecharge",
  "flipturn",
  "futuresight",
  "grassyglide",
  "iceshard",
  "icywind",
  "incinerate",
  "infestation",
  "machpunch",
  "meteorbeam",
  "mortalspin",
  "nuzzle",
  "pluck",
  "pursuit",
  "quickattack",
  "rapidspin",
  "reversal",
  "selfdestruct",
  "shadowsneak",
  "skydrop",
  "snarl",
  "strugglebug",
  "suckerpunch",
  "uturn",
  "vacuumwave",
  "voltswitch",
  "watershuriken",
  "waterspout",
];
// Hazard-setting moves
const HAZARDS = ["spikes", "stealthrock", "stickyweb", "toxicspikes"];
// Protect and its variants
const PROTECT_MOVES = [
  "banefulbunker",
  "burningbulwark",
  "protect",
  "silktrap",
  "spikyshield",
];

// Moves that should be paired together when possible
const MOVE_PAIRS = [
  ["lightscreen", "reflect"],
  ["sleeptalk", "rest"],
  ["protect", "wish"],
  ["leechseed", "protect"],
  ["leechseed", "substitute"],
];

/** Pokemon who always want priority STAB, and are fine with it as its only STAB move of that type */
const PRIORITY_POKEMON = [
  "breloom",
  "brutebonnet",
  "cacturne",
  "honchkrow",
  "mimikyu",
  "ragingbolt",
  "scizor",
];

const DEFENSIVE_TERA_BLAST_USERS = [
  "alcremie",
  "bellossom",
  "comfey",
  "fezandipiti",
  "florges",
  "raikou",
];

function sereneGraceBenefits(move: Move) {
  return (
    move.secondary?.chance &&
    move.secondary.chance > 20 &&
    move.secondary.chance < 100
  );
}

export class PokeSimRandomGen {
  private prng: PRNG;
  private pokemonPool: SpeciesName[];
  private randomSets: Record<string, RandomSet>;
  private maxMoveCount = 4;
  private dex = Dex;

  constructor(prng: PRNG) {
    this.randomSets = this.filterSets(randomSetsJSON);

    this.pokemonPool = Object.keys(this.randomSets) as SpeciesName[];
    this.prng = prng;
  }

  private filterSets = (randomSets: Record<string, RandomSet>) => {
    const finalSet: Record<string, RandomSet> = {};
    Object.keys(randomSets).forEach((species) => {
      const speciesSets = randomSets[species];
      const filteredSets = speciesSets.sets
        .map((set) => {
          return {
            ...set,
            abilities: set.abilities.filter((ability) => {
              if (ability === "Battle Bond") {
                return false;
              }
              return true;
            }),
            movepool: set.movepool.filter((moveName) => {
              const move = this.dex.moves.get(moveName);
              if (HAZARDS.includes(move.id)) {
                return false;
              }
              if (move.forceSwitch || move.selfSwitch) {
                return false;
              }
              if (move.id === "destinybond") {
                return false;
              }
              if (move.selfdestruct) {
                return false;
              }
              return true;
            }),
          };
        })
        .filter((set) => {
          if (set.movepool.length < 4 && species !== "ditto") {
            return false;
          }
          if (set.abilities.length === 0) {
            return false;
          }
          return true;
        });

      if (filteredSets.length > 0) {
        finalSet[species] = {
          ...speciesSets,
          sets: filteredSets,
        };
      }
    });
    return finalSet;
  };

  public buildRandomPokemon = (filter?: (pkmn: string) => boolean) => {
    let pool: SpeciesName[] = [];
    if (filter) {
      pool = this.pokemonPool.filter(filter);
    } else {
      pool = this.pokemonPool;
    }
    const randomIndex = this.random(0, pool.length);
    const pokemon = fastPop(pool, randomIndex);
    this.pokemonPool = this.pokemonPool.filter(
      (species) =>
        this.randomSets[pokemon].baseSpecies !==
        this.randomSets[species].baseSpecies,
    );
    return this.buildRandomSet(pokemon);
  };

  private getForme = (species: Species) => {
    if (typeof species.battleOnly === "string") {
      // Only change the forme. The species has custom moves, and may have different typing and requirements.
      return species.battleOnly;
    }
    if (species.cosmeticFormes)
      return this.sample([species.name].concat(species.cosmeticFormes));

    // Consolidate mostly-cosmetic formes, at least for the purposes of Random Battles
    if (
      [
        "Dudunsparce",
        "Magearna",
        "Maushold",
        "Polteageist",
        "Sinistcha",
        "Zarude",
      ].includes(species.baseSpecies)
    ) {
      return this.sample([species.name].concat(species.otherFormes!));
    }
    if (species.baseSpecies === "Basculin")
      return "Basculin" + this.sample(["", "-Blue-Striped"]);
    if (species.baseSpecies === "Pikachu") {
      return (
        "Pikachu" +
        this.sample([
          "",
          "-Original",
          "-Hoenn",
          "-Sinnoh",
          "-Unova",
          "-Kalos",
          "-Alola",
          "-Partner",
          "-World",
        ])
      );
    }
    return species.name;
  };

  getLevel(species: Species): number {
    if (this.randomSets[species.id]["level"])
      return this.randomSets[species.id]["level"]!;
    // Default to tier-based leveling
    const tier = species.tier;
    const tierScale: Partial<Record<Species["tier"], number>> = {
      Uber: 76,
      OU: 80,
      UUBL: 81,
      UU: 82,
      RUBL: 83,
      RU: 84,
      NUBL: 85,
      NU: 86,
      PUBL: 87,
      PU: 88,
      "(PU)": 88,
      NFE: 88,
    };
    return tierScale[tier] || 80;
  }

  private buildRandomSet = (s: SpeciesName): PokemonSet => {
    const species = Dex.species.get(s);
    const forme = this.getForme(species);
    const sets = this.randomSets[s].sets;

    const set = this.sampleIfArray(sets);
    const role = set.role;
    const movePool: string[] = [];
    for (const movename of set.movepool) {
      movePool.push(Dex.moves.get(movename).id);
    }
    const teraTypes = set.teraTypes!;
    const teraType = this.sampleIfArray(teraTypes) as TypeName;

    let ability = "";
    let item: string | undefined = undefined;

    const evs = { hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85 };
    const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

    const types = species.types;
    const abilities = set.abilities!;

    // Get moves
    const moves = this.randomMoveset(
      types,
      abilities,
      species,
      movePool,
      teraType,
      role,
    );
    const counter = this.queryMoves(moves, species, teraType, abilities);

    // Get ability
    ability = this.getAbility(moves, abilities, counter, species, teraType);

    // Get items
    // First, the priority items
    item = this.getPriorityItem(ability, types, moves, counter, species, role);
    if (item === undefined) {
      item = this.getItem(ability, moves, counter, species, role);
    }

    // Get level
    const level = this.getLevel(species);

    // Prepare optimal HP
    const srImmunity = ability === "Magic Guard" || item === "Heavy-Duty Boots";
    let srWeakness = srImmunity ? 0 : Dex.getEffectiveness("Rock", species);
    // Crash damage move users want an odd HP to survive two misses
    if (
      ["axekick", "highjumpkick", "jumpkick", "supercellslam"].some((m) =>
        moves.has(m),
      )
    )
      srWeakness = 2;
    while (evs.hp > 1) {
      const hp = Math.floor(
        (Math.floor(
          2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100,
        ) *
          level) /
          100 +
          10,
      );
      if (
        (moves.has("substitute") &&
          ["Sitrus Berry", "Salac Berry"].includes(item)) ||
        species.id === "minior"
      ) {
        // Two Substitutes should activate Sitrus Berry. Two switch-ins to Stealth Rock should activate Shields Down on Minior.
        if (hp % 4 === 0) break;
      } else if (
        (moves.has("bellydrum") ||
          moves.has("filletaway") ||
          moves.has("shedtail")) &&
        (item === "Sitrus Berry" || ability === "Gluttony")
      ) {
        // Belly Drum should activate Sitrus Berry
        if (hp % 2 === 0) break;
      } else if (moves.has("substitute") && moves.has("endeavor")) {
        // Luvdisc should be able to Substitute down to very low HP
        if (hp % 4 > 0) break;
      } else {
        // Maximize number of Stealth Rock switch-ins in singles
        if (
          srWeakness <= 0 ||
          ability === "Regenerator" ||
          ["Leftovers", "Life Orb"].includes(item)
        )
          break;
        if (item !== "Sitrus Berry" && hp % (4 / srWeakness) > 0) break;
        // Minimise number of Stealth Rock switch-ins to activate Sitrus Berry
        if (item === "Sitrus Berry" && hp % (4 / srWeakness) === 0) break;
      }
      evs.hp -= 4;
    }

    // Minimize confusion damage
    const noAttackStatMoves = [...moves].every((m) => {
      const move = Dex.moves.get(m);
      if (move.damage) return true;
      if (move.id === "shellsidearm") return false;
      // Physical Tera Blast
      if (
        move.id === "terablast" &&
        (species.id === "porygon2" ||
          ["Contrary", "Defiant"].includes(ability) ||
          moves.has("shiftgear") ||
          species.baseStats.atk > species.baseStats.spa)
      )
        return false;
      return (
        move.category !== "Physical" ||
        move.id === "bodypress" ||
        move.id === "foulplay"
      );
    });
    if (noAttackStatMoves && !moves.has("transform")) {
      evs.atk = 0;
      ivs.atk = 0;
    }

    if (moves.has("gyroball") || moves.has("trickroom")) {
      evs.spe = 0;
      ivs.spe = 0;
    }

    // shuffle moves to add more randomness to camomons
    const shuffledMoves = Array.from(moves);
    this.prng!.shuffle(shuffledMoves);

    return {
      name: species.baseSpecies,
      species: forme,
      gender:
        species.baseSpecies === "Greninja"
          ? "M"
          : this.generateRandomGender(species),
      shiny: this.random(1, 1024) === 1,
      level,
      moves: shuffledMoves,
      ability,
      evs,
      ivs,
      item,
      teraType,
      nature: "Serious",
    };
  };

  private generateRandomGender(species: Species) {
    if (species.genderRatio.M === 1) {
      return "M";
    }
    if (species.genderRatio.F === 1) {
      return "F";
    }
    if (species.genderRatio.M === 0 && species.genderRatio.F === 0) {
      return "N";
    }
    return this.random(1, 3) === 1 ? "F" : "M";
  }

  // Generate random moveset for a given species, role, tera type.
  private randomMoveset(
    types: string[],
    abilities: string[],
    species: Species,
    movePool: string[],
    teraType: TypeName,
    role: string,
  ): Set<string> {
    const moves = new Set<string>();

    // If there are only four moves, add all moves and return early
    if (movePool.length <= this.maxMoveCount) {
      for (const moveid of movePool) {
        moves.add(moveid);
      }
      return moves;
    }

    if (role === "Tera Blast user") {
      this.addMove("terablast", moves, movePool);
    }
    // Add required move (e.g. Relic Song for Meloetta-P)
    if (species.requiredMove) {
      const move = this.dex.moves.get(species.requiredMove).id;
      this.addMove(move, moves, movePool);
    }

    // Add other moves you really want to have, e.g. STAB, recovery, setup.

    // Enforce Facade if Guts is a possible ability
    if (movePool.includes("facade") && abilities.includes("Guts")) {
      this.addMove("facade", moves, movePool);
    }

    // Enforce Night Shade, Revelation Dance, Revival Blessing, and Sticky Web
    for (const moveid of [
      "nightshade",
      "revelationdance",
      "revivalblessing",
      "stickyweb",
    ]) {
      if (movePool.includes(moveid)) {
        this.addMove(moveid, moves, movePool);
      }
    }

    // Enforce Trick Room on Doubles Wallbreaker
    if (movePool.includes("trickroom") && role === "Doubles Wallbreaker") {
      this.addMove("trickroom", moves, movePool);
    }

    if (movePool.includes("auroraveil")) {
      this.addMove("auroraveil", moves, movePool);
    }

    // Enforce Knock Off on pure Normal- and Fighting-types in singles
    if (
      types.length === 1 &&
      (types.includes("Normal") || types.includes("Fighting"))
    ) {
      if (movePool.includes("knockoff")) {
        this.addMove("knockoff", moves, movePool);
      }
    }

    // Enforce Spore on Smeargle
    if (species.id === "smeargle") {
      if (movePool.includes("spore")) {
        this.addMove("spore", moves, movePool);
      }
    }

    // Enforce STAB priority
    if (
      [
        "Bulky Attacker",
        "Bulky Setup",
        "Wallbreaker",
        "Doubles Wallbreaker",
      ].includes(role) ||
      PRIORITY_POKEMON.includes(species.id)
    ) {
      const priorityMoves: string[] = [];
      for (const moveid of movePool) {
        const move = this.dex.moves.get(moveid);
        const moveType = this.getMoveType(move, species, abilities, teraType);
        if (
          types.includes(moveType) &&
          (move.priority > 0 ||
            (moveid === "grassyglide" && abilities.includes("Grassy Surge"))) &&
          move.basePower
        ) {
          priorityMoves.push(moveid);
        }
      }
      if (priorityMoves.length) {
        const moveid = this.sample(priorityMoves);
        this.addMove(moveid, moves, movePool);
      }
    }

    // Enforce STAB
    for (const type of types) {
      // Check if a STAB move of that type should be required
      const stabMoves: string[] = [];
      for (const moveid of movePool) {
        const move = this.dex.moves.get(moveid);
        const moveType = this.getMoveType(move, species, abilities, teraType);
        if (!NO_STAB.includes(moveid) && move.basePower && type === moveType) {
          stabMoves.push(moveid);
        }
      }
    }

    // Enforce Tera STAB
    if (!["Bulky Support", "Doubles Support"].includes(role)) {
      const stabMoves: string[] = [];
      for (const moveid of movePool) {
        const move = this.dex.moves.get(moveid);
        const moveType = this.getMoveType(move, species, abilities, teraType);
        if (
          !NO_STAB.includes(moveid) &&
          move.basePower &&
          teraType === moveType
        ) {
          stabMoves.push(moveid);
        }
      }
      if (stabMoves.length) {
        const moveid = this.sample(stabMoves);
        this.addMove(moveid, moves, movePool);
      }
    }
    let counter = this.queryMoves(moves, species, teraType, abilities);

    // If no STAB move was added, add a STAB move
    if (!counter.stab.length) {
      const stabMoves: string[] = [];
      for (const moveid of movePool) {
        const move = this.dex.moves.get(moveid);
        const moveType = this.getMoveType(move, species, abilities, teraType);
        if (
          !NO_STAB.includes(moveid) &&
          move.basePower &&
          types.includes(moveType)
        ) {
          stabMoves.push(moveid);
        }
      }
      if (stabMoves.length) {
        const moveid = this.sample(stabMoves);
        this.addMove(moveid, moves, movePool);
      }
    }

    // Enforce recovery
    if (["Bulky Support", "Bulky Attacker", "Bulky Setup"].includes(role)) {
      const recoveryMoves = movePool.filter((moveid) =>
        RECOVERY_MOVES.includes(moveid),
      );
      if (recoveryMoves.length) {
        const moveid = this.sample(recoveryMoves);
        this.addMove(moveid, moves, movePool);
      }
    }

    // Enforce pivoting moves on AV Pivot
    if (role === "AV Pivot") {
      const pivotMoves = movePool.filter((moveid) =>
        ["uturn", "voltswitch"].includes(moveid),
      );
      if (pivotMoves.length) {
        const moveid = this.sample(pivotMoves);
        this.addMove(moveid, moves, movePool);
      }
    }

    // Enforce setup
    if (role.includes("Setup") || role === "Tera Blast user") {
      // First, try to add a non-Speed setup move
      const nonSpeedSetupMoves = movePool.filter(
        (moveid) => SETUP.includes(moveid) && !SPEED_SETUP.includes(moveid),
      );
      if (nonSpeedSetupMoves.length) {
        const moveid = this.sample(nonSpeedSetupMoves);
        this.addMove(moveid, moves, movePool);
      } else {
        // No non-Speed setup moves, so add any (Speed) setup move
        const setupMoves = movePool.filter((moveid) => SETUP.includes(moveid));
        if (setupMoves.length) {
          const moveid = this.sample(setupMoves);
          this.addMove(moveid, moves, movePool);
        }
      }
    }

    // Enforce redirecting moves and Fake Out on Doubles Support
    if (role === "Doubles Support") {
      for (const moveid of ["fakeout", "followme", "ragepowder"]) {
        if (movePool.includes(moveid)) {
          this.addMove(moveid, moves, movePool);
        }
      }
      const speedControl = movePool.filter((moveid) =>
        SPEED_CONTROL.includes(moveid),
      );
      if (speedControl.length) {
        const moveid = this.sample(speedControl);
        this.addMove(moveid, moves, movePool);
      }
    }

    // Enforce Protect
    if (role.includes("Protect")) {
      const protectMoves = movePool.filter((moveid) =>
        PROTECT_MOVES.includes(moveid),
      );
      if (protectMoves.length) {
        const moveid = this.sample(protectMoves);
        this.addMove(moveid, moves, movePool);
      }
    }

    counter = this.queryMoves(moves, species, teraType, abilities);
    // Enforce a move not on the noSTAB list
    if (!counter.damagingMoves.length) {
      // Choose an attacking move
      const attackingMoves: string[] = [];
      for (const moveid of movePool) {
        const move = this.dex.moves.get(moveid);
        if (!NO_STAB.includes(moveid) && move.category !== "Status")
          attackingMoves.push(moveid);
      }
      if (attackingMoves.length) {
        const moveid = this.sample(attackingMoves);
        this.addMove(moveid, moves, movePool);
      }
    }

    counter = this.queryMoves(moves, species, teraType, abilities);
    // Enforce coverage move
    if (
      ![
        "AV Pivot",
        "Fast Support",
        "Bulky Support",
        "Bulky Protect",
        "Doubles Support",
      ].includes(role)
    ) {
      if (counter.damagingMoves.length === 1) {
        // Find the type of the current attacking move
        const currentAttackType = counter.damagingMoves[0].type;
        // Choose an attacking move that is of different type to the current single attack
        const coverageMoves: string[] = [];
        for (const moveid of movePool) {
          const move = this.dex.moves.get(moveid);
          const moveType = this.getMoveType(move, species, abilities, teraType);
          if (!NO_STAB.includes(moveid) && move.basePower) {
            if (currentAttackType !== moveType) coverageMoves.push(moveid);
          }
        }
        if (coverageMoves.length) {
          const moveid = this.sample(coverageMoves);
          this.addMove(moveid, moves, movePool);
        }
      }
    }

    // Add (moves.size < this.maxMoveCount) as a condition if moves is getting larger than 4 moves.
    // If you want moves to be favored but not required, add something like && this.randomChance(1, 2) to your condition.

    // Choose remaining moves randomly from movepool and add them to moves list:
    while (moves.size < this.maxMoveCount && movePool.length) {
      if (moves.size + movePool.length <= this.maxMoveCount) {
        for (const moveid of movePool) {
          moves.add(moveid);
        }
        break;
      }
      const moveid = this.sample(movePool);
      this.addMove(moveid, moves, movePool);
      for (const pair of MOVE_PAIRS) {
        if (moveid === pair[0] && movePool.includes(pair[1])) {
          this.addMove(pair[1], moves, movePool);
        }
        if (moveid === pair[1] && movePool.includes(pair[0])) {
          this.addMove(pair[0], moves, movePool);
        }
      }
    }
    return moves;
  }

  getMoveType(
    move: Move,
    species: Species,
    abilities: string[],
    teraType: TypeName,
  ): TypeName {
    if (move.id === "terablast") return teraType;
    if (["judgment", "revelationdance"].includes(move.id))
      return species.types[0];

    if (
      move.name === "Raging Bull" &&
      species.name.startsWith("Tauros-Paldea")
    ) {
      if (species.name.endsWith("Combat")) return "Fighting";
      if (species.name.endsWith("Blaze")) return "Fire";
      if (species.name.endsWith("Aqua")) return "Water";
    }

    if (move.name === "Ivy Cudgel" && species.name.startsWith("Ogerpon")) {
      if (species.name.endsWith("Wellspring")) return "Water";
      if (species.name.endsWith("Hearthflame")) return "Fire";
      if (species.name.endsWith("Cornerstone")) return "Rock";
    }

    const moveType = move.type;
    if (moveType === "Normal") {
      if (abilities.includes("Aerilate")) return "Flying";
      if (abilities.includes("Galvanize")) return "Electric";
      if (abilities.includes("Pixilate")) return "Fairy";
      if (abilities.includes("Refrigerate")) return "Ice";
    }
    return moveType;
  }

  queryMoves(
    moves: Set<string> | null,
    species: Species,
    teraType: TypeName,
    abilities: string[],
  ) {
    // This is primarily a helper function for random setbuilder functions.
    const counter: MoveCounter = {
      physical: 0,
      special: 0,
      status: 0,
      damagingMoves: [],
      technician: [],
      skilllink: [],
      recoil: [],
      drain: [],
      stab: [],
      stabtera: [],
      strongjaw: [],
      ironfist: [],
      sound: [],
      priority: [],
      sheerforce: [],
      inaccurate: [],
      recovery: [],
      serenegrace: [],
      contrary: [],
      physicalsetup: [],
      specialsetup: [],
      mixedsetup: [],
      speedsetup: [],
      setup: [],
      hazards: [],
    };
    const types = species.types;
    if (!moves?.size) return counter;

    const categories = { Physical: 0, Special: 0, Status: 0 };

    // Iterate through all moves we've chosen so far and keep track of what they do:
    for (const moveid of moves) {
      const move = this.dex.moves.get(moveid);

      const moveType = this.getMoveType(move, species, abilities, teraType);
      if (move.damage) {
        // Moves that do a set amount of damage:
        counter.damagingMoves.push(move);
      } else {
        // Are Physical/Special/Status moves:
        categories[move.category]++;
      }
      // Moves that have a low base power:
      if (
        moveid === "lowkick" ||
        (move.basePower && move.basePower <= 60 && moveid !== "rapidspin")
      ) {
        counter.technician.push(move);
      }
      // Moves that hit up to 5 times:
      if (
        move.multihit &&
        Array.isArray(move.multihit) &&
        move.multihit[1] === 5
      )
        counter.skilllink.push(move);
      if (move.recoil || move.hasCrashDamage) counter.recoil.push(move);
      if (move.drain) counter.drain.push(move);
      // Moves which have a base power:
      if (move.basePower) {
        if (
          !NO_STAB.includes(moveid) ||
          (PRIORITY_POKEMON.includes(species.id) && move.priority > 0)
        ) {
          if (types.includes(moveType)) counter.stab.push(move);
          if (teraType === moveType) counter.stabtera.push(move);
          counter.damagingMoves.push(move);
        }
        if (move.flags["bite"]) counter.strongjaw.push(move);
        if (move.flags["punch"]) counter.ironfist.push(move);
        if (move.flags["sound"]) counter.sound.push(move);
        if (
          move.priority > 0 ||
          (moveid === "grassyglide" && abilities.includes("Grassy Surge"))
        ) {
          counter.priority.push(move);
        }
      }
      // Moves with secondary effects:
      if (move.secondary || move.hasSheerForce) {
        counter.sheerforce.push(move);
        if (sereneGraceBenefits(move)) {
          counter.serenegrace.push(move);
        }
      }
      // Moves with low accuracy:
      if (move.accuracy && move.accuracy !== true && move.accuracy < 90)
        counter.inaccurate.push(move);

      // Moves that change stats:
      if (RECOVERY_MOVES.includes(moveid)) counter.recovery.push(move);
      if (CONTRARY_MOVES.includes(moveid)) counter.contrary.push(move);
      if (PHYSICAL_SETUP.includes(moveid)) counter.physicalsetup.push(move);
      if (SPECIAL_SETUP.includes(moveid)) counter.specialsetup.push(move);
      if (MIXED_SETUP.includes(moveid)) counter.mixedsetup.push(move);
      if (SPEED_SETUP.includes(moveid)) counter.speedsetup.push(move);
      if (SETUP.includes(moveid)) counter.setup.push(move);
      if (HAZARDS.includes(moveid)) counter.hazards.push(move);
    }

    counter.physical = Math.floor(categories["Physical"]);
    counter.special = Math.floor(categories["Special"]);
    counter.status = Math.floor(categories["Status"]);
    return counter;
  }

  getAbility(
    moves: Set<string>,
    abilities: string[],
    counter: MoveCounter,
    species: Species,
    teraType: string,
  ): string {
    if (abilities.length <= 1) return abilities[0];

    // Hard-code abilities here
    if (species.id === "drifblim")
      return moves.has("defog") ? "Aftermath" : "Unburden";
    if (
      abilities.includes("Flash Fire") &&
      this.dex.getEffectiveness("Fire", teraType) >= 1
    )
      return "Flash Fire";
    if (species.id === "hitmonchan" && counter.ironfist.length)
      return "Iron Fist";
    if (
      (species.id === "thundurus" || species.id === "tornadus") &&
      !counter.physical
    )
      return "Prankster";
    if (species.id === "toucannon" && counter.skilllink.length)
      return "Skill Link";
    if (abilities.includes("Slush Rush") && moves.has("snowscape"))
      return "Slush Rush";

    // Pick a random ability
    return this.sample(abilities);
  }

  getPriorityItem(
    ability: string,
    types: string[],
    moves: Set<string>,
    counter: MoveCounter,
    species: Species,
    role: string,
  ) {
    if (
      role === "Fast Bulky Setup" &&
      (ability === "Quark Drive" || ability === "Protosynthesis")
    ) {
      return "Booster Energy";
    }
    if (species.id === "lokix") {
      return role === "Fast Attacker" ? "Silver Powder" : "Life Orb";
    }
    if (species.requiredItems) {
      // Z-Crystals aren't available in Gen 9, so require Plates
      if (species.baseSpecies === "Arceus") {
        return species.requiredItems[0];
      }
      return this.sample(species.requiredItems);
    }
    if (role === "AV Pivot") return "Assault Vest";
    if (species.id === "pikachu") return "Light Ball";
    if (species.id === "regieleki") return "Magnet";
    if (
      types.includes("Normal") &&
      moves.has("doubleedge") &&
      moves.has("fakeout")
    )
      return "Silk Scarf";
    if (
      species.id === "froslass" ||
      moves.has("populationbomb") ||
      (ability === "Hustle" && counter.setup.length && this.random(1, 3) === 1)
    )
      return "Wide Lens";
    if (species.id === "smeargle") return "Focus Sash";
    if (
      moves.has("clangoroussoul") ||
      (species.id === "toxtricity" && moves.has("shiftgear"))
    )
      return "Throat Spray";
    if (
      (species.baseSpecies === "Magearna" && role === "Tera Blast user") ||
      species.id === "necrozmaduskmane"
    )
      return "Weakness Policy";
    if (
      ["dragonenergy", "lastrespects", "waterspout"].some((m) => moves.has(m))
    )
      return "Choice Scarf";
    if (
      ability === "Imposter" ||
      (species.id === "magnezone" && role === "Fast Attacker")
    )
      return "Choice Scarf";
    if (species.id === "rampardos" && role === "Fast Attacker")
      return "Choice Scarf";
    if (species.id === "palkia" && counter.special < 4) return "Lustrous Orb";
    if (moves.has("bellydrum") && moves.has("substitute")) return "Salac Berry";
    if (
      ["Cheek Pouch", "Cud Chew", "Harvest", "Ripen"].some(
        (m) => ability === m,
      ) ||
      moves.has("bellydrum") ||
      moves.has("filletaway")
    ) {
      return "Sitrus Berry";
    }
    if (["healingwish", "switcheroo", "trick"].some((m) => moves.has(m))) {
      if (
        species.baseStats.spe >= 60 &&
        species.baseStats.spe <= 108 &&
        role !== "Wallbreaker" &&
        role !== "Doubles Wallbreaker" &&
        !counter.priority.length
      ) {
        return "Choice Scarf";
      } else {
        return counter.physical > counter.special
          ? "Choice Band"
          : "Choice Specs";
      }
    }
    if (
      counter.status &&
      (species.name === "Latias" || species.name === "Latios")
    )
      return "Soul Dew";
    if (species.id === "scyther") return "Eviolite";
    if (ability === "Poison Heal" || ability === "Quick Feet")
      return "Toxic Orb";
    if (species.nfe) return "Eviolite";
    if (
      (ability === "Guts" || moves.has("facade")) &&
      !moves.has("sleeptalk")
    ) {
      return types.includes("Fire") || ability === "Toxic Boost"
        ? "Toxic Orb"
        : "Flame Orb";
    }
    if (
      ability === "Magic Guard" ||
      (ability === "Sheer Force" && counter.sheerforce)
    )
      return "Life Orb";
    if (ability === "Anger Shell")
      return this.sample([
        "Rindo Berry",
        "Passho Berry",
        "Scope Lens",
        "Sitrus Berry",
      ]);
    if (
      counter.skilllink.length &&
      ability !== "Skill Link" &&
      species.id !== "breloom"
    )
      return "Loaded Dice";
    if (ability === "Unburden") {
      return moves.has("closecombat") || moves.has("leafstorm")
        ? "White Herb"
        : "Sitrus Berry";
    }
    if (moves.has("shellsmash") && ability !== "Weak Armor")
      return "White Herb";
    if (moves.has("meteorbeam") || moves.has("electroshot"))
      return "Power Herb";
    if (moves.has("acrobatics") && ability !== "Protosynthesis") return "";
    if (
      moves.has("auroraveil") ||
      (moves.has("lightscreen") && moves.has("reflect"))
    )
      return "Light Clay";
    if (ability === "Gluttony")
      return `${this.sample(["Aguav", "Figy", "Iapapa", "Mago", "Wiki"])} Berry`;
    if (
      species.id === "giratina" &&
      moves.has("rest") &&
      !moves.has("sleeptalk")
    )
      return "Leftovers";
    if (
      moves.has("rest") &&
      !moves.has("sleeptalk") &&
      ability !== "Natural Cure" &&
      ability !== "Shed Skin"
    ) {
      return "Chesto Berry";
    }
  }

  getItem(
    ability: string,
    moves: Set<string>,
    counter: MoveCounter,
    species: Species,
    role: string,
  ): string {
    if (
      species.id !== "jirachi" &&
      counter.physical >= 4 &&
      [
        "dragontail",
        "fakeout",
        "firstimpression",
        "flamecharge",
        "rapidspin",
      ].every((m) => !moves.has(m))
    ) {
      const scarfReqs =
        role !== "Wallbreaker" &&
        (species.baseStats.atk >= 100 ||
          ability === "Huge Power" ||
          ability === "Pure Power") &&
        species.baseStats.spe >= 60 &&
        species.baseStats.spe <= 108 &&
        ability !== "Speed Boost" &&
        !counter.priority.length &&
        !moves.has("aquastep");
      return scarfReqs && this.random(1, 3) === 1
        ? "Choice Scarf"
        : "Choice Band";
    }
    if (
      counter.special >= 4 ||
      (counter.special >= 3 && ["flipturn", "uturn"].some((m) => moves.has(m)))
    ) {
      const scarfReqs =
        role !== "Wallbreaker" &&
        species.baseStats.spa >= 100 &&
        species.baseStats.spe >= 60 &&
        species.baseStats.spe <= 108 &&
        ability !== "Speed Boost" &&
        ability !== "Tinted Lens" &&
        !moves.has("uturn") &&
        !counter.priority.length;
      return scarfReqs && this.random(1, 3) === 1
        ? "Choice Scarf"
        : "Choice Specs";
    }
    if (counter.speedsetup.length && role === "Bulky Setup")
      return "Weakness Policy";
    if (
      !counter.status &&
      !["Fast Attacker", "Wallbreaker", "Tera Blast user"].includes(role)
    ) {
      return "Assault Vest";
    }
    if (species.id === "golem")
      return counter.speedsetup.length ? "Weakness Policy" : "Custap Berry";
    if (moves.has("substitute")) return "Leftovers";
    if (
      moves.has("stickyweb") &&
      species.baseStats.hp + species.baseStats.def + species.baseStats.spd <=
        235
    )
      return "Focus Sash";

    // Low Priority
    if (
      ability === "Rough Skin" ||
      (ability === "Regenerator" &&
        (role === "Bulky Support" || role === "Bulky Attacker") &&
        species.baseStats.hp + species.baseStats.def >= 180 &&
        this.random(1, 3) === 1) ||
      (ability !== "Regenerator" &&
        !counter.setup.length &&
        counter.recovery.length &&
        this.dex.getEffectiveness("Fighting", species) < 1 &&
        species.baseStats.hp + species.baseStats.def > 200 &&
        this.random(1, 3) === 1)
    )
      return "Rocky Helmet";
    if (moves.has("outrage") && counter.setup.length) return "Lum Berry";
    if (moves.has("protect") && ability !== "Speed Boost") return "Leftovers";
    if (
      role === "Fast Support" &&
      !counter.recovery.length &&
      !counter.recoil.length &&
      (counter.hazards.length || counter.setup.length) &&
      species.baseStats.hp + species.baseStats.def + species.baseStats.spd < 258
    )
      return "Focus Sash";
    if (
      !counter.setup.length &&
      ability !== "Levitate" &&
      this.dex.getEffectiveness("Ground", species) >= 2
    )
      return "Air Balloon";
    if (
      ["Bulky Attacker", "Bulky Support", "Bulky Setup"].some((m) => role === m)
    )
      return "Leftovers";
    if (species.id === "pawmot" && moves.has("nuzzle")) return "Leppa Berry";
    if (role === "Fast Support" || role === "Fast Bulky Setup") {
      return counter.physical + counter.special >= 3 && !moves.has("nuzzle")
        ? "Life Orb"
        : "Leftovers";
    }
    if (
      role === "Tera Blast user" &&
      DEFENSIVE_TERA_BLAST_USERS.includes(species.id)
    )
      return "Leftovers";
    if (
      ["flamecharge", "rapidspin", "trailblaze"].every((m) => !moves.has(m)) &&
      ["Fast Attacker", "Setup Sweeper", "Tera Blast user", "Wallbreaker"].some(
        (m) => role === m,
      )
    )
      return "Life Orb";
    return "Leftovers";
  }

  addMove(move: string, moves: Set<string>, movePool: string[]) {
    moves.add(move);
    fastPop(movePool, movePool.indexOf(move));
  }

  private random = (numerator: number, denominator: number) => {
    return this.prng!.random(numerator, denominator);
  };

  private sample<T>(items: readonly T[]): T {
    return this.prng!.sample(items);
  }

  private sampleIfArray<T>(item: T | T[]): T {
    if (Array.isArray(item)) {
      return this.sample(item);
    }
    return item;
  }
}

type MoveCounter = {
  physical: number;
  special: number;
  status: number;
  damagingMoves: Move[];
  technician: Move[];
  skilllink: Move[];
  recoil: Move[];
  drain: Move[];
  stab: Move[];
  stabtera: Move[];
  strongjaw: Move[];
  ironfist: Move[];
  sound: Move[];
  priority: Move[];
  sheerforce: Move[];
  inaccurate: Move[];
  recovery: Move[];
  serenegrace: Move[];
  contrary: Move[];
  physicalsetup: Move[];
  specialsetup: Move[];
  mixedsetup: Move[];
  speedsetup: Move[];
  setup: Move[];
  hazards: Move[];
};

// Taken from @pkmn/randoms/src/gen9.ts
const randomSetsJSON: Record<string, RandomSet> = {
  venusaur: {
    level: 84,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Giga Drain",
          "Leech Seed",
          "Sleep Powder",
          "Sludge Bomb",
          "Substitute",
        ],
        abilities: ["Chlorophyll", "Overgrow"],
        teraTypes: ["Steel", "Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Earth Power",
          "Energy Ball",
          "Knock Off",
          "Sleep Powder",
          "Sludge Bomb",
          "Synthesis",
          "Toxic",
        ],
        abilities: ["Chlorophyll", "Overgrow"],
        teraTypes: ["Dark", "Steel", "Water"],
      },
    ],
    baseSpecies: "Venusaur",
  },
  charizard: {
    level: 85,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Earthquake",
          "Flamethrower",
          "Focus Blast",
          "Hurricane",
          "Will-O-Wisp",
        ],
        abilities: ["Blaze"],
        teraTypes: ["Dragon", "Fire", "Ground"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Dragon Dance",
          "Earthquake",
          "Flare Blitz",
          "Outrage",
          "Swords Dance",
        ],
        abilities: ["Blaze"],
        teraTypes: ["Dragon", "Ground"],
      },
    ],
    baseSpecies: "Charizard",
  },
  blastoise: {
    level: 80,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Earthquake", "Hydro Pump", "Ice Beam", "Shell Smash"],
        abilities: ["Torrent"],
        teraTypes: ["Ground", "Steel", "Water"],
      },
    ],
    baseSpecies: "Blastoise",
  },
  arbok: {
    level: 87,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Earthquake",
          "Glare",
          "Gunk Shot",
          "Knock Off",
          "Sucker Punch",
          "Toxic Spikes",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Dark", "Ground"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Coil", "Earthquake", "Gunk Shot", "Trailblaze"],
        abilities: ["Intimidate"],
        teraTypes: ["Grass", "Ground"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Coil", "Earthquake", "Gunk Shot", "Sucker Punch"],
        abilities: ["Intimidate"],
        teraTypes: ["Dark", "Ground"],
      },
    ],
    baseSpecies: "Arbok",
  },
  pikachu: {
    level: 93,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Fake Out",
          "Knock Off",
          "Play Rough",
          "Surf",
          "Volt Switch",
          "Volt Tackle",
        ],
        abilities: ["Lightning Rod"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Pikachu",
  },
  raichu: {
    level: 88,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Alluring Voice",
          "Encore",
          "Focus Blast",
          "Grass Knot",
          "Knock Off",
          "Nasty Plot",
          "Nuzzle",
          "Surf",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Lightning Rod"],
        teraTypes: ["Grass", "Water"],
      },
    ],
    baseSpecies: "Raichu",
  },
  raichualola: {
    level: 87,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Alluring Voice",
          "Focus Blast",
          "Grass Knot",
          "Psychic",
          "Psyshock",
          "Surf",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Surge Surfer"],
        teraTypes: ["Fairy", "Fighting", "Grass", "Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Alluring Voice",
          "Focus Blast",
          "Grass Knot",
          "Nasty Plot",
          "Psyshock",
          "Surf",
          "Thunderbolt",
        ],
        abilities: ["Surge Surfer"],
        teraTypes: ["Fairy", "Fighting", "Grass", "Water"],
      },
    ],
    baseSpecies: "Raichu",
  },
  sandslash: {
    level: 89,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Knock Off",
          "Rapid Spin",
          "Spikes",
          "Stone Edge",
          "Swords Dance",
        ],
        abilities: ["Sand Rush"],
        teraTypes: ["Dragon", "Steel", "Water"],
      },
    ],
    baseSpecies: "Sandslash",
  },
  sandslashalola: {
    level: 88,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Iron Head",
          "Knock Off",
          "Rapid Spin",
          "Spikes",
          "Triple Axel",
        ],
        abilities: ["Slush Rush"],
        teraTypes: ["Flying", "Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Earthquake",
          "Ice Shard",
          "Knock Off",
          "Rapid Spin",
          "Swords Dance",
          "Triple Axel",
        ],
        abilities: ["Slush Rush"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Sandslash",
  },
  clefable: {
    level: 83,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Fire Blast",
          "Knock Off",
          "Moonblast",
          "Moonlight",
          "Stealth Rock",
          "Thunder Wave",
        ],
        abilities: ["Magic Guard", "Unaware"],
        teraTypes: ["Poison", "Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Fire Blast", "Moonblast", "Moonlight"],
        abilities: ["Magic Guard", "Unaware"],
        teraTypes: ["Fire", "Steel"],
      },
    ],
    baseSpecies: "Clefable",
  },
  ninetales: {
    level: 85,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Fire Blast", "Nasty Plot", "Scorching Sands", "Solar Beam"],
        abilities: ["Drought"],
        teraTypes: ["Fire", "Grass"],
      },
    ],
    baseSpecies: "Ninetales",
  },
  ninetalesalola: {
    level: 78,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Aurora Veil",
          "Blizzard",
          "Encore",
          "Moonblast",
          "Nasty Plot",
        ],
        abilities: ["Snow Warning"],
        teraTypes: ["Steel", "Water"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Aurora Veil",
          "Blizzard",
          "Freeze-Dry",
          "Moonblast",
          "Nasty Plot",
        ],
        abilities: ["Snow Warning"],
        teraTypes: ["Steel", "Water"],
      },
    ],
    baseSpecies: "Ninetales",
  },
  wigglytuff: {
    level: 96,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Alluring Voice",
          "Dazzling Gleam",
          "Fire Blast",
          "Knock Off",
          "Protect",
          "Thunder Wave",
          "Wish",
        ],
        abilities: ["Competitive"],
        teraTypes: ["Poison", "Steel"],
      },
    ],
    baseSpecies: "Wigglytuff",
  },
  vileplume: {
    level: 85,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Giga Drain",
          "Leech Seed",
          "Sleep Powder",
          "Sludge Bomb",
          "Strength Sap",
        ],
        abilities: ["Effect Spore"],
        teraTypes: ["Steel", "Water"],
      },
    ],
    baseSpecies: "Vileplume",
  },
  venomoth: {
    level: 84,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Bug Buzz", "Quiver Dance", "Sleep Powder", "Sludge Wave"],
        abilities: ["Tinted Lens"],
        teraTypes: ["Bug", "Poison", "Steel", "Water"],
      },
    ],
    baseSpecies: "Venomoth",
  },
  dugtrio: {
    level: 84,
    sets: [
      {
        role: "Fast Support",
        movepool: ["Earthquake", "Stone Edge", "Sucker Punch", "Swords Dance"],
        abilities: ["Arena Trap"],
        teraTypes: ["Dark", "Fairy", "Flying", "Ghost", "Ground"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Earthquake", "Stone Edge", "Sucker Punch", "Throat Chop"],
        abilities: ["Arena Trap"],
        teraTypes: ["Dark", "Fairy", "Flying", "Ghost", "Ground"],
      },
    ],
    baseSpecies: "Dugtrio",
  },
  dugtrioalola: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Earthquake",
          "Iron Head",
          "Stealth Rock",
          "Stone Edge",
          "Sucker Punch",
          "Swords Dance",
        ],
        abilities: ["Sand Force", "Tangling Hair"],
        teraTypes: ["Ground", "Steel"],
      },
    ],
    baseSpecies: "Dugtrio",
  },
  persian: {
    level: 92,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Double-Edge",
          "Gunk Shot",
          "Knock Off",
          "Switcheroo",
          "U-turn",
        ],
        abilities: ["Limber"],
        teraTypes: ["Normal", "Poison"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Double-Edge", "Fake Out", "Knock Off", "U-turn"],
        abilities: ["Technician"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Persian",
  },
  persianalola: {
    level: 86,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Dark Pulse",
          "Hypnosis",
          "Nasty Plot",
          "Power Gem",
          "Thunderbolt",
        ],
        abilities: ["Fur Coat"],
        teraTypes: ["Dark", "Electric"],
      },
      {
        role: "Fast Support",
        movepool: [
          "Foul Play",
          "Knock Off",
          "Parting Shot",
          "Taunt",
          "Thunder Wave",
        ],
        abilities: ["Fur Coat"],
        teraTypes: ["Fairy", "Ghost", "Poison"],
      },
    ],
    baseSpecies: "Persian",
  },
  golduck: {
    level: 90,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Encore",
          "Grass Knot",
          "Hydro Pump",
          "Ice Beam",
          "Nasty Plot",
        ],
        abilities: ["Cloud Nine", "Swift Swim"],
        teraTypes: ["Water"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Flip Turn",
          "Grass Knot",
          "Hydro Pump",
          "Ice Beam",
          "Nasty Plot",
        ],
        abilities: ["Cloud Nine", "Swift Swim"],
        teraTypes: ["Grass", "Water"],
      },
    ],
    baseSpecies: "Golduck",
  },
  annihilape: {
    level: 76,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Bulk Up",
          "Drain Punch",
          "Gunk Shot",
          "Rage Fist",
          "Rest",
          "Taunt",
        ],
        abilities: ["Defiant"],
        teraTypes: ["Fairy", "Ghost", "Steel", "Water"],
      },
    ],
    baseSpecies: "Annihilape",
  },
  arcanine: {
    level: 84,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Close Combat",
          "Extreme Speed",
          "Flare Blitz",
          "Morning Sun",
          "Roar",
          "Will-O-Wisp",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Fighting", "Normal"],
      },
    ],
    baseSpecies: "Arcanine",
  },
  arcaninehisui: {
    level: 79,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Extreme Speed",
          "Flare Blitz",
          "Head Smash",
          "Wild Charge",
        ],
        abilities: ["Rock Head"],
        teraTypes: ["Fire", "Normal", "Rock"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Extreme Speed", "Flare Blitz", "Head Smash", "Morning Sun"],
        abilities: ["Rock Head"],
        teraTypes: ["Fire", "Grass", "Normal", "Rock"],
      },
    ],
    baseSpecies: "Arcanine",
  },
  poliwrath: {
    level: 88,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Close Combat", "Knock Off", "Liquidation", "Rain Dance"],
        abilities: ["Swift Swim"],
        teraTypes: ["Dark", "Fighting", "Water"],
      },
      {
        role: "AV Pivot",
        movepool: ["Circle Throw", "Close Combat", "Knock Off", "Liquidation"],
        abilities: ["Water Absorb"],
        teraTypes: ["Dark", "Fighting", "Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Bulk Up",
          "Drain Punch",
          "Ice Punch",
          "Knock Off",
          "Liquidation",
          "Poison Jab",
        ],
        abilities: ["Water Absorb"],
        teraTypes: ["Fighting", "Steel", "Water"],
      },
    ],
    baseSpecies: "Poliwrath",
  },
  victreebel: {
    level: 90,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Poison Jab", "Power Whip", "Sucker Punch", "Swords Dance"],
        abilities: ["Chlorophyll"],
        teraTypes: ["Dark", "Grass"],
      },
      {
        role: "Wallbreaker",
        movepool: [
          "Knock Off",
          "Power Whip",
          "Sleep Powder",
          "Sludge Wave",
          "Strength Sap",
          "Sucker Punch",
        ],
        abilities: ["Chlorophyll"],
        teraTypes: ["Grass", "Steel"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Power Whip", "Sludge Wave", "Sunny Day", "Weather Ball"],
        abilities: ["Chlorophyll"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Victreebel",
  },
  tentacruel: {
    level: 84,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Flip Turn",
          "Haze",
          "Knock Off",
          "Rapid Spin",
          "Sludge Bomb",
          "Surf",
          "Toxic",
          "Toxic Spikes",
        ],
        abilities: ["Liquid Ooze"],
        teraTypes: ["Flying", "Grass"],
      },
    ],
    baseSpecies: "Tentacruel",
  },
  golem: {
    level: 87,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Earthquake",
          "Explosion",
          "Rock Polish",
          "Stealth Rock",
          "Stone Edge",
        ],
        abilities: ["Sturdy"],
        teraTypes: ["Grass", "Ground", "Steel"],
      },
    ],
    baseSpecies: "Golem",
  },
  golemalola: {
    level: 93,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Double-Edge", "Earthquake", "Rock Polish", "Stone Edge"],
        abilities: ["Galvanize"],
        teraTypes: ["Flying", "Grass"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Double-Edge", "Earthquake", "Explosion", "Stone Edge"],
        abilities: ["Galvanize"],
        teraTypes: ["Electric", "Grass", "Ground"],
      },
    ],
    baseSpecies: "Golem",
  },
  slowbro: {
    level: 85,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Calm Mind",
          "Psychic Noise",
          "Psyshock",
          "Scald",
          "Slack Off",
          "Thunder Wave",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Fairy", "Water"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Body Press",
          "Fire Blast",
          "Future Sight",
          "Ice Beam",
          "Psychic Noise",
          "Scald",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Fairy", "Fighting"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Body Press", "Iron Defense", "Scald", "Slack Off"],
        abilities: ["Regenerator"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Slowbro",
  },
  slowbrogalar: {
    level: 87,
    sets: [
      {
        role: "AV Pivot",
        movepool: [
          "Earthquake",
          "Fire Blast",
          "Foul Play",
          "Psychic",
          "Shell Side Arm",
          "Surf",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Dark", "Ground", "Poison", "Water"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Fire Blast", "Psychic", "Shell Side Arm", "Trick Room"],
        abilities: ["Regenerator"],
        teraTypes: ["Poison", "Psychic"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Earthquake",
          "Fire Blast",
          "Psychic",
          "Shell Side Arm",
          "Slack Off",
          "Thunder Wave",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Dark", "Ground", "Poison"],
      },
    ],
    baseSpecies: "Slowbro",
  },
  dodrio: {
    level: 86,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Brave Bird",
          "Double-Edge",
          "Drill Run",
          "Knock Off",
          "Swords Dance",
        ],
        abilities: ["Early Bird"],
        teraTypes: ["Flying", "Ground", "Normal"],
      },
    ],
    baseSpecies: "Dodrio",
  },
  dewgong: {
    level: 94,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Encore", "Flip Turn", "Knock Off", "Surf", "Triple Axel"],
        abilities: ["Thick Fat"],
        teraTypes: ["Dragon", "Grass", "Ground", "Poison", "Steel"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Encore",
          "Flip Turn",
          "Hydro Pump",
          "Ice Beam",
          "Knock Off",
          "Surf",
        ],
        abilities: ["Thick Fat"],
        teraTypes: ["Dragon", "Grass", "Ground", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Dewgong",
  },
  muk: {
    level: 86,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Drain Punch",
          "Gunk Shot",
          "Haze",
          "Ice Punch",
          "Knock Off",
          "Poison Jab",
          "Shadow Sneak",
          "Toxic Spikes",
        ],
        abilities: ["Poison Touch"],
        teraTypes: ["Dark"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Drain Punch",
          "Gunk Shot",
          "Ice Punch",
          "Knock Off",
          "Poison Jab",
          "Shadow Sneak",
        ],
        abilities: ["Poison Touch"],
        teraTypes: ["Dark"],
      },
    ],
    baseSpecies: "Muk",
  },
  mukalola: {
    level: 82,
    sets: [
      {
        role: "AV Pivot",
        movepool: [
          "Drain Punch",
          "Gunk Shot",
          "Ice Punch",
          "Knock Off",
          "Poison Jab",
          "Shadow Sneak",
        ],
        abilities: ["Poison Touch"],
        teraTypes: ["Dark"],
      },
    ],
    baseSpecies: "Muk",
  },
  cloyster: {
    level: 80,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Drill Run", "Icicle Spear", "Rock Blast", "Shell Smash"],
        abilities: ["Skill Link"],
        teraTypes: ["Ground"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Hydro Pump", "Icicle Spear", "Rock Blast", "Shell Smash"],
        abilities: ["Skill Link"],
        teraTypes: ["Ice", "Rock"],
      },
    ],
    baseSpecies: "Cloyster",
  },
  gengar: {
    level: 81,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Focus Blast",
          "Nasty Plot",
          "Shadow Ball",
          "Sludge Wave",
          "Trick",
        ],
        abilities: ["Cursed Body"],
        teraTypes: ["Dark", "Fighting", "Ghost"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Encore",
          "Focus Blast",
          "Shadow Ball",
          "Sludge Wave",
          "Toxic Spikes",
          "Will-O-Wisp",
        ],
        abilities: ["Cursed Body"],
        teraTypes: ["Dark", "Fighting", "Ghost"],
      },
    ],
    baseSpecies: "Gengar",
  },
  hypno: {
    level: 95,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Encore",
          "Knock Off",
          "Psychic Noise",
          "Thunder Wave",
          "Toxic",
        ],
        abilities: ["Insomnia"],
        teraTypes: ["Dark", "Fairy", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Focus Blast", "Protect", "Psychic Noise", "Toxic"],
        abilities: ["Insomnia"],
        teraTypes: ["Dark", "Fighting", "Steel"],
      },
    ],
    baseSpecies: "Hypno",
  },
  electrode: {
    level: 92,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Explosion",
          "Foul Play",
          "Taunt",
          "Thunder Wave",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Aftermath", "Soundproof", "Static"],
        teraTypes: ["Dark", "Electric"],
      },
    ],
    baseSpecies: "Electrode",
  },
  electrodehisui: {
    level: 87,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Giga Drain",
          "Leaf Storm",
          "Taunt",
          "Thunder Wave",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Aftermath", "Soundproof", "Static"],
        teraTypes: ["Electric", "Grass"],
      },
      {
        role: "Fast Support",
        movepool: ["Giga Drain", "Leech Seed", "Substitute", "Thunderbolt"],
        abilities: ["Soundproof"],
        teraTypes: ["Poison"],
      },
    ],
    baseSpecies: "Electrode",
  },
  exeggutor: {
    level: 89,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Leech Seed",
          "Psychic",
          "Psychic Noise",
          "Sleep Powder",
          "Sludge Bomb",
          "Substitute",
        ],
        abilities: ["Harvest"],
        teraTypes: ["Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Leech Seed", "Protect", "Psychic Noise", "Substitute"],
        abilities: ["Harvest"],
        teraTypes: ["Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Giga Drain",
          "Psychic",
          "Psyshock",
          "Substitute",
        ],
        abilities: ["Harvest"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Exeggutor",
  },
  exeggutoralola: {
    level: 89,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Draco Meteor", "Flamethrower", "Giga Drain", "Leaf Storm"],
        abilities: ["Frisk"],
        teraTypes: ["Fire"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Draco Meteor",
          "Dragon Tail",
          "Flamethrower",
          "Knock Off",
          "Moonlight",
          "Sleep Powder",
          "Stun Spore",
          "Wood Hammer",
        ],
        abilities: ["Harvest"],
        teraTypes: ["Fire"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Dragon Pulse", "Flamethrower", "Giga Drain"],
        abilities: ["Harvest"],
        teraTypes: ["Fire", "Steel"],
      },
    ],
    baseSpecies: "Exeggutor",
  },
  hitmonlee: {
    level: 85,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "High Jump Kick",
          "Knock Off",
          "Mach Punch",
          "Poison Jab",
          "Stone Edge",
        ],
        abilities: ["Reckless"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Close Combat",
          "Knock Off",
          "Poison Jab",
          "Stone Edge",
          "Swords Dance",
        ],
        abilities: ["Unburden"],
        teraTypes: ["Dark", "Fighting", "Poison"],
      },
    ],
    baseSpecies: "Hitmonlee",
  },
  hitmonchan: {
    level: 87,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Close Combat",
          "Drain Punch",
          "Ice Punch",
          "Knock Off",
          "Mach Punch",
          "Rapid Spin",
          "Swords Dance",
        ],
        abilities: ["Inner Focus", "Iron Fist"],
        teraTypes: ["Dark", "Fighting"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Bulk Up",
          "Drain Punch",
          "Knock Off",
          "Poison Jab",
          "Rapid Spin",
        ],
        abilities: ["Iron Fist"],
        teraTypes: ["Dark", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Hitmonchan",
  },
  weezing: {
    level: 88,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Fire Blast",
          "Gunk Shot",
          "Pain Split",
          "Sludge Bomb",
          "Toxic Spikes",
          "Will-O-Wisp",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Weezing",
  },
  weezinggalar: {
    level: 86,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Defog",
          "Fire Blast",
          "Gunk Shot",
          "Pain Split",
          "Strange Steam",
          "Will-O-Wisp",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Weezing",
  },
  rhydon: {
    level: 85,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Earthquake",
          "Megahorn",
          "Stealth Rock",
          "Stone Edge",
          "Swords Dance",
        ],
        abilities: ["Lightning Rod"],
        teraTypes: ["Dragon", "Fairy", "Flying", "Grass", "Water"],
      },
    ],
    baseSpecies: "Rhydon",
  },
  scyther: {
    level: 82,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Bug Bite", "Close Combat", "Dual Wingbeat", "Swords Dance"],
        abilities: ["Technician"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Fast Support",
        movepool: ["Close Combat", "Defog", "Dual Wingbeat", "U-turn"],
        abilities: ["Technician"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Scyther",
  },
  tauros: {
    level: 82,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Body Slam", "Close Combat", "Earthquake", "Throat Chop"],
        abilities: ["Sheer Force"],
        teraTypes: ["Fighting", "Ground", "Normal"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Body Slam", "Close Combat", "Throat Chop", "Zen Headbutt"],
        abilities: ["Sheer Force"],
        teraTypes: ["Fighting", "Normal", "Psychic"],
      },
    ],
    baseSpecies: "Tauros",
  },
  taurospaldeacombat: {
    level: 82,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Bulk Up",
          "Close Combat",
          "Earthquake",
          "Iron Head",
          "Stone Edge",
          "Throat Chop",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Dark", "Fighting", "Steel"],
      },
    ],
    baseSpecies: "Tauros",
  },
  taurospaldeablaze: {
    level: 81,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: ["Bulk Up", "Close Combat", "Raging Bull", "Substitute"],
        abilities: ["Cud Chew"],
        teraTypes: ["Water"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Close Combat", "Flare Blitz", "Stone Edge", "Wild Charge"],
        abilities: ["Intimidate"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Tauros",
  },
  taurospaldeaaqua: {
    level: 81,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: ["Bulk Up", "Close Combat", "Liquidation", "Substitute"],
        abilities: ["Cud Chew"],
        teraTypes: ["Steel", "Water"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Aqua Jet", "Close Combat", "Stone Edge", "Wave Crash"],
        abilities: ["Intimidate"],
        teraTypes: ["Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Aqua Jet", "Bulk Up", "Close Combat", "Liquidation"],
        abilities: ["Intimidate"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Tauros",
  },
  gyarados: {
    level: 79,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Dragon Dance",
          "Earthquake",
          "Stone Edge",
          "Temper Flare",
          "Waterfall",
        ],
        abilities: ["Intimidate", "Moxie"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Gyarados",
  },
  lapras: {
    level: 87,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Freeze-Dry", "Hydro Pump", "Ice Beam", "Sparkling Aria"],
        abilities: ["Water Absorb"],
        teraTypes: ["Ice", "Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Freeze-Dry", "Rest", "Sleep Talk", "Sparkling Aria"],
        abilities: ["Water Absorb"],
        teraTypes: ["Dragon", "Ghost", "Ground", "Poison", "Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Dragon Dance", "Earthquake", "Icicle Spear", "Waterfall"],
        abilities: ["Water Absorb"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Lapras",
  },
  ditto: {
    level: 87,
    sets: [
      {
        role: "Fast Support",
        movepool: ["Transform"],
        abilities: ["Imposter"],
        teraTypes: [
          "Bug",
          "Dark",
          "Dragon",
          "Electric",
          "Fairy",
          "Fighting",
          "Fire",
          "Flying",
          "Ghost",
          "Grass",
          "Ground",
          "Ice",
          "Normal",
          "Poison",
          "Psychic",
          "Rock",
          "Steel",
          "Water",
        ],
      },
    ],
    baseSpecies: "Ditto",
  },
  vaporeon: {
    level: 86,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Flip Turn", "Ice Beam", "Protect", "Scald", "Wish"],
        abilities: ["Water Absorb"],
        teraTypes: ["Ghost", "Ground", "Poison"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Protect", "Scald", "Wish"],
        abilities: ["Water Absorb"],
        teraTypes: ["Ghost", "Ground", "Poison"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Haze", "Protect", "Roar", "Scald", "Wish"],
        abilities: ["Water Absorb"],
        teraTypes: ["Ghost", "Ground", "Poison"],
      },
    ],
    baseSpecies: "Vaporeon",
  },
  jolteon: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Alluring Voice",
          "Calm Mind",
          "Shadow Ball",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Volt Absorb"],
        teraTypes: ["Electric", "Fairy"],
      },
    ],
    baseSpecies: "Jolteon",
  },
  flareon: {
    level: 90,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Facade",
          "Flare Blitz",
          "Quick Attack",
          "Trailblaze",
          "Will-O-Wisp",
        ],
        abilities: ["Guts"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Flareon",
  },
  snorlax: {
    level: 82,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Body Slam", "Curse", "Rest", "Sleep Talk"],
        abilities: ["Thick Fat"],
        teraTypes: ["Fairy", "Poison"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Body Slam", "Crunch", "Curse", "Earthquake", "Rest"],
        abilities: ["Thick Fat"],
        teraTypes: ["Ground", "Poison"],
      },
    ],
    baseSpecies: "Snorlax",
  },
  articuno: {
    level: 86,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Brave Bird",
          "Freeze-Dry",
          "Haze",
          "Roost",
          "Substitute",
          "U-turn",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Ground", "Steel"],
      },
    ],
    baseSpecies: "Articuno",
  },
  articunogalar: {
    level: 84,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: ["Calm Mind", "Freezing Glare", "Hurricane", "Recover"],
        abilities: ["Competitive"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Articuno",
  },
  zapdos: {
    level: 78,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Discharge",
          "Heat Wave",
          "Hurricane",
          "Roost",
          "Thunderbolt",
          "U-turn",
        ],
        abilities: ["Static"],
        teraTypes: ["Electric", "Steel"],
      },
    ],
    baseSpecies: "Zapdos",
  },
  zapdosgalar: {
    level: 77,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Brave Bird",
          "Bulk Up",
          "Close Combat",
          "Knock Off",
          "U-turn",
        ],
        abilities: ["Defiant"],
        teraTypes: ["Dark", "Fighting", "Steel"],
      },
    ],
    baseSpecies: "Zapdos",
  },
  moltres: {
    level: 81,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Brave Bird",
          "Fire Blast",
          "Roost",
          "Scorching Sands",
          "U-turn",
          "Will-O-Wisp",
        ],
        abilities: ["Flame Body"],
        teraTypes: ["Dragon", "Ground", "Steel"],
      },
    ],
    baseSpecies: "Moltres",
  },
  moltresgalar: {
    level: 79,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Agility", "Fiery Wrath", "Hurricane", "Nasty Plot", "Rest"],
        abilities: ["Berserk"],
        teraTypes: ["Dark", "Steel"],
      },
    ],
    baseSpecies: "Moltres",
  },
  dragonite: {
    level: 74,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Dragon Dance", "Earthquake", "Outrage", "Roost"],
        abilities: ["Multiscale"],
        teraTypes: ["Ground", "Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Dragon Dance", "Earthquake", "Iron Head", "Outrage"],
        abilities: ["Multiscale"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Dragonite",
  },
  mewtwo: {
    level: 72,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Aura Sphere",
          "Dark Pulse",
          "Fire Blast",
          "Nasty Plot",
          "Psystrike",
          "Recover",
        ],
        abilities: ["Unnerve"],
        teraTypes: ["Dark", "Fighting", "Fire", "Psychic"],
      },
    ],
    baseSpecies: "Mewtwo",
  },
  mew: {
    level: 82,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Encore",
          "Knock Off",
          "Psychic",
          "Psychic Noise",
          "Stealth Rock",
          "Toxic Spikes",
          "U-turn",
          "Will-O-Wisp",
        ],
        abilities: ["Synchronize"],
        teraTypes: ["Dark", "Fairy", "Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Close Combat",
          "Knock Off",
          "Leech Life",
          "Psychic Fangs",
          "Swords Dance",
        ],
        abilities: ["Synchronize"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Aura Sphere",
          "Bug Buzz",
          "Dark Pulse",
          "Earth Power",
          "Fire Blast",
          "Hydro Pump",
          "Nasty Plot",
          "Psychic",
          "Psyshock",
        ],
        abilities: ["Synchronize"],
        teraTypes: ["Dark", "Fighting", "Fire", "Ground", "Psychic", "Water"],
      },
    ],
    baseSpecies: "Mew",
  },
  meganium: {
    level: 90,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Dragon Tail",
          "Encore",
          "Energy Ball",
          "Knock Off",
          "Leech Seed",
          "Synthesis",
        ],
        abilities: ["Overgrow"],
        teraTypes: ["Poison", "Steel", "Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Earthquake", "Knock Off", "Petal Blizzard", "Swords Dance"],
        abilities: ["Overgrow"],
        teraTypes: ["Ground", "Steel", "Water"],
      },
    ],
    baseSpecies: "Meganium",
  },
  typhlosion: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Eruption", "Fire Blast", "Focus Blast", "Scorching Sands"],
        abilities: ["Blaze", "Flash Fire"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Typhlosion",
  },
  typhlosionhisui: {
    level: 83,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Calm Mind",
          "Fire Blast",
          "Focus Blast",
          "Shadow Ball",
          "Substitute",
          "Will-O-Wisp",
        ],
        abilities: ["Blaze"],
        teraTypes: ["Fighting", "Fire", "Ghost"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Eruption", "Fire Blast", "Focus Blast", "Shadow Ball"],
        abilities: ["Blaze"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Typhlosion",
  },
  feraligatr: {
    level: 79,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: ["Crunch", "Dragon Dance", "Ice Punch", "Liquidation"],
        abilities: ["Sheer Force"],
        teraTypes: ["Dark", "Dragon", "Steel", "Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Dragon Dance", "Ice Punch", "Liquidation", "Trailblaze"],
        abilities: ["Sheer Force"],
        teraTypes: ["Grass", "Water"],
      },
    ],
    baseSpecies: "Feraligatr",
  },
  furret: {
    level: 94,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Double-Edge", "Knock Off", "Trick", "U-turn"],
        abilities: ["Frisk"],
        teraTypes: ["Ghost", "Normal"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Brick Break", "Double-Edge", "Knock Off", "Tidy Up"],
        abilities: ["Frisk"],
        teraTypes: ["Ghost", "Normal"],
      },
    ],
    baseSpecies: "Furret",
  },
  noctowl: {
    level: 95,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Calm Mind",
          "Defog",
          "Hurricane",
          "Hyper Voice",
          "Nasty Plot",
          "Roost",
        ],
        abilities: ["Tinted Lens"],
        teraTypes: ["Ground", "Normal", "Steel"],
      },
    ],
    baseSpecies: "Noctowl",
  },
  ariados: {
    level: 95,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Knock Off",
          "Megahorn",
          "Poison Jab",
          "Sticky Web",
          "Sucker Punch",
          "Toxic Spikes",
        ],
        abilities: ["Insomnia", "Swarm"],
        teraTypes: ["Ghost"],
      },
    ],
    baseSpecies: "Ariados",
  },
  lanturn: {
    level: 89,
    sets: [
      {
        role: "Fast Support",
        movepool: ["Scald", "Thunder Wave", "Thunderbolt", "Volt Switch"],
        abilities: ["Volt Absorb"],
        teraTypes: ["Flying"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Ice Beam",
          "Scald",
          "Thunder Wave",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Volt Absorb"],
        teraTypes: ["Flying"],
      },
    ],
    baseSpecies: "Lanturn",
  },
  ampharos: {
    level: 88,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Agility",
          "Dazzling Gleam",
          "Focus Blast",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Static"],
        teraTypes: ["Electric", "Fairy"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Dazzling Gleam",
          "Discharge",
          "Dragon Tail",
          "Focus Blast",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Static"],
        teraTypes: ["Fairy"],
      },
    ],
    baseSpecies: "Ampharos",
  },
  bellossom: {
    level: 84,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Giga Drain",
          "Quiver Dance",
          "Sleep Powder",
          "Strength Sap",
        ],
        abilities: ["Chlorophyll"],
        teraTypes: ["Poison", "Steel", "Water"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Giga Drain",
          "Moonblast",
          "Quiver Dance",
          "Sludge Bomb",
          "Strength Sap",
        ],
        abilities: ["Chlorophyll"],
        teraTypes: ["Fairy", "Poison"],
      },
    ],
    baseSpecies: "Bellossom",
  },
  azumarill: {
    level: 82,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Aqua Jet",
          "Belly Drum",
          "Ice Spinner",
          "Knock Off",
          "Liquidation",
          "Play Rough",
          "Superpower",
        ],
        abilities: ["Huge Power"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Azumarill",
  },
  sudowoodo: {
    level: 94,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Earthquake",
          "Head Smash",
          "Stealth Rock",
          "Sucker Punch",
          "Wood Hammer",
        ],
        abilities: ["Rock Head"],
        teraTypes: ["Grass", "Rock"],
      },
    ],
    baseSpecies: "Sudowoodo",
  },
  politoed: {
    level: 88,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Encore",
          "Haze",
          "Hydro Pump",
          "Hypnosis",
          "Ice Beam",
          "Rest",
          "Surf",
        ],
        abilities: ["Drizzle"],
        teraTypes: ["Steel", "Water"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Focus Blast", "Hydro Pump", "Ice Beam", "Weather Ball"],
        abilities: ["Drizzle"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Politoed",
  },
  jumpluff: {
    level: 87,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Acrobatics", "Leech Seed", "Strength Sap", "Substitute"],
        abilities: ["Infiltrator"],
        teraTypes: ["Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Acrobatics",
          "Encore",
          "Sleep Powder",
          "Strength Sap",
          "U-turn",
        ],
        abilities: ["Infiltrator"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Jumpluff",
  },
  sunflora: {
    level: 100,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Dazzling Gleam",
          "Earth Power",
          "Leaf Storm",
          "Sludge Bomb",
        ],
        abilities: ["Chlorophyll"],
        teraTypes: ["Fairy", "Grass", "Ground", "Poison"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Earth Power", "Solar Beam", "Sunny Day", "Weather Ball"],
        abilities: ["Chlorophyll"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Sunflora",
  },
  quagsire: {
    level: 84,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Earthquake", "Ice Beam", "Recover", "Spikes", "Toxic"],
        abilities: ["Unaware"],
        teraTypes: ["Fairy", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Quagsire",
  },
  clodsire: {
    level: 81,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Gunk Shot",
          "Poison Jab",
          "Recover",
          "Spikes",
          "Toxic",
        ],
        abilities: ["Unaware", "Water Absorb"],
        teraTypes: ["Flying", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Curse",
          "Earthquake",
          "Gunk Shot",
          "Poison Jab",
          "Recover",
          "Stealth Rock",
          "Toxic Spikes",
        ],
        abilities: ["Unaware", "Water Absorb"],
        teraTypes: ["Flying", "Steel"],
      },
    ],
    baseSpecies: "Clodsire",
  },
  espeon: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Alluring Voice",
          "Calm Mind",
          "Morning Sun",
          "Psychic",
          "Psyshock",
          "Shadow Ball",
          "Trick",
        ],
        abilities: ["Magic Bounce"],
        teraTypes: ["Fairy", "Psychic"],
      },
    ],
    baseSpecies: "Espeon",
  },
  umbreon: {
    level: 84,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Foul Play", "Protect", "Toxic", "Wish"],
        abilities: ["Synchronize"],
        teraTypes: ["Poison"],
      },
    ],
    baseSpecies: "Umbreon",
  },
  slowking: {
    level: 88,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Chilly Reception",
          "Psychic Noise",
          "Psyshock",
          "Scald",
          "Slack Off",
          "Thunder Wave",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Dragon", "Fairy"],
      },
      {
        role: "Fast Support",
        movepool: ["Chilly Reception", "Future Sight", "Scald", "Slack Off"],
        abilities: ["Regenerator"],
        teraTypes: ["Dragon", "Fairy"],
      },
    ],
    baseSpecies: "Slowking",
  },
  slowkinggalar: {
    level: 85,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Chilly Reception",
          "Fire Blast",
          "Psychic Noise",
          "Psyshock",
          "Slack Off",
          "Sludge Bomb",
          "Thunder Wave",
          "Toxic Spikes",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Dark", "Poison"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Fire Blast",
          "Future Sight",
          "Psychic Noise",
          "Sludge Bomb",
          "Surf",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Poison", "Psychic", "Water"],
      },
    ],
    baseSpecies: "Slowking",
  },
  misdreavus: {
    level: 90,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Draining Kiss", "Shadow Ball", "Will-O-Wisp"],
        abilities: ["Levitate"],
        teraTypes: ["Fairy"],
      },
    ],
    baseSpecies: "Misdreavus",
  },
  girafarig: {
    level: 89,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Dazzling Gleam",
          "Nasty Plot",
          "Psychic",
          "Psyshock",
          "Shadow Ball",
          "Thunderbolt",
        ],
        abilities: ["Sap Sipper"],
        teraTypes: ["Electric", "Fairy", "Psychic"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Hyper Voice", "Nasty Plot", "Psyshock", "Thunderbolt"],
        abilities: ["Sap Sipper"],
        teraTypes: ["Electric", "Normal"],
      },
    ],
    baseSpecies: "Girafarig",
  },
  forretress: {
    level: 84,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Iron Head",
          "Rapid Spin",
          "Stealth Rock",
          "Toxic Spikes",
          "Volt Switch",
        ],
        abilities: ["Sturdy"],
        teraTypes: ["Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Press",
          "Iron Head",
          "Rapid Spin",
          "Spikes",
          "Stealth Rock",
        ],
        abilities: ["Sturdy"],
        teraTypes: ["Fighting", "Water"],
      },
    ],
    baseSpecies: "Forretress",
  },
  dunsparce: {
    level: 86,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Body Slam", "Coil", "Earthquake", "Roost"],
        abilities: ["Serene Grace"],
        teraTypes: ["Ghost", "Ground"],
      },
    ],
    baseSpecies: "Dunsparce",
  },
  granbull: {
    level: 88,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Earthquake", "Encore", "Play Rough", "Thunder Wave"],
        abilities: ["Intimidate"],
        teraTypes: ["Ground"],
      },
      {
        role: "Bulky Support",
        movepool: ["Earthquake", "Play Rough", "Roar", "Thunder Wave"],
        abilities: ["Intimidate"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Granbull",
  },
  qwilfish: {
    level: 86,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Destiny Bond",
          "Gunk Shot",
          "Spikes",
          "Taunt",
          "Thunder Wave",
          "Toxic Spikes",
          "Waterfall",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Dark", "Grass"],
      },
      {
        role: "Fast Support",
        movepool: [
          "Flip Turn",
          "Gunk Shot",
          "Pain Split",
          "Thunder Wave",
          "Toxic",
          "Toxic Spikes",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Dark", "Grass"],
      },
    ],
    baseSpecies: "Qwilfish",
  },
  qwilfishhisui: {
    level: 83,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Crunch", "Gunk Shot", "Spikes", "Taunt", "Toxic Spikes"],
        abilities: ["Intimidate"],
        teraTypes: ["Flying", "Poison"],
      },
    ],
    baseSpecies: "Qwilfish",
  },
  overqwil: {
    level: 82,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Aqua Jet",
          "Crunch",
          "Gunk Shot",
          "Liquidation",
          "Swords Dance",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Crunch", "Gunk Shot", "Scale Shot", "Swords Dance"],
        abilities: ["Intimidate"],
        teraTypes: ["Dragon"],
      },
    ],
    baseSpecies: "Overqwil",
  },
  scizor: {
    level: 79,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Bullet Punch",
          "Close Combat",
          "Defog",
          "Knock Off",
          "U-turn",
        ],
        abilities: ["Technician"],
        teraTypes: ["Dragon", "Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Bug Bite",
          "Bullet Punch",
          "Close Combat",
          "Knock Off",
          "Swords Dance",
        ],
        abilities: ["Technician"],
        teraTypes: ["Steel"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Bullet Punch", "Close Combat", "Knock Off", "U-turn"],
        abilities: ["Technician"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Scizor",
  },
  heracross: {
    level: 80,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Close Combat", "Facade", "Knock Off", "Trailblaze"],
        abilities: ["Guts"],
        teraTypes: ["Normal"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Earthquake",
          "Knock Off",
          "Megahorn",
          "Stone Edge",
        ],
        abilities: ["Moxie"],
        teraTypes: ["Bug", "Fighting", "Rock"],
      },
    ],
    baseSpecies: "Heracross",
  },
  ursaring: {
    level: 84,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Slam",
          "Earthquake",
          "Rest",
          "Sleep Talk",
          "Throat Chop",
        ],
        abilities: ["Guts"],
        teraTypes: ["Ghost", "Ground"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Close Combat",
          "Crunch",
          "Facade",
          "Swords Dance",
          "Throat Chop",
        ],
        abilities: ["Quick Feet"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Ursaring",
  },
  magcargo: {
    level: 95,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Earth Power", "Fire Blast", "Power Gem", "Shell Smash"],
        abilities: ["Weak Armor"],
        teraTypes: ["Dragon", "Grass"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Lava Plume",
          "Power Gem",
          "Recover",
          "Stealth Rock",
          "Yawn",
        ],
        abilities: ["Flame Body"],
        teraTypes: ["Dragon", "Grass"],
      },
    ],
    baseSpecies: "Magcargo",
  },
  piloswine: {
    level: 85,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Ice Shard",
          "Icicle Crash",
          "Roar",
          "Stealth Rock",
        ],
        abilities: ["Thick Fat"],
        teraTypes: ["Dragon", "Poison"],
      },
    ],
    baseSpecies: "Piloswine",
  },
  delibird: {
    level: 100,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Brave Bird",
          "Drill Run",
          "Ice Shard",
          "Ice Spinner",
          "Spikes",
        ],
        abilities: ["Hustle"],
        teraTypes: ["Flying", "Ground", "Ice"],
      },
      {
        role: "Fast Support",
        movepool: ["Brave Bird", "Freeze-Dry", "Rapid Spin", "Spikes"],
        abilities: ["Insomnia", "Vital Spirit"],
        teraTypes: ["Ghost"],
      },
    ],
    baseSpecies: "Delibird",
  },
  skarmory: {
    level: 80,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Body Press", "Brave Bird", "Iron Defense", "Roost"],
        abilities: ["Sturdy"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Press",
          "Brave Bird",
          "Roost",
          "Spikes",
          "Stealth Rock",
        ],
        abilities: ["Sturdy"],
        teraTypes: ["Dragon", "Fighting"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Brave Bird",
          "Roost",
          "Spikes",
          "Stealth Rock",
          "Whirlwind",
        ],
        abilities: ["Sturdy"],
        teraTypes: ["Dragon"],
      },
    ],
    baseSpecies: "Skarmory",
  },
  houndoom: {
    level: 87,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Dark Pulse",
          "Fire Blast",
          "Nasty Plot",
          "Sludge Bomb",
          "Sucker Punch",
        ],
        abilities: ["Flash Fire"],
        teraTypes: ["Dark", "Fire", "Poison"],
      },
    ],
    baseSpecies: "Houndoom",
  },
  kingdra: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Draco Meteor", "Hurricane", "Rain Dance", "Wave Crash"],
        abilities: ["Swift Swim"],
        teraTypes: ["Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Dragon Dance", "Outrage", "Waterfall", "Wave Crash"],
        abilities: ["Sniper", "Swift Swim"],
        teraTypes: ["Water"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Dragon Dance", "Iron Head", "Outrage", "Wave Crash"],
        abilities: ["Sniper", "Swift Swim"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Kingdra",
  },
  donphan: {
    level: 84,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Ice Shard",
          "Ice Spinner",
          "Knock Off",
          "Rapid Spin",
          "Stealth Rock",
        ],
        abilities: ["Sturdy"],
        teraTypes: ["Dragon", "Steel", "Water"],
      },
    ],
    baseSpecies: "Donphan",
  },
  porygon2: {
    level: 81,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Discharge", "Ice Beam", "Recover", "Tri Attack"],
        abilities: ["Download"],
        teraTypes: ["Electric", "Ghost", "Poison"],
      },
    ],
    baseSpecies: "Porygon2",
  },
  smeargle: {
    level: 95,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Ceaseless Edge",
          "Spore",
          "Stealth Rock",
          "Sticky Web",
          "Whirlwind",
        ],
        abilities: ["Own Tempo"],
        teraTypes: ["Ghost"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Population Bomb", "Power Trip", "Shell Smash", "Spore"],
        abilities: ["Technician"],
        teraTypes: ["Ghost", "Normal"],
      },
    ],
    baseSpecies: "Smeargle",
  },
  hitmontop: {
    level: 88,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Close Combat",
          "Earthquake",
          "Rapid Spin",
          "Stone Edge",
          "Sucker Punch",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Bulk Up", "Close Combat", "Rapid Spin", "Triple Axel"],
        abilities: ["Technician"],
        teraTypes: ["Ice"],
      },
    ],
    baseSpecies: "Hitmontop",
  },
  chansey: {
    level: 85,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Heal Bell",
          "Seismic Toss",
          "Soft-Boiled",
          "Stealth Rock",
          "Thunder Wave",
        ],
        abilities: ["Natural Cure"],
        teraTypes: ["Fairy", "Ghost", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Chansey",
  },
  blissey: {
    level: 85,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Heal Bell",
          "Seismic Toss",
          "Soft-Boiled",
          "Stealth Rock",
          "Thunder Wave",
        ],
        abilities: ["Natural Cure"],
        teraTypes: ["Fairy", "Ghost", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Blissey",
  },
  raikou: {
    level: 81,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Scald", "Substitute", "Thunderbolt"],
        abilities: ["Pressure"],
        teraTypes: ["Grass", "Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Calm Mind",
          "Scald",
          "Shadow Ball",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Electric", "Water"],
      },
    ],
    baseSpecies: "Raikou",
  },
  entei: {
    level: 78,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Extreme Speed",
          "Flare Blitz",
          "Sacred Fire",
          "Stomping Tantrum",
        ],
        abilities: ["Inner Focus"],
        teraTypes: ["Fire", "Normal"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Extreme Speed", "Flare Blitz", "Sacred Fire", "Stone Edge"],
        abilities: ["Inner Focus"],
        teraTypes: ["Fire", "Normal"],
      },
    ],
    baseSpecies: "Entei",
  },
  suicune: {
    level: 82,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Calm Mind", "Rest", "Scald", "Sleep Talk"],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Ice Beam", "Scald", "Substitute"],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Steel"],
      },
      {
        role: "Fast Support",
        movepool: ["Calm Mind", "Protect", "Scald", "Substitute"],
        abilities: ["Pressure"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Suicune",
  },
  tyranitar: {
    level: 79,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Dragon Dance",
          "Earthquake",
          "Ice Punch",
          "Knock Off",
          "Stone Edge",
        ],
        abilities: ["Sand Stream"],
        teraTypes: ["Ghost", "Rock"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Dragon Tail",
          "Earthquake",
          "Ice Beam",
          "Knock Off",
          "Stealth Rock",
          "Stone Edge",
          "Thunder Wave",
        ],
        abilities: ["Sand Stream"],
        teraTypes: ["Ghost", "Rock"],
      },
    ],
    baseSpecies: "Tyranitar",
  },
  lugia: {
    level: 73,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Aeroblast", "Calm Mind", "Earth Power", "Recover"],
        abilities: ["Multiscale"],
        teraTypes: ["Ground", "Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Aeroblast", "Calm Mind", "Psychic Noise", "Recover"],
        abilities: ["Multiscale"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Lugia",
  },
  hooh: {
    level: 71,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Brave Bird", "Earthquake", "Recover", "Sacred Fire"],
        abilities: ["Regenerator"],
        teraTypes: ["Ground", "Steel"],
      },
    ],
    baseSpecies: "Ho-Oh",
  },
  sceptile: {
    level: 87,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Earthquake",
          "Focus Blast",
          "Giga Drain",
          "Leaf Storm",
          "Rock Slide",
          "Shed Tail",
        ],
        abilities: ["Overgrow"],
        teraTypes: ["Grass", "Ground", "Steel"],
      },
      {
        role: "Fast Support",
        movepool: ["Focus Blast", "Giga Drain", "Leech Seed", "Substitute"],
        abilities: ["Overgrow"],
        teraTypes: ["Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Earthquake", "Leaf Blade", "Rock Slide", "Swords Dance"],
        abilities: ["Overgrow"],
        teraTypes: ["Rock"],
      },
    ],
    baseSpecies: "Sceptile",
  },
  blaziken: {
    level: 76,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Close Combat",
          "Flare Blitz",
          "Knock Off",
          "Protect",
          "Stone Edge",
          "Swords Dance",
        ],
        abilities: ["Speed Boost"],
        teraTypes: ["Dark", "Fighting"],
      },
    ],
    baseSpecies: "Blaziken",
  },
  swampert: {
    level: 83,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Flip Turn",
          "Ice Beam",
          "Knock Off",
          "Roar",
          "Stealth Rock",
          "Yawn",
        ],
        abilities: ["Damp", "Torrent"],
        teraTypes: ["Poison", "Steel"],
      },
    ],
    baseSpecies: "Swampert",
  },
  mightyena: {
    level: 95,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Crunch",
          "Play Rough",
          "Poison Fang",
          "Sucker Punch",
          "Taunt",
          "Throat Chop",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Fairy", "Poison"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Crunch",
          "Play Rough",
          "Poison Fang",
          "Sucker Punch",
          "Super Fang",
          "Throat Chop",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Fairy", "Poison"],
      },
    ],
    baseSpecies: "Mightyena",
  },
  ludicolo: {
    level: 90,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Giga Drain", "Hydro Pump", "Ice Beam", "Rain Dance"],
        abilities: ["Swift Swim"],
        teraTypes: ["Grass", "Steel", "Water"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Giga Drain", "Hydro Pump", "Ice Beam", "Leaf Storm"],
        abilities: ["Swift Swim"],
        teraTypes: ["Grass", "Water"],
      },
    ],
    baseSpecies: "Ludicolo",
  },
  shiftry: {
    level: 89,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Defog",
          "Knock Off",
          "Leaf Storm",
          "Sucker Punch",
          "Will-O-Wisp",
        ],
        abilities: ["Wind Rider"],
        teraTypes: ["Dark", "Poison"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Knock Off", "Leaf Blade", "Sucker Punch", "Swords Dance"],
        abilities: ["Wind Rider"],
        teraTypes: ["Dark", "Poison"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Knock Off", "Leaf Blade", "Low Kick", "Tailwind"],
        abilities: ["Wind Rider"],
        teraTypes: ["Dark", "Fighting"],
      },
    ],
    baseSpecies: "Shiftry",
  },
  pelipper: {
    level: 86,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Hurricane",
          "Hydro Pump",
          "Knock Off",
          "Roost",
          "Surf",
          "U-turn",
        ],
        abilities: ["Drizzle"],
        teraTypes: ["Ground", "Water"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Hurricane", "Hydro Pump", "U-turn", "Weather Ball"],
        abilities: ["Drizzle"],
        teraTypes: ["Flying", "Water"],
      },
    ],
    baseSpecies: "Pelipper",
  },
  gardevoir: {
    level: 83,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Calm Mind",
          "Focus Blast",
          "Healing Wish",
          "Moonblast",
          "Mystical Fire",
          "Psychic",
          "Psyshock",
          "Trick",
        ],
        abilities: ["Trace"],
        teraTypes: ["Fairy", "Fighting", "Fire"],
      },
    ],
    baseSpecies: "Gardevoir",
  },
  masquerain: {
    level: 87,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Bug Buzz", "Hurricane", "Hydro Pump", "Quiver Dance"],
        abilities: ["Intimidate"],
        teraTypes: ["Water"],
      },
      {
        role: "Fast Support",
        movepool: [
          "Bug Buzz",
          "Hurricane",
          "Hydro Pump",
          "Sticky Web",
          "Stun Spore",
          "U-turn",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Ground", "Steel", "Water"],
      },
    ],
    baseSpecies: "Masquerain",
  },
  breloom: {
    level: 82,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Bullet Seed",
          "Mach Punch",
          "Rock Tomb",
          "Spore",
          "Swords Dance",
        ],
        abilities: ["Technician"],
        teraTypes: ["Fighting", "Rock"],
      },
    ],
    baseSpecies: "Breloom",
  },
  vigoroth: {
    level: 85,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Body Slam", "Bulk Up", "Knock Off", "Slack Off"],
        abilities: ["Vital Spirit"],
        teraTypes: ["Ghost"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Body Slam", "Bulk Up", "Earthquake", "Slack Off"],
        abilities: ["Vital Spirit"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Vigoroth",
  },
  slaking: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Double-Edge", "Earthquake", "Giga Impact", "Knock Off"],
        abilities: ["Truant"],
        teraTypes: ["Ghost", "Ground", "Normal"],
      },
    ],
    baseSpecies: "Slaking",
  },
  hariyama: {
    level: 87,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Bullet Punch",
          "Close Combat",
          "Facade",
          "Fake Out",
          "Headlong Rush",
          "Knock Off",
        ],
        abilities: ["Guts"],
        teraTypes: ["Normal"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Bullet Punch",
          "Close Combat",
          "Headlong Rush",
          "Heavy Slam",
          "Knock Off",
          "Stone Edge",
        ],
        abilities: ["Thick Fat"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Hariyama",
  },
  sableye: {
    level: 88,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Encore",
          "Knock Off",
          "Recover",
          "Thunder Wave",
          "Will-O-Wisp",
        ],
        abilities: ["Prankster"],
        teraTypes: ["Poison", "Steel"],
      },
    ],
    baseSpecies: "Sableye",
  },
  medicham: {
    level: 86,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Bullet Punch",
          "Close Combat",
          "Ice Punch",
          "Poison Jab",
          "Zen Headbutt",
        ],
        abilities: ["Pure Power"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Medicham",
  },
  plusle: {
    level: 95,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Alluring Voice",
          "Encore",
          "Grass Knot",
          "Nasty Plot",
          "Thunderbolt",
        ],
        abilities: ["Lightning Rod"],
        teraTypes: ["Electric", "Fairy", "Grass"],
      },
    ],
    baseSpecies: "Plusle",
  },
  minun: {
    level: 95,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Alluring Voice",
          "Encore",
          "Grass Knot",
          "Nasty Plot",
          "Thunderbolt",
        ],
        abilities: ["Volt Absorb"],
        teraTypes: ["Electric", "Fairy", "Grass"],
      },
    ],
    baseSpecies: "Minun",
  },
  volbeat: {
    level: 90,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Encore", "Roost", "Thunder Wave", "U-turn"],
        abilities: ["Prankster"],
        teraTypes: ["Steel", "Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Encore", "Lunge", "Roost", "Thunder Wave"],
        abilities: ["Prankster"],
        teraTypes: ["Steel", "Water"],
      },
    ],
    baseSpecies: "Volbeat",
  },
  illumise: {
    level: 91,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Bug Buzz", "Encore", "Roost", "Thunder Wave"],
        abilities: ["Prankster"],
        teraTypes: ["Steel", "Water"],
      },
    ],
    baseSpecies: "Illumise",
  },
  swalot: {
    level: 90,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Clear Smog",
          "Earthquake",
          "Encore",
          "Ice Beam",
          "Knock Off",
          "Pain Split",
          "Sludge Bomb",
          "Toxic Spikes",
        ],
        abilities: ["Liquid Ooze"],
        teraTypes: ["Dark"],
      },
      {
        role: "Bulky Support",
        movepool: ["Earthquake", "Protect", "Sludge Bomb", "Toxic"],
        abilities: ["Liquid Ooze"],
        teraTypes: ["Ground"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Earthquake", "Gunk Shot", "Knock Off", "Swords Dance"],
        abilities: ["Liquid Ooze"],
        teraTypes: ["Dark", "Ground"],
      },
    ],
    baseSpecies: "Swalot",
  },
  camerupt: {
    level: 91,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Overheat",
          "Roar",
          "Stealth Rock",
          "Will-O-Wisp",
        ],
        abilities: ["Solid Rock"],
        teraTypes: ["Grass", "Water"],
      },
    ],
    baseSpecies: "Camerupt",
  },
  torkoal: {
    level: 88,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Earthquake",
          "Lava Plume",
          "Rapid Spin",
          "Solar Beam",
          "Stealth Rock",
          "Yawn",
        ],
        abilities: ["Drought"],
        teraTypes: ["Grass"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Lava Plume",
          "Rapid Spin",
          "Solar Beam",
          "Stealth Rock",
          "Yawn",
        ],
        abilities: ["Drought"],
        teraTypes: ["Dragon", "Grass"],
      },
    ],
    baseSpecies: "Torkoal",
  },
  grumpig: {
    level: 92,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Dazzling Gleam",
          "Earth Power",
          "Nasty Plot",
          "Psychic",
          "Psyshock",
          "Shadow Ball",
        ],
        abilities: ["Thick Fat"],
        teraTypes: ["Fairy", "Ghost", "Ground", "Psychic"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Earth Power",
          "Focus Blast",
          "Psychic",
          "Psyshock",
          "Shadow Ball",
          "Trick",
        ],
        abilities: ["Thick Fat"],
        teraTypes: ["Fighting", "Ghost", "Ground", "Psychic"],
      },
    ],
    baseSpecies: "Grumpig",
  },
  flygon: {
    level: 82,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Dragon Dance",
          "Earthquake",
          "Outrage",
          "Stone Edge",
          "U-turn",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Ground", "Rock", "Steel"],
      },
    ],
    baseSpecies: "Flygon",
  },
  cacturne: {
    level: 92,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Focus Blast",
          "Knock Off",
          "Leaf Storm",
          "Spikes",
          "Sucker Punch",
          "Toxic Spikes",
        ],
        abilities: ["Water Absorb"],
        teraTypes: ["Dark", "Grass", "Poison"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Drain Punch",
          "Knock Off",
          "Seed Bomb",
          "Sucker Punch",
          "Swords Dance",
        ],
        abilities: ["Water Absorb"],
        teraTypes: ["Dark", "Poison"],
      },
    ],
    baseSpecies: "Cacturne",
  },
  altaria: {
    level: 89,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Brave Bird",
          "Defog",
          "Earthquake",
          "Haze",
          "Roost",
          "Will-O-Wisp",
        ],
        abilities: ["Natural Cure"],
        teraTypes: ["Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Brave Bird", "Dragon Dance", "Earthquake", "Roost"],
        abilities: ["Natural Cure"],
        teraTypes: ["Ground", "Steel"],
      },
    ],
    baseSpecies: "Altaria",
  },
  zangoose: {
    level: 85,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Facade",
          "Knock Off",
          "Quick Attack",
          "Swords Dance",
        ],
        abilities: ["Toxic Boost"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Zangoose",
  },
  seviper: {
    level: 93,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Earthquake",
          "Flamethrower",
          "Giga Drain",
          "Glare",
          "Gunk Shot",
          "Knock Off",
          "Switcheroo",
        ],
        abilities: ["Infiltrator"],
        teraTypes: ["Dark", "Fire", "Grass", "Ground", "Poison"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Earthquake", "Gunk Shot", "Swords Dance", "Trailblaze"],
        abilities: ["Infiltrator"],
        teraTypes: ["Grass", "Ground"],
      },
    ],
    baseSpecies: "Seviper",
  },
  whiscash: {
    level: 88,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Hydro Pump",
          "Ice Beam",
          "Spikes",
          "Stealth Rock",
        ],
        abilities: ["Oblivious"],
        teraTypes: ["Ghost", "Poison", "Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Dragon Dance", "Earthquake", "Liquidation", "Stone Edge"],
        abilities: ["Oblivious"],
        teraTypes: ["Ground", "Steel"],
      },
    ],
    baseSpecies: "Whiscash",
  },
  crawdaunt: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Aqua Jet",
          "Close Combat",
          "Crabhammer",
          "Dragon Dance",
          "Knock Off",
        ],
        abilities: ["Adaptability"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Aqua Jet", "Crabhammer", "Dragon Dance", "Knock Off"],
        abilities: ["Adaptability"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Crawdaunt",
  },
  milotic: {
    level: 83,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Dragon Tail", "Haze", "Ice Beam", "Recover", "Scald"],
        abilities: ["Competitive"],
        teraTypes: ["Dragon", "Steel"],
      },
    ],
    baseSpecies: "Milotic",
  },
  banette: {
    level: 93,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Gunk Shot",
          "Poltergeist",
          "Shadow Sneak",
          "Swords Dance",
          "Thunder Wave",
        ],
        abilities: ["Cursed Body", "Frisk"],
        teraTypes: ["Ghost", "Poison"],
      },
    ],
    baseSpecies: "Banette",
  },
  tropius: {
    level: 91,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Air Slash", "Leech Seed", "Protect", "Substitute"],
        abilities: ["Harvest"],
        teraTypes: ["Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Dragon Dance",
          "Dual Wingbeat",
          "Earthquake",
          "Leaf Blade",
          "Synthesis",
        ],
        abilities: ["Harvest"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Tropius",
  },
  chimecho: {
    level: 93,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Encore",
          "Heal Bell",
          "Knock Off",
          "Psychic Noise",
          "Recover",
          "Thunder Wave",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Dark", "Electric", "Poison", "Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Dazzling Gleam",
          "Psychic Noise",
          "Psyshock",
          "Recover",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Fairy", "Poison", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Cosmic Power", "Dazzling Gleam", "Recover", "Stored Power"],
        abilities: ["Levitate"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Chimecho",
  },
  glalie: {
    level: 96,
    sets: [
      {
        role: "Fast Support",
        movepool: ["Disable", "Earthquake", "Freeze-Dry", "Spikes", "Taunt"],
        abilities: ["Inner Focus"],
        teraTypes: ["Ghost", "Ground", "Water"],
      },
    ],
    baseSpecies: "Glalie",
  },
  luvdisc: {
    level: 100,
    sets: [
      {
        role: "Fast Support",
        movepool: ["Endeavor", "Substitute", "Surf", "Whirlpool"],
        abilities: ["Swift Swim"],
        teraTypes: ["Ghost", "Ground"],
      },
    ],
    baseSpecies: "Luvdisc",
  },
  salamence: {
    level: 77,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Dragon Dance",
          "Dual Wingbeat",
          "Earthquake",
          "Outrage",
          "Roost",
        ],
        abilities: ["Intimidate", "Moxie"],
        teraTypes: ["Dragon", "Ground", "Steel"],
      },
    ],
    baseSpecies: "Salamence",
  },
  metagross: {
    level: 79,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Agility",
          "Earthquake",
          "Heavy Slam",
          "Knock Off",
          "Psychic Fangs",
        ],
        abilities: ["Clear Body"],
        teraTypes: ["Ground"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Bullet Punch",
          "Earthquake",
          "Heavy Slam",
          "Knock Off",
          "Psychic Fangs",
          "Stealth Rock",
        ],
        abilities: ["Clear Body"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Metagross",
  },
  regirock: {
    level: 83,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Press",
          "Iron Defense",
          "Stealth Rock",
          "Stone Edge",
          "Thunder Wave",
        ],
        abilities: ["Clear Body"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Body Press", "Curse", "Iron Defense", "Rest", "Stone Edge"],
        abilities: ["Clear Body"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Regirock",
  },
  regice: {
    level: 88,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Press",
          "Ice Beam",
          "Rest",
          "Sleep Talk",
          "Thunder Wave",
          "Thunderbolt",
        ],
        abilities: ["Clear Body"],
        teraTypes: ["Electric"],
      },
    ],
    baseSpecies: "Regice",
  },
  registeel: {
    level: 81,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Body Press", "Iron Defense", "Iron Head", "Rest"],
        abilities: ["Clear Body"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Body Press",
          "Iron Defense",
          "Iron Head",
          "Stealth Rock",
          "Thunder Wave",
        ],
        abilities: ["Clear Body"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Registeel",
  },
  latias: {
    level: 79,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: ["Calm Mind", "Draco Meteor", "Psyshock", "Recover"],
        abilities: ["Levitate"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Latias",
  },
  latios: {
    level: 78,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Draco Meteor", "Psyshock", "Recover"],
        abilities: ["Levitate"],
        teraTypes: ["Steel"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Aura Sphere",
          "Calm Mind",
          "Draco Meteor",
          "Flip Turn",
          "Luster Purge",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Dragon", "Psychic", "Steel"],
      },
    ],
    baseSpecies: "Latios",
  },
  kyogre: {
    level: 71,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Ice Beam", "Origin Pulse", "Thunder", "Water Spout"],
        abilities: ["Drizzle"],
        teraTypes: ["Water"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Ice Beam", "Origin Pulse", "Thunder"],
        abilities: ["Drizzle"],
        teraTypes: ["Dragon", "Electric", "Steel"],
      },
    ],
    baseSpecies: "Kyogre",
  },
  groudon: {
    level: 72,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Heat Crash",
          "Precipice Blades",
          "Roar",
          "Spikes",
          "Stealth Rock",
          "Stone Edge",
          "Thunder Wave",
          "Will-O-Wisp",
        ],
        abilities: ["Drought"],
        teraTypes: ["Fire"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Heat Crash",
          "Precipice Blades",
          "Stone Edge",
          "Swords Dance",
          "Thunder Wave",
        ],
        abilities: ["Drought"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Groudon",
  },
  rayquaza: {
    level: 72,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Dragon Ascent", "Dragon Dance", "Earthquake", "Outrage"],
        abilities: ["Air Lock"],
        teraTypes: ["Flying", "Steel"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Dragon Ascent",
          "Earthquake",
          "Extreme Speed",
          "Swords Dance",
          "U-turn",
        ],
        abilities: ["Air Lock"],
        teraTypes: ["Normal"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Dragon Ascent", "Earthquake", "Scale Shot", "Swords Dance"],
        abilities: ["Air Lock"],
        teraTypes: ["Dragon", "Flying", "Steel"],
      },
    ],
    baseSpecies: "Rayquaza",
  },
  jirachi: {
    level: 80,
    sets: [
      {
        role: "Fast Support",
        movepool: ["Body Slam", "Iron Head", "Protect", "Wish"],
        abilities: ["Serene Grace"],
        teraTypes: ["Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Slam",
          "Drain Punch",
          "Iron Head",
          "Stealth Rock",
          "U-turn",
        ],
        abilities: ["Serene Grace"],
        teraTypes: ["Fighting", "Water"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Healing Wish",
          "Iron Head",
          "Protect",
          "Psychic",
          "U-turn",
          "Wish",
        ],
        abilities: ["Serene Grace"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Jirachi",
  },
  deoxys: {
    level: 74,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Extreme Speed", "Knock Off", "Psycho Boost", "Superpower"],
        abilities: ["Pressure"],
        teraTypes: ["Dark", "Fighting", "Normal", "Psychic"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Ice Beam", "Knock Off", "Psycho Boost", "Superpower"],
        abilities: ["Pressure"],
        teraTypes: ["Dark", "Fighting", "Psychic"],
      },
    ],
    baseSpecies: "Deoxys",
  },
  deoxysattack: {
    level: 72,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Extreme Speed", "Knock Off", "Psycho Boost", "Superpower"],
        abilities: ["Pressure"],
        teraTypes: ["Dark", "Fighting", "Normal", "Psychic"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Ice Beam", "Knock Off", "Psycho Boost", "Superpower"],
        abilities: ["Pressure"],
        teraTypes: ["Dark", "Fighting", "Psychic"],
      },
    ],
    baseSpecies: "Deoxys",
  },
  deoxysdefense: {
    level: 84,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Cosmic Power", "Night Shade", "Recover", "Stored Power"],
        abilities: ["Pressure"],
        teraTypes: ["Steel"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Knock Off",
          "Psychic Noise",
          "Recover",
          "Spikes",
          "Stealth Rock",
          "Teleport",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Dark", "Fairy", "Steel"],
      },
    ],
    baseSpecies: "Deoxys",
  },
  deoxysspeed: {
    level: 82,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Knock Off",
          "Psycho Boost",
          "Spikes",
          "Stealth Rock",
          "Superpower",
          "Taunt",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Dark", "Fighting", "Ghost", "Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Dark Pulse", "Focus Blast", "Nasty Plot", "Psycho Boost"],
        abilities: ["Pressure"],
        teraTypes: ["Dark", "Fighting", "Psychic"],
      },
    ],
    baseSpecies: "Deoxys",
  },
  torterra: {
    level: 78,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Bullet Seed", "Headlong Rush", "Rock Blast", "Shell Smash"],
        abilities: ["Overgrow"],
        teraTypes: ["Grass", "Ground", "Rock", "Water"],
      },
    ],
    baseSpecies: "Torterra",
  },
  infernape: {
    level: 82,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Grass Knot",
          "Gunk Shot",
          "Knock Off",
          "Mach Punch",
          "Overheat",
          "Stone Edge",
        ],
        abilities: ["Blaze", "Iron Fist"],
        teraTypes: ["Dark", "Fighting", "Fire"],
      },
      {
        role: "Fast Support",
        movepool: [
          "Close Combat",
          "Flare Blitz",
          "Gunk Shot",
          "Knock Off",
          "Mach Punch",
          "Stone Edge",
          "Swords Dance",
          "U-turn",
        ],
        abilities: ["Blaze", "Iron Fist"],
        teraTypes: ["Dark", "Fighting", "Fire"],
      },
    ],
    baseSpecies: "Infernape",
  },
  empoleon: {
    level: 84,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Flip Turn",
          "Ice Beam",
          "Knock Off",
          "Roar",
          "Roost",
          "Stealth Rock",
          "Surf",
          "Yawn",
        ],
        abilities: ["Competitive"],
        teraTypes: ["Flying", "Grass"],
      },
    ],
    baseSpecies: "Empoleon",
  },
  staraptor: {
    level: 79,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Brave Bird",
          "Close Combat",
          "Double-Edge",
          "Quick Attack",
          "U-turn",
        ],
        abilities: ["Reckless"],
        teraTypes: ["Fighting", "Flying"],
      },
    ],
    baseSpecies: "Staraptor",
  },
  kricketune: {
    level: 99,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Knock Off",
          "Pounce",
          "Sticky Web",
          "Swords Dance",
          "Taunt",
        ],
        abilities: ["Technician"],
        teraTypes: ["Ghost"],
      },
    ],
    baseSpecies: "Kricketune",
  },
  luxray: {
    level: 88,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Facade",
          "Play Rough",
          "Supercell Slam",
          "Throat Chop",
          "Trailblaze",
        ],
        abilities: ["Guts"],
        teraTypes: ["Normal"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Ice Fang",
          "Play Rough",
          "Throat Chop",
          "Volt Switch",
          "Wild Charge",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Electric", "Fairy"],
      },
    ],
    baseSpecies: "Luxray",
  },
  rampardos: {
    level: 90,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Earthquake", "Fire Punch", "Head Smash", "Rock Slide"],
        abilities: ["Sheer Force"],
        teraTypes: ["Ground", "Rock"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Earthquake", "Fire Punch", "Rock Slide", "Zen Headbutt"],
        abilities: ["Sheer Force"],
        teraTypes: ["Psychic", "Rock"],
      },
    ],
    baseSpecies: "Rampardos",
  },
  bastiodon: {
    level: 89,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Body Press", "Foul Play", "Iron Defense", "Rest"],
        abilities: ["Soundproof"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Bastiodon",
  },
  vespiquen: {
    level: 99,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Air Slash",
          "Hurricane",
          "Roost",
          "Spikes",
          "Toxic",
          "Toxic Spikes",
          "U-turn",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Vespiquen",
  },
  pachirisu: {
    level: 96,
    sets: [
      {
        role: "AV Pivot",
        movepool: ["Nuzzle", "Super Fang", "Thunderbolt", "U-turn"],
        abilities: ["Volt Absorb"],
        teraTypes: ["Flying"],
      },
      {
        role: "Fast Support",
        movepool: ["Discharge", "Encore", "Super Fang", "U-turn"],
        abilities: ["Volt Absorb"],
        teraTypes: ["Flying"],
      },
    ],
    baseSpecies: "Pachirisu",
  },
  floatzel: {
    level: 85,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Crunch", "Flip Turn", "Ice Spinner", "Wave Crash"],
        abilities: ["Water Veil"],
        teraTypes: ["Water"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Bulk Up", "Ice Spinner", "Taunt", "Wave Crash"],
        abilities: ["Water Veil"],
        teraTypes: ["Steel", "Water"],
      },
    ],
    baseSpecies: "Floatzel",
  },
  gastrodon: {
    level: 86,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Clear Smog",
          "Earthquake",
          "Ice Beam",
          "Recover",
          "Spikes",
          "Stealth Rock",
          "Surf",
        ],
        abilities: ["Storm Drain"],
        teraTypes: ["Poison", "Steel"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Recover",
          "Sludge Bomb",
          "Stealth Rock",
          "Surf",
        ],
        abilities: ["Storm Drain"],
        teraTypes: ["Poison"],
      },
    ],
    baseSpecies: "Gastrodon",
  },
  ambipom: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Double-Edge",
          "Knock Off",
          "Low Kick",
          "Triple Axel",
          "U-turn",
        ],
        abilities: ["Technician"],
        teraTypes: ["Ice"],
      },
      {
        role: "Wallbreaker",
        movepool: [
          "Double-Edge",
          "Fake Out",
          "Knock Off",
          "Low Kick",
          "U-turn",
        ],
        abilities: ["Technician"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Ambipom",
  },
  drifblim: {
    level: 86,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Air Slash",
          "Calm Mind",
          "Defog",
          "Shadow Ball",
          "Strength Sap",
        ],
        abilities: ["Aftermath", "Unburden"],
        teraTypes: ["Fairy", "Ghost"],
      },
    ],
    baseSpecies: "Drifblim",
  },
  mismagius: {
    level: 86,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Dazzling Gleam",
          "Energy Ball",
          "Mystical Fire",
          "Shadow Ball",
          "Thunderbolt",
          "Trick",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Fairy", "Fire", "Ghost"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Dazzling Gleam",
          "Mystical Fire",
          "Nasty Plot",
          "Shadow Ball",
          "Substitute",
          "Thunderbolt",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Fairy"],
      },
    ],
    baseSpecies: "Mismagius",
  },
  honchkrow: {
    level: 86,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Brave Bird", "Heat Wave", "Sucker Punch", "U-turn"],
        abilities: ["Moxie"],
        teraTypes: ["Dark", "Flying"],
      },
      {
        role: "Wallbreaker",
        movepool: [
          "Brave Bird",
          "Heat Wave",
          "Lash Out",
          "Sucker Punch",
          "Thunder Wave",
        ],
        abilities: ["Moxie"],
        teraTypes: ["Dark", "Flying"],
      },
    ],
    baseSpecies: "Honchkrow",
  },
  skuntank: {
    level: 84,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Fire Blast",
          "Gunk Shot",
          "Knock Off",
          "Sucker Punch",
          "Taunt",
          "Toxic Spikes",
        ],
        abilities: ["Aftermath"],
        teraTypes: ["Dark", "Poison"],
      },
    ],
    baseSpecies: "Skuntank",
  },
  bronzong: {
    level: 88,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Hypnosis",
          "Iron Head",
          "Psychic",
          "Psychic Noise",
          "Stealth Rock",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Water"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Body Press",
          "Iron Defense",
          "Iron Head",
          "Psychic Noise",
          "Rest",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Bronzong",
  },
  spiritomb: {
    level: 89,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Foul Play",
          "Pain Split",
          "Poltergeist",
          "Shadow Sneak",
          "Sucker Punch",
          "Toxic",
          "Will-O-Wisp",
        ],
        abilities: ["Infiltrator"],
        teraTypes: ["Ghost", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Spiritomb",
  },
  garchomp: {
    level: 74,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Dragon Tail",
          "Earthquake",
          "Outrage",
          "Spikes",
          "Stealth Rock",
        ],
        abilities: ["Rough Skin"],
        teraTypes: ["Ground", "Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Earthquake",
          "Fire Fang",
          "Iron Head",
          "Scale Shot",
          "Stone Edge",
          "Swords Dance",
        ],
        abilities: ["Rough Skin"],
        teraTypes: ["Fire", "Ground", "Steel"],
      },
    ],
    baseSpecies: "Garchomp",
  },
  lucario: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Extreme Speed",
          "Meteor Mash",
          "Stone Edge",
          "Swords Dance",
        ],
        abilities: ["Justified"],
        teraTypes: ["Normal"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Aura Sphere",
          "Flash Cannon",
          "Focus Blast",
          "Nasty Plot",
          "Vacuum Wave",
        ],
        abilities: ["Inner Focus"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Lucario",
  },
  hippowdon: {
    level: 82,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Slack Off",
          "Stealth Rock",
          "Stone Edge",
          "Whirlwind",
        ],
        abilities: ["Sand Stream"],
        teraTypes: ["Dragon", "Rock", "Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Curse", "Earthquake", "Slack Off", "Stone Edge"],
        abilities: ["Sand Stream"],
        teraTypes: ["Rock", "Steel"],
      },
    ],
    baseSpecies: "Hippowdon",
  },
  toxicroak: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Earthquake",
          "Gunk Shot",
          "Knock Off",
          "Sucker Punch",
          "Swords Dance",
        ],
        abilities: ["Dry Skin"],
        teraTypes: ["Dark"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Close Combat",
          "Earthquake",
          "Gunk Shot",
          "Sucker Punch",
          "Swords Dance",
        ],
        abilities: ["Dry Skin"],
        teraTypes: ["Dark", "Fighting", "Ground"],
      },
    ],
    baseSpecies: "Toxicroak",
  },
  lumineon: {
    level: 93,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Alluring Voice",
          "Encore",
          "Hydro Pump",
          "Ice Beam",
          "U-turn",
        ],
        abilities: ["Storm Drain"],
        teraTypes: ["Fairy", "Water"],
      },
    ],
    baseSpecies: "Lumineon",
  },
  abomasnow: {
    level: 85,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Aurora Veil",
          "Blizzard",
          "Earthquake",
          "Ice Shard",
          "Wood Hammer",
        ],
        abilities: ["Snow Warning"],
        teraTypes: ["Ice", "Water"],
      },
    ],
    baseSpecies: "Abomasnow",
  },
  weavile: {
    level: 79,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Ice Shard",
          "Knock Off",
          "Low Kick",
          "Swords Dance",
          "Triple Axel",
        ],
        abilities: ["Pickpocket"],
        teraTypes: ["Dark", "Fighting", "Ice"],
      },
    ],
    baseSpecies: "Weavile",
  },
  sneasler: {
    level: 74,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Close Combat", "Dire Claw", "Throat Chop", "U-turn"],
        abilities: ["Poison Touch"],
        teraTypes: ["Dark", "Fighting"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Acrobatics",
          "Close Combat",
          "Dire Claw",
          "Gunk Shot",
          "Swords Dance",
        ],
        abilities: ["Unburden"],
        teraTypes: ["Flying"],
      },
    ],
    baseSpecies: "Sneasler",
  },
  magnezone: {
    level: 85,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Body Press", "Flash Cannon", "Thunderbolt", "Volt Switch"],
        abilities: ["Magnet Pull"],
        teraTypes: ["Electric", "Fighting", "Flying", "Water"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Discharge",
          "Flash Cannon",
          "Mirror Coat",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Analytic", "Magnet Pull"],
        teraTypes: ["Flying", "Water"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Body Press",
          "Discharge",
          "Flash Cannon",
          "Iron Defense",
          "Thunderbolt",
        ],
        abilities: ["Magnet Pull"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Magnezone",
  },
  rhyperior: {
    level: 82,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Earthquake",
          "Ice Punch",
          "Megahorn",
          "Rock Polish",
          "Stone Edge",
        ],
        abilities: ["Solid Rock"],
        teraTypes: ["Bug", "Ground", "Rock"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Dragon Tail",
          "Earthquake",
          "Ice Punch",
          "Megahorn",
          "Stone Edge",
        ],
        abilities: ["Solid Rock"],
        teraTypes: ["Bug", "Dragon", "Grass", "Steel"],
      },
    ],
    baseSpecies: "Rhyperior",
  },
  electivire: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Earthquake",
          "Flamethrower",
          "Ice Punch",
          "Knock Off",
          "Supercell Slam",
          "Volt Switch",
        ],
        abilities: ["Motor Drive"],
        teraTypes: ["Dark", "Electric", "Ground"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Bulk Up", "Earthquake", "Ice Punch", "Supercell Slam"],
        abilities: ["Motor Drive"],
        teraTypes: ["Flying", "Ground"],
      },
    ],
    baseSpecies: "Electivire",
  },
  magmortar: {
    level: 88,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Fire Blast",
          "Focus Blast",
          "Knock Off",
          "Scorching Sands",
          "Taunt",
          "Thunderbolt",
        ],
        abilities: ["Flame Body"],
        teraTypes: ["Electric", "Fighting", "Water"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Earthquake",
          "Fire Blast",
          "Focus Blast",
          "Knock Off",
          "Thunderbolt",
          "Will-O-Wisp",
        ],
        abilities: ["Flame Body"],
        teraTypes: ["Electric", "Fighting", "Water"],
      },
    ],
    baseSpecies: "Magmortar",
  },
  yanmega: {
    level: 82,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Air Slash", "Bug Buzz", "Giga Drain", "U-turn"],
        abilities: ["Tinted Lens"],
        teraTypes: ["Bug"],
      },
    ],
    baseSpecies: "Yanmega",
  },
  leafeon: {
    level: 88,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Double-Edge",
          "Knock Off",
          "Leaf Blade",
          "Substitute",
          "Swords Dance",
          "Synthesis",
        ],
        abilities: ["Chlorophyll"],
        teraTypes: ["Dark", "Normal"],
      },
    ],
    baseSpecies: "Leafeon",
  },
  glaceon: {
    level: 94,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Freeze-Dry", "Protect", "Wish"],
        abilities: ["Ice Body"],
        teraTypes: ["Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Freeze-Dry", "Mud Shot", "Protect", "Wish"],
        abilities: ["Ice Body"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Glaceon",
  },
  gliscor: {
    level: 76,
    sets: [
      {
        role: "Fast Support",
        movepool: ["Earthquake", "Protect", "Substitute", "Toxic"],
        abilities: ["Poison Heal"],
        teraTypes: ["Water"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Knock Off",
          "Protect",
          "Toxic",
          "Toxic Spikes",
        ],
        abilities: ["Poison Heal"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Gliscor",
  },
  mamoswine: {
    level: 81,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Earthquake",
          "Ice Shard",
          "Icicle Crash",
          "Knock Off",
          "Stealth Rock",
        ],
        abilities: ["Thick Fat"],
        teraTypes: ["Ground", "Ice"],
      },
    ],
    baseSpecies: "Mamoswine",
  },
  porygonz: {
    level: 83,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Ice Beam",
          "Nasty Plot",
          "Shadow Ball",
          "Thunderbolt",
          "Tri Attack",
          "Trick",
        ],
        abilities: ["Adaptability", "Download"],
        teraTypes: ["Electric", "Ghost"],
      },
    ],
    baseSpecies: "Porygon-Z",
  },
  gallade: {
    level: 81,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Leaf Blade", "Night Slash", "Psycho Cut", "Sacred Sword"],
        abilities: ["Sharpness"],
        teraTypes: ["Dark", "Fighting", "Grass"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Agility", "Night Slash", "Psycho Cut", "Sacred Sword"],
        abilities: ["Sharpness"],
        teraTypes: ["Dark", "Fighting"],
      },
    ],
    baseSpecies: "Gallade",
  },
  probopass: {
    level: 92,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Body Press",
          "Flash Cannon",
          "Iron Defense",
          "Power Gem",
          "Rest",
          "Thunder Wave",
        ],
        abilities: ["Magnet Pull"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Probopass",
  },
  dusknoir: {
    level: 89,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Earthquake",
          "Leech Life",
          "Pain Split",
          "Poltergeist",
          "Shadow Sneak",
          "Trick",
        ],
        abilities: ["Frisk"],
        teraTypes: ["Ghost", "Ground"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Pain Split",
          "Poltergeist",
          "Shadow Sneak",
          "Will-O-Wisp",
        ],
        abilities: ["Frisk"],
        teraTypes: ["Dark", "Fairy"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Focus Punch", "Pain Split", "Poltergeist", "Substitute"],
        abilities: ["Frisk"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Dusknoir",
  },
  froslass: {
    level: 87,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Destiny Bond",
          "Poltergeist",
          "Spikes",
          "Taunt",
          "Triple Axel",
          "Will-O-Wisp",
        ],
        abilities: ["Cursed Body"],
        teraTypes: ["Ghost", "Ice"],
      },
    ],
    baseSpecies: "Froslass",
  },
  rotom: {
    level: 88,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Nasty Plot",
          "Shadow Ball",
          "Thunderbolt",
          "Trick",
          "Volt Switch",
          "Will-O-Wisp",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Ghost"],
      },
    ],
    baseSpecies: "Rotom",
  },
  rotomwash: {
    level: 83,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Hydro Pump",
          "Nasty Plot",
          "Pain Split",
          "Thunderbolt",
          "Trick",
          "Volt Switch",
          "Will-O-Wisp",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Water"],
      },
    ],
    baseSpecies: "Rotom",
  },
  rotomheat: {
    level: 83,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Nasty Plot",
          "Overheat",
          "Pain Split",
          "Thunderbolt",
          "Trick",
          "Volt Switch",
          "Will-O-Wisp",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Fire"],
      },
    ],
    baseSpecies: "Rotom",
  },
  rotomfrost: {
    level: 87,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Blizzard",
          "Nasty Plot",
          "Thunderbolt",
          "Volt Switch",
          "Will-O-Wisp",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric"],
      },
    ],
    baseSpecies: "Rotom",
  },
  rotomfan: {
    level: 86,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Air Slash",
          "Nasty Plot",
          "Thunderbolt",
          "Volt Switch",
          "Will-O-Wisp",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Steel"],
      },
    ],
    baseSpecies: "Rotom",
  },
  rotommow: {
    level: 87,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Leaf Storm",
          "Nasty Plot",
          "Thunderbolt",
          "Trick",
          "Volt Switch",
          "Will-O-Wisp",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Grass"],
      },
    ],
    baseSpecies: "Rotom",
  },
  uxie: {
    level: 83,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Encore",
          "Knock Off",
          "Psychic Noise",
          "Stealth Rock",
          "Thunder Wave",
          "U-turn",
          "Yawn",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Dark", "Electric", "Steel"],
      },
    ],
    baseSpecies: "Uxie",
  },
  mesprit: {
    level: 85,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Dazzling Gleam",
          "Ice Beam",
          "Nasty Plot",
          "Psychic",
          "Shadow Ball",
          "Thunderbolt",
          "Trick",
          "U-turn",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Fairy"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Encore",
          "Knock Off",
          "Psychic Noise",
          "Stealth Rock",
          "Thunder Wave",
          "U-turn",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Dark", "Electric", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Drain Punch",
          "Ice Beam",
          "Knock Off",
          "Psychic Noise",
          "Stealth Rock",
          "Thunder Wave",
          "Thunderbolt",
          "U-turn",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Dark", "Fighting"],
      },
    ],
    baseSpecies: "Mesprit",
  },
  azelf: {
    level: 82,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Encore",
          "Explosion",
          "Fire Blast",
          "Knock Off",
          "Psychic",
          "Stealth Rock",
          "Taunt",
          "U-turn",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Dark", "Fire"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Dazzling Gleam",
          "Fire Blast",
          "Nasty Plot",
          "Psychic",
          "Psyshock",
          "Thunderbolt",
          "Trick",
          "U-turn",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Fairy", "Fire", "Psychic"],
      },
    ],
    baseSpecies: "Azelf",
  },
  dialga: {
    level: 73,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Draco Meteor",
          "Fire Blast",
          "Heavy Slam",
          "Stealth Rock",
          "Thunder Wave",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Flying", "Steel"],
      },
      {
        role: "AV Pivot",
        movepool: ["Draco Meteor", "Dragon Tail", "Fire Blast", "Heavy Slam"],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Flying", "Steel"],
      },
    ],
    baseSpecies: "Dialga",
  },
  dialgaorigin: {
    level: 73,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Draco Meteor",
          "Fire Blast",
          "Flash Cannon",
          "Heavy Slam",
          "Stealth Rock",
          "Thunder Wave",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Flying", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Draco Meteor",
          "Dragon Tail",
          "Fire Blast",
          "Flash Cannon",
          "Heavy Slam",
          "Stealth Rock",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Flying", "Steel"],
      },
    ],
    baseSpecies: "Dialga",
  },
  palkia: {
    level: 75,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Draco Meteor", "Fire Blast", "Hydro Pump", "Spacial Rend"],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Fire", "Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Draco Meteor",
          "Fire Blast",
          "Hydro Pump",
          "Spacial Rend",
          "Thunder Wave",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Fire", "Water"],
      },
    ],
    baseSpecies: "Palkia",
  },
  palkiaorigin: {
    level: 72,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Draco Meteor",
          "Fire Blast",
          "Hydro Pump",
          "Spacial Rend",
          "Thunder Wave",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Fire", "Water"],
      },
    ],
    baseSpecies: "Palkia",
  },
  heatran: {
    level: 79,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earth Power",
          "Flash Cannon",
          "Heavy Slam",
          "Lava Plume",
          "Magma Storm",
          "Stealth Rock",
        ],
        abilities: ["Flash Fire"],
        teraTypes: ["Flying", "Grass", "Steel"],
      },
    ],
    baseSpecies: "Heatran",
  },
  regigigas: {
    level: 84,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Body Slam", "Knock Off", "Rest", "Sleep Talk"],
        abilities: ["Slow Start"],
        teraTypes: ["Ghost"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Body Slam", "Knock Off", "Protect", "Substitute"],
        abilities: ["Slow Start"],
        teraTypes: ["Ghost", "Poison"],
      },
    ],
    baseSpecies: "Regigigas",
  },
  giratina: {
    level: 75,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Dragon Tail",
          "Rest",
          "Shadow Ball",
          "Sleep Talk",
          "Will-O-Wisp",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Fairy"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Dragon Pulse", "Rest", "Sleep Talk"],
        abilities: ["Pressure"],
        teraTypes: ["Fairy"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Defog",
          "Dragon Tail",
          "Rest",
          "Shadow Ball",
          "Will-O-Wisp",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Fairy"],
      },
    ],
    baseSpecies: "Giratina",
  },
  giratinaorigin: {
    level: 72,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Defog",
          "Draco Meteor",
          "Dragon Tail",
          "Poltergeist",
          "Shadow Sneak",
          "Will-O-Wisp",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Dragon", "Fairy", "Ghost", "Steel"],
      },
    ],
    baseSpecies: "Giratina",
  },
  cresselia: {
    level: 80,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Moonblast",
          "Moonlight",
          "Psyshock",
          "Thunderbolt",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric", "Fairy", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Cresselia",
  },
  phione: {
    level: 91,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Rest", "Scald", "Sleep Talk", "Take Heart"],
        abilities: ["Hydration"],
        teraTypes: ["Dragon", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Grass Knot", "Ice Beam", "Scald", "Take Heart"],
        abilities: ["Hydration"],
        teraTypes: ["Grass", "Steel"],
      },
    ],
    baseSpecies: "Phione",
  },
  manaphy: {
    level: 78,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Energy Ball",
          "Hydro Pump",
          "Ice Beam",
          "Surf",
          "Tail Glow",
        ],
        abilities: ["Hydration"],
        teraTypes: ["Grass", "Water"],
      },
    ],
    baseSpecies: "Manaphy",
  },
  darkrai: {
    level: 77,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Dark Pulse",
          "Focus Blast",
          "Hypnosis",
          "Nasty Plot",
          "Sludge Bomb",
          "Substitute",
        ],
        abilities: ["Bad Dreams"],
        teraTypes: ["Poison"],
      },
    ],
    baseSpecies: "Darkrai",
  },
  shaymin: {
    level: 82,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Air Slash", "Earth Power", "Seed Flare", "Synthesis"],
        abilities: ["Natural Cure"],
        teraTypes: ["Ground", "Steel"],
      },
      {
        role: "Bulky Support",
        movepool: ["Air Slash", "Leech Seed", "Seed Flare", "Substitute"],
        abilities: ["Natural Cure"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Shaymin",
  },
  shayminsky: {
    level: 73,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Air Slash", "Dazzling Gleam", "Earth Power", "Seed Flare"],
        abilities: ["Serene Grace"],
        teraTypes: ["Flying", "Grass"],
      },
      {
        role: "Bulky Support",
        movepool: ["Air Slash", "Leech Seed", "Seed Flare", "Substitute"],
        abilities: ["Serene Grace"],
        teraTypes: ["Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Air Slash", "Earth Power", "Seed Flare", "Synthesis"],
        abilities: ["Serene Grace"],
        teraTypes: ["Steel", "Water"],
      },
    ],
    baseSpecies: "Shaymin",
  },
  arceus: {
    level: 68,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Earthquake",
          "Extreme Speed",
          "Recover",
          "Shadow Claw",
          "Swords Dance",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Ghost"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Earthquake", "Extreme Speed", "Recover", "Swords Dance"],
        abilities: ["Multitype"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusbug: {
    level: 73,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Earth Power",
          "Fire Blast",
          "Judgment",
          "Recover",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Fire", "Ground"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusdark: {
    level: 71,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Dazzling Gleam",
          "Judgment",
          "Recover",
          "Sludge Bomb",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Fairy", "Poison"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusdragon: {
    level: 71,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Extreme Speed",
          "Flare Blitz",
          "Heavy Slam",
          "Outrage",
          "Swords Dance",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Fire"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Dragon Dance", "Flare Blitz", "Heavy Slam", "Outrage"],
        abilities: ["Multitype"],
        teraTypes: ["Fire", "Steel"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Calm Mind",
          "Fire Blast",
          "Judgment",
          "Recover",
          "Sludge Bomb",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceuselectric: {
    level: 70,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Ice Beam", "Judgment", "Recover"],
        abilities: ["Multitype"],
        teraTypes: ["Electric", "Ice"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusfairy: {
    level: 69,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Earth Power", "Judgment", "Recover"],
        abilities: ["Multitype"],
        teraTypes: ["Ground", "Steel"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusfighting: {
    level: 70,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: ["Body Press", "Cosmic Power", "Recover", "Stored Power"],
        abilities: ["Multitype"],
        teraTypes: ["Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Body Press", "Iron Defense", "Recover", "Shadow Ball"],
        abilities: ["Multitype"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusfire: {
    level: 72,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Earthquake",
          "Extreme Speed",
          "Flare Blitz",
          "Recover",
          "Swords Dance",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Fire", "Ground"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Dragon Dance", "Earthquake", "Flare Blitz", "Recover"],
        abilities: ["Multitype"],
        teraTypes: ["Fire", "Ground"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Earth Power",
          "Energy Ball",
          "Judgment",
          "Recover",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Grass", "Ground"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusflying: {
    level: 69,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Earth Power", "Judgment", "Recover"],
        abilities: ["Multitype"],
        teraTypes: ["Ground", "Steel"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusghost: {
    level: 69,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Focus Blast", "Judgment", "Recover", "Will-O-Wisp"],
        abilities: ["Multitype"],
        teraTypes: ["Fighting", "Normal"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Focus Blast", "Judgment", "Recover"],
        abilities: ["Multitype"],
        teraTypes: ["Fighting", "Ghost", "Normal"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusgrass: {
    level: 72,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Calm Mind", "Earth Power", "Ice Beam", "Judgment"],
        abilities: ["Multitype"],
        teraTypes: ["Ground"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Fire Blast", "Judgment", "Recover"],
        abilities: ["Multitype"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusground: {
    level: 70,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Fire Blast",
          "Ice Beam",
          "Judgment",
          "Recover",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Dragon", "Ground"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Earthquake", "Extreme Speed", "Stone Edge", "Swords Dance"],
        abilities: ["Multitype"],
        teraTypes: ["Normal"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Dragon Dance", "Earthquake", "Recover", "Stone Edge"],
        abilities: ["Multitype"],
        teraTypes: ["Ground", "Steel"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusice: {
    level: 72,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Earth Power",
          "Judgment",
          "Recover",
          "Thunderbolt",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Electric", "Ground"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceuspoison: {
    level: 70,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Dragon Dance",
          "Earthquake",
          "Flare Blitz",
          "Gunk Shot",
          "Liquidation",
          "Recover",
          "Swords Dance",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Ground"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Earthquake", "Extreme Speed", "Gunk Shot", "Swords Dance"],
        abilities: ["Multitype"],
        teraTypes: ["Ground", "Normal"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceuspsychic: {
    level: 69,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Body Press", "Cosmic Power", "Recover", "Stored Power"],
        abilities: ["Multitype"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceusrock: {
    level: 74,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Earth Power",
          "Fire Blast",
          "Judgment",
          "Recover",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Dragon", "Ground"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Dragon Dance",
          "Earthquake",
          "Recover",
          "Stone Edge",
          "Swords Dance",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceussteel: {
    level: 70,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Earthquake", "Judgment", "Recover", "Will-O-Wisp"],
        abilities: ["Multitype"],
        teraTypes: ["Ghost"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Earth Power", "Judgment", "Recover"],
        abilities: ["Multitype"],
        teraTypes: ["Ghost"],
      },
    ],
    baseSpecies: "Arceus",
  },
  arceuswater: {
    level: 71,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Calm Mind",
          "Ice Beam",
          "Judgment",
          "Recover",
          "Will-O-Wisp",
        ],
        abilities: ["Multitype"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Arceus",
  },
  serperior: {
    level: 79,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Dragon Pulse",
          "Glare",
          "Leaf Storm",
          "Leech Seed",
          "Substitute",
          "Synthesis",
        ],
        abilities: ["Contrary"],
        teraTypes: ["Dragon", "Grass", "Water"],
      },
    ],
    baseSpecies: "Serperior",
  },
  emboar: {
    level: 84,
    sets: [
      {
        role: "AV Pivot",
        movepool: [
          "Close Combat",
          "Flare Blitz",
          "Knock Off",
          "Scald",
          "Sucker Punch",
          "Wild Charge",
        ],
        abilities: ["Reckless"],
        teraTypes: ["Dark", "Electric", "Fire", "Water"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Flare Blitz",
          "Head Smash",
          "Knock Off",
          "Wild Charge",
        ],
        abilities: ["Reckless"],
        teraTypes: ["Fire"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Bulk Up", "Drain Punch", "Flare Blitz", "Trailblaze"],
        abilities: ["Reckless"],
        teraTypes: ["Fighting", "Grass"],
      },
    ],
    baseSpecies: "Emboar",
  },
  samurott: {
    level: 88,
    sets: [
      {
        role: "AV Pivot",
        movepool: [
          "Aqua Jet",
          "Flip Turn",
          "Grass Knot",
          "Hydro Pump",
          "Ice Beam",
          "Knock Off",
          "Megahorn",
          "Sacred Sword",
        ],
        abilities: ["Torrent"],
        teraTypes: ["Dark", "Grass", "Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Aqua Jet",
          "Knock Off",
          "Liquidation",
          "Megahorn",
          "Sacred Sword",
          "Swords Dance",
        ],
        abilities: ["Torrent"],
        teraTypes: ["Dark", "Water"],
      },
    ],
    baseSpecies: "Samurott",
  },
  samurotthisui: {
    level: 77,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Ceaseless Edge",
          "Flip Turn",
          "Razor Shell",
          "Sacred Sword",
          "Sucker Punch",
          "Swords Dance",
        ],
        abilities: ["Sharpness"],
        teraTypes: ["Dark", "Poison", "Water"],
      },
    ],
    baseSpecies: "Samurott",
  },
  zebstrika: {
    level: 87,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "High Horsepower",
          "Overheat",
          "Supercell Slam",
          "Volt Switch",
        ],
        abilities: ["Sap Sipper"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Zebstrika",
  },
  excadrill: {
    level: 79,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Earthquake", "Iron Head", "Rapid Spin", "Swords Dance"],
        abilities: ["Mold Breaker", "Sand Rush"],
        teraTypes: ["Grass", "Ground", "Water"],
      },
      {
        role: "AV Pivot",
        movepool: ["Earthquake", "Iron Head", "Rapid Spin", "Rock Slide"],
        abilities: ["Mold Breaker", "Sand Rush"],
        teraTypes: ["Grass", "Water"],
      },
    ],
    baseSpecies: "Excadrill",
  },
  gurdurr: {
    level: 85,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Bulk Up",
          "Defog",
          "Drain Punch",
          "Knock Off",
          "Mach Punch",
        ],
        abilities: ["Guts"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Gurdurr",
  },
  conkeldurr: {
    level: 80,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Close Combat", "Facade", "Knock Off", "Mach Punch"],
        abilities: ["Guts"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Conkeldurr",
  },
  leavanny: {
    level: 86,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Knock Off",
          "Leaf Blade",
          "Lunge",
          "Sticky Web",
          "Swords Dance",
        ],
        abilities: ["Chlorophyll", "Swarm"],
        teraTypes: ["Ghost", "Rock"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Bullet Seed",
          "Knock Off",
          "Sticky Web",
          "Swords Dance",
          "Triple Axel",
        ],
        abilities: ["Chlorophyll"],
        teraTypes: ["Ghost", "Rock"],
      },
    ],
    baseSpecies: "Leavanny",
  },
  whimsicott: {
    level: 84,
    sets: [
      {
        role: "Fast Support",
        movepool: ["Encore", "Giga Drain", "Moonblast", "Stun Spore", "U-turn"],
        abilities: ["Prankster"],
        teraTypes: ["Poison", "Steel"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Encore",
          "Hurricane",
          "Leech Seed",
          "Moonblast",
          "Substitute",
        ],
        abilities: ["Prankster"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Whimsicott",
  },
  lilligant: {
    level: 86,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Alluring Voice",
          "Petal Dance",
          "Quiver Dance",
          "Sleep Powder",
        ],
        abilities: ["Own Tempo"],
        teraTypes: ["Fairy", "Grass"],
      },
    ],
    baseSpecies: "Lilligant",
  },
  lilliganthisui: {
    level: 79,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Close Combat",
          "Ice Spinner",
          "Leaf Blade",
          "Sleep Powder",
          "Victory Dance",
        ],
        abilities: ["Hustle"],
        teraTypes: ["Fighting", "Steel"],
      },
    ],
    baseSpecies: "Lilligant",
  },
  basculin: {
    level: 86,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Aqua Jet", "Double-Edge", "Flip Turn", "Wave Crash"],
        abilities: ["Adaptability"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Basculin",
  },
  basculegion: {
    level: 81,
    sets: [
      {
        role: "AV Pivot",
        movepool: ["Aqua Jet", "Flip Turn", "Shadow Ball", "Wave Crash"],
        abilities: ["Adaptability"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Basculegion",
  },
  basculegionf: {
    level: 83,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Flip Turn", "Hydro Pump", "Ice Beam", "Shadow Ball"],
        abilities: ["Adaptability"],
        teraTypes: ["Water"],
      },
      {
        role: "AV Pivot",
        movepool: ["Flip Turn", "Hydro Pump", "Shadow Ball", "Wave Crash"],
        abilities: ["Adaptability"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Basculegion",
  },
  krookodile: {
    level: 80,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Bulk Up",
          "Earthquake",
          "Gunk Shot",
          "Knock Off",
          "Stealth Rock",
          "Stone Edge",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Ground", "Poison"],
      },
    ],
    baseSpecies: "Krookodile",
  },
  scrafty: {
    level: 84,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Bulk Up", "Drain Punch", "Knock Off", "Rest"],
        abilities: ["Shed Skin"],
        teraTypes: ["Poison"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Close Combat", "Dragon Dance", "Knock Off", "Poison Jab"],
        abilities: ["Intimidate"],
        teraTypes: ["Poison"],
      },
    ],
    baseSpecies: "Scrafty",
  },
  zoroark: {
    level: 83,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Dark Pulse",
          "Flamethrower",
          "Focus Blast",
          "Psychic",
          "Sludge Bomb",
          "Trick",
          "U-turn",
        ],
        abilities: ["Illusion"],
        teraTypes: ["Poison"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Dark Pulse",
          "Encore",
          "Focus Blast",
          "Nasty Plot",
          "Psychic",
          "Sludge Bomb",
        ],
        abilities: ["Illusion"],
        teraTypes: ["Poison"],
      },
    ],
    baseSpecies: "Zoroark",
  },
  zoroarkhisui: {
    level: 80,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Bitter Malice",
          "Flamethrower",
          "Focus Blast",
          "Hyper Voice",
          "Nasty Plot",
          "Trick",
          "U-turn",
        ],
        abilities: ["Illusion"],
        teraTypes: ["Fighting", "Normal"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Focus Blast", "Hyper Voice", "Poltergeist", "Will-O-Wisp"],
        abilities: ["Illusion"],
        teraTypes: ["Fighting", "Normal"],
      },
    ],
    baseSpecies: "Zoroark",
  },
  cinccino: {
    level: 83,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Bullet Seed",
          "Tail Slap",
          "Tidy Up",
          "Triple Axel",
          "U-turn",
        ],
        abilities: ["Technician"],
        teraTypes: ["Grass", "Ice", "Normal"],
      },
    ],
    baseSpecies: "Cinccino",
  },
  gothitelle: {
    level: 90,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Dark Pulse",
          "Focus Blast",
          "Psychic Noise",
          "Thunderbolt",
        ],
        abilities: ["Shadow Tag"],
        teraTypes: [
          "Dark",
          "Electric",
          "Fairy",
          "Fighting",
          "Flying",
          "Ghost",
          "Ground",
          "Steel",
        ],
      },
      {
        role: "Fast Attacker",
        movepool: ["Dark Pulse", "Focus Blast", "Psychic", "Trick"],
        abilities: ["Shadow Tag"],
        teraTypes: [
          "Dark",
          "Fairy",
          "Fighting",
          "Flying",
          "Ghost",
          "Ground",
          "Psychic",
          "Steel",
        ],
      },
    ],
    baseSpecies: "Gothitelle",
  },
  reuniclus: {
    level: 88,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Focus Blast",
          "Psychic",
          "Psyshock",
          "Recover",
          "Shadow Ball",
        ],
        abilities: ["Magic Guard"],
        teraTypes: ["Fighting", "Steel"],
      },
    ],
    baseSpecies: "Reuniclus",
  },
  swanna: {
    level: 88,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Brave Bird", "Defog", "Hydro Pump", "Knock Off", "Roost"],
        abilities: ["Hydration"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Swanna",
  },
  sawsbuck: {
    level: 88,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Double-Edge",
          "High Horsepower",
          "Horn Leech",
          "Swords Dance",
        ],
        abilities: ["Sap Sipper"],
        teraTypes: ["Ground", "Normal"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Headbutt", "High Horsepower", "Horn Leech", "Swords Dance"],
        abilities: ["Serene Grace"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Sawsbuck",
  },
  amoonguss: {
    level: 82,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Clear Smog", "Giga Drain", "Sludge Bomb", "Spore", "Toxic"],
        abilities: ["Regenerator"],
        teraTypes: ["Steel", "Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Giga Drain", "Sludge Bomb", "Spore", "Stomping Tantrum"],
        abilities: ["Regenerator"],
        teraTypes: ["Steel", "Water"],
      },
    ],
    baseSpecies: "Amoonguss",
  },
  alomomola: {
    level: 87,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Flip Turn", "Protect", "Scald", "Wish"],
        abilities: ["Regenerator"],
        teraTypes: ["Steel"],
      },
      {
        role: "Fast Support",
        movepool: ["Flip Turn", "Protect", "Scald", "Wish"],
        abilities: ["Regenerator"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Alomomola",
  },
  galvantula: {
    level: 82,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Bug Buzz",
          "Giga Drain",
          "Sticky Web",
          "Thunder",
          "Volt Switch",
        ],
        abilities: ["Compound Eyes"],
        teraTypes: ["Electric"],
      },
    ],
    baseSpecies: "Galvantula",
  },
  eelektross: {
    level: 87,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Coil",
          "Drain Punch",
          "Fire Punch",
          "Knock Off",
          "Supercell Slam",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Fighting"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Close Combat",
          "Discharge",
          "Dragon Tail",
          "Flamethrower",
          "Giga Drain",
          "Knock Off",
          "U-turn",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Poison", "Steel"],
      },
    ],
    baseSpecies: "Eelektross",
  },
  chandelure: {
    level: 83,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Calm Mind",
          "Energy Ball",
          "Fire Blast",
          "Pain Split",
          "Shadow Ball",
          "Substitute",
          "Will-O-Wisp",
        ],
        abilities: ["Flame Body", "Flash Fire"],
        teraTypes: ["Fire", "Ghost", "Grass"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Energy Ball", "Fire Blast", "Shadow Ball", "Trick"],
        abilities: ["Flash Fire"],
        teraTypes: ["Fire", "Ghost", "Grass"],
      },
    ],
    baseSpecies: "Chandelure",
  },
  haxorus: {
    level: 77,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Close Combat",
          "Dragon Dance",
          "Earthquake",
          "Iron Head",
          "Outrage",
        ],
        abilities: ["Mold Breaker"],
        teraTypes: ["Steel"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Close Combat",
          "Earthquake",
          "Iron Head",
          "Scale Shot",
          "Swords Dance",
        ],
        abilities: ["Mold Breaker"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Haxorus",
  },
  beartic: {
    level: 91,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Aqua Jet",
          "Close Combat",
          "Earthquake",
          "Icicle Crash",
          "Snowscape",
          "Swords Dance",
        ],
        abilities: ["Slush Rush", "Swift Swim"],
        teraTypes: ["Fighting", "Ground"],
      },
    ],
    baseSpecies: "Beartic",
  },
  cryogonal: {
    level: 89,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Flash Cannon",
          "Freeze-Dry",
          "Haze",
          "Rapid Spin",
          "Recover",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Poison", "Steel"],
      },
    ],
    baseSpecies: "Cryogonal",
  },
  mienshao: {
    level: 83,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "High Jump Kick",
          "Knock Off",
          "Poison Jab",
          "Stone Edge",
          "U-turn",
        ],
        abilities: ["Reckless"],
        teraTypes: ["Fighting"],
      },
      {
        role: "AV Pivot",
        movepool: ["Close Combat", "Fake Out", "Knock Off", "U-turn"],
        abilities: ["Regenerator"],
        teraTypes: ["Dark", "Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Close Combat",
          "Knock Off",
          "Poison Jab",
          "Swords Dance",
          "Triple Axel",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Dark", "Fighting", "Poison"],
      },
    ],
    baseSpecies: "Mienshao",
  },
  golurk: {
    level: 87,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Dynamic Punch",
          "Earthquake",
          "Poltergeist",
          "Stealth Rock",
          "Stone Edge",
        ],
        abilities: ["No Guard"],
        teraTypes: ["Fighting", "Ghost", "Ground"],
      },
    ],
    baseSpecies: "Golurk",
  },
  braviary: {
    level: 85,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: ["Brave Bird", "Bulk Up", "Close Combat", "Roost"],
        abilities: ["Defiant"],
        teraTypes: ["Fighting", "Steel"],
      },
    ],
    baseSpecies: "Braviary",
  },
  braviaryhisui: {
    level: 85,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Agility", "Heat Wave", "Hurricane", "Psychic"],
        abilities: ["Sheer Force"],
        teraTypes: ["Fairy", "Fire", "Psychic", "Steel"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Esper Wing", "Hurricane", "U-turn", "Vacuum Wave"],
        abilities: ["Tinted Lens"],
        teraTypes: ["Fairy", "Fighting", "Psychic", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Calm Mind", "Defog", "Esper Wing", "Hurricane", "Roost"],
        abilities: ["Tinted Lens"],
        teraTypes: ["Fairy", "Psychic", "Steel"],
      },
    ],
    baseSpecies: "Braviary",
  },
  mandibuzz: {
    level: 85,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Defog", "Foul Play", "Roost", "Toxic", "U-turn"],
        abilities: ["Overcoat"],
        teraTypes: ["Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Brave Bird",
          "Defog",
          "Foul Play",
          "Knock Off",
          "Roost",
          "Toxic",
        ],
        abilities: ["Overcoat"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Mandibuzz",
  },
  hydreigon: {
    level: 79,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Dark Pulse",
          "Draco Meteor",
          "Fire Blast",
          "Flash Cannon",
          "Nasty Plot",
          "U-turn",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Dark", "Dragon", "Fire", "Steel"],
      },
    ],
    baseSpecies: "Hydreigon",
  },
  volcarona: {
    level: 77,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Bug Buzz",
          "Fiery Dance",
          "Fire Blast",
          "Giga Drain",
          "Morning Sun",
          "Quiver Dance",
        ],
        abilities: ["Flame Body", "Swarm"],
        teraTypes: ["Fire", "Grass", "Steel"],
      },
    ],
    baseSpecies: "Volcarona",
  },
  cobalion: {
    level: 80,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Close Combat",
          "Iron Head",
          "Stone Edge",
          "Swords Dance",
          "Taunt",
        ],
        abilities: ["Justified"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Aura Sphere", "Calm Mind", "Flash Cannon", "Vacuum Wave"],
        abilities: ["Justified"],
        teraTypes: ["Fighting", "Ghost", "Water"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Body Press",
          "Iron Defense",
          "Iron Head",
          "Stealth Rock",
          "Stone Edge",
          "Thunder Wave",
          "Volt Switch",
        ],
        abilities: ["Justified"],
        teraTypes: ["Ghost", "Water"],
      },
    ],
    baseSpecies: "Cobalion",
  },
  terrakion: {
    level: 79,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Close Combat", "Earthquake", "Stone Edge", "Swords Dance"],
        abilities: ["Justified"],
        teraTypes: ["Fighting", "Ground"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Close Combat", "Earthquake", "Quick Attack", "Stone Edge"],
        abilities: ["Justified"],
        teraTypes: ["Fighting", "Ground"],
      },
    ],
    baseSpecies: "Terrakion",
  },
  virizion: {
    level: 82,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Close Combat", "Leaf Blade", "Stone Edge", "Swords Dance"],
        abilities: ["Justified"],
        teraTypes: ["Rock"],
      },
    ],
    baseSpecies: "Virizion",
  },
  tornadus: {
    level: 82,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Bleakwind Storm",
          "Focus Blast",
          "Grass Knot",
          "Heat Wave",
          "Nasty Plot",
          "U-turn",
        ],
        abilities: ["Defiant", "Prankster"],
        teraTypes: ["Fighting", "Fire", "Flying"],
      },
    ],
    baseSpecies: "Tornadus",
  },
  tornadustherian: {
    level: 79,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Bleakwind Storm",
          "Focus Blast",
          "Grass Knot",
          "Heat Wave",
          "Nasty Plot",
          "U-turn",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Fighting", "Fire", "Flying"],
      },
      {
        role: "AV Pivot",
        movepool: ["Bleakwind Storm", "Heat Wave", "Knock Off", "U-turn"],
        abilities: ["Regenerator"],
        teraTypes: ["Dark", "Steel"],
      },
    ],
    baseSpecies: "Tornadus",
  },
  thundurus: {
    level: 80,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Focus Blast",
          "Grass Knot",
          "Knock Off",
          "Nasty Plot",
          "Sludge Wave",
          "Taunt",
          "Thunder Wave",
          "Thunderbolt",
          "U-turn",
        ],
        abilities: ["Defiant", "Prankster"],
        teraTypes: ["Electric", "Grass", "Steel"],
      },
      {
        role: "Wallbreaker",
        movepool: [
          "Acrobatics",
          "Focus Blast",
          "Grass Knot",
          "Knock Off",
          "Taunt",
          "Thunder Wave",
          "Thunderbolt",
          "U-turn",
        ],
        abilities: ["Defiant", "Prankster"],
        teraTypes: ["Electric", "Flying", "Grass", "Steel"],
      },
    ],
    baseSpecies: "Thundurus",
  },
  thundurustherian: {
    level: 80,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Focus Blast",
          "Grass Knot",
          "Nasty Plot",
          "Psychic",
          "Sludge Wave",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Volt Absorb"],
        teraTypes: ["Electric", "Poison", "Psychic"],
      },
    ],
    baseSpecies: "Thundurus",
  },
  reshiram: {
    level: 76,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Blue Flare",
          "Draco Meteor",
          "Dragon Tail",
          "Earth Power",
          "Will-O-Wisp",
        ],
        abilities: ["Turboblaze"],
        teraTypes: ["Fire", "Ground"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Dragon Dance", "Flare Blitz", "Outrage", "Stone Edge"],
        abilities: ["Turboblaze"],
        teraTypes: ["Dragon", "Fire"],
      },
    ],
    baseSpecies: "Reshiram",
  },
  zekrom: {
    level: 71,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Bolt Strike", "Dragon Dance", "Outrage", "Substitute"],
        abilities: ["Teravolt"],
        teraTypes: ["Electric", "Fairy", "Grass", "Steel"],
      },
    ],
    baseSpecies: "Zekrom",
  },
  landorus: {
    level: 75,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Earth Power",
          "Focus Blast",
          "Nasty Plot",
          "Psychic",
          "Rock Slide",
          "Sludge Wave",
          "Stealth Rock",
        ],
        abilities: ["Sheer Force"],
        teraTypes: ["Ground", "Poison"],
      },
    ],
    baseSpecies: "Landorus",
  },
  landorustherian: {
    level: 76,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Stealth Rock",
          "Stone Edge",
          "Taunt",
          "U-turn",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Ground", "Water"],
      },
    ],
    baseSpecies: "Landorus",
  },
  kyurem: {
    level: 77,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Draco Meteor",
          "Earth Power",
          "Freeze-Dry",
          "Ice Beam",
          "Outrage",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Kyurem",
  },
  kyuremwhite: {
    level: 73,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Draco Meteor", "Earth Power", "Freeze-Dry", "Fusion Flare"],
        abilities: ["Turboblaze"],
        teraTypes: ["Dragon", "Fire"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Draco Meteor", "Freeze-Dry", "Fusion Flare", "Ice Beam"],
        abilities: ["Turboblaze"],
        teraTypes: ["Dragon", "Fire", "Ice"],
      },
    ],
    baseSpecies: "Kyurem",
  },
  kyuremblack: {
    level: 71,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Dragon Dance", "Fusion Bolt", "Icicle Spear", "Scale Shot"],
        abilities: ["Teravolt"],
        teraTypes: ["Electric"],
      },
    ],
    baseSpecies: "Kyurem",
  },
  keldeoresolute: {
    level: 79,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Air Slash",
          "Calm Mind",
          "Flip Turn",
          "Hydro Pump",
          "Secret Sword",
          "Vacuum Wave",
        ],
        abilities: ["Justified"],
        teraTypes: ["Fighting", "Water"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Hydro Pump",
          "Secret Sword",
          "Substitute",
          "Surf",
        ],
        abilities: ["Justified"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Keldeo",
  },
  meloetta: {
    level: 82,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Calm Mind",
          "Focus Blast",
          "Hyper Voice",
          "Psyshock",
          "U-turn",
        ],
        abilities: ["Serene Grace"],
        teraTypes: ["Fighting", "Normal", "Psychic"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Close Combat", "Knock Off", "Relic Song", "Triple Axel"],
        abilities: ["Serene Grace"],
        teraTypes: ["Dark", "Fighting"],
      },
    ],
    baseSpecies: "Meloetta",
  },
  chesnaught: {
    level: 84,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Body Press",
          "Knock Off",
          "Spikes",
          "Synthesis",
          "Wood Hammer",
        ],
        abilities: ["Bulletproof"],
        teraTypes: ["Steel", "Water"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Body Press", "Iron Defense", "Synthesis", "Trailblaze"],
        abilities: ["Bulletproof"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Chesnaught",
  },
  delphox: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Fire Blast",
          "Focus Blast",
          "Grass Knot",
          "Nasty Plot",
          "Psyshock",
        ],
        abilities: ["Blaze"],
        teraTypes: ["Fighting", "Fire", "Grass"],
      },
    ],
    baseSpecies: "Delphox",
  },
  greninja: {
    level: 80,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Dark Pulse",
          "Grass Knot",
          "Gunk Shot",
          "Hydro Pump",
          "Ice Beam",
          "Toxic Spikes",
          "U-turn",
        ],
        abilities: ["Protean"],
        teraTypes: ["Dark", "Poison", "Water"],
      },
      {
        role: "Wallbreaker",
        movepool: [
          "Grass Knot",
          "Gunk Shot",
          "Hydro Pump",
          "Ice Beam",
          "Spikes",
          "U-turn",
        ],
        abilities: ["Protean"],
        teraTypes: ["Poison"],
      },
    ],
    baseSpecies: "Greninja",
  },
  greninjabond: {
    level: 80,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Dark Pulse", "Gunk Shot", "Hydro Pump", "Ice Beam"],
        abilities: ["Battle Bond"],
        teraTypes: ["Poison", "Water"],
      },
    ],
    baseSpecies: "Greninja",
  },
  talonflame: {
    level: 83,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Brave Bird",
          "Defog",
          "Overheat",
          "Roost",
          "Taunt",
          "U-turn",
          "Will-O-Wisp",
        ],
        abilities: ["Flame Body"],
        teraTypes: ["Dragon", "Ground"],
      },
    ],
    baseSpecies: "Talonflame",
  },
  vivillon: {
    level: 83,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: ["Bug Buzz", "Hurricane", "Quiver Dance", "Sleep Powder"],
        abilities: ["Compound Eyes"],
        teraTypes: ["Flying"],
      },
    ],
    baseSpecies: "Vivillon",
  },
  pyroar: {
    level: 88,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Dark Pulse",
          "Fire Blast",
          "Hyper Voice",
          "Taunt",
          "Will-O-Wisp",
          "Work Up",
        ],
        abilities: ["Unnerve"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Pyroar",
  },
  florges: {
    level: 85,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Moonblast", "Protect", "Wish"],
        abilities: ["Flower Veil"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Florges",
  },
  gogoat: {
    level: 88,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Bulk Up",
          "Earthquake",
          "Horn Leech",
          "Milk Drink",
          "Rock Slide",
        ],
        abilities: ["Sap Sipper"],
        teraTypes: ["Ground", "Water"],
      },
    ],
    baseSpecies: "Gogoat",
  },
  meowstic: {
    level: 89,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Alluring Voice",
          "Light Screen",
          "Psychic Noise",
          "Reflect",
          "Thunder Wave",
          "Yawn",
        ],
        abilities: ["Prankster"],
        teraTypes: ["Fairy"],
      },
    ],
    baseSpecies: "Meowstic",
  },
  meowsticf: {
    level: 89,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Alluring Voice",
          "Dark Pulse",
          "Nasty Plot",
          "Psychic",
          "Psyshock",
          "Thunderbolt",
        ],
        abilities: ["Competitive"],
        teraTypes: ["Dark", "Electric", "Fairy"],
      },
    ],
    baseSpecies: "Meowstic",
  },
  malamar: {
    level: 82,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Knock Off", "Rest", "Sleep Talk", "Superpower"],
        abilities: ["Contrary"],
        teraTypes: ["Fighting", "Poison", "Steel"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Knock Off", "Psycho Cut", "Rest", "Superpower"],
        abilities: ["Contrary"],
        teraTypes: ["Fighting", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Malamar",
  },
  dragalge: {
    level: 88,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Draco Meteor",
          "Dragon Tail",
          "Flip Turn",
          "Focus Blast",
          "Sludge Wave",
          "Toxic",
          "Toxic Spikes",
        ],
        abilities: ["Adaptability"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Dragalge",
  },
  clawitzer: {
    level: 87,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Aura Sphere",
          "Dark Pulse",
          "Dragon Pulse",
          "U-turn",
          "Water Pulse",
        ],
        abilities: ["Mega Launcher"],
        teraTypes: ["Dark", "Dragon", "Fighting"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Aura Sphere",
          "Dark Pulse",
          "Dragon Pulse",
          "U-turn",
          "Water Pulse",
        ],
        abilities: ["Mega Launcher"],
        teraTypes: ["Dragon"],
      },
    ],
    baseSpecies: "Clawitzer",
  },
  sylveon: {
    level: 85,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Hyper Voice", "Protect", "Wish"],
        abilities: ["Pixilate"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Sylveon",
  },
  hawlucha: {
    level: 80,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Acrobatics",
          "Brave Bird",
          "Close Combat",
          "Encore",
          "Stone Edge",
          "Swords Dance",
          "Throat Chop",
        ],
        abilities: ["Unburden"],
        teraTypes: ["Fighting", "Flying"],
      },
    ],
    baseSpecies: "Hawlucha",
  },
  dedenne: {
    level: 88,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Dazzling Gleam",
          "Nuzzle",
          "Super Fang",
          "Thunderbolt",
          "U-turn",
        ],
        abilities: ["Cheek Pouch"],
        teraTypes: ["Flying"],
      },
    ],
    baseSpecies: "Dedenne",
  },
  carbink: {
    level: 90,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Body Press",
          "Iron Defense",
          "Moonblast",
          "Rest",
          "Rock Polish",
        ],
        abilities: ["Clear Body", "Sturdy"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Carbink",
  },
  goodra: {
    level: 85,
    sets: [
      {
        role: "AV Pivot",
        movepool: [
          "Draco Meteor",
          "Dragon Tail",
          "Earthquake",
          "Fire Blast",
          "Knock Off",
          "Power Whip",
          "Scald",
          "Sludge Bomb",
        ],
        abilities: ["Sap Sipper"],
        teraTypes: ["Fire", "Grass", "Ground", "Poison", "Steel", "Water"],
      },
    ],
    baseSpecies: "Goodra",
  },
  goodrahisui: {
    level: 82,
    sets: [
      {
        role: "AV Pivot",
        movepool: [
          "Draco Meteor",
          "Dragon Tail",
          "Earthquake",
          "Fire Blast",
          "Heavy Slam",
          "Hydro Pump",
          "Knock Off",
          "Thunderbolt",
        ],
        abilities: ["Sap Sipper"],
        teraTypes: ["Dragon", "Flying", "Ground", "Water"],
      },
    ],
    baseSpecies: "Goodra",
  },
  klefki: {
    level: 84,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Magnet Rise", "Play Rough", "Spikes", "Thunder Wave"],
        abilities: ["Prankster"],
        teraTypes: ["Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Dazzling Gleam", "Foul Play", "Spikes", "Thunder Wave"],
        abilities: ["Prankster"],
        teraTypes: ["Flying", "Water"],
      },
    ],
    baseSpecies: "Klefki",
  },
  trevenant: {
    level: 89,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Drain Punch",
          "Horn Leech",
          "Poltergeist",
          "Rest",
          "Trick Room",
          "Will-O-Wisp",
          "Wood Hammer",
        ],
        abilities: ["Natural Cure"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Bulky Support",
        movepool: ["Drain Punch", "Poltergeist", "Protect", "Toxic"],
        abilities: ["Harvest"],
        teraTypes: ["Dark", "Fairy", "Fighting", "Steel"],
      },
    ],
    baseSpecies: "Trevenant",
  },
  avalugg: {
    level: 88,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Avalanche", "Body Press", "Curse", "Rapid Spin", "Recover"],
        abilities: ["Sturdy"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Avalugg",
  },
  avalugghisui: {
    level: 90,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Avalanche",
          "Body Press",
          "Rapid Spin",
          "Recover",
          "Stone Edge",
        ],
        abilities: ["Sturdy"],
        teraTypes: ["Flying", "Ghost", "Poison"],
      },
    ],
    baseSpecies: "Avalugg",
  },
  noivern: {
    level: 82,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Boomburst",
          "Draco Meteor",
          "Flamethrower",
          "Hurricane",
          "Roost",
          "U-turn",
        ],
        abilities: ["Infiltrator"],
        teraTypes: ["Normal"],
      },
      {
        role: "Fast Support",
        movepool: [
          "Defog",
          "Draco Meteor",
          "Flamethrower",
          "Hurricane",
          "Roost",
          "U-turn",
        ],
        abilities: ["Infiltrator"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Noivern",
  },
  diancie: {
    level: 82,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Press",
          "Diamond Storm",
          "Earth Power",
          "Moonblast",
          "Rock Polish",
          "Stealth Rock",
        ],
        abilities: ["Clear Body"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Diamond Storm",
          "Draining Kiss",
          "Earth Power",
        ],
        abilities: ["Clear Body"],
        teraTypes: ["Fairy", "Water"],
      },
    ],
    baseSpecies: "Diancie",
  },
  hoopa: {
    level: 85,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Focus Blast",
          "Nasty Plot",
          "Psychic",
          "Psyshock",
          "Shadow Ball",
          "Trick",
        ],
        abilities: ["Magician"],
        teraTypes: ["Fighting", "Ghost", "Psychic"],
      },
    ],
    baseSpecies: "Hoopa",
  },
  hoopaunbound: {
    level: 80,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Drain Punch",
          "Gunk Shot",
          "Hyperspace Fury",
          "Trick",
          "Zen Headbutt",
        ],
        abilities: ["Magician"],
        teraTypes: ["Dark", "Fighting", "Poison"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Focus Blast",
          "Gunk Shot",
          "Hyperspace Fury",
          "Psychic",
          "Trick",
        ],
        abilities: ["Magician"],
        teraTypes: ["Fighting", "Poison"],
      },
    ],
    baseSpecies: "Hoopa",
  },
  volcanion: {
    level: 79,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Earth Power",
          "Flame Charge",
          "Flamethrower",
          "Haze",
          "Sludge Bomb",
          "Steam Eruption",
        ],
        abilities: ["Water Absorb"],
        teraTypes: ["Fire", "Ground", "Water"],
      },
    ],
    baseSpecies: "Volcanion",
  },
  decidueye: {
    level: 88,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Defog",
          "Knock Off",
          "Leaf Storm",
          "Roost",
          "Spirit Shackle",
          "U-turn",
        ],
        abilities: ["Overgrow"],
        teraTypes: ["Dark", "Ghost", "Grass"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Leaf Blade", "Poltergeist", "Shadow Sneak", "Swords Dance"],
        abilities: ["Overgrow"],
        teraTypes: ["Ghost"],
      },
    ],
    baseSpecies: "Decidueye",
  },
  decidueyehisui: {
    level: 87,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Defog",
          "Knock Off",
          "Leaf Blade",
          "Roost",
          "Sucker Punch",
          "Swords Dance",
          "Triple Arrows",
          "U-turn",
        ],
        abilities: ["Scrappy"],
        teraTypes: ["Steel", "Water"],
      },
    ],
    baseSpecies: "Decidueye",
  },
  incineroar: {
    level: 82,
    sets: [
      {
        role: "AV Pivot",
        movepool: [
          "Close Combat",
          "Fake Out",
          "Knock Off",
          "Overheat",
          "U-turn",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Fighting", "Water"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Earthquake",
          "Flare Blitz",
          "Knock Off",
          "Parting Shot",
          "Will-O-Wisp",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Fighting", "Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Flare Blitz", "Knock Off", "Swords Dance", "Trailblaze"],
        abilities: ["Intimidate"],
        teraTypes: ["Grass"],
      },
    ],
    baseSpecies: "Incineroar",
  },
  primarina: {
    level: 83,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Flip Turn", "Hydro Pump", "Moonblast", "Psychic"],
        abilities: ["Torrent"],
        teraTypes: ["Water"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Draining Kiss", "Moonblast", "Psychic Noise"],
        abilities: ["Liquid Voice"],
        teraTypes: ["Fairy", "Poison", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Calm Mind", "Draining Kiss", "Psychic", "Sparkling Aria"],
        abilities: ["Torrent"],
        teraTypes: ["Fairy", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Primarina",
  },
  toucannon: {
    level: 88,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Beak Blast",
          "Boomburst",
          "Bullet Seed",
          "Knock Off",
          "Roost",
          "U-turn",
        ],
        abilities: ["Keen Eye", "Skill Link"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Toucannon",
  },
  gumshoos: {
    level: 95,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Double-Edge", "Earthquake", "Knock Off", "U-turn"],
        abilities: ["Stakeout"],
        teraTypes: ["Normal"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Double-Edge", "Earthquake", "Knock Off", "U-turn"],
        abilities: ["Adaptability", "Stakeout"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Gumshoos",
  },
  vikavolt: {
    level: 83,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Bug Buzz",
          "Discharge",
          "Energy Ball",
          "Sticky Web",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Levitate"],
        teraTypes: ["Electric"],
      },
    ],
    baseSpecies: "Vikavolt",
  },
  crabominable: {
    level: 90,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Close Combat",
          "Drain Punch",
          "Earthquake",
          "Gunk Shot",
          "Ice Hammer",
          "Knock Off",
        ],
        abilities: ["Iron Fist"],
        teraTypes: ["Fighting", "Ground"],
      },
      {
        role: "AV Pivot",
        movepool: ["Drain Punch", "Earthquake", "Ice Hammer", "Knock Off"],
        abilities: ["Iron Fist"],
        teraTypes: ["Fighting", "Ground", "Water"],
      },
    ],
    baseSpecies: "Crabominable",
  },
  oricorio: {
    level: 84,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Hurricane", "Quiver Dance", "Revelation Dance", "Roost"],
        abilities: ["Dancer"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Oricorio",
  },
  oricoriopompom: {
    level: 82,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Hurricane", "Quiver Dance", "Revelation Dance", "Roost"],
        abilities: ["Dancer"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Oricorio",
  },
  oricoriopau: {
    level: 87,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Hurricane", "Quiver Dance", "Revelation Dance", "Roost"],
        abilities: ["Dancer"],
        teraTypes: ["Fighting", "Ground"],
      },
    ],
    baseSpecies: "Oricorio",
  },
  oricoriosensu: {
    level: 85,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Hurricane", "Quiver Dance", "Revelation Dance", "Roost"],
        abilities: ["Dancer"],
        teraTypes: ["Fighting", "Ghost"],
      },
    ],
    baseSpecies: "Oricorio",
  },
  ribombee: {
    level: 83,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Bug Buzz",
          "Moonblast",
          "Sticky Web",
          "Stun Spore",
          "U-turn",
        ],
        abilities: ["Shield Dust"],
        teraTypes: ["Ghost"],
      },
    ],
    baseSpecies: "Ribombee",
  },
  lycanroc: {
    level: 86,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Accelerock",
          "Close Combat",
          "Crunch",
          "Psychic Fangs",
          "Stealth Rock",
          "Stone Edge",
          "Swords Dance",
          "Taunt",
        ],
        abilities: ["Sand Rush"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Lycanroc",
  },
  lycanrocmidnight: {
    level: 89,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Knock Off",
          "Stealth Rock",
          "Stone Edge",
          "Sucker Punch",
          "Swords Dance",
        ],
        abilities: ["No Guard"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Lycanroc",
  },
  lycanrocdusk: {
    level: 81,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Accelerock",
          "Close Combat",
          "Psychic Fangs",
          "Stone Edge",
          "Swords Dance",
          "Throat Chop",
        ],
        abilities: ["Tough Claws"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Lycanroc",
  },
  toxapex: {
    level: 82,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Haze", "Liquidation", "Recover", "Toxic", "Toxic Spikes"],
        abilities: ["Regenerator"],
        teraTypes: ["Fairy", "Flying", "Grass", "Steel"],
      },
    ],
    baseSpecies: "Toxapex",
  },
  mudsdale: {
    level: 83,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Earthquake",
          "Heavy Slam",
          "Roar",
          "Stealth Rock",
          "Stone Edge",
        ],
        abilities: ["Stamina"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Mudsdale",
  },
  araquanid: {
    level: 82,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Hydro Pump",
          "Leech Life",
          "Liquidation",
          "Mirror Coat",
          "Sticky Web",
        ],
        abilities: ["Water Bubble"],
        teraTypes: ["Ground", "Steel", "Water"],
      },
    ],
    baseSpecies: "Araquanid",
  },
  lurantis: {
    level: 87,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Defog",
          "Knock Off",
          "Leaf Storm",
          "Superpower",
          "Synthesis",
        ],
        abilities: ["Contrary"],
        teraTypes: ["Fighting"],
      },
      {
        role: "AV Pivot",
        movepool: ["Knock Off", "Leaf Storm", "Leech Life", "Superpower"],
        abilities: ["Contrary"],
        teraTypes: ["Fighting", "Steel", "Water"],
      },
    ],
    baseSpecies: "Lurantis",
  },
  salazzle: {
    level: 83,
    sets: [
      {
        role: "Fast Support",
        movepool: ["Flamethrower", "Protect", "Substitute", "Toxic"],
        abilities: ["Corrosion"],
        teraTypes: ["Flying", "Grass"],
      },
    ],
    baseSpecies: "Salazzle",
  },
  tsareena: {
    level: 87,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "High Jump Kick",
          "Knock Off",
          "Power Whip",
          "Rapid Spin",
          "Synthesis",
          "Triple Axel",
          "U-turn",
        ],
        abilities: ["Queenly Majesty"],
        teraTypes: ["Fighting", "Steel"],
      },
    ],
    baseSpecies: "Tsareena",
  },
  comfey: {
    level: 85,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Draining Kiss", "Giga Drain", "Stored Power"],
        abilities: ["Triage"],
        teraTypes: ["Fairy", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Comfey",
  },
  oranguru: {
    level: 92,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Focus Blast",
          "Nasty Plot",
          "Psychic",
          "Psyshock",
          "Thunderbolt",
        ],
        abilities: ["Inner Focus"],
        teraTypes: ["Electric", "Fighting", "Psychic"],
      },
      {
        role: "Wallbreaker",
        movepool: [
          "Focus Blast",
          "Hyper Voice",
          "Nasty Plot",
          "Psyshock",
          "Thunderbolt",
          "Trick",
        ],
        abilities: ["Inner Focus"],
        teraTypes: ["Electric", "Fighting", "Normal", "Psychic"],
      },
    ],
    baseSpecies: "Oranguru",
  },
  passimian: {
    level: 83,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Earthquake",
          "Gunk Shot",
          "Knock Off",
          "Rock Slide",
          "U-turn",
        ],
        abilities: ["Defiant"],
        teraTypes: ["Dark", "Fighting", "Poison"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Bulk Up", "Drain Punch", "Gunk Shot", "Knock Off"],
        abilities: ["Defiant"],
        teraTypes: ["Dark", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Passimian",
  },
  palossand: {
    level: 89,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earth Power",
          "Shadow Ball",
          "Shore Up",
          "Sludge Bomb",
          "Stealth Rock",
        ],
        abilities: ["Water Compaction"],
        teraTypes: ["Poison", "Water"],
      },
    ],
    baseSpecies: "Palossand",
  },
  minior: {
    level: 79,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Acrobatics", "Earthquake", "Power Gem", "Shell Smash"],
        abilities: ["Shields Down"],
        teraTypes: ["Flying", "Ground", "Steel", "Water"],
      },
    ],
    baseSpecies: "Minior",
  },
  komala: {
    level: 89,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Double-Edge",
          "Earthquake",
          "Knock Off",
          "Superpower",
          "U-turn",
          "Wood Hammer",
        ],
        abilities: ["Comatose"],
        teraTypes: ["Fighting", "Grass", "Ground"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Body Slam",
          "Earthquake",
          "Knock Off",
          "Rapid Spin",
          "U-turn",
        ],
        abilities: ["Comatose"],
        teraTypes: ["Ghost"],
      },
    ],
    baseSpecies: "Komala",
  },
  mimikyu: {
    level: 79,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Drain Punch",
          "Play Rough",
          "Shadow Sneak",
          "Swords Dance",
          "Wood Hammer",
        ],
        abilities: ["Disguise"],
        teraTypes: ["Fairy", "Fighting", "Grass"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Play Rough", "Shadow Claw", "Shadow Sneak", "Swords Dance"],
        abilities: ["Disguise"],
        teraTypes: ["Fairy", "Ghost"],
      },
    ],
    baseSpecies: "Mimikyu",
  },
  bruxish: {
    level: 85,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Aqua Jet",
          "Crunch",
          "Flip Turn",
          "Ice Fang",
          "Psychic Fangs",
          "Swords Dance",
          "Wave Crash",
        ],
        abilities: ["Strong Jaw"],
        teraTypes: ["Dark", "Psychic"],
      },
    ],
    baseSpecies: "Bruxish",
  },
  kommoo: {
    level: 78,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Boomburst",
          "Clanging Scales",
          "Clangorous Soul",
          "Close Combat",
          "Iron Head",
        ],
        abilities: ["Soundproof"],
        teraTypes: ["Normal", "Steel"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Close Combat", "Iron Head", "Scale Shot", "Swords Dance"],
        abilities: ["Soundproof"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Kommo-o",
  },
  solgaleo: {
    level: 74,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Close Combat",
          "Earthquake",
          "Flame Charge",
          "Knock Off",
          "Psychic",
          "Sunsteel Strike",
        ],
        abilities: ["Full Metal Body"],
        teraTypes: ["Dark", "Fighting", "Ground"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Close Combat",
          "Earthquake",
          "Flare Blitz",
          "Knock Off",
          "Morning Sun",
          "Psychic Fangs",
          "Sunsteel Strike",
        ],
        abilities: ["Full Metal Body"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Solgaleo",
  },
  lunala: {
    level: 70,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Moonblast", "Moongeist Beam", "Moonlight"],
        abilities: ["Shadow Shield"],
        teraTypes: ["Fairy"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Calm Mind", "Moongeist Beam", "Moonlight", "Psyshock"],
        abilities: ["Shadow Shield"],
        teraTypes: ["Dark", "Fairy"],
      },
    ],
    baseSpecies: "Lunala",
  },
  necrozma: {
    level: 80,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Dragon Dance",
          "Earthquake",
          "Knock Off",
          "Photon Geyser",
          "Swords Dance",
        ],
        abilities: ["Prism Armor"],
        teraTypes: ["Dark", "Ground", "Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Earth Power",
          "Heat Wave",
          "Moonlight",
          "Photon Geyser",
        ],
        abilities: ["Prism Armor"],
        teraTypes: ["Fairy", "Ground", "Steel"],
      },
    ],
    baseSpecies: "Necrozma",
  },
  necrozmaduskmane: {
    level: 69,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Dragon Dance",
          "Earthquake",
          "Morning Sun",
          "Sunsteel Strike",
        ],
        abilities: ["Prism Armor"],
        teraTypes: ["Ground", "Steel", "Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Dragon Dance",
          "Earthquake",
          "Photon Geyser",
          "Sunsteel Strike",
        ],
        abilities: ["Prism Armor"],
        teraTypes: ["Ground", "Steel", "Water"],
      },
    ],
    baseSpecies: "Necrozma",
  },
  necrozmadawnwings: {
    level: 76,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Moongeist Beam", "Moonlight", "Photon Geyser"],
        abilities: ["Prism Armor"],
        teraTypes: ["Dark", "Fairy"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Brick Break",
          "Dragon Dance",
          "Moongeist Beam",
          "Photon Geyser",
        ],
        abilities: ["Prism Armor"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Necrozma",
  },
  magearna: {
    level: 77,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Aura Sphere",
          "Flash Cannon",
          "Fleur Cannon",
          "Pain Split",
          "Spikes",
          "Thunder Wave",
          "Volt Switch",
        ],
        abilities: ["Soul-Heart"],
        teraTypes: ["Fairy", "Fighting", "Water"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Flash Cannon", "Fleur Cannon", "Shift Gear"],
        abilities: ["Soul-Heart"],
        teraTypes: ["Fairy", "Flying", "Steel", "Water"],
      },
    ],
    baseSpecies: "Magearna",
  },
  rillaboom: {
    level: 79,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Grassy Glide",
          "Knock Off",
          "Swords Dance",
          "U-turn",
          "Wood Hammer",
        ],
        abilities: ["Grassy Surge"],
        teraTypes: ["Grass"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Grassy Glide",
          "High Horsepower",
          "Swords Dance",
          "U-turn",
          "Wood Hammer",
        ],
        abilities: ["Grassy Surge"],
        teraTypes: ["Grass"],
      },
    ],
    baseSpecies: "Rillaboom",
  },
  cinderace: {
    level: 77,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Gunk Shot", "High Jump Kick", "Pyro Ball", "U-turn"],
        abilities: ["Libero"],
        teraTypes: ["Fire"],
      },
      {
        role: "Fast Support",
        movepool: [
          "Court Change",
          "High Jump Kick",
          "Pyro Ball",
          "Sucker Punch",
        ],
        abilities: ["Libero"],
        teraTypes: ["Fighting", "Fire"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Court Change",
          "Gunk Shot",
          "High Jump Kick",
          "Pyro Ball",
          "U-turn",
        ],
        abilities: ["Libero"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Cinderace",
  },
  inteleon: {
    level: 81,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Dark Pulse", "Hydro Pump", "Ice Beam", "U-turn"],
        abilities: ["Torrent"],
        teraTypes: ["Water"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Hydro Pump", "Ice Beam", "Scald", "U-turn"],
        abilities: ["Torrent"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Inteleon",
  },
  greedent: {
    level: 86,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Body Slam",
          "Double-Edge",
          "Earthquake",
          "Knock Off",
          "Swords Dance",
        ],
        abilities: ["Cheek Pouch"],
        teraTypes: ["Ghost", "Ground"],
      },
    ],
    baseSpecies: "Greedent",
  },
  corviknight: {
    level: 80,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Body Press", "Brave Bird", "Defog", "Roost", "U-turn"],
        abilities: ["Mirror Armor", "Pressure"],
        teraTypes: ["Dragon"],
      },
    ],
    baseSpecies: "Corviknight",
  },
  drednaw: {
    level: 81,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Crunch", "Liquidation", "Shell Smash", "Stone Edge"],
        abilities: ["Strong Jaw"],
        teraTypes: ["Dark"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Earthquake", "Liquidation", "Shell Smash", "Stone Edge"],
        abilities: ["Shell Armor", "Swift Swim"],
        teraTypes: ["Ground", "Water"],
      },
    ],
    baseSpecies: "Drednaw",
  },
  coalossal: {
    level: 89,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Flamethrower",
          "Overheat",
          "Rapid Spin",
          "Spikes",
          "Stealth Rock",
          "Stone Edge",
          "Will-O-Wisp",
        ],
        abilities: ["Flame Body"],
        teraTypes: ["Ghost", "Grass", "Water"],
      },
    ],
    baseSpecies: "Coalossal",
  },
  flapple: {
    level: 88,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Dragon Dance",
          "Grav Apple",
          "Outrage",
          "Sucker Punch",
          "U-turn",
        ],
        abilities: ["Hustle"],
        teraTypes: ["Dragon", "Grass"],
      },
    ],
    baseSpecies: "Flapple",
  },
  appletun: {
    level: 92,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Apple Acid",
          "Draco Meteor",
          "Dragon Pulse",
          "Leech Seed",
          "Recover",
        ],
        abilities: ["Thick Fat"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Appletun",
  },
  sandaconda: {
    level: 84,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Coil", "Earthquake", "Glare", "Rest", "Stone Edge"],
        abilities: ["Shed Skin"],
        teraTypes: ["Dragon", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Earthquake", "Glare", "Rest", "Stealth Rock", "Stone Edge"],
        abilities: ["Shed Skin"],
        teraTypes: ["Dragon", "Water"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Coil", "Earthquake", "Rock Blast", "Scale Shot"],
        abilities: ["Shed Skin"],
        teraTypes: ["Dragon"],
      },
    ],
    baseSpecies: "Sandaconda",
  },
  cramorant: {
    level: 86,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Brave Bird", "Defog", "Roost", "Surf"],
        abilities: ["Gulp Missile"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Cramorant",
  },
  barraskewda: {
    level: 81,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Close Combat",
          "Flip Turn",
          "Poison Jab",
          "Psychic Fangs",
          "Throat Chop",
          "Waterfall",
        ],
        abilities: ["Swift Swim"],
        teraTypes: ["Fighting", "Water"],
      },
    ],
    baseSpecies: "Barraskewda",
  },
  toxtricity: {
    level: 82,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Boomburst", "Overdrive", "Sludge Wave", "Volt Switch"],
        abilities: ["Punk Rock"],
        teraTypes: ["Normal"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Boomburst", "Gunk Shot", "Overdrive", "Shift Gear"],
        abilities: ["Punk Rock"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Toxtricity",
  },
  polteageist: {
    level: 79,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Giga Drain",
          "Shadow Ball",
          "Shell Smash",
          "Stored Power",
          "Strength Sap",
        ],
        abilities: ["Cursed Body"],
        teraTypes: ["Psychic"],
      },
    ],
    baseSpecies: "Polteageist",
  },
  hatterene: {
    level: 85,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Draining Kiss",
          "Mystical Fire",
          "Psychic",
          "Psyshock",
        ],
        abilities: ["Magic Bounce"],
        teraTypes: ["Fairy", "Steel"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Draining Kiss",
          "Mystical Fire",
          "Nuzzle",
          "Psychic",
          "Psychic Noise",
        ],
        abilities: ["Magic Bounce"],
        teraTypes: ["Fairy", "Steel"],
      },
    ],
    baseSpecies: "Hatterene",
  },
  grimmsnarl: {
    level: 83,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Light Screen",
          "Parting Shot",
          "Reflect",
          "Spirit Break",
          "Thunder Wave",
        ],
        abilities: ["Prankster"],
        teraTypes: ["Poison", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Parting Shot",
          "Spirit Break",
          "Sucker Punch",
          "Taunt",
          "Thunder Wave",
        ],
        abilities: ["Prankster"],
        teraTypes: ["Poison", "Steel"],
      },
    ],
    baseSpecies: "Grimmsnarl",
  },
  perrserker: {
    level: 89,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Iron Head",
          "Knock Off",
          "Stealth Rock",
          "U-turn",
        ],
        abilities: ["Tough Claws"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Wallbreaker",
        movepool: [
          "Close Combat",
          "Iron Head",
          "Knock Off",
          "Stealth Rock",
          "U-turn",
        ],
        abilities: ["Steely Spirit"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Perrserker",
  },
  alcremie: {
    level: 90,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Acid Armor",
          "Alluring Voice",
          "Calm Mind",
          "Dazzling Gleam",
          "Recover",
        ],
        abilities: ["Aroma Veil"],
        teraTypes: ["Poison", "Steel"],
      },
    ],
    baseSpecies: "Alcremie",
  },
  falinks: {
    level: 84,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Close Combat", "Iron Head", "Knock Off", "No Retreat"],
        abilities: ["Defiant"],
        teraTypes: ["Dark", "Steel"],
      },
    ],
    baseSpecies: "Falinks",
  },
  pincurchin: {
    level: 100,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Discharge",
          "Recover",
          "Scald",
          "Spikes",
          "Thunderbolt",
          "Toxic Spikes",
        ],
        abilities: ["Electric Surge"],
        teraTypes: ["Water"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Curse", "Liquidation", "Recover", "Zing Zap"],
        abilities: ["Electric Surge"],
        teraTypes: ["Grass", "Water"],
      },
    ],
    baseSpecies: "Pincurchin",
  },
  frosmoth: {
    level: 82,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Bug Buzz",
          "Giga Drain",
          "Hurricane",
          "Ice Beam",
          "Quiver Dance",
        ],
        abilities: ["Ice Scales"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Frosmoth",
  },
  stonjourner: {
    level: 91,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Earthquake",
          "Heat Crash",
          "Rock Polish",
          "Stealth Rock",
          "Stone Edge",
        ],
        abilities: ["Power Spot"],
        teraTypes: ["Fire", "Ground"],
      },
    ],
    baseSpecies: "Stonjourner",
  },
  eiscue: {
    level: 88,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Belly Drum",
          "Ice Spinner",
          "Iron Head",
          "Liquidation",
          "Substitute",
          "Zen Headbutt",
        ],
        abilities: ["Ice Face"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Eiscue",
  },
  indeedee: {
    level: 84,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Calm Mind",
          "Dazzling Gleam",
          "Expanding Force",
          "Healing Wish",
          "Hyper Voice",
          "Shadow Ball",
        ],
        abilities: ["Psychic Surge"],
        teraTypes: ["Psychic"],
      },
    ],
    baseSpecies: "Indeedee",
  },
  indeedeef: {
    level: 90,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Calm Mind",
          "Dazzling Gleam",
          "Healing Wish",
          "Hyper Voice",
          "Psychic",
          "Psyshock",
          "Shadow Ball",
        ],
        abilities: ["Psychic Surge"],
        teraTypes: ["Fairy", "Psychic"],
      },
    ],
    baseSpecies: "Indeedee",
  },
  morpeko: {
    level: 88,
    sets: [
      {
        role: "Fast Support",
        movepool: ["Aura Wheel", "Parting Shot", "Protect", "Rapid Spin"],
        abilities: ["Hunger Switch"],
        teraTypes: ["Electric"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Aura Wheel", "Knock Off", "Protect", "Rapid Spin"],
        abilities: ["Hunger Switch"],
        teraTypes: ["Electric"],
      },
    ],
    baseSpecies: "Morpeko",
  },
  copperajah: {
    level: 86,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Earthquake",
          "Iron Head",
          "Play Rough",
          "Rock Slide",
          "Stealth Rock",
          "Superpower",
        ],
        abilities: ["Sheer Force"],
        teraTypes: ["Fairy"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Earthquake",
          "Heat Crash",
          "Heavy Slam",
          "Knock Off",
          "Stone Edge",
          "Supercell Slam",
          "Superpower",
        ],
        abilities: ["Heavy Metal"],
        teraTypes: ["Fire", "Steel"],
      },
    ],
    baseSpecies: "Copperajah",
  },
  duraludon: {
    level: 82,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Press",
          "Draco Meteor",
          "Dragon Tail",
          "Flash Cannon",
          "Iron Defense",
          "Stealth Rock",
          "Thunder Wave",
        ],
        abilities: ["Light Metal"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Duraludon",
  },
  dragapult: {
    level: 77,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Draco Meteor", "Fire Blast", "Shadow Ball", "U-turn"],
        abilities: ["Infiltrator"],
        teraTypes: ["Dragon", "Fire", "Ghost"],
      },
      {
        role: "Fast Support",
        movepool: ["Dragon Darts", "Hex", "U-turn", "Will-O-Wisp"],
        abilities: ["Cursed Body", "Infiltrator"],
        teraTypes: ["Dragon", "Fairy"],
      },
    ],
    baseSpecies: "Dragapult",
  },
  zacian: {
    level: 69,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Crunch",
          "Play Rough",
          "Psychic Fangs",
          "Swords Dance",
          "Wild Charge",
        ],
        abilities: ["Intrepid Sword"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Zacian",
  },
  zaciancrowned: {
    level: 64,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Behemoth Blade",
          "Close Combat",
          "Play Rough",
          "Swords Dance",
        ],
        abilities: ["Intrepid Sword"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Zacian",
  },
  zamazenta: {
    level: 71,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Close Combat",
          "Crunch",
          "Iron Head",
          "Psychic Fangs",
          "Stone Edge",
        ],
        abilities: ["Dauntless Shield"],
        teraTypes: ["Dark", "Fighting", "Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Body Press",
          "Crunch",
          "Iron Defense",
          "Iron Head",
          "Rest",
          "Stone Edge",
          "Substitute",
        ],
        abilities: ["Dauntless Shield"],
        teraTypes: ["Fighting", "Steel"],
      },
    ],
    baseSpecies: "Zamazenta",
  },
  zamazentacrowned: {
    level: 68,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Body Press", "Heavy Slam", "Iron Defense", "Stone Edge"],
        abilities: ["Dauntless Shield"],
        teraTypes: ["Fighting", "Ghost"],
      },
    ],
    baseSpecies: "Zamazenta",
  },
  eternatus: {
    level: 69,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Dynamax Cannon", "Fire Blast", "Recover", "Sludge Bomb"],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Fire"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Dynamax Cannon",
          "Flamethrower",
          "Recover",
          "Toxic",
          "Toxic Spikes",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Dynamax Cannon",
          "Fire Blast",
          "Meteor Beam",
          "Sludge Bomb",
        ],
        abilities: ["Pressure"],
        teraTypes: ["Dragon", "Fire", "Poison"],
      },
    ],
    baseSpecies: "Eternatus",
  },
  urshifu: {
    level: 74,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Poison Jab",
          "Sucker Punch",
          "Swords Dance",
          "U-turn",
          "Wicked Blow",
        ],
        abilities: ["Unseen Fist"],
        teraTypes: ["Dark", "Fighting", "Poison"],
      },
    ],
    baseSpecies: "Urshifu",
  },
  urshifurapidstrike: {
    level: 75,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Aqua Jet",
          "Close Combat",
          "Ice Spinner",
          "Surging Strikes",
          "Swords Dance",
          "U-turn",
        ],
        abilities: ["Unseen Fist"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Urshifu",
  },
  zarude: {
    level: 77,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Close Combat",
          "Knock Off",
          "Power Whip",
          "Swords Dance",
          "Synthesis",
        ],
        abilities: ["Leaf Guard"],
        teraTypes: ["Dark", "Fighting", "Grass"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Close Combat", "Knock Off", "Power Whip", "U-turn"],
        abilities: ["Leaf Guard"],
        teraTypes: ["Dark", "Fighting", "Grass"],
      },
    ],
    baseSpecies: "Zarude",
  },
  regieleki: {
    level: 79,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Ancient Power",
          "Rapid Spin",
          "Thunderbolt",
          "Electro Ball",
        ],
        abilities: ["Transistor"],
        teraTypes: ["Electric"],
      },
    ],
    baseSpecies: "Regieleki",
  },
  regidrago: {
    level: 77,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Draco Meteor", "Dragon Dance", "Earthquake", "Outrage"],
        abilities: ["Dragon's Maw"],
        teraTypes: ["Dragon"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Draco Meteor", "Dragon Energy", "Earthquake", "Outrage"],
        abilities: ["Dragon's Maw"],
        teraTypes: ["Dragon"],
      },
    ],
    baseSpecies: "Regidrago",
  },
  glastrier: {
    level: 86,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Close Combat",
          "Heavy Slam",
          "High Horsepower",
          "Icicle Crash",
          "Swords Dance",
        ],
        abilities: ["Chilling Neigh"],
        teraTypes: ["Fighting", "Ground", "Steel"],
      },
    ],
    baseSpecies: "Glastrier",
  },
  spectrier: {
    level: 75,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Dark Pulse",
          "Draining Kiss",
          "Nasty Plot",
          "Shadow Ball",
          "Substitute",
          "Will-O-Wisp",
        ],
        abilities: ["Grim Neigh"],
        teraTypes: ["Dark", "Fairy"],
      },
    ],
    baseSpecies: "Spectrier",
  },
  calyrex: {
    level: 93,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Calm Mind",
          "Encore",
          "Giga Drain",
          "Leech Seed",
          "Psychic",
          "Psyshock",
        ],
        abilities: ["Unnerve"],
        teraTypes: ["Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Press",
          "Encore",
          "Giga Drain",
          "Leech Seed",
          "Psychic",
          "Psyshock",
        ],
        abilities: ["Unnerve"],
        teraTypes: ["Fighting", "Steel"],
      },
    ],
    baseSpecies: "Calyrex",
  },
  calyrexice: {
    level: 72,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Agility",
          "Close Combat",
          "Glacial Lance",
          "High Horsepower",
        ],
        abilities: ["As One (Glastrier)"],
        teraTypes: ["Fighting", "Ground"],
      },
      {
        role: "Wallbreaker",
        movepool: [
          "Close Combat",
          "Glacial Lance",
          "High Horsepower",
          "Trick Room",
        ],
        abilities: ["As One (Glastrier)"],
        teraTypes: ["Fighting", "Ground"],
      },
    ],
    baseSpecies: "Calyrex",
  },
  calyrexshadow: {
    level: 64,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Astral Barrage",
          "Nasty Plot",
          "Pollen Puff",
          "Psyshock",
          "Trick",
        ],
        abilities: ["As One (Spectrier)"],
        teraTypes: ["Dark", "Ghost"],
      },
    ],
    baseSpecies: "Calyrex",
  },
  wyrdeer: {
    level: 87,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Slam",
          "Earthquake",
          "Megahorn",
          "Psychic Noise",
          "Thunder Wave",
        ],
        abilities: ["Intimidate"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Wyrdeer",
  },
  kleavor: {
    level: 78,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Close Combat",
          "Defog",
          "Stone Axe",
          "Swords Dance",
          "U-turn",
          "X-Scissor",
        ],
        abilities: ["Sharpness"],
        teraTypes: ["Bug", "Fighting", "Rock"],
      },
    ],
    baseSpecies: "Kleavor",
  },
  ursaluna: {
    level: 79,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Crunch",
          "Facade",
          "Headlong Rush",
          "Swords Dance",
          "Throat Chop",
          "Trailblaze",
        ],
        abilities: ["Guts"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Ursaluna",
  },
  ursalunabloodmoon: {
    level: 79,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Blood Moon", "Calm Mind", "Earth Power", "Moonlight"],
        abilities: ["Mind's Eye"],
        teraTypes: ["Ghost", "Normal", "Poison"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Blood Moon", "Calm Mind", "Moonlight", "Vacuum Wave"],
        abilities: ["Mind's Eye"],
        teraTypes: ["Fighting", "Ghost", "Normal", "Poison"],
      },
    ],
    baseSpecies: "Ursaluna",
  },
  enamorus: {
    level: 79,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Play Rough",
          "Substitute",
          "Superpower",
          "Taunt",
          "Zen Headbutt",
        ],
        abilities: ["Contrary"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Calm Mind",
          "Earth Power",
          "Moonblast",
          "Mystical Fire",
          "Substitute",
        ],
        abilities: ["Cute Charm"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Enamorus",
  },
  enamorustherian: {
    level: 83,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Earth Power",
          "Moonblast",
          "Mystical Fire",
          "Psychic",
          "Superpower",
        ],
        abilities: ["Overcoat"],
        teraTypes: ["Fairy", "Ground"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Agility",
          "Earth Power",
          "Moonblast",
          "Mystical Fire",
          "Superpower",
        ],
        abilities: ["Overcoat"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Enamorus",
  },
  meowscarada: {
    level: 78,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Flower Trick",
          "Knock Off",
          "Toxic Spikes",
          "Triple Axel",
          "U-turn",
        ],
        abilities: ["Protean"],
        teraTypes: ["Dark", "Grass"],
      },
    ],
    baseSpecies: "Meowscarada",
  },
  skeledirge: {
    level: 79,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Flame Charge", "Shadow Ball", "Slack Off", "Torch Song"],
        abilities: ["Unaware"],
        teraTypes: ["Fairy", "Water"],
      },
      {
        role: "Bulky Support",
        movepool: ["Hex", "Slack Off", "Torch Song", "Will-O-Wisp"],
        abilities: ["Unaware"],
        teraTypes: ["Fairy", "Water"],
      },
    ],
    baseSpecies: "Skeledirge",
  },
  quaquaval: {
    level: 79,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Aqua Step",
          "Close Combat",
          "Knock Off",
          "Rapid Spin",
          "Roost",
          "Triple Axel",
          "U-turn",
        ],
        abilities: ["Moxie"],
        teraTypes: ["Fighting", "Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Aqua Step",
          "Close Combat",
          "Encore",
          "Knock Off",
          "Roost",
          "Swords Dance",
          "Triple Axel",
        ],
        abilities: ["Moxie"],
        teraTypes: ["Fighting", "Water"],
      },
    ],
    baseSpecies: "Quaquaval",
  },
  oinkologne: {
    level: 92,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Body Slam",
          "Curse",
          "Double-Edge",
          "High Horsepower",
          "Lash Out",
        ],
        abilities: ["Thick Fat"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Oinkologne",
  },
  oinkolognef: {
    level: 92,
    sets: [
      {
        role: "Bulky Setup",
        movepool: [
          "Body Slam",
          "Curse",
          "Double-Edge",
          "High Horsepower",
          "Lash Out",
        ],
        abilities: ["Thick Fat"],
        teraTypes: ["Ground"],
      },
      {
        role: "Bulky Support",
        movepool: ["Body Slam", "Curse", "Rest", "Sleep Talk"],
        abilities: ["Thick Fat"],
        teraTypes: ["Fairy", "Poison"],
      },
    ],
    baseSpecies: "Oinkologne",
  },
  spidops: {
    level: 96,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Circle Throw",
          "Knock Off",
          "Spikes",
          "Sticky Web",
          "Toxic Spikes",
          "U-turn",
        ],
        abilities: ["Stakeout"],
        teraTypes: ["Ghost"],
      },
    ],
    baseSpecies: "Spidops",
  },
  lokix: {
    level: 82,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "First Impression",
          "Knock Off",
          "Leech Life",
          "Sucker Punch",
        ],
        abilities: ["Tinted Lens"],
        teraTypes: ["Bug"],
      },
      {
        role: "Fast Attacker",
        movepool: ["First Impression", "Knock Off", "Sucker Punch", "U-turn"],
        abilities: ["Tinted Lens"],
        teraTypes: ["Bug"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Knock Off", "Leech Life", "Sucker Punch", "Swords Dance"],
        abilities: ["Tinted Lens"],
        teraTypes: ["Dark"],
      },
    ],
    baseSpecies: "Lokix",
  },
  pawmot: {
    level: 80,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Double Shock",
          "Knock Off",
          "Nuzzle",
          "Revival Blessing",
        ],
        abilities: ["Volt Absorb"],
        teraTypes: ["Electric"],
      },
      {
        role: "Wallbreaker",
        movepool: [
          "Close Combat",
          "Double Shock",
          "Ice Punch",
          "Revival Blessing",
        ],
        abilities: ["Iron Fist"],
        teraTypes: ["Electric"],
      },
    ],
    baseSpecies: "Pawmot",
  },
  maushold: {
    level: 76,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Bite", "Encore", "Population Bomb", "Tidy Up"],
        abilities: ["Technician"],
        teraTypes: ["Ghost", "Normal"],
      },
    ],
    baseSpecies: "Maushold",
  },
  dachsbun: {
    level: 92,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Body Press",
          "Play Rough",
          "Protect",
          "Stomping Tantrum",
          "Wish",
        ],
        abilities: ["Well-Baked Body"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Dachsbun",
  },
  arboliva: {
    level: 91,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Earth Power", "Energy Ball", "Hyper Voice", "Strength Sap"],
        abilities: ["Seed Sower"],
        teraTypes: ["Grass", "Ground", "Poison"],
      },
      {
        role: "Bulky Support",
        movepool: ["Hyper Voice", "Leech Seed", "Protect", "Substitute"],
        abilities: ["Harvest"],
        teraTypes: ["Poison", "Water"],
      },
    ],
    baseSpecies: "Arboliva",
  },
  squawkabilly: {
    level: 85,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Brave Bird", "Facade", "Protect", "Quick Attack", "U-turn"],
        abilities: ["Guts"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Squawkabilly",
  },
  squawkabillywhite: {
    level: 89,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Brave Bird",
          "Double-Edge",
          "Foul Play",
          "Parting Shot",
          "Quick Attack",
        ],
        abilities: ["Hustle"],
        teraTypes: ["Flying", "Normal"],
      },
    ],
    baseSpecies: "Squawkabilly",
  },
  squawkabillyblue: {
    level: 85,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Brave Bird", "Facade", "Protect", "Quick Attack", "U-turn"],
        abilities: ["Guts"],
        teraTypes: ["Normal"],
      },
    ],
    baseSpecies: "Squawkabilly",
  },
  squawkabillyyellow: {
    level: 89,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Brave Bird",
          "Double-Edge",
          "Foul Play",
          "Parting Shot",
          "Quick Attack",
        ],
        abilities: ["Hustle"],
        teraTypes: ["Flying", "Normal"],
      },
    ],
    baseSpecies: "Squawkabilly",
  },
  garganacl: {
    level: 80,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Earthquake",
          "Protect",
          "Recover",
          "Salt Cure",
          "Stealth Rock",
        ],
        abilities: ["Purifying Salt"],
        teraTypes: ["Dragon", "Ghost"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Body Press",
          "Protect",
          "Recover",
          "Salt Cure",
          "Stealth Rock",
        ],
        abilities: ["Purifying Salt"],
        teraTypes: ["Dragon", "Ghost"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Body Press", "Iron Defense", "Recover", "Salt Cure"],
        abilities: ["Purifying Salt"],
        teraTypes: ["Dragon", "Ghost"],
      },
    ],
    baseSpecies: "Garganacl",
  },
  armarouge: {
    level: 80,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Armor Cannon",
          "Aura Sphere",
          "Energy Ball",
          "Focus Blast",
          "Psyshock",
        ],
        abilities: ["Weak Armor"],
        teraTypes: ["Fighting", "Fire", "Grass", "Psychic"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Armor Cannon", "Energy Ball", "Meteor Beam", "Psyshock"],
        abilities: ["Weak Armor"],
        teraTypes: ["Fire", "Grass"],
      },
    ],
    baseSpecies: "Armarouge",
  },
  ceruledge: {
    level: 78,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Bitter Blade",
          "Close Combat",
          "Poltergeist",
          "Shadow Sneak",
          "Swords Dance",
        ],
        abilities: ["Weak Armor"],
        teraTypes: ["Fighting", "Fire", "Ghost"],
      },
    ],
    baseSpecies: "Ceruledge",
  },
  bellibolt: {
    level: 84,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Muddy Water",
          "Slack Off",
          "Thunderbolt",
          "Toxic",
          "Volt Switch",
        ],
        abilities: ["Electromorphosis"],
        teraTypes: ["Electric", "Water"],
      },
    ],
    baseSpecies: "Bellibolt",
  },
  kilowattrel: {
    level: 83,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Hurricane",
          "Roost",
          "Thunder Wave",
          "Thunderbolt",
          "U-turn",
        ],
        abilities: ["Volt Absorb"],
        teraTypes: ["Electric", "Flying", "Steel", "Water"],
      },
    ],
    baseSpecies: "Kilowattrel",
  },
  mabosstiff: {
    level: 86,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Crunch", "Play Rough", "Psychic Fangs", "Wild Charge"],
        abilities: ["Stakeout"],
        teraTypes: ["Dark", "Fairy"],
      },
    ],
    baseSpecies: "Mabosstiff",
  },
  grafaiai: {
    level: 86,
    sets: [
      {
        role: "AV Pivot",
        movepool: ["Gunk Shot", "Knock Off", "Super Fang", "U-turn"],
        abilities: ["Poison Touch"],
        teraTypes: ["Dark"],
      },
      {
        role: "Fast Support",
        movepool: ["Encore", "Gunk Shot", "Knock Off", "Parting Shot"],
        abilities: ["Prankster"],
        teraTypes: ["Dark"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Gunk Shot", "Knock Off", "Low Kick", "Swords Dance"],
        abilities: ["Poison Touch"],
        teraTypes: ["Dark"],
      },
    ],
    baseSpecies: "Grafaiai",
  },
  brambleghast: {
    level: 88,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Leech Seed",
          "Poltergeist",
          "Power Whip",
          "Rapid Spin",
          "Spikes",
          "Strength Sap",
          "Substitute",
        ],
        abilities: ["Wind Rider"],
        teraTypes: ["Fairy", "Steel", "Water"],
      },
    ],
    baseSpecies: "Brambleghast",
  },
  toedscruel: {
    level: 87,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earth Power",
          "Giga Drain",
          "Knock Off",
          "Leaf Storm",
          "Rapid Spin",
          "Spore",
          "Toxic",
        ],
        abilities: ["Mycelium Might"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Toedscruel",
  },
  klawf: {
    level: 90,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Crabhammer",
          "High Horsepower",
          "Knock Off",
          "Stealth Rock",
          "Stone Edge",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Dark", "Ground", "Rock", "Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Crabhammer",
          "High Horsepower",
          "Knock Off",
          "Stone Edge",
          "Swords Dance",
        ],
        abilities: ["Anger Shell"],
        teraTypes: ["Dark", "Ground", "Rock", "Water"],
      },
    ],
    baseSpecies: "Klawf",
  },
  scovillain: {
    level: 91,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Flamethrower", "Leech Seed", "Protect", "Substitute"],
        abilities: ["Chlorophyll"],
        teraTypes: ["Steel"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Energy Ball", "Flamethrower", "Leaf Storm", "Overheat"],
        abilities: ["Chlorophyll"],
        teraTypes: ["Fire", "Grass"],
      },
      {
        role: "Wallbreaker",
        movepool: [
          "Energy Ball",
          "Fire Blast",
          "Stomping Tantrum",
          "Sunny Day",
        ],
        abilities: ["Chlorophyll"],
        teraTypes: ["Fire", "Grass", "Ground"],
      },
    ],
    baseSpecies: "Scovillain",
  },
  rabsca: {
    level: 91,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Bug Buzz",
          "Earth Power",
          "Psychic",
          "Recover",
          "Revival Blessing",
          "Trick Room",
        ],
        abilities: ["Synchronize"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Rabsca",
  },
  espathra: {
    level: 80,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Dazzling Gleam", "Lumina Crash", "Trick", "U-turn"],
        abilities: ["Speed Boost"],
        teraTypes: ["Fairy", "Psychic"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Calm Mind",
          "Dazzling Gleam",
          "Protect",
          "Roost",
          "Stored Power",
          "Substitute",
        ],
        abilities: ["Speed Boost"],
        teraTypes: ["Fairy"],
      },
    ],
    baseSpecies: "Espathra",
  },
  tinkaton: {
    level: 82,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Encore",
          "Gigaton Hammer",
          "Knock Off",
          "Play Rough",
          "Stealth Rock",
          "Thunder Wave",
        ],
        abilities: ["Mold Breaker"],
        teraTypes: ["Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Gigaton Hammer", "Knock Off", "Play Rough", "Swords Dance"],
        abilities: ["Mold Breaker"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Tinkaton",
  },
  wugtrio: {
    level: 91,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Aqua Jet",
          "Liquidation",
          "Stomping Tantrum",
          "Throat Chop",
        ],
        abilities: ["Gooey"],
        teraTypes: ["Dark", "Ground", "Water"],
      },
    ],
    baseSpecies: "Wugtrio",
  },
  bombirdier: {
    level: 85,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Brave Bird",
          "Knock Off",
          "Roost",
          "Stone Edge",
          "Sucker Punch",
          "U-turn",
        ],
        abilities: ["Rocky Payload"],
        teraTypes: ["Rock"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Brave Bird",
          "Knock Off",
          "Roost",
          "Stealth Rock",
          "Sucker Punch",
          "U-turn",
        ],
        abilities: ["Big Pecks"],
        teraTypes: ["Dark", "Steel"],
      },
    ],
    baseSpecies: "Bombirdier",
  },
  palafin: {
    level: 77,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Close Combat", "Flip Turn", "Jet Punch", "Wave Crash"],
        abilities: ["Zero to Hero"],
        teraTypes: ["Fighting", "Water"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Bulk Up",
          "Drain Punch",
          "Ice Punch",
          "Jet Punch",
          "Wave Crash",
        ],
        abilities: ["Zero to Hero"],
        teraTypes: ["Dragon", "Steel"],
      },
    ],
    baseSpecies: "Palafin",
  },
  revavroom: {
    level: 79,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Gunk Shot", "High Horsepower", "Iron Head", "Shift Gear"],
        abilities: ["Filter"],
        teraTypes: ["Ground"],
      },
    ],
    baseSpecies: "Revavroom",
  },
  cyclizar: {
    level: 83,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Draco Meteor",
          "Knock Off",
          "Rapid Spin",
          "Shed Tail",
          "Taunt",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Dragon", "Fairy", "Ghost", "Steel"],
      },
    ],
    baseSpecies: "Cyclizar",
  },
  orthworm: {
    level: 88,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Body Press", "Coil", "Iron Tail", "Rest"],
        abilities: ["Earth Eater"],
        teraTypes: ["Electric", "Fighting"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Press",
          "Heavy Slam",
          "Rest",
          "Shed Tail",
          "Spikes",
          "Stealth Rock",
        ],
        abilities: ["Earth Eater"],
        teraTypes: ["Electric", "Fighting", "Ghost", "Poison"],
      },
    ],
    baseSpecies: "Orthworm",
  },
  glimmora: {
    level: 75,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Earth Power",
          "Mortal Spin",
          "Power Gem",
          "Sludge Wave",
          "Spikes",
          "Stealth Rock",
        ],
        abilities: ["Toxic Debris"],
        teraTypes: ["Ground"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Earth Power", "Energy Ball", "Meteor Beam", "Sludge Wave"],
        abilities: ["Toxic Debris"],
        teraTypes: ["Grass"],
      },
    ],
    baseSpecies: "Glimmora",
  },
  houndstone: {
    level: 86,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Press",
          "Play Rough",
          "Poltergeist",
          "Roar",
          "Shadow Sneak",
          "Trick",
          "Will-O-Wisp",
        ],
        abilities: ["Fluffy"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Bulky Support",
        movepool: ["Body Press", "Poltergeist", "Rest", "Sleep Talk"],
        abilities: ["Fluffy"],
        teraTypes: ["Fighting"],
      },
      {
        role: "AV Pivot",
        movepool: ["Body Press", "Play Rough", "Poltergeist", "Shadow Sneak"],
        abilities: ["Fluffy"],
        teraTypes: ["Fairy", "Fighting"],
      },
    ],
    baseSpecies: "Houndstone",
  },
  flamigo: {
    level: 82,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Brave Bird", "Close Combat", "Throat Chop", "U-turn"],
        abilities: ["Scrappy"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Brave Bird",
          "Close Combat",
          "Roost",
          "Swords Dance",
          "Throat Chop",
        ],
        abilities: ["Scrappy"],
        teraTypes: ["Fighting", "Steel"],
      },
    ],
    baseSpecies: "Flamigo",
  },
  cetitan: {
    level: 82,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Earthquake",
          "Ice Shard",
          "Icicle Crash",
          "Liquidation",
          "Superpower",
        ],
        abilities: ["Sheer Force"],
        teraTypes: ["Water"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Belly Drum", "Earthquake", "Ice Shard", "Ice Spinner"],
        abilities: ["Slush Rush", "Thick Fat"],
        teraTypes: ["Ice"],
      },
    ],
    baseSpecies: "Cetitan",
  },
  veluza: {
    level: 85,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Aqua Cutter",
          "Aqua Jet",
          "Flip Turn",
          "Night Slash",
          "Psycho Cut",
        ],
        abilities: ["Sharpness"],
        teraTypes: ["Dark", "Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Aqua Cutter", "Fillet Away", "Night Slash", "Psycho Cut"],
        abilities: ["Sharpness"],
        teraTypes: ["Dark", "Psychic", "Water"],
      },
    ],
    baseSpecies: "Veluza",
  },
  dondozo: {
    level: 78,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Curse", "Rest", "Sleep Talk", "Wave Crash"],
        abilities: ["Unaware"],
        teraTypes: ["Dragon", "Fairy"],
      },
    ],
    baseSpecies: "Dondozo",
  },
  tatsugiri: {
    level: 87,
    sets: [
      {
        role: "Fast Support",
        movepool: ["Draco Meteor", "Nasty Plot", "Rapid Spin", "Surf"],
        abilities: ["Storm Drain"],
        teraTypes: ["Water"],
      },
      {
        role: "Fast Support",
        movepool: ["Draco Meteor", "Hydro Pump", "Nasty Plot", "Rapid Spin"],
        abilities: ["Storm Drain"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Tatsugiri",
  },
  farigiraf: {
    level: 91,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Body Slam", "Protect", "Psychic Noise", "Wish"],
        abilities: ["Sap Sipper"],
        teraTypes: ["Fairy", "Ground", "Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Future Sight", "Hyper Voice", "Protect", "Wish"],
        abilities: ["Sap Sipper"],
        teraTypes: ["Fairy", "Ground", "Water"],
      },
    ],
    baseSpecies: "Farigiraf",
  },
  dudunsparce: {
    level: 83,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Earthquake", "Glare", "Headbutt", "Roost"],
        abilities: ["Serene Grace"],
        teraTypes: ["Ghost", "Ground"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Boomburst", "Calm Mind", "Earth Power", "Roost"],
        abilities: ["Rattled"],
        teraTypes: ["Fairy", "Ghost"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Boomburst", "Calm Mind", "Roost", "Shadow Ball"],
        abilities: ["Rattled"],
        teraTypes: ["Ghost"],
      },
    ],
    baseSpecies: "Dudunsparce",
  },
  kingambit: {
    level: 74,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Iron Head",
          "Kowtow Cleave",
          "Sucker Punch",
          "Swords Dance",
        ],
        abilities: ["Supreme Overlord"],
        teraTypes: ["Dark", "Flying"],
      },
    ],
    baseSpecies: "Kingambit",
  },
  greattusk: {
    level: 77,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Bulk Up",
          "Close Combat",
          "Earthquake",
          "Rapid Spin",
          "Stone Edge",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Ground", "Steel"],
      },
      {
        role: "Bulky Setup",
        movepool: [
          "Bulk Up",
          "Close Combat",
          "Earthquake",
          "Rapid Spin",
          "Stone Edge",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Ground", "Steel"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Close Combat",
          "Headlong Rush",
          "Ice Spinner",
          "Knock Off",
          "Rapid Spin",
          "Stealth Rock",
          "Stone Edge",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Ground", "Steel"],
      },
    ],
    baseSpecies: "Great Tusk",
  },
  brutebonnet: {
    level: 81,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: ["Close Combat", "Seed Bomb", "Spore", "Sucker Punch"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Fighting", "Poison"],
      },
      {
        role: "Bulky Support",
        movepool: ["Crunch", "Seed Bomb", "Spore", "Sucker Punch"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Dark", "Poison"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Close Combat", "Crunch", "Seed Bomb", "Sucker Punch"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Dark", "Fighting", "Poison"],
      },
    ],
    baseSpecies: "Brute Bonnet",
  },
  sandyshocks: {
    level: 80,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Earth Power",
          "Spikes",
          "Stealth Rock",
          "Thunder Wave",
          "Thunderbolt",
          "Volt Switch",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Electric", "Grass", "Ground"],
      },
    ],
    baseSpecies: "Sandy Shocks",
  },
  screamtail: {
    level: 84,
    sets: [
      {
        role: "Bulky Support",
        movepool: ["Encore", "Play Rough", "Protect", "Thunder Wave", "Wish"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Poison", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Dazzling Gleam",
          "Encore",
          "Protect",
          "Thunder Wave",
          "Wish",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Poison", "Steel"],
      },
    ],
    baseSpecies: "Scream Tail",
  },
  fluttermane: {
    level: 74,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Calm Mind",
          "Moonblast",
          "Mystical Fire",
          "Psyshock",
          "Shadow Ball",
          "Thunderbolt",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Electric", "Fairy", "Fire", "Ghost"],
      },
      {
        role: "Wallbreaker",
        movepool: [
          "Moonblast",
          "Mystical Fire",
          "Psyshock",
          "Shadow Ball",
          "Thunderbolt",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Fairy"],
      },
    ],
    baseSpecies: "Flutter Mane",
  },
  slitherwing: {
    level: 81,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Bulk Up",
          "Close Combat",
          "Earthquake",
          "Flame Charge",
          "Leech Life",
          "Wild Charge",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Electric", "Fighting"],
      },
      {
        role: "Fast Attacker",
        movepool: [
          "Close Combat",
          "Earthquake",
          "First Impression",
          "Flare Blitz",
          "U-turn",
          "Wild Charge",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Bug", "Electric", "Fighting", "Fire"],
      },
      {
        role: "Fast Support",
        movepool: ["Close Combat", "Morning Sun", "U-turn", "Will-O-Wisp"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Fire", "Steel"],
      },
    ],
    baseSpecies: "Slither Wing",
  },
  roaringmoon: {
    level: 72,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Dragon Dance",
          "Earthquake",
          "Iron Head",
          "Knock Off",
          "Outrage",
          "Roost",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Dark", "Dragon", "Ground", "Poison", "Steel"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Acrobatics",
          "Dragon Dance",
          "Iron Head",
          "Knock Off",
          "Outrage",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Flying", "Steel"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Iron Head", "Knock Off", "Outrage", "U-turn"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Dark", "Dragon", "Steel"],
      },
    ],
    baseSpecies: "Roaring Moon",
  },
  walkingwake: {
    level: 79,
    sets: [
      {
        role: "Wallbreaker",
        movepool: ["Draco Meteor", "Flamethrower", "Flip Turn", "Hydro Pump"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Fire", "Water"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Draco Meteor", "Flamethrower", "Hydro Steam", "Sunny Day"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Walking Wake",
  },
  irontreads: {
    level: 77,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Iron Head",
          "Knock Off",
          "Rapid Spin",
          "Stealth Rock",
          "Volt Switch",
        ],
        abilities: ["Quark Drive"],
        teraTypes: ["Ground", "Steel"],
      },
    ],
    baseSpecies: "Iron Treads",
  },
  ironmoth: {
    level: 78,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Energy Ball",
          "Fiery Dance",
          "Fire Blast",
          "Morning Sun",
          "Sludge Wave",
          "Toxic Spikes",
          "U-turn",
        ],
        abilities: ["Quark Drive"],
        teraTypes: ["Fire", "Grass"],
      },
    ],
    baseSpecies: "Iron Moth",
  },
  ironhands: {
    level: 79,
    sets: [
      {
        role: "AV Pivot",
        movepool: [
          "Close Combat",
          "Drain Punch",
          "Fake Out",
          "Heavy Slam",
          "Ice Punch",
          "Thunder Punch",
          "Volt Switch",
          "Wild Charge",
        ],
        abilities: ["Quark Drive"],
        teraTypes: ["Electric", "Fighting"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Drain Punch",
          "Ice Punch",
          "Swords Dance",
          "Thunder Punch",
          "Wild Charge",
        ],
        abilities: ["Quark Drive"],
        teraTypes: ["Fighting", "Flying", "Steel"],
      },
    ],
    baseSpecies: "Iron Hands",
  },
  ironjugulis: {
    level: 78,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Dark Pulse",
          "Earth Power",
          "Fire Blast",
          "Hurricane",
          "Hydro Pump",
          "U-turn",
        ],
        abilities: ["Quark Drive"],
        teraTypes: ["Dark", "Flying", "Ground"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Dark Pulse", "Earth Power", "Hurricane", "Meteor Beam"],
        abilities: ["Quark Drive"],
        teraTypes: ["Dark", "Ground"],
      },
    ],
    baseSpecies: "Iron Jugulis",
  },
  ironthorns: {
    level: 83,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Earthquake",
          "Ice Punch",
          "Spikes",
          "Stealth Rock",
          "Stone Edge",
          "Volt Switch",
          "Wild Charge",
        ],
        abilities: ["Quark Drive"],
        teraTypes: ["Flying", "Grass", "Water"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Dragon Dance",
          "Earthquake",
          "Ice Punch",
          "Stone Edge",
          "Wild Charge",
        ],
        abilities: ["Quark Drive"],
        teraTypes: ["Flying", "Grass", "Ground", "Rock"],
      },
    ],
    baseSpecies: "Iron Thorns",
  },
  ironbundle: {
    level: 77,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Encore",
          "Flip Turn",
          "Freeze-Dry",
          "Hydro Pump",
          "Ice Beam",
          "Substitute",
        ],
        abilities: ["Quark Drive"],
        teraTypes: ["Ice", "Water"],
      },
    ],
    baseSpecies: "Iron Bundle",
  },
  ironvaliant: {
    level: 78,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Close Combat", "Knock Off", "Spirit Break", "Swords Dance"],
        abilities: ["Quark Drive"],
        teraTypes: ["Dark", "Fighting"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Calm Mind", "Close Combat", "Moonblast", "Psychic"],
        abilities: ["Quark Drive"],
        teraTypes: ["Fairy", "Fighting", "Steel"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Close Combat", "Encore", "Knock Off", "Moonblast"],
        abilities: ["Quark Drive"],
        teraTypes: ["Dark", "Fairy", "Fighting", "Steel"],
      },
    ],
    baseSpecies: "Iron Valiant",
  },
  ironleaves: {
    level: 80,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Close Combat",
          "Leaf Blade",
          "Megahorn",
          "Psyblade",
          "Swords Dance",
        ],
        abilities: ["Quark Drive"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Iron Leaves",
  },
  baxcalibur: {
    level: 75,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Earthquake", "Glaive Rush", "Ice Shard", "Icicle Crash"],
        abilities: ["Thermal Exchange"],
        teraTypes: ["Dragon", "Ground"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Dragon Dance", "Earthquake", "Glaive Rush", "Icicle Crash"],
        abilities: ["Thermal Exchange"],
        teraTypes: ["Dragon", "Ground"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Earthquake", "Icicle Spear", "Scale Shot", "Swords Dance"],
        abilities: ["Thermal Exchange"],
        teraTypes: ["Dragon", "Ground"],
      },
    ],
    baseSpecies: "Baxcalibur",
  },
  gholdengo: {
    level: 77,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Focus Blast",
          "Make It Rain",
          "Nasty Plot",
          "Shadow Ball",
          "Trick",
        ],
        abilities: ["Good as Gold"],
        teraTypes: ["Fighting", "Ghost", "Steel"],
      },
      {
        role: "Bulky Support",
        movepool: [
          "Make It Rain",
          "Nasty Plot",
          "Recover",
          "Shadow Ball",
          "Thunder Wave",
        ],
        abilities: ["Good as Gold"],
        teraTypes: ["Dark", "Steel", "Water"],
      },
    ],
    baseSpecies: "Gholdengo",
  },
  tinglu: {
    level: 78,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Earthquake",
          "Spikes",
          "Stealth Rock",
          "Throat Chop",
          "Whirlwind",
        ],
        abilities: ["Vessel of Ruin"],
        teraTypes: ["Ghost", "Poison"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Earthquake",
          "Heavy Slam",
          "Payback",
          "Ruination",
          "Spikes",
          "Stealth Rock",
        ],
        abilities: ["Vessel of Ruin"],
        teraTypes: ["Ghost", "Poison", "Steel"],
      },
    ],
    baseSpecies: "Ting-Lu",
  },
  chienpao: {
    level: 72,
    sets: [
      {
        role: "Wallbreaker",
        movepool: [
          "Crunch",
          "Ice Shard",
          "Icicle Crash",
          "Sacred Sword",
          "Throat Chop",
        ],
        abilities: ["Sword of Ruin"],
        teraTypes: ["Dark", "Fighting", "Ice"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Ice Shard",
          "Icicle Crash",
          "Sacred Sword",
          "Sucker Punch",
          "Swords Dance",
          "Throat Chop",
        ],
        abilities: ["Sword of Ruin"],
        teraTypes: ["Dark", "Fighting", "Ice"],
      },
    ],
    baseSpecies: "Chien-Pao",
  },
  wochien: {
    level: 83,
    sets: [
      {
        role: "Bulky Support",
        movepool: [
          "Giga Drain",
          "Knock Off",
          "Leech Seed",
          "Protect",
          "Ruination",
          "Stun Spore",
        ],
        abilities: ["Tablets of Ruin"],
        teraTypes: ["Poison"],
      },
    ],
    baseSpecies: "Wo-Chien",
  },
  chiyu: {
    level: 77,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Dark Pulse",
          "Fire Blast",
          "Nasty Plot",
          "Psychic",
          "Will-O-Wisp",
        ],
        abilities: ["Beads of Ruin"],
        teraTypes: ["Dark", "Fire"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Dark Pulse", "Flamethrower", "Overheat", "Psychic"],
        abilities: ["Beads of Ruin"],
        teraTypes: ["Dark", "Fire"],
      },
    ],
    baseSpecies: "Chi-Yu",
  },
  koraidon: {
    level: 64,
    sets: [
      {
        role: "Fast Attacker",
        movepool: ["Close Combat", "Flare Blitz", "Outrage", "U-turn"],
        abilities: ["Orichalcum Pulse"],
        teraTypes: ["Fire"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Collision Course",
          "Flare Blitz",
          "Scale Shot",
          "Swords Dance",
        ],
        abilities: ["Orichalcum Pulse"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Koraidon",
  },
  miraidon: {
    level: 65,
    sets: [
      {
        role: "Fast Bulky Setup",
        movepool: ["Calm Mind", "Draco Meteor", "Electro Drift", "Substitute"],
        abilities: ["Hadron Engine"],
        teraTypes: ["Electric"],
      },
      {
        role: "Fast Attacker",
        movepool: ["Draco Meteor", "Electro Drift", "Overheat", "Volt Switch"],
        abilities: ["Hadron Engine"],
        teraTypes: ["Electric"],
      },
    ],
    baseSpecies: "Miraidon",
  },
  dipplin: {
    level: 88,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Dragon Pulse",
          "Dragon Tail",
          "Giga Drain",
          "Recover",
          "Sucker Punch",
        ],
        abilities: ["Sticky Hold"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Dipplin",
  },
  sinistcha: {
    level: 83,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Matcha Gotcha", "Shadow Ball", "Strength Sap"],
        abilities: ["Heatproof"],
        teraTypes: ["Steel"],
      },
    ],
    baseSpecies: "Sinistcha",
  },
  okidogi: {
    level: 77,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Bulk Up", "Drain Punch", "Gunk Shot", "Knock Off"],
        abilities: ["Toxic Chain"],
        teraTypes: ["Dark"],
      },
      {
        role: "AV Pivot",
        movepool: [
          "Drain Punch",
          "Gunk Shot",
          "High Horsepower",
          "Knock Off",
          "Psychic Fangs",
        ],
        abilities: ["Toxic Chain"],
        teraTypes: ["Dark"],
      },
    ],
    baseSpecies: "Okidogi",
  },
  munkidori: {
    level: 79,
    sets: [
      {
        role: "Fast Attacker",
        movepool: [
          "Focus Blast",
          "Nasty Plot",
          "Psyshock",
          "Sludge Wave",
          "U-turn",
        ],
        abilities: ["Toxic Chain"],
        teraTypes: ["Fighting", "Poison"],
      },
      {
        role: "AV Pivot",
        movepool: ["Fake Out", "Psychic Noise", "Sludge Wave", "U-turn"],
        abilities: ["Toxic Chain"],
        teraTypes: ["Dark"],
      },
    ],
    baseSpecies: "Munkidori",
  },
  fezandipiti: {
    level: 82,
    sets: [
      {
        role: "AV Pivot",
        movepool: ["Gunk Shot", "Heat Wave", "Moonblast", "U-turn"],
        abilities: ["Toxic Chain"],
        teraTypes: ["Dark", "Steel", "Water"],
      },
      {
        role: "Bulky Attacker",
        movepool: ["Gunk Shot", "Moonblast", "Roost", "U-turn"],
        abilities: ["Toxic Chain"],
        teraTypes: ["Dark", "Steel", "Water"],
      },
    ],
    baseSpecies: "Fezandipiti",
  },
  ogerpon: {
    level: 80,
    sets: [
      {
        role: "Fast Support",
        movepool: [
          "Encore",
          "Ivy Cudgel",
          "Knock Off",
          "Spikes",
          "Superpower",
          "Synthesis",
          "U-turn",
        ],
        abilities: ["Defiant"],
        teraTypes: ["Grass"],
      },
      {
        role: "Setup Sweeper",
        movepool: ["Ivy Cudgel", "Knock Off", "Superpower", "Swords Dance"],
        abilities: ["Defiant"],
        teraTypes: ["Grass"],
      },
    ],
    baseSpecies: "Ogerpon",
  },
  ogerponwellspring: {
    level: 76,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Encore",
          "Ivy Cudgel",
          "Spikes",
          "Synthesis",
          "U-turn",
          "Wood Hammer",
        ],
        abilities: ["Water Absorb"],
        teraTypes: ["Water"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Horn Leech",
          "Ivy Cudgel",
          "Knock Off",
          "Play Rough",
          "Power Whip",
          "Swords Dance",
        ],
        abilities: ["Water Absorb"],
        teraTypes: ["Water"],
      },
    ],
    baseSpecies: "Ogerpon",
  },
  ogerponhearthflame: {
    level: 74,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Horn Leech",
          "Ivy Cudgel",
          "Knock Off",
          "Power Whip",
          "Stomping Tantrum",
          "Swords Dance",
        ],
        abilities: ["Mold Breaker"],
        teraTypes: ["Fire"],
      },
    ],
    baseSpecies: "Ogerpon",
  },
  ogerponcornerstone: {
    level: 76,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Encore",
          "Ivy Cudgel",
          "Power Whip",
          "Spikes",
          "Superpower",
          "Synthesis",
        ],
        abilities: ["Sturdy"],
        teraTypes: ["Rock"],
      },
      {
        role: "Setup Sweeper",
        movepool: [
          "Horn Leech",
          "Ivy Cudgel",
          "Power Whip",
          "Superpower",
          "Swords Dance",
        ],
        abilities: ["Sturdy"],
        teraTypes: ["Rock"],
      },
    ],
    baseSpecies: "Ogerpon",
  },
  archaludon: {
    level: 78,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Earthquake", "Iron Head", "Outrage", "Swords Dance"],
        abilities: ["Stamina"],
        teraTypes: ["Ground"],
      },
      {
        role: "Bulky Attacker",
        movepool: [
          "Body Press",
          "Draco Meteor",
          "Dragon Tail",
          "Flash Cannon",
          "Stealth Rock",
          "Thunder Wave",
          "Thunderbolt",
        ],
        abilities: ["Stamina"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Archaludon",
  },
  hydrapple: {
    level: 83,
    sets: [
      {
        role: "AV Pivot",
        movepool: [
          "Dragon Tail",
          "Earth Power",
          "Fickle Beam",
          "Giga Drain",
          "Leaf Storm",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Steel"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Earth Power",
          "Fickle Beam",
          "Giga Drain",
          "Nasty Plot",
          "Recover",
        ],
        abilities: ["Regenerator"],
        teraTypes: ["Steel"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Draco Meteor", "Earth Power", "Fickle Beam", "Leaf Storm"],
        abilities: ["Regenerator"],
        teraTypes: ["Dragon", "Steel"],
      },
    ],
    baseSpecies: "Hydrapple",
  },
  gougingfire: {
    level: 74,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: ["Dragon Dance", "Earthquake", "Heat Crash", "Outrage"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Ground"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Dragon Dance", "Heat Crash", "Morning Sun", "Outrage"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Fairy"],
      },
    ],
    baseSpecies: "Gouging Fire",
  },
  ragingbolt: {
    level: 78,
    sets: [
      {
        role: "AV Pivot",
        movepool: [
          "Discharge",
          "Draco Meteor",
          "Thunderbolt",
          "Thunderclap",
          "Volt Switch",
        ],
        abilities: ["Protosynthesis"],
        teraTypes: ["Electric"],
      },
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Draco Meteor", "Thunderbolt", "Thunderclap"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Electric", "Fairy"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: ["Calm Mind", "Dragon Pulse", "Thunderbolt", "Thunderclap"],
        abilities: ["Protosynthesis"],
        teraTypes: ["Electric", "Fairy"],
      },
    ],
    baseSpecies: "Raging Bolt",
  },
  ironboulder: {
    level: 77,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Close Combat",
          "Mighty Cleave",
          "Swords Dance",
          "Zen Headbutt",
        ],
        abilities: ["Quark Drive"],
        teraTypes: ["Fighting"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Close Combat",
          "Mighty Cleave",
          "Swords Dance",
          "Zen Headbutt",
        ],
        abilities: ["Quark Drive"],
        teraTypes: ["Fighting"],
      },
    ],
    baseSpecies: "Iron Boulder",
  },
  ironcrown: {
    level: 78,
    sets: [
      {
        role: "Bulky Setup",
        movepool: ["Calm Mind", "Focus Blast", "Psyshock", "Tachyon Cutter"],
        abilities: ["Quark Drive"],
        teraTypes: ["Fighting", "Steel"],
      },
      {
        role: "Wallbreaker",
        movepool: ["Focus Blast", "Psyshock", "Tachyon Cutter", "Volt Switch"],
        abilities: ["Quark Drive"],
        teraTypes: ["Fighting", "Steel"],
      },
    ],
    baseSpecies: "Iron Crown",
  },
  terapagos: {
    level: 76,
    sets: [
      {
        role: "Setup Sweeper",
        movepool: [
          "Calm Mind",
          "Dark Pulse",
          "Rapid Spin",
          "Rest",
          "Tera Starstorm",
        ],
        abilities: ["Tera Shift"],
        teraTypes: ["Stellar"],
      },
      {
        role: "Fast Bulky Setup",
        movepool: [
          "Calm Mind",
          "Earth Power",
          "Rapid Spin",
          "Rest",
          "Tera Starstorm",
        ],
        abilities: ["Tera Shift"],
        teraTypes: ["Stellar"],
      },
    ],
    baseSpecies: "Terapagos",
  },
  pecharunt: {
    level: 77,
    sets: [
      {
        role: "Bulky Attacker",
        movepool: [
          "Malignant Chain",
          "Nasty Plot",
          "Parting Shot",
          "Recover",
          "Shadow Ball",
        ],
        abilities: ["Poison Puppeteer"],
        teraTypes: ["Dark"],
      },
    ],
    baseSpecies: "Pecharunt",
  },
};
