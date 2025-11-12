import cors from "cors";
import express from "express";
import http from "http";
import path from "path";
import { getConfig } from "./config.js";
import { registerRoutes } from "./controllers/index.js";
import { registerScheduler } from "./scheduler.js";

const configSettings = getConfig();

const httpPort = configSettings.httpPort;
const allowedOrigins = configSettings.allowedOrigins;

const app = express();

app.use(
  cors({
    origin: allowedOrigins,
    methods: "GET,PUT,POST,OPTIONS",
    credentials: true,
    optionsSuccessStatus: 204,
  }),
);
app.use((_, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  next();
});

http.createServer(app).listen(httpPort, () => {
  console.log(`LobbyServer HTTP is listening on ${httpPort}`);
});

app.use(express.json());
app.use(express.static(path.join(path.resolve(), "./dist")));

registerRoutes(app, configSettings);
registerScheduler(configSettings);
