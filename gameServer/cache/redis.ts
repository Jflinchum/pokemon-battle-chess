import { Redis } from "ioredis";
import { PRNGSeed } from "@pkmn/sim";
import { Color } from "chess.js";
import { getConfig } from "../config.js";
import GameRoom from "../models/GameRoom.js";
import User from "../../shared/models/User.js";
import { GameOptions } from "../../shared/types/GameOptions.js";
import { FormatID } from "../../shared/models/PokemonBattleChessManager.js";
import { MatchLog } from "../../shared/types/Game.js";
import { Lock, Redlock } from "@sesamecare-oss/redlock";
import {
  REDIS_KEY_EXPIRY,
  ROOM_KEY,
} from "../../shared/constants/redisConstants.js";
import {
  getRoomKey,
  getRoomPlayerSetKey,
  getRoomPokemonMoveHistoryKey,
  getRoomWhiteMatchHistoryKey,
  getRoomBlackMatchHistoryKey,
  getRoomPokemonBoardKey,
  getRoomPokemonBanKey,
  getRoomSquareModifiersKey,
  getRoomLockKey,
  getRandomMatchmakingQueueKey,
  getDraftMatchmakingQueueKey,
  getPlayerKey,
} from "../../shared/cache/redis.js";

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
 * randomMatchmakingQueue - playerId[]
 * draftMatchmakingQueue - playerId[]
 * player:{playerId} -> { playerName, roomId, avatarId, secret, transient, viewingResults, spectating }
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
  return await redisClient.exists(getRoomKey(roomId));
};

export const fetchRoomCode = async (roomId: string) => {
  return await getRoomHash(roomId, "roomCode");
};

export const fetchPlayerSecret = async (playerId: string) => {
  return await redisClient.hget(getPlayerKey(playerId), "secret");
};

