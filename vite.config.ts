import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import { config } from "./server/config";
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
  plugins: [react()],
  server: {
    https: httpsOptions,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        secure: false,
      },
    },
  },
});
