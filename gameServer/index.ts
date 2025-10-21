import { createAdapter } from "@socket.io/redis-streams-adapter";
import cors from "cors";
import express from "express";
import http from "http";
import { Redis } from "ioredis";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../shared/types/Socket.js";
import { getConfig } from "./config.js";
import { registerRoutes } from "./controllers/index.js";
import GameRoomManager from "./models/GameRoomManager.js";
import { registerSocketEvents } from "./socket/socketEvents.js";
import { registerSocketIoAdmin } from "./socket/socketIoAdmin.js";

const configSettings = getConfig();

const serverPort = configSettings.serverPort;
const allowedOrigins = configSettings.allowedOrigins;

const app = express();

app.use(
  cors({
    origin: allowedOrigins,
    methods: "GET,PUT,POST,OPTIONS",
    optionsSuccessStatus: 204,
  }),
);

const server = http.createServer(app).listen(serverPort, () => {
  console.log(`GameServer is listening on ${serverPort}`);
});

const redisClient = new Redis(getConfig().redisUrl, {
  enableOfflineQueue: false,
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  adapter: createAdapter(redisClient),
  cors: {
    origin: [...allowedOrigins, "https://admin.socket.io"],
  },
});

app.use(express.json());

const gameRoomManager = new GameRoomManager({}, io);

registerSocketEvents(io, gameRoomManager);
registerSocketIoAdmin(io);
registerRoutes(app, gameRoomManager);
