import { createClient, SCHEMA_FIELD_TYPE, SearchReply } from "redis";
import { getConfig } from "../config.js";

/**
 *
 * roomPlayerSet:{roomId} -> playerId[]
 * room:{roomId} -> { roomCode, hostName, hostId, isOngoing }
 */

const redisClient = createClient({ url: getConfig().redisUrl });

const connectAndIndexRedis = async () => {
  redisClient.on("error", (err) => console.log("Redis Client Error", err));
  await redisClient.connect();
  await createRedisIndex();
};

const createRedisIndex = async () => {
  const indexList = await redisClient.ft._list();
  if (indexList.includes("hash-idx:rooms")) {
    return;
  }

  redisClient.ft.create(
    "hash-idx:rooms",
    {
      hostName: SCHEMA_FIELD_TYPE.TEXT,
      hostId: SCHEMA_FIELD_TYPE.TEXT,
      roomCode: SCHEMA_FIELD_TYPE.TEXT,
      isOngoing: SCHEMA_FIELD_TYPE.NUMERIC,
    },
    {
      ON: "HASH",
      PREFIX: "room",
    },
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
  await redisClient.hSet(hash, key, value);
};

export const getValue = async (
  hash: string,
  key: string,
): Promise<string | null> => {
  return redisClient.hGet(hash, key);
};

export const addPlayerIdToRoom = async (
  roomId: string,
  playerId: string,
): Promise<void> => {
  await redisClient.sAdd(`roomPlayerSet:${roomId}`, playerId);
};

export const isPlayerIdInRoom = async (
  roomId: string,
  playerId: string,
): Promise<number> => {
  return redisClient.sIsMember(`roomPlayerSet:${roomId}`, playerId);
};

export const removePlayerIdFromRoom = async (
  roomId: string,
  playerId: string,
): Promise<void> => {
  const roomHostId = await redisClient.hGet(`room:${roomId}`, "hostId");
  if (roomHostId === playerId) {
    await redisClient
      .multi()
      .del(`roomPlayerSet:${roomId}`)
      .del(`room:${roomId}`)
      .exec();
  } else {
    await redisClient.sRem(`roomPlayerSet:${roomId}`, playerId);
  }
};

export const getRoomSize = async (roomId: string): Promise<number> => {
  return redisClient.sCard(`roomPlayerSet:${roomId}`);
};

export const createRoom = async (
  roomId: string,
  roomCode: string,
  host: string,
  hostId: string,
) => {
  await redisClient
    .multi()
    .hSet(`room:${roomId}`, {
      roomCode,
      hostName: host,
      hostId,
      isOngoing: 0,
    })
    .sAdd(`roomPlayerSet:${roomId}`, hostId)
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
  return redisClient.hGet(`room:${roomId}`, "roomCode");
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
    const results = await redisClient.ft.search(
      "hash-idx:rooms",
      `${searchTerm ? `@hostName:${searchTerm}` : "*"}`,
      { LIMIT: { from: (page - 1) * limit, size: limit } },
    );
    if ((results as SearchReply)?.total) {
      return (results as SearchReply).documents.map(({ id, value }) => ({
        hostName: (value.hostName as string) || "",
        hasPassword: !!value.roomCode,
        isOngoing: value.isOngoing === "1",
        roomId: id.replace("room:", ""),
      }));
    }
  } catch (err) {
    console.log(err);
    return [];
  }

  return [];
};

export const getRoomIdFromHostId = async (hostId: string) => {
  try {
    const results = await redisClient.ft.search(
      "hash-idx:rooms",
      `@hostId:"${hostId}"`,
    );
    if ((results as SearchReply)?.total >= 1) {
      return (results as SearchReply).documents.map(({ id }) =>
        id.replace("room:", ""),
      );
    }
  } catch {
    return;
  }

  return;
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

  const [hostName, hasRoomCode, isOngoing, playerCount] = await redisClient
    .multi()
    .hGet(`room:${roomId}`, "hostName")
    .hGet(`room:${roomId}`, "roomCode")
    .hGet(`room:${roomId}`, "isOngoing")
    .sCard(`roomPlayerSet:${roomId}`)
    .exec();
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

  return await redisClient.hGet(`room:${roomId}`, "hostName");
};
