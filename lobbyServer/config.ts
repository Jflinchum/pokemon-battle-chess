import { RedisOptions } from "ioredis";

export interface InternalConfig {
  keyLocation: string;
  certLocation: string;
  allowedOrigins: string[];
  gameServiceUrl: string;
  redisOptions: Partial<RedisOptions>;
  httpsPort: number;
}

export const getConfig = () => {
  return process.env.NODE_ENV === "production"
    ? config.prodConfig
    : config.devConfig;
};

export const config: Record<"devConfig" | "prodConfig", InternalConfig> = {
  devConfig: {
    keyLocation: "nginx/tls.key",
    certLocation: "nginx/tls.crt",
    allowedOrigins: ["https://localhost:5173"],
    gameServiceUrl: process.env.DOCKER_HOST
      ? "http://game-server-service:3003"
      : "http://localhost:3003",
    redisOptions: {
      host: "host.docker.internal",
      port: 6379,
    },
    httpsPort: 3001,
  },

  prodConfig: {
    keyLocation: "nginx/tls.key",
    certLocation: "nginx/tls.crt",
    allowedOrigins: [],
    gameServiceUrl: "http://game-server-service:3003",
    redisOptions: {
      sentinels: [
        {
          host: "redis-sentinel-node-0.redis-sentinel-headless.default.svc.cluster.local",
          port: 26379,
        },
        {
          host: "redis-sentinel-node-1.redis-sentinel-headless.default.svc.cluster.local",
          port: 26379,
        },
        {
          host: "redis-sentinel-node-2.redis-sentinel-headless.default.svc.cluster.local",
          port: 26379,
        },
      ],
      name: "mymaster",
    },
    httpsPort: 3001,
  },
};
