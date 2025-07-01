import { createClient } from "redis";

/**
 *
 * roomPlayerSet:{roomId} -> playerId[]
 * room:{roomId} -> { roomCode, hostName, hostId, isOngoing }
 */

const redisClient = createClient({ url: "redis://host.docker.internal:6379" });

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
