import { Redis } from "ioredis";
import { PRNGSeed } from "@pkmn/sim";
import { getConfig } from "../config.js";
import GameRoom from "../models/GameRoom.js";
import User from "../models/User.js";
import { GameOptions } from "../../shared/types/GameOptions.js";
import { FormatID } from "../../shared/models/PokemonBattleChessManager.js";
import { MatchLog } from "../../shared/types/Game.js";
import { Color } from "chess.js";
import { Lock, Redlock } from "@sesamecare-oss/redlock";

/**
 *
 * roomPlayerSet:{roomId} -> playerId[]
 * room:{roomId} -> {
 *    roomCode,
 *    publicSeed,
 *    hostName,
 *    hostId,
 *    isOngoing,
 *    player1Id,
 *    player2Id,
 *    whitePlayerId,
 *    blackPlayerId,
 *    chessBoard,
 *    squareModifierTarget,
 *    format,
 *    atkBuff...,
 *    whitePlayerPokemonMove,
 *    blackPlayerPokemonMove,
 * }
 * roomPokemonMoveHistory:{roomId} string[]
 * roomWhiteMatchHistory:{roomId} -> MatchLog[]
 * roomBlackMatchHistory:{roomId} -> MatchLog[]
 * roomPokemonBoard:{roomId} -> (number | null)[]
 * roomPokemonBan:${roomId} -> number[]
 * roomSquareModifiers:${roomId} -> number[]
 * player:{playerId} -> { playerName, avatarId, secret, viewingResults, spectating }
 * roomLock:{roomId}
 */

export const redisClient = new Redis(getConfig().redisUrl, {
  lazyConnect: true,
});

const connectAndIndexRedis = async () => {
  redisClient.on("error", (err) => {
    console.log("Redis Client Error", err);
    redisClient.disconnect();
  });
  await redisClient.connect();
};

(async () => {
  await connectAndIndexRedis();
})();

const redlock = new Redlock([redisClient]);

export const doesRoomExist = async (roomId?: string | null) => {
  if (!roomId) {
    return 0;
  }
  return await redisClient.exists(`room:${roomId}`);
};

export const fetchRoomCode = async (roomId: string) => {
  return await getRoomHash(roomId, "roomCode");
};

export const fetchPlayerSecret = async (playerId: string) => {
  return await redisClient.hget(`player:${playerId}`, "secret");
};

export const fetchUser = async (
  playerId: string | null,
): Promise<User | null> => {
  if (!playerId) {
    return null;
  }

  const response = await redisClient
    .multi()
    .hget(`player:${playerId}`, "playerName")
    .hget(`player:${playerId}`, "avatarId")
    .hget(`player:${playerId}`, "secret")
    .hget(`player:${playerId}`, "transient")
    .hget(`player:${playerId}`, "viewingResults")
    .hget(`player:${playerId}`, "spectating")
    .exec();

  if (!response) {
    return null;
  }
  const [playerName, avatarId, secret, transient, viewingResults, spectating] =
    response.map(([, result]) => result);

  if (playerName && avatarId && secret) {
    return new User(
      playerName as unknown as string,
      playerId,
      avatarId as unknown as string,
      secret as unknown as string,
      (transient as unknown as string) !== "0",
      (viewingResults as unknown as string) === "1",
      (spectating as unknown as string) === "1",
    );
  }
  return null;
};

