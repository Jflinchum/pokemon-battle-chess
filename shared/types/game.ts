import { PokemonSet } from "@pkmn/data";
import { Color, Square } from "chess.js"

export type MatchHistory = MatchLog[];
export type MatchLog = BanData | DraftData | ChessData | PokemonData | GenericData;

export type BanData = {
  type: 'ban',
  data: {
    color: Color,
    index: number,
  },
};

export type DraftData = {
  type: 'draft',
  data: {
    color: Color,
    index: number,
    square: Square
  },
};

export type ChessData = {
  type: 'chess',
  data: {
    color: Color,
    san: string,
    failed?: boolean,
  },
};

export type PokemonData = {
  type: 'pokemon',
  data: PokemonStreamOutputData | PokemonVictoryData | PokemonBeginBattleData,
};
export type PokemonStreamOutputData = {
  event: 'streamOutput',
  chunk: string,
};
export type PokemonVictoryData = {
  event: 'victory',
  color: Color,
};
export type PokemonBeginBattleData = {
  event: 'battleStart',
  p1Pokemon: PokemonSet,
  p2Pokemon: PokemonSet,
  attemptedMove: {
    san: string,
    color: Color,
  },
}

export type GenericData = {
  type: 'generic',
  data: {
    event: 'gameEnd',
    color: Color | '',
    reason: EndGameReason,
  }
};

export type Timer = {
  white: { pause: boolean; timerExpiration: number };
  black: { pause: boolean; timerExpiration: number };
}

export type EndGameReason = 'KING_CAPTURED' | 'TIMEOUT' | 'PLAYER_DISCONNECTED' | 'HOST_DISCONNECTED' | 'HOST_ENDED_GAME';