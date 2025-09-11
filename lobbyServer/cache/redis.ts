import { Redis } from "ioredis";
import { getConfig } from "../config.js";
import User from "./../../shared/models/User.js";

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
 * player:{playerId} -> { playerName, avatarId, roomId, secret, transient, viewingResults, spectating }
 * roomLock:{roomId}
 */

const redisClient = new Redis(getConfig().redisUrl, { lazyConnect: true });

const connectAndIndexRedis = async () => {
  redisClient.on("error", (err) => {
    console.log("Redis Client Error", err);
    redisClient.disconnect();
  });
  await redisClient.connect();
  await createRedisIndex();
};

const createRedisIndex = async () => {
  const indexList = await redisClient.call("FT._LIST");
  if (!Array.isArray(indexList) || !indexList.includes("hash-idx:rooms")) {
    redisClient.call(
      "FT.CREATE",
      "hash-idx:rooms",
      "ON",
      "HASH",
      "PREFIX",
      "1",
      "room:",
      "SCHEMA",
      "hostName",
      "TEXT",
      "hostId",
      "TEXT",
      "isQuickPlay",
      "NUMERIC",
    );
  }

  if (!Array.isArray(indexList) || !indexList.includes("hash-idx:players")) {
    redisClient.call(
      "FT.CREATE",
      "hash-idx:players",
      "ON",
      "HASH",
      "PREFIX",
      "1",
      "player:",
      "SCHEMA",
      "playerName",
      "TEXT",
      "transient",
      "NUMERIC",
    );
  }
};

(async () => {
  await connectAndIndexRedis();
})();

export const setKey = async (
  hash: string,
  key: string,
  value: string,
): Promise<void> => {
  await redisClient.hset(hash, key, value);
};

export const getValue = async (
  hash: string,
  key: string,
): Promise<string | null> => {
  return redisClient.hget(hash, key);
};

export const addPlayerIdToRoom = async (
  roomId: string,
  playerName: string,
  avatarId: string,
  secret: string,
  playerId: string,
): Promise<void> => {
  await redisClient
    .multi()
    .sadd(`roomPlayerSet:${roomId}`, playerId)
    .hset(`player:${playerId}`, {
      playerName,
      avatarId,
      secret,
      viewingResults: 0,
      roomId,
    })
    .exec();
};

export const isPlayerIdInRoom = async (
  roomId: string,
  playerId: string,
): Promise<number> => {
  return redisClient.sismember(`roomPlayerSet:${roomId}`, playerId);
};

export const getRoomSize = async (roomId: string): Promise<number> => {
  return redisClient.scard(`roomPlayerSet:${roomId}`);
};

export const createRoom = async (
  roomId: string,
  roomCode: string,
  host: string,
  hostId: string,
) => {
  await redisClient
    .multi()
    .hset(`room:${roomId}`, {
      roomCode,
      hostName: host,
      hostId,
      isOngoing: 0,
    })
    .sadd(`roomPlayerSet:${roomId}`, hostId)
    .exec();
};

export const roomExists = async (roomId?: string): Promise<number> => {
  if (!roomId) {
    return Promise.resolve(0);
  }
  return redisClient.exists(`room:${roomId}`);
};

export const getRoomPasscode = async (
  roomId: string,
): Promise<string | null> => {
  return redisClient.hget(`room:${roomId}`, "roomCode");
};

export const getRoomFromName = async (
  page: number,
  limit: number,
  searchTerm: string,
): Promise<{
  roomCount: number;
  rooms: {
    roomId: string;
    hostName: string;
    hasPassword: boolean;
    isOngoing: boolean;
  }[];
}> => {
  try {
    const response = await redisClient.call(
      "FT.SEARCH",
      "hash-idx:rooms",
      `${searchTerm ? `@hostName:'*${searchTerm}*' @isQuickPlay:[0 0]` : "@isQuickPlay:[0 0]"}`,
      "LIMIT",
      (page - 1) * limit,
      limit,
    );

    if (!Array.isArray(response) || !response[0]) {
      return { roomCount: 0, rooms: [] };
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

    return {
      roomCount: response[0],
      rooms: results.map(({ id, value }) => ({
        hostName: (value.hostName as string) || "",
        hasPassword: !!value.roomCode,
        isOngoing: value.isOngoing === "1",
        roomId: id.replace("room:", ""),
      })),
    };
  } catch (err) {
    console.log(err);
    return {
      roomCount: 0,
      rooms: [],
    };
  }
};

export const getRoomListDetails = async (
  roomId?: string | null,
): Promise<{
  roomId: string;
  hostName: string;
  hasPassword: boolean;
  isOngoing: boolean;
  playerCount: number;
} | null> => {
  if (!roomId) {
    return Promise.resolve(null);
  }

  const exists = await redisClient.exists(`room:${roomId}`);

  if (!exists) {
    return Promise.resolve(null);
  }

  const response = await redisClient
    .multi()
    .hget(`room:${roomId}`, "hostName")
    .hget(`room:${roomId}`, "roomCode")
    .hget(`room:${roomId}`, "isOngoing")
    .scard(`roomPlayerSet:${roomId}`)
    .exec();

  if (!response) {
    return Promise.resolve(null);
  }

  const [hostName, hasRoomCode, isOngoing, playerCount] = response.map(
    ([, result]) => result,
  );

  return Promise.resolve({
    roomId,
    hostName: hostName as unknown as string,
    hasPassword: !!hasRoomCode,
    isOngoing: !!isOngoing,
    playerCount: playerCount as unknown as number,
  });
};

export const getHostNameFromRoomId = async (roomId?: string | null) => {
  if (!roomId) {
    return Promise.resolve(null);
  }

  return await redisClient.hget(`room:${roomId}`, "hostName");
};

export const getDisconnectedUsers = async (): Promise<
  { playerId: string; roomId: string }[]
> => {
  const IDLE_TIME_UNTIL_DISCONNECT = 1000 * 60 * 3;
  try {
    const response = await redisClient.call(
      "FT.SEARCH",
      "hash-idx:players",
      `@transient:[1 ${new Date().getTime() + IDLE_TIME_UNTIL_DISCONNECT}]`,
    );

    if (!Array.isArray(response) || !response[0]) {
      return [];
    }

    const results = [];

    for (let i = 1; i < response.length; i += 2) {
      const value: Record<string, string> = {};
      for (let j = 0; j < response[i + 1].length; j += 2) {
        const key = response[i + 1][j] as string;
        value[key] = response[i + 1][j + 1];
      }
      results.push({
        playerId: response[i].replace("player:", ""),
        roomId: value.roomId,
      });
    }

    return results;
  } catch (err) {
    console.log(err);
    return [];
  }
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
    .hget(`player:${playerId}`, "roomId")
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