export const fetchGame = async (
  roomId: string | null,
): Promise<GameRoom | null> => {
  if (!roomId) {
    return null;
  }
  const response = await redisClient
    .multi()
    .hget(`room:${roomId}`, "roomCode")
    .hget(`room:${roomId}`, "publicSeed")
    .hget(`room:${roomId}`, "hostId")
    .hget(`room:${roomId}`, "player1Id")
    .hget(`room:${roomId}`, "player2Id")
    .hget(`room:${roomId}`, "whitePlayerId")
    .hget(`room:${roomId}`, "blackPlayerId")
    .hget(`room:${roomId}`, "isOngoing")
    .smembers(`roomPlayerSet:${roomId}`)
    .exec();
  if (!response) {
    return null;
  }
  const [
    roomCode,
    publicSeed,
    hostPlayerId,
    player1Id,
    player2Id,
    whitePlayerId,
    blackPlayerId,
    isOngoing,
    playerList,
  ] = response.map(([, result]) => result);
  const roomOptions = (await fetchGameOptions(roomId)) ?? undefined;
  const hostPlayer =
    (await fetchUser(hostPlayerId as unknown as string)) ?? undefined;
  const player1 =
    (await fetchUser(player1Id as unknown as string)) ?? undefined;
  const player2 =
    (await fetchUser(player2Id as unknown as string)) ?? undefined;
  const whitePlayer =
    (await fetchUser(whitePlayerId as unknown as string)) ?? undefined;
  const blackPlayer =
    (await fetchUser(blackPlayerId as unknown as string)) ?? undefined;
  return new GameRoom(
    roomId,
    roomCode as unknown as string,
    publicSeed as unknown as PRNGSeed,
    roomOptions,
    playerList as unknown as string[],
    hostPlayer,
    player1,
    player2,
    whitePlayer,
    blackPlayer,
    (isOngoing as unknown as string) === "1",
  );
};

export const setRoomToOngoing = async (roomId: string, isOngoing: boolean) => {
  return await redisClient.hset(
    `room:${roomId}`,
    "isOngoing",
    isOngoing ? 1 : 0,
  );
};

export const removePlayerIdFromRoom = async (
  roomId: string,
  playerId: string,
): Promise<void> => {
  const roomHostId = await redisClient.hget(`room:${roomId}`, "hostId");
  if (roomHostId === playerId) {
    await deleteRoom(roomId);
  } else {
    await redisClient.srem(`roomPlayerSet:${roomId}`, playerId);
  }
};

export const deleteRoom = async (roomId: string) => {
  const playerIdList = await redisClient.smembers(`roomPlayerSet:${roomId}`);

  return Promise.all([
    ...playerIdList.map((id) => redisClient.del(`player:${id}`)),
    redisClient
      .multi()
      .del(`roomPlayerSet:${roomId}`)
      .del(`room:${roomId}`)
      .del(`roomWhiteMatchHistory:${roomId}`)
      .del(`roomBlackMatchHistory:${roomId}`)
      .del(`roomPokemonBoard:${roomId}`)
      .del(`roomPokemonMoveHistory:${roomId}`)
      .del(`roomPokemonBan:${roomId}`)
      .exec(),
  ]);
};

export const setUserAsTransient = async (
  playerId: string,
  transientTimestamp: number,
) => {
  return await redisClient.hset(`player:${playerId}`, {
    transient: transientTimestamp,
  });
};

export const getRoomIdFromHostId = async (hostId: string) => {
  try {
    const response = await redisClient.call(
      "FT.SEARCH",
      "hash-idx:rooms",
      `@hostId:${hostId}`,
    );

    if (!Array.isArray(response) || !response[0]) {
      return;
    }

    const results = [];

    for (let i = 1; i < response.length; i += 2) {
      const value: Record<string, string> = {};
      for (let j = 0; j < response[i + 1].length; j += 2) {
        const key = response[i + 1][j] as string;
        value[key] = response[i + 1][j + 1];
      }
      results.push({ id: response[i], value });
    }
    return results.map(({ id }) => id.replace("room:", ""));
  } catch {
    return;
  }
};

export const createRoom = async (roomId: string, room: GameRoom) => {
  await redisClient.hset(`room:${roomId}`, {
    publicSeed: room.publicSeed,
    isOngoing: 0,
    format: "random",
    atkBuff: 0,
    defBuff: 0,
    spaBuff: 0,
    spdBuff: 1,
    speBuff: 0,
    accuracyBuff: 0,
    evasionBuff: 0,
    weatherWars: 0,
    timersEnabled: 1,
    banTimerDuration: 30,
    chessTimerDuration: 15,
    chessTimerIncrement: 5,
    pokemonTimerIncrement: 5,
  });
};

