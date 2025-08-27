export const getConfig = () => {
  return process.env.NODE_ENV === "production"
    ? config.prodConfig
    : config.devConfig;
};

export const config = {
  devConfig: {
    allowedOrigins: ["https://localhost:3001", "https://localhost:5173"],
    redisUrl: "redis://host.docker.internal:6379",
    serverPort: 3003,
  },

  prodConfig: {
    allowedOrigins: ["https://pokemon-gambit.com"],
    redisUrl: "redis://redis-service.default.svc.cluster.local:6379",
    serverPort: 3003,
  },
};
