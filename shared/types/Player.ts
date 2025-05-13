import { Color } from 'chess.js';

export interface Player {
  playerName: string;
  playerId: string;
  avatarId: string;
  transient: boolean;
  viewingResults: boolean;
  isHost: boolean;
  isPlayer1: boolean;
  isPlayer2: boolean;
  color: Color | null;
  isSpectator: boolean;
}