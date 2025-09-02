import { BoostsTable } from "@pkmn/data";
import { PRNGSeed } from "@pkmn/sim";
import { Color } from "chess.js";
import { Player } from "./Player.js";
type FormatID = "random" | "draft";

export interface GameOptions {
  gameSeed?: string;
  format: FormatID;
  offenseAdvantage: BoostsTable;
  weatherWars: boolean;
  timersEnabled: boolean;
  // In seconds
  banTimerDuration: number;
  // In minutes
  chessTimerDuration: number;
  // In seconds
  chessTimerIncrement: number;
  // In seconds
  pokemonTimerIncrement: number;
}

export interface GameSettings {
  whitePlayer?: Player;
  blackPlayer?: Player;
  seed?: PRNGSeed;
  color?: Color;
  options: GameOptions;
  isQuickPlay?: boolean;
}
