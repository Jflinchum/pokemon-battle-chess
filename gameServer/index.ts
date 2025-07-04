import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import https from "https";
import { SecureContextOptions } from "tls";
import fs from "fs";
import GameRoomManager from "./models/GameRoomManager.js";
import { config } from "./config.js";
import { registerSocketEvents } from "./socket/socketEvents.js";
import { registerRoutes } from "./controllers/index.js";
import { registerSocketIoAdmin } from "./socket/socketIoAdmin.js";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../shared/types/Socket.js";

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

const server = https.createServer(options, app).listen(httpsPort, () => {
  console.log(`GameServer HTTPS is listening on ${httpsPort}`);
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: [...allowedOrigins, "https://admin.socket.io"],
    credentials: true,
  },
});

app.use(express.json());

const gameRoomManager = new GameRoomManager({}, io);

registerSocketEvents(io, gameRoomManager);
registerSocketIoAdmin(io);
registerRoutes(app, gameRoomManager);
