export const getConfig = () => {
  return process.env.NODE_ENV === "production"
    ? config.prodConfig
    : config.devConfig;
};

export const config = {
  devConfig: {
    keyLocation: "nginx/private-key.key",
    certLocation: "nginx/certificate.crt",
    allowedOrigins: [
      "https://localhost:3001",
      "https://localhost:5173",
      "https://lobby-server-service:3001",
    ],
    redisUrl: "redis://host.docker.internal:6379",
    httpsPort: 3003,
  },

  prodConfig: {
    keyLocation: "nginx/private-key.key",
    certLocation: "nginx/certificate.crt",
    allowedOrigins: [],
    redisUrl: "redis://redis-service.default.svc.cluster.local:6379",
    httpsPort: 3003,
  },
};
