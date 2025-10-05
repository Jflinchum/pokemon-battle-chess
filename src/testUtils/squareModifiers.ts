import { SquareModifier } from "../../shared/models/PokemonBattleChessManager";

export const getMockSquareModifiers = (
  overrides: Partial<SquareModifier> = {},
): SquareModifier => {
  return {
    square: "a1",
    modifiers: getMockModifiers(),
    ...overrides,
  };
};

export const getMockModifiers = (
  overrides: Partial<SquareModifier["modifiers"]> = {},
): SquareModifier["modifiers"] => {
  return {
    weather: {
      id: "sunnyday",
      duration: 2,
    },
    terrain: {
      id: "electricterrain",
      duration: 3,
    },
    ...overrides,
  };
};