export const movePlayerToActive = async (roomId: string, playerId: string) => {
  const response = await redisClient
    .multi()
    .hget(`room:${roomId}`, "player1Id")
    .hget(`room:${roomId}`, `player2Id`)
    .exec();

  if (!response) {
    return;
  }

  const [player1, player2] = response.map(([, result]) => result);

  if (!player1) {
    await redisClient.hset(`room:${roomId}`, "player1Id", playerId);
  } else if (!player2) {
    await redisClient.hset(`room:${roomId}`, "player2Id", playerId);
  }
};

export const movePlayerToInactive = async (
  roomId: string,
  playerId: string,
) => {
  const response = await redisClient
    .multi()
    .hget(`room:${roomId}`, "player1Id")
    .hget(`room:${roomId}`, `player2Id`)
    .exec();

  if (!response) {
    return;
  }

  const [player1, player2] = response.map(([, result]) => result);

  if ((player1 as unknown as string) === playerId) {
    await redisClient.hdel(`room:${roomId}`, "player1Id");
  } else if ((player2 as unknown as string) === playerId) {
    await redisClient.hdel(`room:${roomId}`, "player2Id");
  }
};

const getRoomHash = async (roomId: string, key: string) => {
  return await redisClient.hget(`room:${roomId}`, key);
};

export const fetchAllUsersInRoom = async (roomId: string): Promise<User[]> => {
  const connectedPlayerIds = await redisClient.smembers(
    `roomPlayerSet:${roomId}`,
  );
  const cachedUsers = await Promise.all(
    connectedPlayerIds.map((id) => {
      return fetchUser(id);
    }),
  );
  return cachedUsers.filter((user) => user !== null);
};

export const fetchPlayer1Id = async (
  roomId: string,
): Promise<string | null> => {
  return await getRoomHash(roomId, "player1Id");
};

export const fetchPlayer2Id = async (
  roomId: string,
): Promise<string | null> => {
  return await getRoomHash(roomId, "player2Id");
};

export const fetchHostPlayerId = async (
  roomId: string,
): Promise<string | null> => {
  return await getRoomHash(roomId, "hostId");
};

export const fetchWhitePlayerId = async (
  roomId: string,
): Promise<string | null> => {
  return await getRoomHash(roomId, "whitePlayerId");
};

export const fetchBlackPlayerId = async (
  roomId: string,
): Promise<string | null> => {
  return await getRoomHash(roomId, "blackPlayerId");
};

export const fetchPlayer1 = async (roomId: string): Promise<User | null> => {
  const player1Id = await fetchPlayer1Id(roomId);
  return await fetchUser(player1Id);
};

export const fetchPlayer2 = async (roomId: string): Promise<User | null> => {
  const player2Id = await fetchPlayer2Id(roomId);
  return await fetchUser(player2Id);
};

