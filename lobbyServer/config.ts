export interface InternalConfig {
  keyLocation: string;
  certLocation: string;
  allowedOrigins: string[];
  gameServiceUrl: string;
  httpsPort: number;
}

export const config: Record<"devConfig" | "prodConfig", InternalConfig> = {
  devConfig: {
    keyLocation: "private-key.pem",
    certLocation: "certificate.pem",
    allowedOrigins: ["https://localhost:5173"],
    gameServiceUrl: process.env.DOCKER_HOST
      ? "http://game-service:3002"
      : "http://localhost:3002",
    httpsPort: 3001,
  },

  prodConfig: {
    keyLocation: "private-key.pem",
    certLocation: "certificate.pem",
    allowedOrigins: [],
    gameServiceUrl: "https://game-service:3002",
    httpsPort: 3001,
  },
};
