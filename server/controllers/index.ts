import path from "path";
import { Express } from 'express';
import User from '../models/User';
import GameRoom from '../models/GameRoom';
import GameRoomManager from "../models/GameRoomManager";

interface APIResponse<Data> {
  data?: Data
  message?: string
}

interface Empty {}

export const registerRoutes = (app: Express, gameRoomManager: GameRoomManager) => {
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
    const { room } = gameRoomManager.getPlayer(playerId);
    if (room) {
      gameRoomManager.removeRoom(room.roomId);
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

  app.get<Empty, APIResponse<{ rooms: { roomId: GameRoom['roomId'], hostName: User['playerName'], hasPassword: boolean }[], pageCount: number  }>, Empty, { page?: number, limit?: number, searchTerm?: string }>('/api/getRooms', (req, res) => {
    const { page = 1, limit = 10, searchTerm = '' } = req.query || {};

    const roomResponse = gameRoomManager.getAllRooms()
    .filter((id) => {
      const hostPlayerName = gameRoomManager.getRoom(id)?.hostPlayer?.playerName;
      if (!hostPlayerName) {
        return false;
      }
      return hostPlayerName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .map((id) => {
      const room = gameRoomManager.getRoom(id);
      return {
        roomId: id,
        hostName: room!.hostPlayer!.playerName,
        hasPassword: !!room?.password,
        playerCount: room?.getPlayers()?.length,
        matchInProgress: room?.isOngoing,
      }
    })
    .slice((page - 1) * limit, ((page - 1) * limit) + limit);

    res.status(200).send({ data: { rooms: roomResponse, pageCount: Math.floor(roomResponse.length / limit) + 1 } });
  });
};