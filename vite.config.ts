/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import fs from "fs";
import { SecureContextOptions } from "tls";
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";

const httpsOptions: {
  key?: SecureContextOptions["key"];
  cert?: SecureContextOptions["cert"];
} = {};

try {
  httpsOptions.key = fs.readFileSync("./shared/tls.key");
  httpsOptions.cert = fs.readFileSync("./shared/tls.crt");
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
          ? "http://lobby-server-service:3001"
          : "https://localhost:3001",
        changeOrigin: process.env.DOCKER_HOST ? false : true,
        secure: false,
      },
      "/game-service": {
        target: process.env.DOCKER_HOST
          ? "http://game-server-service:3003"
          : "https://localhost:3003",
        changeOrigin: process.env.DOCKER_HOST ? false : true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/testUtils/vitest.setup.ts"],
    globalSetup: "./src/testUtils/vitest.global-setup.ts",
    coverage: {
      exclude: [...configDefaults.exclude, "util/*", "src/testUtils/*"],
    },
    exclude: [...configDefaults.exclude, "util/*", "src/testUtils/*"],
  },
});
