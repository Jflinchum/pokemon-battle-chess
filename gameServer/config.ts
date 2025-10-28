import { RedisOptions } from "ioredis";

export const getConfig = () => {
  return process.env.NODE_ENV === "production"
    ? config.prodConfig
    : config.devConfig;
};

interface GameServerConfig {
  allowedOrigins: string[];
  redisOptions: Partial<RedisOptions>;
  serverPort: number;
}

export const config: Record<string, GameServerConfig> = {
  devConfig: {
    allowedOrigins: ["https://localhost:3001", "https://localhost:5173"],
    redisOptions: {
      host: "host.docker.internal",
      port: 6379,
    },
    serverPort: 3003,
  },

  prodConfig: {
    allowedOrigins: ["https://pokemon-gambit.com"],
    redisOptions: {
      sentinels: [{ host: "redis-sentinel", port: 26379 }],
      name: "mymaster",
    },
    serverPort: 3003,
  },
};
