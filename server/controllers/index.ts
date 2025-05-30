import path from "path";
import { Express } from "express";
import User from "../models/User";
import GameRoom from "../models/GameRoom";
import GameRoomManager from "../models/GameRoomManager";
import { isStringProfane } from "../../shared/util/profanityFilter";

interface APIResponse<Data> {
  data?: Data;
  message?: string;
}

type Empty = object;

export const registerRoutes = (
  app: Express,
  gameRoomManager: GameRoomManager,
) => {
  app.get("/", (_, res) => {
    res.sendFile(path.join(path.resolve(), "./dist/index.html"));
  });

  app.get("/healthz", (_, res) => {
    res.status(200).send("Ok");
  });

  /**
   * Creates a room and adds it in memory.
   * The player that creates the room becomes the host.
   */
  app.post<
    Empty,
    APIResponse<Partial<GameRoom>>,
    {
      playerName: User["playerName"];
      playerId: User["playerId"];
      password: string;
      avatarId: User["avatarId"];
      playerSecret: User["playerSecret"];
    }
  >("/api/createRoom", (req, res) => {
    const playerName = req.body.playerName;
    const playerId = req.body.playerId;
    const password = req.body.password;
    const avatarId = req.body.avatarId;
    const secret = req.body.playerSecret;

    if (!playerName || !playerId) {
      res.status(400).send();
      return;
    }

    if (isStringProfane(playerName)) {
      res.status(400).send({ message: "Name does not pass profanity filter." });
      return;
    }

    // Player already owns a room
    const { room } = gameRoomManager.getPlayer(playerId);
    if (room) {
      gameRoomManager.removeRoom(room.roomId);
    }
    const newRoomId = crypto.randomUUID();

    const host = new User(playerName, playerId, avatarId || "1", secret);
    const gameRoom = new GameRoom(
      newRoomId,
      host,
      password,
      gameRoomManager,
      false,
    );
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
  app.post<
    Empty,
    APIResponse<Empty>,
    {
      roomId?: GameRoom["roomId"];
      playerId?: User["playerId"];
      playerName?: User["playerName"];
      playerSecret: User["playerSecret"];
      password?: GameRoom["password"];
      avatarId?: User["avatarId"];
    }
  >("/api/joinRoom", (req, res) => {
    const roomId = req.body.roomId;
    const playerId = req.body.playerId;
    const playerName = req.body.playerName;
    const password = req.body.password;
    const avatarId = req.body.avatarId;
    const playerSecret = req.body.playerSecret;
    const room = gameRoomManager.getRoom(roomId);

    if (!roomId || !playerId || !playerName) {
      res.status(400).send({ message: "Missing parameters" });
      return;
    } else if (!room) {
      res.status(400).send({ message: "Room is no longer available" });
      return;
    } else if (room?.password !== password) {
      res.status(401).send({ message: "Invalid password" });
      return;
    } else if (isStringProfane(playerName)) {
      res.status(400).send({ message: "Name does not pass profanity filter." });
      return;
    }

    const existingPlayer = room.getPlayer(playerId);
    if (existingPlayer) {
      if (room.transientPlayerList[playerId]) {
        clearTimeout(room.transientPlayerList[playerId]);
      }
      existingPlayer.setViewingResults(false);
    } else {
      room.joinRoom(
        new User(playerName, playerId, avatarId || "1", playerSecret),
      );
    }
    res.status(200).send({ data: { roomId: roomId } });
  });

  /**
   * Leave Room
   */
  app.post<
    Empty,
    APIResponse<Empty>,
    { roomId?: GameRoom["roomId"]; playerId?: User["playerId"] }
  >("/api/leaveRoom", (req, res) => {
    const roomId = req.body.roomId;
    if (!roomId || !gameRoomManager.getRoom(roomId)) {
      res.status(204).send();
      return;
    }
    gameRoomManager.playerLeaveRoom(roomId, req.body.playerId);
    res.status(200).send();
  });

  /**
   * Get Rooms
   */
  app.get<
    Empty,
    APIResponse<{
      rooms: {
        roomId: GameRoom["roomId"];
        hostName: User["playerName"];
        hasPassword: boolean;
      }[];
      pageCount: number;
    }>,
    Empty,
    { page?: number; limit?: number; searchTerm?: string }
  >("/api/getRooms", (req, res) => {
    const { page = 1, limit = 10, searchTerm = "" } = req.query || {};

    const roomResponse = gameRoomManager
      .getAllRooms()
      .filter((id) => {
        const hostPlayerName =
          gameRoomManager.getRoom(id)?.hostPlayer?.playerName;
        if (!hostPlayerName) {
          return false;
        }
        if (gameRoomManager.getRoom(id)?.isQuickPlay) {
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
        };
      })
      .slice((page - 1) * limit, (page - 1) * limit + limit);

    res.status(200).send({
      data: {
        rooms: roomResponse,
        pageCount: Math.floor(roomResponse.length / limit) + 1,
      },
    });
  });

  /**
   * Get Room
   */
  app.get<
    Empty,
    APIResponse<{
      roomId: GameRoom["roomId"];
      isOngoing: GameRoom["isOngoing"];
      hostName?: User["playerName"];
      hasPassword: boolean;
    }>,
    Empty,
    { roomId?: GameRoom["roomId"] }
  >("/api/getRoom", (req, res) => {
    const { roomId } = req.query || {};

    const room = gameRoomManager.getRoom(roomId);

    if (!room) {
      res.status(404).send({ message: "Room not found." });
      return;
    }

    res.status(200).send({
      data: {
        roomId: room.roomId,
        isOngoing: room.isOngoing,
        hostName: room.hostPlayer?.playerName,
        hasPassword: !!room.password,
      },
    });
  });
};