export const fetchGameOptions = async (
  roomId: string,
): Promise<GameOptions | null> => {
  const response = await redisClient
    .multi()
    .hget(`room:${roomId}`, "format")
    .hget(`room:${roomId}`, `atkBuff`)
    .hget(`room:${roomId}`, `defBuff`)
    .hget(`room:${roomId}`, `spaBuff`)
    .hget(`room:${roomId}`, `spdBuff`)
    .hget(`room:${roomId}`, `speBuff`)
    .hget(`room:${roomId}`, `accuracyBuff`)
    .hget(`room:${roomId}`, `evasionBuff`)
    .hget(`room:${roomId}`, `weatherWars`)
    .hget(`room:${roomId}`, `timersEnabled`)
    .hget(`room:${roomId}`, `banTimerDuration`)
    .hget(`room:${roomId}`, `chessTimerDuration`)
    .hget(`room:${roomId}`, `chessTimerIncrement`)
    .hget(`room:${roomId}`, `pokemonTimerIncrement`)
    .exec();

  if (!response) {
    return null;
  }
  const [
    format,
    atkBuff,
    defBuff,
    spaBuff,
    spdBuff,
    speBuff,
    accuracyBuff,
    evasionBuff,
    weatherWars,
    timersEnabled,
    banTimerDuration,
    chessTimerDuration,
    chessTimerIncrement,
    pokemonTimerIncrement,
  ] = response.map(([, result]) => result);
  return {
    format: format as unknown as FormatID,
    offenseAdvantage: {
      atk: parseInt(atkBuff as unknown as string),
      def: parseInt(defBuff as unknown as string),
      spa: parseInt(spaBuff as unknown as string),
      spd: parseInt(spdBuff as unknown as string),
      spe: parseInt(speBuff as unknown as string),
      accuracy: parseInt(accuracyBuff as unknown as string),
      evasion: parseInt(evasionBuff as unknown as string),
    },
    weatherWars: (weatherWars as unknown as string) === "1",
    timersEnabled: (timersEnabled as unknown as string) === "1",
    banTimerDuration: parseInt(banTimerDuration as unknown as string),
    chessTimerDuration: parseInt(chessTimerDuration as unknown as string),
    chessTimerIncrement: parseInt(chessTimerIncrement as unknown as string),
    pokemonTimerIncrement: parseInt(pokemonTimerIncrement as unknown as string),
  };
};

export const setPlayerViewingResults = async (playerId: string, v: boolean) => {
  return await redisClient.hset(
    `player:${playerId}`,
    "viewingResults",
    v ? 1 : 0,
  );
};

export const setPlayersViewingResults = async (
  playerIdList: string[],
  v: boolean,
) => {
  return Promise.all(
    playerIdList.map((playerId) => setPlayerViewingResults(playerId, v)),
  );
};

export const setPlayerSpectating = async (
  roomId: string,
  playerId: string,
  s: boolean,
) => {
  if (s) {
    await movePlayerToActive(roomId, playerId);
  } else {
    await movePlayerToInactive(roomId, playerId);
  }
  return await redisClient.hset(`player:${playerId}`, "spectating", s ? 1 : 0);
};

export const fetchPlayerSpectating = async (
  playerId: string,
): Promise<boolean> => {
  return (
    parseInt(
      (await redisClient.hget(`player:${playerId}`, "spectating")) || "0",
    ) === 1
  );
};

export const setGameRoomOptions = async (
  roomId: string,
  options: GameOptions,
) => {
  return await redisClient.hset(`room:${roomId}`, {
    format: options.format,
    atkBuff: options.offenseAdvantage.atk,
    defBuff: options.offenseAdvantage.def,
    spaBuff: options.offenseAdvantage.spa,
    spdBuff: options.offenseAdvantage.spd,
    speBuff: options.offenseAdvantage.spe,
    accuracyBuff: options.offenseAdvantage.accuracy,
    evasionBuff: options.offenseAdvantage.evasion,
    weatherWars: options.weatherWars ? 1 : 0,
    timersEnabled: options.timersEnabled ? 1 : 0,
    banTimerDuration: options.banTimerDuration,
    chessTimerDuration: options.chessTimerDuration,
    chessTimerIncrement: options.chessTimerIncrement,
    pokemonTimerIncrement: options.pokemonTimerIncrement,
  });
};

export const setGameRoomSeed = async (roomId: string, seed: string) => {
  return await redisClient.hset(`room:${roomId}`, {
    publicSeed: seed,
  });
};

export const setRoomSquareModifierTarget = async (
  roomId: string,
  squareModifierTarget: number,
) => {
  return await redisClient.hset(`room:${roomId}`, {
    squareModifierTarget,
  });
};

