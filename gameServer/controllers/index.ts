import { Express } from "express";
import User from "../../shared/models/User.js";
import { isStringProfane } from "../../shared/util/profanityFilter.js";
import { doesRoomExist, setPlayerViewingResults } from "../cache/redis.js";
import GameRoom from "../models/GameRoom.js";
import GameRoomManager from "../models/GameRoomManager.js";

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
    }
  >("/game-service/create-room", async (req, res) => {
    const playerName = req.body.playerName;
    const playerId = req.body.playerId;
    const password = req.body.password;

    if (!playerName || !playerId) {
      res.status(400).send();
      return;
    }

    if (isStringProfane(playerName)) {
      res.status(400).send({ message: "Name does not pass profanity filter." });
      return;
    }

    try {
      const { roomId } = await gameRoomManager.createAndCacheNewRoom(
        playerId,
        password,
      );
      console.log(
        `Player ${playerName} (${playerId}) has created a new room ${roomId}`,
      );
      await gameRoomManager.playerJoinRoom(roomId, playerId);
      gameRoomManager.clearPlayerTransientState(playerId);

      res.status(200).send({
        data: { roomId },
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Could not create room." });
    }
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
    }
  >("/game-service/join-room", async (req, res) => {
    const roomId = req.body.roomId;
    const playerId = req.body.playerId;
    const playerName = req.body.playerName;

    try {
      const roomExists = await doesRoomExist(roomId);

      if (!roomExists) {
        res.status(400).send({ message: "Room is no longer available" });
        return;
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Unable to find room" });
    }

    if (!roomId || !playerId || !playerName) {
      res.status(400).send({ message: "Missing parameters" });
      return;
    } else if (isStringProfane(playerName)) {
      res.status(400).send({ message: "Name does not pass profanity filter." });
      return;
    }

    try {
      const existingPlayer = await gameRoomManager.getUser(playerId);
      if (existingPlayer?.transient) {
        gameRoomManager.clearPlayerTransientState(playerId);
        await setPlayerViewingResults(existingPlayer.playerId, false);
      } else {
        await gameRoomManager.playerJoinRoom(roomId, playerId);
      }
      console.log(
        `Player ${playerName} (${playerId}) has joined room ${roomId}`,
      );
      res.status(200).send({ data: { roomId: roomId } });
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Unable to add player to room." });
    }
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
    if (!roomId || !playerId) {
      res.status(204).send();
      return;
    }

    try {
      console.log(`Player (${playerId}) has left room ${roomId}`);
      await gameRoomManager.playerLeaveRoom(roomId, playerId);
    } catch (err) {
      console.error(err);
      // Continue silently
    }

    res.status(200).send();
  });
};
