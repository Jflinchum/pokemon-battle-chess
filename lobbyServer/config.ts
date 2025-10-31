import { RedisOptions } from "ioredis";

export interface InternalConfig {
  allowedOrigins: string[];
  gameServiceUrl: string;
  redisOptions: Partial<RedisOptions>;
  httpPort: number;
}

export const getConfig = () => {
  return process.env.NODE_ENV === "production"
    ? config.prodConfig
    : config.devConfig;
};

export const config: Record<"devConfig" | "prodConfig", InternalConfig> = {
  devConfig: {
    allowedOrigins: ["https://localhost:5173"],
    gameServiceUrl: process.env.DOCKER_HOST
      ? "http://game-server-service:3003"
      : "http://localhost:3003",
    redisOptions: {
      host: "host.docker.internal",
      port: 6379,
    },
    httpPort: 3001,
  },

  prodConfig: {
    allowedOrigins: [],
    gameServiceUrl: "http://game-server-service:3003",
    redisOptions: {
      sentinels: [
        { host: "redis-sentinel.default.svc.cluster.local", port: 26379 },
      ],
      name: "mymaster",
    },
    httpPort: 3001,
  },
};
