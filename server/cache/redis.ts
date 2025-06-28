import { createClient } from "redis";

const redisClient = createClient({ url: "redis://host.docker.internal:6379" });
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect();

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
  await redisClient
    .multi()
    .sRem(`roomPlayerSet:${roomId}`, playerId)
    .del(`hostName:${playerId}`)
    .exec();
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
      isOngoing: 0,
    })
    .set(`hostName:${host}`, roomId)
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

export const scanRoomNames = async (
  page: number,
  limit: number,
  searchTerm: string,
): Promise<{ cursor: string; keys: string[] }> => {
  return redisClient.scan(`${page * limit}`, {
    MATCH: `hostName:*${searchTerm}*`,
    COUNT: limit,
  });
};

export const getRoomIdFromHostname = async (
  hostName: string,
): Promise<string | null> => {
  return redisClient.get(`hostName:${hostName}`);
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
