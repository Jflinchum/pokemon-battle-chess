import { Redis } from "ioredis";

const redisClient = new Redis("redis://localhost:6379");

for (let i = 0; i < 300; i++) {
  console.log(`Creating room ${i}`);
  await redisClient.hset(`room:${i}`, {
    hostName: `Dummy host ${i}`,
    hostId: i,
    isOngoing: Math.random() > 0.5 ? 1 : 0,
    isQuickPlay: 0,
  });
  console.log("Room created");
}
