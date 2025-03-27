import express from 'express';
import path from 'path';
import { Server } from 'socket.io'
import cors from 'cors';
import User from './User';
import GameRoomManager from './GameRoomManager';
import GameRoom from './GameRoom';
import { captureRejectionSymbol } from 'events';

const serverPort = 3000;
const allowedOrigins = ['http://localhost:5173'];

const app = express();

const server = app.listen(serverPort, () => {
  console.log(`App listening on ${serverPort}`);
});
const io = new Server(server, {
  cors: {
    origin: allowedOrigins
  }
});

const gameRoomManager = new GameRoomManager();

app.use(cors({
  origin: allowedOrigins,
  methods: 'GET,PUT,POST,OPTIONS',
  credentials: true,
  optionsSuccessStatus: 204,
}));

app.use(express.json());

app.use(express.static(path.join(path.resolve(), './dist')));

app.get('/', (_, res) => {
  res.sendFile(path.join(path.resolve(), './dist/index.html'))
});

/**
 * Creates a room and adds it in memory.
 * The player that creates the room becomes the host.
 */
app.post<Empty, APIResponse<Partial<GameRoom>>, { playerName, playerId, password }>('/api/createRoom', (req, res) => {
  const playerName = req.body.playerName;
  const playerId = req.body.playerId;
  const password = req.body.password;

  if (!playerName || !playerId) {
    res.status(400).send();
    return;
  }
  const newRoomId = crypto.randomUUID();

  const host = new User(req.body.playerName, req.body.playerId);
  const gameRoom = new GameRoom(newRoomId, host, password);
  gameRoomManager.addRoom(newRoomId, gameRoom);

  res.status(200).send({
    data: { roomId: newRoomId },
  });
});

app.post<Empty, APIResponse<Empty>, { roomId: GameRoom['roomId'], playerId: User['playerId'], playerName: User['playerName'], password: GameRoom['password'] }>('/api/joinRoom', (req, res) => {
  const roomId = req.body.roomId;
  const playerId = req.body.playerId;
  const playerName = req.body.playerName;
  const password = req.body.password;

  if (!roomId || !playerId || !playerName) {
    res.status(400).send({ message: 'Missing parameters' });
    return;
  } else if (!gameRoomManager.getRoom(roomId)) {
    res.status(400).send({ message: 'Room is no longer available' });
    return;
  } else if (gameRoomManager.getRoom(roomId).clientPlayer) {
    res.status(400).send({ message: 'Room is full' });
    return;
  } else if (gameRoomManager.getRoom(roomId).password !== password) {
    res.status(401).send({ message: 'Invalid password' });
    return;
  }
  const room = gameRoomManager.getRoom(roomId);

  room.joinRoom(new User(playerId, playerName));
  res.status(200).send({ data: { roomId: roomId } });
});

app.post<Empty, APIResponse<Empty>, { roomId: GameRoom['roomId'], playerId: User['playerId'] }>('/api/leaveRoom', (req, res) => {
  const roomId = req.body.roomId;
  if (!roomId || !gameRoomManager.getRoom(roomId)) {
    res.status(204);
    return;
  }
  const room = gameRoomManager.getRoom(roomId);

  room.leaveRoom(req.body.playerId);
  res.status(200).send();

  if (!room.hasPlayers()) {
    gameRoomManager.removeRoom(req.body.roomId);
  }
});

// TODO - pagination
app.get<Empty, Empty, { roomId: GameRoom['roomId'], hostName: User['playerName'] }[]>('/api/getRooms', (req, res) => {
  const roomResponse = gameRoomManager.getAllRooms().map((id) => {
    return {
      roomId: id,
      hostName: gameRoomManager.getRoom(id).hostPlayer?.playerName,
      hasPassword: !!gameRoomManager.getRoom(id).password,
    }
  })
  res.status(200).send({ rooms: roomResponse });
});

io.on('connection', (socket) => {
  console.log('New User Connection');

  socket.on('disconnect', () => {
    console.log('User Disconnected');
    const game = gameRoomManager.disconnectUserFromSocket(socket);
    if (game && !game.hasPlayers()) {
      gameRoomManager.removeRoom(game.roomId);
    } else if (game) {
      io.to(game.roomId).emit('connectedPlayers', game.getPlayerNames());
    }
  });

  socket.on('joinRoom', (roomId, playerId, playerName, password) => {
    const room = gameRoomManager.getRoom(roomId);
    if (!room || !playerId || !playerName) {
      return socket.disconnect();
    }
    if (room.password !== password) {
      return socket.disconnect();
    }

    if (room.hostPlayer?.playerId === playerId) {
      room.hostPlayer!.socket = socket;
    } else {
      const newUser = new User(playerName, playerId);
      newUser.socket = socket;
      room.joinRoom(newUser);
    }
    socket.join(room.roomId);
    io.to(roomId).emit('connectedPlayers', room.getPlayerNames());
    console.log(`Player ${playerId} joined room ${roomId}`);
  });

  socket.on('requestStartGame', (roomId, playerId) => {
    const room = gameRoomManager.getRoom(roomId);

    if (!room || room.hostPlayer?.playerId !== playerId) {
      socket.disconnect();
      return;
    }

    room.startGame();
  });

  socket.on('requestChessMove', ({ fromSquare, toSquare, promotion, roomId, playerId }) => {
    const room = gameRoomManager.getRoom(roomId);
    if (!room || !playerId) {
      return socket.disconnect();
    }

    room.validateAndEmitChessMove({ fromSquare, toSquare, promotion, playerId });
  });

  socket.on('requestPokemonMove', ({ pokemonMove, roomId, playerId }) => {
    const room = gameRoomManager.getRoom(roomId);
    if (!room || !playerId) {
      return socket.disconnect();
    }

    room.validateAndEmitePokemonMove({ pokemonMove, playerId });
  });
});