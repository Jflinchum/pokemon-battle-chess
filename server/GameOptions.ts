import { BoostsTable } from '@pkmn/data'
type FormatID = 'random' | 'draft';

export interface GameOptions {
  format: FormatID;
  offenseAdvantage: BoostsTable;
}