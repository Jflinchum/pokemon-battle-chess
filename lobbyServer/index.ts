import express from "express";
import path from "path";
import cors from "cors";
import https from "https";
import { SecureContextOptions } from "tls";
import fs from "fs";
import { config } from "./config.js";
import { registerRoutes } from "./controllers/index.js";

const configSettings =
  process.env.NODE_ENV === "production" ? config.prodConfig : config.devConfig;

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
