import express from 'express';
import path from 'path';
import { Server } from 'socket.io'
import cors from 'cors';
import http from 'http';
import https from 'https';
import fs from 'fs';
import GameRoomManager from './models/GameRoomManager';
import { config } from './config';
import { registerSocketEvents } from './socket/socketEvents';
import { registerRoutes } from './controllers';
import { registerSocketIoAdmin } from './socket/socketIoAdmin';

const configSettings = process.env.NODE_ENV === 'production' ? config.prodConfig : config.devConfig;

const httpPort = configSettings.httpPort;
const httpsPort = configSettings.httpsPort;
const allowedOrigins = configSettings.allowedOrigins;

const app = express();

const options: { key?: any; cert?: any; } = {};

try {
  options.key = fs.readFileSync(configSettings.keyLocation);
  options.cert = fs.readFileSync(configSettings.certLocation);
} catch (err) {
  console.log(err);
}

app.use(cors({
  origin: allowedOrigins,
  methods: 'GET,PUT,POST,OPTIONS',
  credentials: true,
  optionsSuccessStatus: 204,
}));

https.createServer(options, app).listen(httpsPort, () => {
  console.log(`HTTPS is listening on ${httpsPort}`);
});
const server = http.createServer(app).listen(httpPort, () => {
  console.log(`HTTP is listening on ${httpPort}`);
});

const io = new Server(server, {
  cors: {
    origin: [...allowedOrigins, 'https://admin.socket.io'],
    credentials: true
  }
});

app.use(express.json());
app.use(express.static(path.join(path.resolve(), './dist')));

const gameRoomManager = new GameRoomManager({}, io);

registerSocketEvents(io, gameRoomManager);
registerSocketIoAdmin(io);
registerRoutes(app, gameRoomManager);