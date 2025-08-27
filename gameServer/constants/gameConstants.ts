import { GameOptions } from "../../shared/types/GameOptions.js";

/**
 * Square modifier target is the weather/terrain that generates on the chess board.
 * We start off with an initial Target value that we default to, and then generate a new one
 * throughout the game between the low and high target.
 */
export const SQUARE_MODIFIER_TARGET = 15;
export const LOW_SQUARE_MODIFIER_TARGET = 10;
export const HIGH_SQUARE_MODIFIER_TARGET = 20;
export const CHESS_MOVES_UNTIL_NEW_SQUARE_MODIFIER_TARGET = 10;

export const DEFAULT_GAME_OPTIONS: GameOptions = {
  format: "random",
  offenseAdvantage: {
    atk: 0,
    def: 0,
    spa: 0,
    spd: 1,
    spe: 0,
    accuracy: 0,
    evasion: 0,
  },
  weatherWars: false,
  timersEnabled: true,
  banTimerDuration: 30,
  chessTimerDuration: 15,
  chessTimerIncrement: 5,
  pokemonTimerIncrement: 1,
};

export const POKE_SIMULATOR_TERMINATOR =
  "POKEMON_GAMBIT_END_OF_SIMULATION_TERMINATOR";
