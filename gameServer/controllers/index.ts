import { Express } from "express";
import User from "../models/User.js";
import GameRoom from "../models/GameRoom.js";
import GameRoomManager from "../models/GameRoomManager.js";
import { isStringProfane } from "../../shared/util/profanityFilter.js";

interface APIResponse<Data> {
  data?: Data;
  message?: string;
}

type Empty = object;

export const registerRoutes = (
  app: Express,
  gameRoomManager: GameRoomManager,
) => {
  app.get("/health", (_, res) => {
    res.status(200).send("Ok");
  });

  /**
   * Creates a room and adds it in memory.
   * The player that creates the room becomes the host.
   */
  app.post<
    Empty,
    APIResponse<{ roomId: GameRoom["roomId"] }>,
    {
      playerName: User["playerName"];
      playerId: User["playerId"];
      password: string;
      avatarId: User["avatarId"];
      playerSecret: User["playerSecret"];
    }
  >("/game-service/create-room", async (req, res) => {
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
  app.put<
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
  >("/game-service/join-room", async (req, res) => {
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
    } else if (isStringProfane(playerName)) {
      res.status(400).send({ message: "Name does not pass profanity filter." });
      return;
    }

    if (room.password !== password) {
      res.status(401).send({ message: "Invalid password" });
      return;
    }

    if (!room) {
      res.status(400).send({ message: "Room is no longer available" });
      return;
    }
    const existingPlayer = room.getPlayer(playerId);
    if (existingPlayer) {
      if (room.transientPlayerList[playerId]) {
        clearTimeout(room.transientPlayerList[playerId]);
      }
      existingPlayer.setViewingResults(false);
    } else {
      room?.joinRoom(
        new User(playerName, playerId, avatarId || "1", playerSecret),
      );
    }
    res.status(200).send({ data: { roomId: roomId } });
  });

  /**
   * Leave Room
   */
  app.put<
    Empty,
    APIResponse<Empty>,
    { roomId?: GameRoom["roomId"]; playerId?: User["playerId"] }
  >("/game-service/leave-room", async (req, res) => {
    const roomId = req.body.roomId;
    const playerId = req.body.playerId;
    const room = gameRoomManager.getRoom(roomId);
    if (!roomId || !playerId || !room) {
      res.status(204).send();
      return;
    }

    gameRoomManager.playerLeaveRoom(roomId, req.body.playerId);

    res.status(200).send();
  });
};
