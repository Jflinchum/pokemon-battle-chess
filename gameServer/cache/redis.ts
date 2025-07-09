import { createClient } from "redis";
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
};

(async () => {
  await connectAndIndexRedis();
})();

export const setRoomToOngoing = async (roomId: string, isOngoing: boolean) => {
  const redisSetOngoing = await redisClient.hSet(
    `room:${roomId}`,
    "isOngoing",
    isOngoing ? 1 : 0,
  );
  return redisSetOngoing;
};
