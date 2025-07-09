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
    keyLocation: "nginx/private-key.key",
    certLocation: "nginx/certificate.crt",
    allowedOrigins: ["https://localhost:5173"],
    gameServiceUrl: process.env.DOCKER_HOST
      ? "https://game-server-service:3003"
      : "http://localhost:3003",
    redisUrl: "redis://host.docker.internal:6379",
    httpsPort: 3001,
  },

  prodConfig: {
    keyLocation: "nginx/private-key.key",
    certLocation: "nginx/certificate.crt",
    allowedOrigins: [],
    gameServiceUrl:
      "https://game-server-service.default.svc.cluster.local:3003",
    redisUrl: "redis://redis-service.default.svc.cluster.local:6379",
    httpsPort: 3001,
  },
};