export const getRoomSquareModifierTarget = async (roomId: string) => {
  const cachedSquareModifierTarget = await redisClient.hget(
    `room:${roomId}`,
    "squareModifierTarget",
  );
  if (!cachedSquareModifierTarget) {
    return;
  }
  return parseInt(cachedSquareModifierTarget);
};

export const setRoomSquareModifiers = async (
  roomId: string,
  squareModifiers: number[],
) => {
  if (!squareModifiers.length) {
    return;
  }

  return redisClient
    .multi()
    .del(`roomSquareModifiers:${roomId}`)
    .rpush(`roomSquareModifiers:${roomId}`, ...squareModifiers)
    .exec();
};

export const getRoomSquareModifiers = async (
  roomId: string,
): Promise<number[]> => {
  return (await redisClient.lrange(`roomSquareModifiers:${roomId}`, 0, -1)).map(
    (i) => parseInt(i),
  );
};

export const clearRoomSquareModifiers = async (roomId: string) => {
  return await redisClient.del(`roomSquareModifiers:${roomId}`);
};

export const setWhitePlayerPokemonMove = async (
  roomId: string,
  pokemonMove: string | null,
) => {
  if (!pokemonMove) {
    return await redisClient.hdel(`room:${roomId}`, "whitePlayerPokemonMove");
  } else {
    return await redisClient.hset(`room:${roomId}`, {
      whitePlayerPokemonMove: pokemonMove,
    });
  }
};

export const getWhitePlayerPokemonMove = async (roomId: string) => {
  return await redisClient.hget(`room:${roomId}`, "whitePlayerPokemonMove");
};

export const setBlackPlayerPokemonMove = async (
  roomId: string,
  pokemonMove: string | null,
) => {
  if (!pokemonMove) {
    return await redisClient.hdel(`room:${roomId}`, "blackPlayerPokemonMove");
  } else {
    return await redisClient.hset(`room:${roomId}`, {
      blackPlayerPokemonMove: pokemonMove,
    });
  }
};

export const getBlackPlayerPokemonMove = async (roomId: string) => {
  return await redisClient.hget(`room:${roomId}`, "blackPlayerPokemonMove");
};

export const resetMatchHistory = async (roomId: string) => {
  return await Promise.all([
    resetWhiteMatchHistory(roomId),
    resetBlackMatchHistory(roomId),
  ]);
};

const resetWhiteMatchHistory = async (roomId: string) => {
  return await redisClient.del(`roomWhiteMatchHistory:${roomId}`);
};

const resetBlackMatchHistory = async (roomId: string) => {
  return await redisClient.del(`roomBlackMatchHistory:${roomId}`);
};

export const pushMatchHistory = async (roomId: string, matchLog: MatchLog) => {
  return await Promise.all([
    pushWhiteMatchHistory(roomId, JSON.stringify(matchLog)),
    pushBlackMatchHistory(roomId, JSON.stringify(matchLog)),
  ]);
};

export const pushWhiteMatchHistory = async (
  roomId: string,
  ...matchLogString: string[]
) => {
  return await redisClient.rpush(
    `roomWhiteMatchHistory:${roomId}`,
    ...matchLogString,
  );
};

export const pushBlackMatchHistory = async (
  roomId: string,
  ...matchLogString: string[]
) => {
  return await redisClient.rpush(
    `roomBlackMatchHistory:${roomId}`,
    ...matchLogString,
  );
};

export const getWhiteMatchHistory = async (roomId: string) => {
  return await redisClient.lrange(`roomWhiteMatchHistory:${roomId}`, 0, -1);
};

export const getBlackMatchHistory = async (roomId: string) => {
  return await redisClient.lrange(`roomBlackMatchHistory:${roomId}`, 0, -1);
};

export const initializeGameStart = async (
  roomId: string,
  whitePlayerId: string,
  blackPlayerId: string,
) => {
  return await redisClient.hset(`room:${roomId}`, {
    isOngoing: 1,
    whitePlayerId,
    blackPlayerId,
  });
};

