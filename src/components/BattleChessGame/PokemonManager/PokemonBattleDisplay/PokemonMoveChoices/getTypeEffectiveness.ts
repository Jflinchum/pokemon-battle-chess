import { Dex } from "@pkmn/dex";
import { Move, TypeName } from "@pkmn/data";
import { Pokemon } from "@pkmn/client";

export const getTypeEffectiveness = (move: Move, currentPokemon?: Pokemon | null, opponentPokemon?: Pokemon | null) => {
  if (!currentPokemon || !opponentPokemon) {
    return {};
  }
  const dexOpponentPokemon = Dex.species.get(opponentPokemon.name);
  const type = modifyTypeAbilities[currentPokemon.set?.ability.toLowerCase() || ''] ? modifyTypeAbilities[currentPokemon.set!.ability.toLowerCase()](move, currentPokemon) : move.type;
  const effectiveness = Dex.getEffectiveness(type, dexOpponentPokemon);
  const notImmune = Dex.getImmunity(move, dexOpponentPokemon);

  return {
    effectiveness,
    notImmune,
  }
};

// Taken from onModifyType
// https://github.com/pkmn/ps/blob/e9c53799548ca8ba182efed51449d56afbb21f03/sim/data/abilities.ts#L1547
const modifyTypeAbilities: Record<string, (move: Move, pokemon: Pokemon) => TypeName> = {
  'pixilate': (move: Move, pokemon: Pokemon) => {
    const noModifyType = [
      'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
    ];
    if (move.type === 'Normal' && !noModifyType.includes(move.id) && !(move.name === 'Tera Blast' && pokemon.isTerastallized)) {
      return 'Fairy';
    }
    return move.type;
  },
  'aerilate': (move: Move, pokemon: Pokemon) => {
    const noModifyType = [
      'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
    ];
    if (move.type === 'Normal' && !noModifyType.includes(move.id) && !(move.name === 'Tera Blast' && pokemon.terastallized)) {
      return 'Flying';
    }
    return move.type
  },
  'galvanize': (move: Move, pokemon: Pokemon) => {
    const noModifyType = [
      'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
    ];
    if (move.type === 'Normal' && !noModifyType.includes(move.id) && !(move.name === 'Tera Blast' && pokemon.terastallized)) {
      return 'Electric';
    }
    return move.type;
  },
  'liquidvoice': (move: Move, _: Pokemon) => {
    if (move.flags['sound']) {
      return 'Water';
    }
    return move.type;
  },
  'normalize': (move: Move, pokemon: Pokemon) => {
    const noModifyType = [
      'hiddenpower', 'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'struggle', 'technoblast', 'terrainpulse', 'weatherball',
    ];
    if (!noModifyType.includes(move.id) && !(move.name === 'Tera Blast' && pokemon.terastallized)) {
      return 'Normal'
    }
    return move.type;
  },
  'refrigerate': (move: Move, pokemon: Pokemon) => {
    const noModifyType = [
      'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
    ];
    if (move.type === 'Normal' && !noModifyType.includes(move.id) && !(move.name === 'Tera Blast' && pokemon.terastallized)) {
      return 'Ice';
    }
    return move.type;
  }
}