export const fetchUser = async (
  playerId: string | null,
): Promise<User | null> => {
  if (!playerId) {
    return null;
  }

  const response = await redisClient
    .multi()
    .hget(getPlayerKey(playerId), "playerName")
    .hget(getPlayerKey(playerId), "avatarId")
    .hget(getPlayerKey(playerId), "secret")
    .hget(getPlayerKey(playerId), "transient")
    .hget(getPlayerKey(playerId), "viewingResults")
    .hget(getPlayerKey(playerId), "spectating")
    .hget(getPlayerKey(playerId), "roomId")
    .exec();

  if (!response) {
    return null;
  }
  const [
    playerName,
    avatarId,
    secret,
    transient,
    viewingResults,
    spectating,
    roomId,
  ] = response.map(([, result]) => result);

  const isTransient = typeof transient === "string" && transient !== "0";
  const isViewingResults =
    typeof viewingResults === "string" && viewingResults === "1";
  const isSpectating = typeof spectating === "string" && spectating === "1";
  const connectedRoom = typeof roomId === "string" ? roomId : undefined;

  if (playerName && avatarId && secret) {
    return new User(
      playerName as unknown as string,
      playerId,
      avatarId as unknown as string,
      secret as unknown as string,
      isTransient,
      isViewingResults,
      isSpectating,
      connectedRoom,
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

  if (!(await doesRoomExist(roomId))) {
    return null;
  }
  const response = await redisClient
    .multi()
    .hget(getRoomKey(roomId), "roomCode")
    .hget(getRoomKey(roomId), "publicSeed")
    .hget(getRoomKey(roomId), "hostId")
    .hget(getRoomKey(roomId), "player1Id")
    .hget(getRoomKey(roomId), "player2Id")
    .hget(getRoomKey(roomId), "whitePlayerId")
    .hget(getRoomKey(roomId), "blackPlayerId")
    .hget(getRoomKey(roomId), "isOngoing")
    .hget(getRoomKey(roomId), "isQuickPlay")
    .smembers(getRoomPlayerSetKey(roomId))
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
    isQuickPlay,
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
    (isQuickPlay as unknown as string) === "1",
  );
};

export const setRoomToOngoing = async (roomId: string, isOngoing: boolean) => {
  return await redisClient.hset(
    getRoomKey(roomId),
    "isOngoing",
    isOngoing ? 1 : 0,
  );
};

export const removePlayerIdFromRoom = async (
  roomId: string,
  playerId: string,
  activePlayerSlot: 0 | 1 | 2,
): Promise<void> => {
  const roomHostId = await redisClient.hget(getRoomKey(roomId), "hostId");

  if (roomHostId === playerId) {
    await deleteRoom(roomId);
  } else if (activePlayerSlot) {
    const activePlayerSlotPromise = activePlayerSlot
      ? redisClient.hdel(getRoomKey(roomId), `player${activePlayerSlot}Id`)
      : Promise.resolve();

    await Promise.all([
      redisClient.srem(getRoomPlayerSetKey(roomId), playerId),
      redisClient.del(getPlayerKey(playerId)),
      activePlayerSlotPromise,
    ]);
  }
};

export const addPlayerToCache = async (user: User) => {
  const key = getPlayerKey(user.playerId);
  return redisClient
    .multi()
    .hset(key, {
      playerName: user.playerName,
      avatarId: user.avatarId,
      secret: user.playerSecret,
      viewingResults: 0,
      roomId: user.connectedRoom,
    })
    .expire(key, REDIS_KEY_EXPIRY)
    .exec();
};

export const deletePlayerFromCache = async (playerId: string) => {
  return await redisClient.del(getPlayerKey(playerId));
};

export const deleteRoom = async (roomId: string) => {
  const playerIdList = await redisClient.smembers(getRoomPlayerSetKey(roomId));

  return Promise.all([
    ...playerIdList.map((id) => redisClient.del(getPlayerKey(id))),
    redisClient
      .multi()
      .del(getRoomPlayerSetKey(roomId))
      .del(getRoomKey(roomId))
      .del(getRoomWhiteMatchHistoryKey(roomId))
      .del(getRoomBlackMatchHistoryKey(roomId))
      .del(getRoomPokemonBoardKey(roomId))
      .del(getRoomPokemonMoveHistoryKey(roomId))
      .del(getRoomPokemonBanKey(roomId))
      .exec(),
  ]);
};

export const setUserAsTransient = async (
  playerId: string,
  transientTimestamp: number,
) => {
  return await redisClient.hset(getPlayerKey(playerId), {
    transient: transientTimestamp,
  });
};

export const getUserTransientStatus = async (
  playerId: string,
): Promise<{ transientTimestamp?: string; currentRoomId?: string }> => {
  const response = await redisClient
    .multi()
    .hget(getPlayerKey(playerId), "transient")
    .hget(getPlayerKey(playerId), `roomId`)
    .exec();

  if (!response) {
    return {};
  }

  const [timestamp, roomId] = response.map(([, result]) => result);
  const transientTimestamp =
    typeof timestamp === "string" ? timestamp : undefined;
  const currentRoomId = typeof roomId === "string" ? roomId : undefined;

  return {
    transientTimestamp,
    currentRoomId,
  };
};

export const getRoomIdFromHostId = async (
  hostId: string,
): Promise<string[] | undefined> => {
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
    return results.map(({ id }) => id.replace(`${ROOM_KEY}:`, ""));
  } catch {
    return;
  }
};

export const createRoom = async (
  roomId: string,
  room: GameRoom,
  isQuickPlay?: boolean,
) => {
  await redisClient
    .multi()
    .hset(getRoomKey(roomId), {
      publicSeed: room.publicSeed,
      roomCode: room.password,
      isOngoing: isQuickPlay ? 1 : 0,
      format: room.roomGameOptions.format,
      atkBuff: room.roomGameOptions.offenseAdvantage.atk,
      defBuff: room.roomGameOptions.offenseAdvantage.def,
      spaBuff: room.roomGameOptions.offenseAdvantage.spa,
      spdBuff: room.roomGameOptions.offenseAdvantage.spd,
      speBuff: room.roomGameOptions.offenseAdvantage.spe,
      accuracyBuff: room.roomGameOptions.offenseAdvantage.accuracy,
      evasionBuff: room.roomGameOptions.offenseAdvantage.evasion,
      weatherWars: room.roomGameOptions.weatherWars ? 1 : 0,
      timersEnabled: room.roomGameOptions.timersEnabled ? 1 : 0,
      banTimerDuration: room.roomGameOptions.banTimerDuration,
      chessTimerDuration: room.roomGameOptions.chessTimerDuration,
      chessTimerIncrement: room.roomGameOptions.chessTimerIncrement,
      pokemonTimerIncrement: room.roomGameOptions.pokemonTimerIncrement,
      whitePlayerTimerPaused: 0,
      blackPlayerTimerPaused: 1,
      isQuickPlay: isQuickPlay ? 1 : 0,
    })
    .expire(getRoomKey(roomId), REDIS_KEY_EXPIRY)
    .exec();
};