export const setGeneratedPokemonIndices = async (
  roomId: string,
  boardIndices: number[],
) => {
  return await redisClient
    .multi()
    .del(`roomPokemonBoard:${roomId}`)
    .rpush(`roomPokemonBoard:${roomId}`, ...boardIndices)
    .exec();
};

export const getRoomBoard = async (roomId: string) => {
  return await redisClient.hget(`room:${roomId}`, "chessBoard");
};

export const setChessBoard = async (roomId: string, chessBoard: string) => {
  return await redisClient.hset(`room:${roomId}`, {
    chessBoard,
  });
};

export const getRoomPokemonIndices = async (
  roomId: string,
): Promise<number[]> => {
  return (await redisClient.lrange(`roomPokemonBoard:${roomId}`, 0, -1)).map(
    (i) => parseInt(i),
  );
};

export const setPokemonBattleSeed = async (
  roomId: string,
  battleSeed?: string,
) => {
  if (!battleSeed) {
    return await redisClient.hdel(`room:${roomId}`, "battleSeed");
  }
  return await redisClient.hset(`room:${roomId}`, {
    battleSeed,
  });
};

export const getPokemonBattleSeed = async (roomId: string) => {
  return await redisClient.hget(`room:${roomId}`, "battleSeed");
};

export const setPokemonBattleStakes = async (
  roomId: string,
  currentBattleStakes?: { san: string; color: Color },
) => {
  if (!currentBattleStakes) {
    return await redisClient.hdel(`room:${roomId}`, "currentBattleStakes");
  }
  return await redisClient.hset(`room:${roomId}`, {
    currentBattleStakes: JSON.stringify(currentBattleStakes),
  });
};

export const getPokemonBattleStakes = async (
  roomId: string,
): Promise<{ san: string; color: Color } | null> => {
  const currentPokemonBattleStakes = await redisClient.hget(
    `room:${roomId}`,
    "currentBattleStakes",
  );
  try {
    if (currentPokemonBattleStakes) {
      return JSON.parse(currentPokemonBattleStakes);
    }
  } catch (e) {
    console.log(
      "Could not parse battle stakes:",
      (e as unknown as Error).message,
    );
  }
  return null;
};

export const clearPokemonMoveHistory = async (roomId: string) => {
  return await redisClient.del(`roomPokemonMoveHistory:${roomId}`);
};

export const pushPokemonMoveHistory = async (
  roomId: string,
  p1Move: string,
  p2Move: string,
) => {
  return await redisClient.rpush(
    `roomPokemonMoveHistory:${roomId}`,
    p1Move,
    p2Move,
  );
};

export const getPokemonMoveHistory = async (roomId: string) => {
  return await redisClient.lrange(`roomPokemonMoveHistory:${roomId}`, 0, -1);
};

export const pushPokemonBanList = async (
  roomId: string,
  pokemonIndex: number,
) => {
  return await redisClient.rpush(`roomPokemonBan:${roomId}`, pokemonIndex);
};

export const getPokemonBanList = async (roomId: string): Promise<number[]> => {
  return (await redisClient.lrange(`roomPokemonBan:${roomId}`, 0, -1)).map(
    (i) => parseInt(i),
  );
};

export const clearPokemonBanList = async (roomId: string) => {
  return await redisClient.del(`roomPokemonBan:${roomId}`);
};

export const setWhiteTimerExpiration = async (
  roomId: string,
  timerExpiration?: string,
) => {
  if (!timerExpiration) {
    return await redisClient.hdel(
      `room:${roomId}`,
      "whitePlayerTimerExpiration",
    );
  }
  return await redisClient.hset(`room:${roomId}`, {
    whitePlayerTimerExpiration: timerExpiration,
  });
};

export const getWhiteTimerExpiration = async (roomId: string) => {
  return await redisClient.hget(`room:${roomId}`, "whitePlayerTimerExpiration");
};

