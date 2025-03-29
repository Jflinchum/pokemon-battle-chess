import express from 'express';
import path from 'path';
import { Server } from 'socket.io'
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import User from './User';
import GameRoomManager from './GameRoomManager';
import GameRoom from './GameRoom';
import { keyLocation, certLocation } from './config';
import { assignSocketEvents } from './socketEvents';

const serverPort = 3000;
const allowedOrigins = ['https://localhost:5173'];

const app = express();
const options = {
  key: fs.readFileSync(keyLocation),
  cert: fs.readFileSync(certLocation),
}
app.use(cors({
  origin: allowedOrigins,
  methods: 'GET,PUT,POST,OPTIONS',
  credentials: true,
  optionsSuccessStatus: 204,
}));

const server = https.createServer(options, app).listen(serverPort, () => {
  console.log(`App listening on ${serverPort}`);
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

/**
 * Creates a room and adds it in memory.
 * The player that creates the room becomes the host.
 * TODO - restrict so player can only create one room
 */
app.post<Empty, APIResponse<Partial<GameRoom>>, { playerName, playerId, password }>('/api/createRoom', (req, res) => {
  const playerName = req.body.playerName;
  const playerId = req.body.playerId;
  const password = req.body.password;

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

  const host = new User(req.body.playerName, req.body.playerId);
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
app.post<Empty, APIResponse<Empty>, { roomId: GameRoom['roomId'], playerId: User['playerId'], playerName: User['playerName'], password: GameRoom['password'] }>('/api/joinRoom', (req, res) => {
  const roomId = req.body.roomId;
  const playerId = req.body.playerId;
  const playerName = req.body.playerName;
  const password = req.body.password;
  const room = gameRoomManager.getRoom(roomId);

  if (!roomId || !playerId || !playerName) {
    res.status(400).send({ message: 'Missing parameters' });
    return;
  } else if (!room) {
    res.status(400).send({ message: 'Room is no longer available' });
    return;
  } else if (room?.clientPlayer) {
    res.status(400).send({ message: 'Room is full' });
    return;
  } else if (room?.password !== password) {
    res.status(401).send({ message: 'Invalid password' });
    return;
  }

  room.joinRoom(new User(playerName, playerId));
  res.status(200).send({ data: { roomId: roomId } });
});

app.post<Empty, APIResponse<Empty>, { roomId?: GameRoom['roomId'], playerId?: User['playerId'] }>('/api/leaveRoom', (req, res) => {
  const roomId = req.body.roomId;
  if (!roomId || !gameRoomManager.getRoom(roomId)) {
    res.status(204);
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
