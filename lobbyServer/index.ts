import cors from "cors";
import express from "express";
import fs from "fs";
import https from "https";
import path from "path";
import { SecureContextOptions } from "tls";
import { getConfig } from "./config.js";
import { registerRoutes } from "./controllers/index.js";
import { registerScheduler } from "./scheduler.js";

const configSettings = getConfig();

const httpsPort = configSettings.httpsPort;
const allowedOrigins = configSettings.allowedOrigins;

const app = express();

const options: {
  key?: SecureContextOptions["key"];
  cert?: SecureContextOptions["cert"];
} = {};

try {
  options.key = fs.readFileSync(configSettings.keyLocation);
  options.cert = fs.readFileSync(configSettings.certLocation);
} catch (err) {
  console.log(err);
}

app.use(
  cors({
    origin: allowedOrigins,
    methods: "GET,PUT,POST,OPTIONS",
    credentials: true,
    optionsSuccessStatus: 204,
  }),
);

https.createServer(options, app).listen(httpsPort, () => {
  console.log(`LobbyServer HTTPS is listening on ${httpsPort}`);
});

app.use(express.json());
app.use(express.static(path.join(path.resolve(), "./dist")));

registerRoutes(app, configSettings);
registerScheduler(configSettings);
