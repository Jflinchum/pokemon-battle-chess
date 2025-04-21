import { BoostsTable } from '@pkmn/data'
type FormatID = 'random' | 'draft';

export interface GameOptions {
  format: FormatID;
  offenseAdvantage: BoostsTable;
  timersEnabled: boolean,
  // In seconds
  banTimerDuration: number;
  // In minutes
  chessTimerDuration: number;
  // In seconds
  chessTimerIncrement: number;
  // In seconds
  pokemonTimerIncrement: number;
}