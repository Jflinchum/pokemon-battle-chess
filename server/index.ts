import express from 'express';
import path from 'path';
import { Server } from 'socket.io'
import cors from 'cors';
import http from 'http';
import https from 'https';
import fs from 'fs';
import User from './User';
import GameRoomManager from './GameRoomManager';
import GameRoom from './GameRoom';
import { config } from './config';
import { assignSocketEvents } from './socketEvents';

interface APIResponse<Data> {
  data?: Data
  message?: string
}

interface Empty {}

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

const server = https.createServer(options, app).listen(httpsPort, () => {
  console.log(`App listening on ${httpsPort}`);
});
http.createServer(app).listen(httpPort, () => {
  console.log(`App listening on ${httpPort}`);
});
const io = new Server(server, {
  cors: {
    origin: allowedOrigins
  }
});

app.use(express.json());
app.use(express.static(path.join(path.resolve(), './dist')));

const gameRoomManager = new GameRoomManager({}, io);

assignSocketEvents(io, gameRoomManager);

app.get('/', (_, res) => {
  res.sendFile(path.join(path.resolve(), './dist/index.html'))
});

app.get('/healthz', (_, res) => {
  res.status(200).send('Ok');
});

/**
 * Creates a room and adds it in memory.
 * The player that creates the room becomes the host.
 */
app.post<Empty, APIResponse<Partial<GameRoom>>, { playerName, playerId, password, avatarId }>('/api/createRoom', (req, res) => {
  const playerName = req.body.playerName;
  const playerId = req.body.playerId;
  const password = req.body.password;
  const avatarId = req.body.avatarId;

  if (!playerName || !playerId) {
    res.status(400).send();
    return;
  }
  // Player already owns a room
  if (gameRoomManager.getPlayer(playerId)) {
    res.status(400).send();
    return;
  }
  const newRoomId = crypto.randomUUID();

  const host = new User(playerName, playerId, avatarId || '1');
  const gameRoom = new GameRoom(newRoomId, host, password, gameRoomManager);
  gameRoomManager.addRoom(newRoomId, gameRoom);

  res.status(200).send({
    data: { roomId: newRoomId },
  });
});

/**
 * Join Room
 * - User attempts to join room
 * - Server validates passcode
 * - Send room id back to user
 * - User joins on socket
 */
app.post<Empty, APIResponse<Empty>, { roomId?: GameRoom['roomId'], playerId?: User['playerId'], playerName?: User['playerName'], password?: GameRoom['password'], avatarId?: User['avatarId'] }>('/api/joinRoom', (req, res) => {
  const roomId = req.body.roomId;
  const playerId = req.body.playerId;
  const playerName = req.body.playerName;
  const password = req.body.password;
  const avatarId = req.body.avatarId;
  const room = gameRoomManager.getRoom(roomId);

  if (!roomId || !playerId || !playerName) {
    res.status(400).send({ message: 'Missing parameters' });
    return;
  } else if (!room) {
    res.status(400).send({ message: 'Room is no longer available' });
    return;
  } else if (room?.password !== password) {
    res.status(401).send({ message: 'Invalid password' });
    return;
  }

  if (room.getPlayer(playerId) && room.transientPlayerList[playerId]) {
    clearTimeout(room.transientPlayerList[playerId]);
  } else {
    room.joinRoom(new User(playerName, playerId, avatarId || '1'));
  }
  res.status(200).send({ data: { roomId: roomId } });
});

app.post<Empty, APIResponse<Empty>, { roomId?: GameRoom['roomId'], playerId?: User['playerId'] }>('/api/leaveRoom', (req, res) => {
  const roomId = req.body.roomId;
  if (!roomId || !gameRoomManager.getRoom(roomId)) {
    res.status(204).send();
    return;
  }
  gameRoomManager.playerLeaveRoom(roomId, req.body.playerId);
  res.status(200).send();
});

// TODO - pagination
app.get<Empty, Empty, { roomId: GameRoom['roomId'], hostName: User['playerName'] }[]>('/api/getRooms', (req, res) => {
  const roomResponse = gameRoomManager.getAllRooms().map((id) => {
    return {
      roomId: id,
      hostName: gameRoomManager.getRoom(id)?.hostPlayer?.playerName,
      hasPassword: !!gameRoomManager.getRoom(id)?.password,
    }
  })
  res.status(200).send({ rooms: roomResponse });
});
