import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import { config } from "./lobbyServer/config";
import { SecureContextOptions } from "tls";

const httpsOptions: {
  key?: SecureContextOptions["key"];
  cert?: SecureContextOptions["cert"];
} = {};

try {
  httpsOptions.key = fs.readFileSync(config.devConfig.keyLocation);
  httpsOptions.cert = fs.readFileSync(config.devConfig.certLocation);
} catch (err) {
  console.log(err);
}

// https://vite.dev/config/
export default defineConfig({
  publicDir: "./src/public",
  plugins: [react()],
  server: {
    https: httpsOptions,
    proxy: {
      "/lobby-service": {
        target: process.env.DOCKER_HOST
          ? "https://lobby-server-service:3001"
          : "https://localhost:3001",
        changeOrigin: process.env.DOCKER_HOST ? false : true,
        secure: false,
      },
      "/game-service": {
        target: process.env.DOCKER_HOST
          ? "https://game-server-service:3003"
          : "https://localhost:3003",
        changeOrigin: process.env.DOCKER_HOST ? false : true,
        secure: false,
      },
    },
  },
});
