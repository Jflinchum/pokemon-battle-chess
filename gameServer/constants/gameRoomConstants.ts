import { GameOptions } from "../../shared/types/GameOptions.js";

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
  weatherWars: true,
  timersEnabled: true,
  banTimerDuration: 30,
  chessTimerDuration: 15,
  chessTimerIncrement: 5,
  pokemonTimerIncrement: 1,
};
