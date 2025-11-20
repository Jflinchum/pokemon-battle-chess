import { Express } from "express";
import path from "path";
import { isStringProfane } from "../../shared/util/profanityFilter.js";
import {
  addPlayerIdToRoom,
  createRoom,
  fetchUser,
  getRoomFromName,
  getRoomListDetails,
  getRoomPasscode,
  getRoomSize,
  roomExists,
} from "../cache/redis.js";
import { InternalConfig } from "../config.js";
import {
  COULD_NOT_FETCH_ROOMS,
  INVALID_PASSWORD_ERROR,
  MISSING_PARAMETERS_ERROR,
  NAME_PROFANITY_ERROR,
  ROOM_NO_LONGER_AVAILABLE_ERROR,
  ROOM_NOT_FOUND_ERROR,
  UNABLE_TO_CREATE_ROOM,
  UNABLE_TO_JOIN_ROOM,
  UNABLE_TO_VERIFY_PASSWORD_ERROR,
} from "../constants/errorMessages.js";
import logger from "../logger.js";

interface APIResponse<Data> {
  data?: Data;
  message?: string;
}

type Empty = object;

export const registerRoutes = (app: Express, config: InternalConfig) => {
  app.get("/", (_, res) => {
    res.sendFile(path.join(path.resolve(), "./dist/index.html"));
  });

  app.get("/health", (_, res) => {
    res.status(200).send("Ok");
  });

  app.post<Empty, APIResponse<Empty>, { [key: string]: string | boolean }>(
    "/lobby-service/log",
    (req, res) => {
      if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).send();
        return;
      }

      if (req.body.level === "error") {
        logger.error({
          request: "/lobby-service/log",
          body: req.body,
        });
      } else if (req.body.level === "warn") {
        logger.warn({
          request: "/lobby-service/log",
          body: req.body,
        });
      } else {
        logger.info({
          request: "/lobby-service/log",
          body: req.body,
        });
      }
      res.status(200).send();
    },
  );

  /**
   * Creates a room.
   * The player that creates the room becomes the host.
   */
  app.post<
    Empty,
    APIResponse<{
      roomId: string;
    }>,
    {
      playerId: string;
      playerName: string;
      password: string;
      avatarId: string;
      playerSecret: string;
    }
  >("/lobby-service/create-room", async (req, res) => {
    const playerName = req.body.playerName;
    const playerId = req.body.playerId;
    const password = req.body.password;
    const avatarId = req.body.avatarId;
    const playerSecret = req.body.playerSecret;

    if (!playerName || !playerId) {
      res.status(400).send();
      return;
    }

    if (isStringProfane(playerName)) {
      res.status(400).send({ message: NAME_PROFANITY_ERROR });
      return;
    }

    try {
      const gameServerResp = await fetch(
        `${config.gameServiceUrl}/game-service/create-room`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId,
            playerName,
            password,
            avatarId,
            playerSecret,
          }),
        },
      );

      const gameServerRespBody = await gameServerResp.json();
      if (gameServerResp.status === 200) {
        try {
          const cacheCreateRoomPromise = createRoom(
            gameServerRespBody.data.roomId,
            password,
            playerName,
            playerId,
          );
          const cacheAddPlayerPromise = addPlayerIdToRoom(
            gameServerRespBody.data.roomId,
            playerName,
            avatarId,
            playerSecret,
            playerId,
          );
          await Promise.all([cacheCreateRoomPromise, cacheAddPlayerPromise]);
        } catch (err) {
          logger.error({
            request: "/lobby-service/create-room",
            body: {
              textPayload: "Failed to create rooms in redis",
              playerName,
              playerId,
              avatarId,
              error: err,
            },
          });
          res.status(500).send({ message: UNABLE_TO_CREATE_ROOM });
          return;
        }
        logger.info({
          request: "/lobby-service/create-room",
          body: {
            textPayload: "Successfully created a new room",
            playerName,
            playerId,
            avatarId,
          },
        });
        res.status(200).send({
          data: { roomId: gameServerRespBody.data.roomId },
        });
        return;
      } else {
        res.status(gameServerResp.status).send();
        return;
      }
    } catch (err) {
      logger.error({
        request: "/lobby-service/create-room",
        body: {
          textPayload: "Failed to request from game service",
          playerName,
          playerId,
          avatarId,
          error: err,
        },
      });
      res.status(500).send({ message: UNABLE_TO_CREATE_ROOM });
      return;
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
      roomId?: string;
      playerId?: string;
      playerName?: string;
      playerSecret?: string;
      password?: string;
      avatarId?: string;
    }
  >("/lobby-service/join-room", async (req, res) => {
    const roomId = req.body.roomId;
    const playerId = req.body.playerId;
    const playerName = req.body.playerName;
    const password = req.body.password;
    const avatarId = req.body.avatarId;
    const playerSecret = req.body.playerSecret;
    try {
      const doesRoomExist = await roomExists(roomId);
      if (!doesRoomExist) {
        res.status(400).send({ message: ROOM_NO_LONGER_AVAILABLE_ERROR });
        return;
      }
    } catch (err) {
      logger.error({
        request: "/lobby-service/join-room",
        body: {
          textPayload: "Could not fetch room from redis",
          err,
        },
      });
      // Continue checking other parameters
    }

    if (!roomId || !playerId || !playerName || !playerSecret) {
      res.status(400).send({ message: MISSING_PARAMETERS_ERROR });
      return;
    } else if (isStringProfane(playerName)) {
      res.status(400).send({ message: NAME_PROFANITY_ERROR });
      return;
    }

    try {
      const roomPasscode = await getRoomPasscode(roomId);
      if (roomPasscode !== password) {
        res.status(401).send({ message: INVALID_PASSWORD_ERROR });
        return;
      }
    } catch (err) {
      logger.error({
        request: "/lobby-service/join-room",
        body: {
          textPayload: "Could not fetch room passcode from redis",
          err,
        },
      });
      res.status(401).send({ message: UNABLE_TO_VERIFY_PASSWORD_ERROR });
      return;
    }

    try {
      const cachedUser = await fetchUser(playerId);
      if (cachedUser?.connectedRoom && cachedUser?.connectedRoom !== roomId) {
        logger.info({
          request: "/lobby-service/join-room",
          body: {
            textPayload:
              "User in a different room already. Kicking them out of their previous room",
          },
        });
        await fetch(`${config.gameServiceUrl}/game-service/leave-room`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId: cachedUser.connectedRoom,
            playerId,
          }),
        });
      }
    } catch (err) {
      logger.error({
        request: "/lobby-service/join-room",
        body: {
          textPayload:
            "Could not fetch user from redis to kick them out of any other rooms that they are in",
          err,
        },
      });
      // Continue silently
    }

    const gameServerResp = await fetch(
      `${config.gameServiceUrl}/game-service/join-room`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          playerId,
          playerName,
          avatarId,
          playerSecret,
        }),
      },
    );

    if (gameServerResp.status === 200) {
      try {
        await addPlayerIdToRoom(
          roomId,
          playerName,
          avatarId || "1",
          playerSecret,
          playerId,
        );
      } catch (err) {
        logger.error({
          request: "/lobby-service/join-room",
          body: {
            textPayload: "Failed to join room",
            err,
            playerName,
            playerId,
            roomId,
            avatarId,
          },
        });
        res.status(500).send({ message: UNABLE_TO_JOIN_ROOM });
        return;
      }
      logger.info({
        request: "/lobby-service/join-room",
        body: {
          textPayload: "Successfully let player join the room",
          playerName,
          playerId,
          roomId,
          avatarId,
        },
      });
      res.status(200).send({ data: { roomId: roomId } });
    } else {
      logger.error({
        request: "/lobby-service/join-room",
        body: {
          textPayload: "Game Server responded with a failure",
          status: gameServerResp.status,
          playerName,
          playerId,
          roomId,
          avatarId,
        },
      });
      res.status(gameServerResp.status).send(await gameServerResp.json());
    }
  });

  /**
   * Leave Room
   */
  app.put<Empty, APIResponse<Empty>, { roomId?: string; playerId?: string }>(
    "/lobby-service/leave-room",
    async (req, res) => {
      const roomId = req.body.roomId;
      const playerId = req.body.playerId;
      if (!roomId || !playerId) {
        res.status(204).send();
        return;
      }

      fetch(`${config.gameServiceUrl}/game-service/leave-room`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          playerId,
        }),
      });

      res.status(200).send();
    },
  );

  /**
   * Get Rooms:
   *  Given a page number, a limit, and a search term, return a list of rooms that
   *  - Pattern matches the host name with the search term
   *  - Paginates the response using the page number and limit
   *
   * The room response should be an array of "rooms" that contains:
   *  - The room id
   *  - The name of the host for the room
   *  - Whether or not it has a passcode
   */
  app.get<
    Empty,
    APIResponse<{
      rooms: {
        roomId: string;
        hostName: string;
        hasPassword: boolean;
        playerCount: number;
        isOngoing: boolean;
      }[];
      pageCount: number;
    }>,
    Empty,
    { page?: number; limit?: number; searchTerm?: string }
  >("/lobby-service/get-rooms", async (req, res) => {
    const { page = 1, limit = 10, searchTerm = "" } = req.query || {};

    try {
      const roomDetails = await getRoomFromName(page, limit, searchTerm);

      const roomResponse = await Promise.all(
        roomDetails.rooms.map(async (room) => {
          const playerCount = await getRoomSize(room.roomId);
          return {
            ...room,
            playerCount,
          };
        }),
      );
      res.status(200).send({
        data: {
          rooms: roomResponse,
          pageCount: Math.max(Math.ceil(roomDetails.roomCount / limit), 1),
        },
      });
    } catch (err) {
      logger.error({
        request: "/lobby-service/get-rooms",
        body: {
          textPayload: "Could not fetch rooms",
          err,
        },
      });
      res.status(500).send({
        message: COULD_NOT_FETCH_ROOMS,
      });
    }
  });

  /**
   * Get Room
   */
  app.get<
    Empty,
    APIResponse<{
      roomId: string;
      isOngoing: boolean;
      hostName?: string;
      hasPassword: boolean;
    }>,
    Empty,
    { roomId?: string }
  >("/lobby-service/get-room", async (req, res) => {
    const { roomId } = req.query || {};

    try {
      const roomListDetails = await getRoomListDetails(roomId);

      if (!roomListDetails) {
        res.status(404).send({ message: ROOM_NOT_FOUND_ERROR });
        return;
      }

      res.status(200).send({
        data: roomListDetails,
      });
      return;
    } catch (err) {
      logger.error({
        request: "/lobby-service/get-room",
        body: {
          textPayload: "Could not get room details from redis",
          err,
        },
      });
      res.status(404).send({ message: ROOM_NOT_FOUND_ERROR });
      return;
    }
  });
};
