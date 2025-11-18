import { Express } from "express";
import User from "../../shared/models/User.js";
import { isStringProfane } from "../../shared/util/profanityFilter.js";
import { doesRoomExist, setPlayerViewingResults } from "../cache/redis.js";
import {
  FAILED_TO_CREATE_ROOM_ERROR,
  MISSING_PARAMETERS as MISSING_PARAMETERS_ERROR,
  NAME_PROFANITY_ERROR,
  ROOM_NO_LONGER_AVAILABLE_ERROR,
  UNABLE_TO_FIND_ROOM_ERROR,
  UNABLE_TO_JOIN_ROOM,
} from "../constants/errorMessages.js";
import logger from "../logger.js";
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
      res.status(400).send({ message: MISSING_PARAMETERS_ERROR });
      return;
    }

    if (isStringProfane(playerName)) {
      res.status(400).send({ message: NAME_PROFANITY_ERROR });
      return;
    }

    try {
      const { roomId } = await gameRoomManager.createAndCacheNewRoom(
        playerId,
        password,
      );
      await gameRoomManager.playerJoinRoom(roomId, playerId);
      gameRoomManager.clearPlayerTransientState(playerId);

      logger.info({
        request: "/game-service/create-room",
        body: {
          textPayload: "Successfully created a new room",
          playerName,
          playerId,
          roomId,
        },
      });
      res.status(200).send({
        data: { roomId },
      });
    } catch (err) {
      logger.error({
        request: "/game-service/create-room",
        body: {
          textPayload: "Failed to create a new room",
          playerName,
          playerId,
          err,
        },
      });
      res.status(500).send({ message: FAILED_TO_CREATE_ROOM_ERROR });
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
        res.status(400).send({ message: ROOM_NO_LONGER_AVAILABLE_ERROR });
        return;
      }
    } catch (err) {
      logger.error({
        request: "/game-service/join-room",
        body: {
          textPayload: "Could not fetch room from redis",
          err,
        },
      });
      res.status(500).send({ message: UNABLE_TO_FIND_ROOM_ERROR });
      return;
    }

    if (!roomId || !playerId || !playerName) {
      res.status(400).send({ message: MISSING_PARAMETERS_ERROR });
      return;
    } else if (isStringProfane(playerName)) {
      res.status(400).send({ message: NAME_PROFANITY_ERROR });
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
      logger.info({
        request: "/game-service/join-room",
        body: {
          textPayload: "Player has succesfully joined the room",
          playerName,
          playerId,
          roomId,
        },
      });
      res.status(200).send({ data: { roomId: roomId } });
    } catch (err) {
      logger.error({
        request: "/game-service/join-room",
        body: {
          textPayload: "Failed to allow player to join the room",
          playerName,
          playerId,
          roomId,
          err,
        },
      });
      res.status(500).send({ message: UNABLE_TO_JOIN_ROOM });
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
      logger.info({
        request: "/game-service/leave-room",
        body: {
          textPayload: "Player has left the room",
          playerId,
          roomId,
        },
      });
      await gameRoomManager.playerLeaveRoom(roomId, playerId);
    } catch (err) {
      logger.error({
        request: "/game-service/leave-room",
        body: {
          textPayload: "Failed to allow player to leave the room",
          playerId,
          roomId,
          err,
        },
      });
      // Continue silently
    }

    res.status(200).send();
  });
};