export const addPlayerIdToRoomPlayerSet = async (
  roomId: string,
  playerId: string,
): Promise<void> => {
  await redisClient.sadd(getRoomPlayerSetKey(roomId), playerId);
};

export const movePlayerToActive = async (roomId: string, playerId: string) => {
  const response = await redisClient
    .multi()
    .hget(getRoomKey(roomId), "player1Id")
    .hget(getRoomKey(roomId), `player2Id`)
    .exec();

  if (!response) {
    return;
  }

  const [player1, player2] = response.map(([, result]) => result);

  if (playerId === player1 || playerId === player2) {
    return;
  }

  if (!player1) {
    return await setPlayerAsPlayer1(roomId, playerId);
  } else if (!player2) {
    return await setPlayerAsPlayer2(roomId, playerId);
  } else {
    return await redisClient.hset(getPlayerKey(playerId), "spectating", 1);
  }
};

export const setPlayerAsPlayer1 = async (roomId: string, playerId: string) => {
  return await redisClient
    .multi()
    .hset(getRoomKey(roomId), "player1Id", playerId)
    .hset(getPlayerKey(playerId), "spectating", 0)
    .exec();
};

export const setPlayerAsPlayer2 = async (roomId: string, playerId: string) => {
  return await redisClient
    .multi()
    .hset(getRoomKey(roomId), "player2Id", playerId)
    .hset(getPlayerKey(playerId), "spectating", 0)
    .exec();
};

export const movePlayerToInactive = async (
  roomId: string,
  playerId: string,
) => {
  const response = await redisClient
    .multi()
    .hget(getRoomKey(roomId), "player1Id")
    .hget(getRoomKey(roomId), `player2Id`)
    .exec();

  if (!response) {
    return;
  }

  const [player1, player2] = response.map(([, result]) => result);

  if ((player1 as unknown as string) === playerId) {
    await redisClient
      .multi()
      .hdel(getRoomKey(roomId), "player1Id")
      .hset(getPlayerKey(playerId), "spectating", 1)
      .exec();
  } else if ((player2 as unknown as string) === playerId) {
    await redisClient
      .multi()
      .hdel(getRoomKey(roomId), "player2Id")
      .hset(getPlayerKey(playerId), "spectating", 1)
      .exec();
  }
};

const getRoomHash = async (roomId: string, key: string) => {
  return await redisClient.hget(getRoomKey(roomId), key);
};

