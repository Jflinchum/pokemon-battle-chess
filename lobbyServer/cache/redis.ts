import { Redis } from "ioredis";
import { getConfig } from "../config.js";

/**
 *
 * roomPlayerSet:{roomId} -> playerId[]
 * room:{roomId} -> { roomCode, hostName, hostId, isOngoing }
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
  if (Array.isArray(indexList) && indexList.includes("hash-idx:rooms")) {
    return;
  }

  redisClient.call(
    "FT.CREATE",
    "hash-idx:rooms",
    "ON",
    "HASH",
    "PREFIX",
    "1",
    "room:", // TODO confirm this works
    "SCHEMA",
    "hostName",
    "TEXT",
    "hostId",
    "TEXT",
  );
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
    })
    .exec();
};

export const isPlayerIdInRoom = async (
  roomId: string,
  playerId: string,
): Promise<number> => {
  return redisClient.sismember(`roomPlayerSet:${roomId}`, playerId);
};

export const removePlayerIdFromRoom = async (
  roomId: string,
  playerId: string,
): Promise<void> => {
  const roomHostId = await redisClient.hget(`room:${roomId}`, "hostId");
  if (roomHostId === playerId) {
    await redisClient
      .multi()
      .del(`roomPlayerSet:${roomId}`)
      .del(`room:${roomId}`)
      .del(`roomWhiteMatchHistory:${roomId}`)
      .del(`roomBlackMatchHistory:${roomId}`)
      .del(`roomPokemonBoard:${roomId}`)
      .del(`roomPokemonMoveHistory:${roomId}`)
      .del(`roomPokemonBan:${roomId}`)
      .del(`player:${playerId}`)
      .exec();
  } else {
    await redisClient.srem(`roomPlayerSet:${roomId}`, playerId);
  }
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
): Promise<
  {
    roomId: string;
    hostName: string;
    hasPassword: boolean;
    isOngoing: boolean;
  }[]
> => {
  try {
    const response = await redisClient.call(
      "FT.SEARCH",
      "hash-idx:rooms",
      `${searchTerm ? `@hostName:${searchTerm}` : "*"}`,
      "LIMIT",
      (page - 1) * limit,
      limit,
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
      results.push({ id: response[i], value });
    }

    return results.map(({ id, value }) => ({
      hostName: (value.hostName as string) || "",
      hasPassword: !!value.roomCode,
      isOngoing: value.isOngoing === "1",
      roomId: id.replace("room:", ""),
    }));
  } catch (err) {
    console.log(err);
    return [];
  }
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
