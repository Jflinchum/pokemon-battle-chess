export interface InternalConfig {
  keyLocation: string;
  certLocation: string;
  allowedOrigins: string[];
  gameServiceUrl: string;
  httpsPort: number;
}

export const config: Record<"devConfig" | "prodConfig", InternalConfig> = {
  devConfig: {
    keyLocation: "nginx/private-key.key",
    certLocation: "nginx/certificate.crt",
    allowedOrigins: ["https://localhost:5173"],
    gameServiceUrl: process.env.DOCKER_HOST
      ? "https://game-service:3003"
      : "http://localhost:3002",
    httpsPort: 3001,
  },

  prodConfig: {
    keyLocation: "nginx/private-key.key",
    certLocation: "nginx/certificate.crt",
    allowedOrigins: [],
    gameServiceUrl: "https://game-service:3003",
    httpsPort: 3001,
  },
};