export const fetchAllUsersInRoom = async (roomId: string): Promise<User[]> => {
  const connectedPlayerIds = await redisClient.smembers(
    getRoomPlayerSetKey(roomId),
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
    .hget(getRoomKey(roomId), "format")
    .hget(getRoomKey(roomId), `atkBuff`)
    .hget(getRoomKey(roomId), `defBuff`)
    .hget(getRoomKey(roomId), `spaBuff`)
    .hget(getRoomKey(roomId), `spdBuff`)
    .hget(getRoomKey(roomId), `speBuff`)
    .hget(getRoomKey(roomId), `accuracyBuff`)
    .hget(getRoomKey(roomId), `evasionBuff`)
    .hget(getRoomKey(roomId), `weatherWars`)
    .hget(getRoomKey(roomId), `timersEnabled`)
    .hget(getRoomKey(roomId), `banTimerDuration`)
    .hget(getRoomKey(roomId), `chessTimerDuration`)
    .hget(getRoomKey(roomId), `chessTimerIncrement`)
    .hget(getRoomKey(roomId), `pokemonTimerIncrement`)
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
    getPlayerKey(playerId),
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
  moveToSpectating: boolean,
) => {
  if (moveToSpectating) {
    await movePlayerToInactive(roomId, playerId);
  } else {
    await movePlayerToActive(roomId, playerId);
  }
};

export const fetchPlayerSpectating = async (
  playerId: string,
): Promise<boolean> => {
  return (
    parseInt(
      (await redisClient.hget(getPlayerKey(playerId), "spectating")) || "0",
    ) === 1
  );
};

export const setGameRoomOptions = async (
  roomId: string,
  options: GameOptions,
) => {
  return await redisClient.hset(getRoomKey(roomId), {
    requestedSeed:
      process.env.NODE_ENV === "production" ? "" : options.gameSeed,
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
  return await redisClient.hset(getRoomKey(roomId), {
    publicSeed: seed,
  });
};

export const getRequestedGameSeed = async (roomId: string) => {
  return (
    ((await redisClient.hget(
      getRoomKey(roomId),
      "requestedSeed",
    )) as PRNGSeed) || ""
  );
};

export const setRoomSquareModifierTarget = async (
  roomId: string,
  squareModifierTarget: number,
) => {
  return await redisClient.hset(getRoomKey(roomId), {
    squareModifierTarget,
  });
};

export const getRoomSquareModifierTarget = async (roomId: string) => {
  const cachedSquareModifierTarget = await getRoomHash(
    roomId,
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
    .del(getRoomSquareModifiersKey(roomId))
    .rpush(getRoomSquareModifiersKey(roomId), ...squareModifiers)
    .expire(getRoomSquareModifiersKey(roomId), REDIS_KEY_EXPIRY)
    .exec();
};

export const getRoomSquareModifiers = async (
  roomId: string,
): Promise<number[]> => {
  return (
    await redisClient.lrange(getRoomSquareModifiersKey(roomId), 0, -1)
  ).map((i) => parseInt(i));
};

export const clearRoomSquareModifiers = async (roomId: string) => {
  return await redisClient.del(getRoomSquareModifiersKey(roomId));
};

export const setWhitePlayerPokemonMove = async (
  roomId: string,
  pokemonMove: string | null,
) => {
  if (!pokemonMove) {
    return await redisClient.hdel(getRoomKey(roomId), "whitePlayerPokemonMove");
  } else {
    return await redisClient.hset(getRoomKey(roomId), {
      whitePlayerPokemonMove: pokemonMove,
    });
  }
};

export const getWhitePlayerPokemonMove = async (roomId: string) => {
  return await getRoomHash(roomId, "whitePlayerPokemonMove");
};

export const setBlackPlayerPokemonMove = async (
  roomId: string,
  pokemonMove: string | null,
) => {
  if (!pokemonMove) {
    return await redisClient.hdel(getRoomKey(roomId), "blackPlayerPokemonMove");
  } else {
    return await redisClient.hset(getRoomKey(roomId), {
      blackPlayerPokemonMove: pokemonMove,
    });
  }
};

export const getBlackPlayerPokemonMove = async (roomId: string) => {
  return await getRoomHash(roomId, "blackPlayerPokemonMove");
};

export const resetMatchHistory = async (roomId: string) => {
  return await Promise.all([
    resetWhiteMatchHistory(roomId),
    resetBlackMatchHistory(roomId),
  ]);
};

const resetWhiteMatchHistory = async (roomId: string) => {
  return await redisClient.del(getRoomWhiteMatchHistoryKey(roomId));
};

const resetBlackMatchHistory = async (roomId: string) => {
  return await redisClient.del(getRoomBlackMatchHistoryKey(roomId));
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
  return await redisClient
    .multi()
    .rpush(getRoomWhiteMatchHistoryKey(roomId), ...matchLogString)
    .expire(getRoomWhiteMatchHistoryKey(roomId), REDIS_KEY_EXPIRY)
    .exec();
};

export const pushBlackMatchHistory = async (
  roomId: string,
  ...matchLogString: string[]
) => {
  return await redisClient
    .multi()
    .rpush(getRoomBlackMatchHistoryKey(roomId), ...matchLogString)
    .expire(getRoomBlackMatchHistoryKey(roomId), REDIS_KEY_EXPIRY)
    .exec();
};

export const getWhiteMatchHistory = async (roomId: string) => {
  return await redisClient.lrange(getRoomWhiteMatchHistoryKey(roomId), 0, -1);
};

export const getBlackMatchHistory = async (roomId: string) => {
  return await redisClient.lrange(getRoomBlackMatchHistoryKey(roomId), 0, -1);
};

export const initializeGameStart = async (
  roomId: string,
  whitePlayerId: string,
  blackPlayerId: string,
) => {
  return await redisClient.hset(getRoomKey(roomId), {
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
    .del(getRoomPokemonBoardKey(roomId))
    .rpush(getRoomPokemonBoardKey(roomId), ...boardIndices)
    .expire(getRoomPokemonBoardKey(roomId), REDIS_KEY_EXPIRY)
    .exec();
};

export const getRoomBoard = async (roomId: string) => {
  return await getRoomHash(roomId, "chessBoard");
};

export const setChessBoard = async (roomId: string, chessBoard: string) => {
  return await redisClient.hset(getRoomKey(roomId), {
    chessBoard,
  });
};

export const getRoomPokemonIndices = async (
  roomId: string,
): Promise<number[]> => {
  return (await redisClient.lrange(getRoomPokemonBoardKey(roomId), 0, -1)).map(
    (i) => parseInt(i),
  );
};

export const setPokemonBattleSeed = async (
  roomId: string,
  battleSeed?: string,
) => {
  if (!battleSeed) {
    return await redisClient.hdel(getRoomKey(roomId), "battleSeed");
  }
  return await redisClient.hset(getRoomKey(roomId), {
    battleSeed,
  });
};

export const getPokemonBattleSeed = async (roomId: string) => {
  return await getRoomHash(roomId, "battleSeed");
};

export const setPokemonBattleStakes = async (
  roomId: string,
  currentBattleStakes?: { san: string; color: Color },
) => {
  if (!currentBattleStakes) {
    return await redisClient.hdel(getRoomKey(roomId), "currentBattleStakes");
  }
  return await redisClient.hset(getRoomKey(roomId), {
    currentBattleStakes: JSON.stringify(currentBattleStakes),
  });
};

export const getPokemonBattleStakes = async (
  roomId: string,
): Promise<{ san: string; color: Color } | null> => {
  const currentPokemonBattleStakes = await redisClient.hget(
    getRoomKey(roomId),
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
  return await redisClient.del(getRoomPokemonMoveHistoryKey(roomId));
};

export const pushPokemonMoveHistory = async (
  roomId: string,
  p1Move: string,
  p2Move: string,
) => {
  return await redisClient.rpush(
    getRoomPokemonMoveHistoryKey(roomId),
    p1Move,
    p2Move,
  );
};

export const getPokemonMoveHistory = async (roomId: string) => {
  return await redisClient.lrange(getRoomPokemonMoveHistoryKey(roomId), 0, -1);
};

export const pushPokemonBanList = async (
  roomId: string,
  pokemonIndex: number,
) => {
  return await redisClient.rpush(getRoomPokemonBanKey(roomId), pokemonIndex);
};

export const getPokemonBanList = async (roomId: string): Promise<number[]> => {
  return (await redisClient.lrange(getRoomPokemonBanKey(roomId), 0, -1)).map(
    (i) => parseInt(i),
  );
};

export const clearPokemonBanList = async (roomId: string) => {
  return await redisClient.del(getRoomPokemonBanKey(roomId));
};

export const setWhiteTimerExpiration = async (
  roomId: string,
  timerExpiration?: string,
) => {
  if (!timerExpiration) {
    return await redisClient.hdel(
      getRoomKey(roomId),
      "whitePlayerTimerExpiration",
    );
  }
  return await redisClient.hset(getRoomKey(roomId), {
    whitePlayerTimerExpiration: timerExpiration,
  });
};

export const getWhiteTimerExpiration = async (roomId: string) => {
  return await getRoomHash(roomId, "whitePlayerTimerExpiration");
};

export const setBlackTimerExpiration = async (
  roomId: string,
  timerExpiration?: string,
) => {
  if (!timerExpiration) {
    return await redisClient.hdel(
      getRoomKey(roomId),
      "blackPlayerTimerExpiration",
    );
  }
  return await redisClient.hset(getRoomKey(roomId), {
    blackPlayerTimerExpiration: timerExpiration,
  });
};

export const getBlackTimerExpiration = async (roomId: string) => {
  return await getRoomHash(roomId, "blackPlayerTimerExpiration");
};

export const setWhiteTimeSinceLastMove = async (
  roomId: string,
  timestamp?: string,
) => {
  if (!timestamp) {
    return await redisClient.hdel(
      getRoomKey(roomId),
      "whitePlayerTimeSinceLastMove",
    );
  }
  return await redisClient.hset(getRoomKey(roomId), {
    whitePlayerTimeSinceLastMove: timestamp,
  });
};

export const getWhiteTimeSinceLastMove = async (roomId: string) => {
  return await getRoomHash(roomId, "whitePlayerTimeSinceLastMove");
};

export const setBlackTimeSinceLastMove = async (
  roomId: string,
  timestamp?: string,
) => {
  if (!timestamp) {
    return await redisClient.hdel(
      getRoomKey(roomId),
      "blackPlayerTimeSinceLastMove",
    );
  }
  return await redisClient.hset(getRoomKey(roomId), {
    blackPlayerTimeSinceLastMove: timestamp,
  });
};

export const getBlackTimeSinceLastMove = async (roomId: string) => {
  return await getRoomHash(roomId, "blackPlayerTimeSinceLastMove");
};

export const setWhiteTimerPaused = async (roomId: string, paused: boolean) => {
  return await redisClient.hset(getRoomKey(roomId), {
    whitePlayerTimerPaused: paused ? 1 : 0,
  });
};

export const getWhiteTimerPaused = async (roomId: string) => {
  return (await getRoomHash(roomId, "whitePlayerTimerPaused")) === "1";
};

export const setBlackTimerPaused = async (roomId: string, paused: boolean) => {
  return await redisClient.hset(getRoomKey(roomId), {
    blackPlayerTimerPaused: paused ? 1 : 0,
  });
};

export const getBlackTimerPaused = async (roomId: string) => {
  return (await getRoomHash(roomId, "blackPlayerTimerPaused")) === "1";
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
  return await redisClient.hset(getRoomKey(roomId), {
    whitePlayerTimerExpiration,
    whitePlayerTimeSinceLastMove,
    whitePlayerTimerPaused: whitePlayerTimerPaused ? 1 : 0,
    blackPlayerTimerExpiration,
    blackPlayerTimeSinceLastMove,
    blackPlayerTimerPaused: blackPlayerTimerPaused ? 1 : 0,
  });
};

export const setLockForRoom = async (roomId: string, expireTime?: number) => {
  return await redlock.acquire(
    [getRoomLockKey(roomId)],
    expireTime || 60 * 1000,
  );
};

export const releaseLockForRoom = async (lock: Lock) => {
  return lock.release();
};

export const pushPlayerToRandomQueue = async (user: User) => {
  return await redisClient
    .multi()
    .rpush(getRandomMatchmakingQueueKey(), user.playerId)
    .hset(getPlayerKey(user.playerId), {
      playerName: user.playerName,
      avatarId: user.avatarId,
      secret: user.playerSecret,
      viewingResults: 0,
    })
    .expire(getPlayerKey(user.playerId), REDIS_KEY_EXPIRY)
    .exec();
};

export const getFirstPlayerInRandomQueue = async () => {
  return await redisClient.lpop(getRandomMatchmakingQueueKey());
};

export const removePlayerFromRandomQueue = async (playerId: string) => {
  return await redisClient.lrem(getRandomMatchmakingQueueKey(), 0, playerId);
};

export const pushPlayerToDraftQueue = async (user: User) => {
  return await redisClient
    .multi()
    .rpush(getDraftMatchmakingQueueKey(), user.playerId)
    .hset(getPlayerKey(user.playerId), {
      playerName: user.playerName,
      avatarId: user.avatarId,
      secret: user.playerSecret,
      viewingResults: 0,
    })
    .expire(getPlayerKey(user.playerId), REDIS_KEY_EXPIRY)
    .exec();
};

export const getFirstPlayerInDraftQueue = async () => {
  return await redisClient.lpop(getDraftMatchmakingQueueKey());
};

export const removePlayerFromDraftQueue = async (playerId: string) => {
  return await redisClient.lrem(getDraftMatchmakingQueueKey(), 0, playerId);
};
