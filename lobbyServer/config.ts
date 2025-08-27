export interface InternalConfig {
  keyLocation: string;
  certLocation: string;
  allowedOrigins: string[];
  gameServiceUrl: string;
  redisUrl: string;
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
    redisUrl: "redis://host.docker.internal:6379",
    httpsPort: 3001,
  },

  prodConfig: {
    keyLocation: "nginx/tls.key",
    certLocation: "nginx/tls.crt",
    allowedOrigins: [],
    gameServiceUrl: "http://game-server-service:3003",
    redisUrl: "redis://redis-service.default.svc.cluster.local:6379",
    httpsPort: 3001,
  },
};
