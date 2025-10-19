import {
  DRAFT_MATCHMAKING_QUEUE_KEY,
  PLAYER_KEY,
  RANDOM_MATCHMAKING_QUEUE_KEY,
  ROOM_BLACK_MATCH_HIST_KEY,
  ROOM_KEY,
  ROOM_LOCK_KEY,
  ROOM_PLAYER_SET_KEY,
  ROOM_POKEMON_BAN_KEY,
  ROOM_POKEMON_BOARD_KEY,
  ROOM_POKEMON_MOVE_HIST_KEY,
  ROOM_SQUARE_MODIFIERS_KEY,
  ROOM_WHITE_MATCH_HIST_KEY,
} from "../constants/redisConstants.js";

export const getRoomKey = (roomId: string) => `${ROOM_KEY}:${roomId}`;

export const getRoomPlayerSetKey = (roomId: string) =>
  `${ROOM_PLAYER_SET_KEY}:${roomId}`;

export const getRoomPokemonMoveHistoryKey = (roomId: string) =>
  `${ROOM_POKEMON_MOVE_HIST_KEY}:${roomId}`;

export const getRoomWhiteMatchHistoryKey = (roomId: string) =>
  `${ROOM_WHITE_MATCH_HIST_KEY}:${roomId}`;

export const getRoomBlackMatchHistoryKey = (roomId: string) =>
  `${ROOM_BLACK_MATCH_HIST_KEY}:${roomId}`;

export const getRoomPokemonBoardKey = (roomId: string) =>
  `${ROOM_POKEMON_BOARD_KEY}:${roomId}`;

export const getRoomPokemonBanKey = (roomId: string) =>
  `${ROOM_POKEMON_BAN_KEY}:${roomId}`;

export const getRoomSquareModifiersKey = (roomId: string) =>
  `${ROOM_SQUARE_MODIFIERS_KEY}:${roomId}`;

export const getRoomLockKey = (roomId: string) => `${ROOM_LOCK_KEY}:${roomId}`;

export const getRandomMatchmakingQueueKey = () => RANDOM_MATCHMAKING_QUEUE_KEY;

export const getDraftMatchmakingQueueKey = () => DRAFT_MATCHMAKING_QUEUE_KEY;

export const getPlayerKey = (playerId: string) => `${PLAYER_KEY}:${playerId}`;
