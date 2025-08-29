import { GameOptions } from "../../shared/types/GameOptions.js";

export const CHESS_MOVES_UNTIL_NEW_SQUARE_MODIFIER_TARGET = 10;

export const DEFAULT_GAME_OPTIONS: GameOptions = {
  format: "random",
  offenseAdvantage: {
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 1,
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