export const setBlackTimerExpiration = async (
  roomId: string,
  timerExpiration?: string,
) => {
  if (!timerExpiration) {
    return await redisClient.hdel(
      `room:${roomId}`,
      "blackPlayerTimerExpiration",
    );
  }
  return await redisClient.hset(`room:${roomId}`, {
    blackPlayerTimerExpiration: timerExpiration,
  });
};

export const getBlackTimerExpiration = async (roomId: string) => {
  return await redisClient.hget(`room:${roomId}`, "blackPlayerTimerExpiration");
};

export const setWhiteTimeSinceLastMove = async (
  roomId: string,
  timestamp?: string,
) => {
  if (!timestamp) {
    return await redisClient.hdel(
      `room:${roomId}`,
      "whitePlayerTimeSinceLastMove",
    );
  }
  return await redisClient.hset(`room:${roomId}`, {
    whitePlayerTimeSinceLastMove: timestamp,
  });
};

export const getWhiteTimeSinceLastMove = async (roomId: string) => {
  return await redisClient.hget(
    `room:${roomId}`,
    "whitePlayerTimeSinceLastMove",
  );
};

export const setBlackTimeSinceLastMove = async (
  roomId: string,
  timestamp?: string,
) => {
  if (!timestamp) {
    return await redisClient.hdel(
      `room:${roomId}`,
      "blackPlayerTimeSinceLastMove",
    );
  }
  return await redisClient.hset(`room:${roomId}`, {
    blackPlayerTimeSinceLastMove: timestamp,
  });
};

export const getBlackTimeSinceLastMove = async (roomId: string) => {
  return await redisClient.hget(
    `room:${roomId}`,
    "blackPlayerTimeSinceLastMove",
  );
};

export const setWhiteTimerPaused = async (roomId: string, paused: boolean) => {
  return await redisClient.hset(`room:${roomId}`, {
    whitePlayerTimerPaused: paused ? 1 : 0,
  });
};

export const getWhiteTimerPaused = async (roomId: string) => {
  return (
    (await redisClient.hget(`room:${roomId}`, "whitePlayerTimerPaused")) === "1"
  );
};

export const setBlackTimerPaused = async (roomId: string, paused: boolean) => {
  return await redisClient.hset(`room:${roomId}`, {
    blackPlayerTimerPaused: paused ? 1 : 0,
  });
};

export const getBlackTimerPaused = async (roomId: string) => {
  return (
    (await redisClient.hget(`room:${roomId}`, "blackPlayerTimerPaused")) === "1"
  );
};

export const setRoomTimers = async (
  roomId: string,
  {
    whitePlayerTimerExpiration,
    whitePlayerTimeSinceLastMove,
    whitePlayerTimerPaused,
    blackPlayerTimerExpiration,
    blackPlayerTimeSinceLastMove,
    blackPlayerTimerPaused,
  }: {
    whitePlayerTimerExpiration: number;
    whitePlayerTimeSinceLastMove: number;
    whitePlayerTimerPaused: boolean;
    blackPlayerTimerExpiration: number;
    blackPlayerTimeSinceLastMove: number;
    blackPlayerTimerPaused: boolean;
  },
) => {
  return await redisClient.hset(`room:${roomId}`, {
    whitePlayerTimerExpiration,
    whitePlayerTimeSinceLastMove,
    whitePlayerTimerPaused: whitePlayerTimerPaused ? 1 : 0,
    blackPlayerTimerExpiration,
    blackPlayerTimeSinceLastMove,
    blackPlayerTimerPaused: blackPlayerTimerPaused ? 1 : 0,
  });
};

export const setLockForRoom = async (roomId: string, expireTime?: number) => {
  return await redlock.acquire([`roomLock:${roomId}`], expireTime || 60 * 1000);
};

export const releaseLockForRoom = async (lock: Lock) => {
  return lock.release();
};
