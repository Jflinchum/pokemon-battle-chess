import { PokemonSet } from "@pkmn/data";

export const getMockPokemonSet = (
  overrides: Partial<PokemonSet<string>> = {},
): PokemonSet<string> => {
  return {
    name: "Pikachu",
    species: "pikachu",
    gender: "F",
    shiny: false,
    level: 50,
    moves: [],
    ability: "static",
    nature: "modest",
    evs: {
      hp: 85,
      atk: 85,
      def: 85,
      spa: 85,
      spd: 85,
      spe: 85,
    },
    ivs: {
      hp: 31,
      atk: 31,
      def: 31,
      spa: 31,
      spd: 31,
      spe: 31,
    },
    item: "Light Ball",
    ...overrides,
  };
};
