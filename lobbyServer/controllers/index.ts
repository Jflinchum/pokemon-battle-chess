import path from "path";
import { Express } from "express";
import { isStringProfane } from "../../shared/util/profanityFilter.js";
import {
  addPlayerIdToRoom,
  createRoom,
  getRoomListDetails,
  getRoomPasscode,
  roomExists,
  getRoomFromName,
  getRoomSize,
  fetchUser,
} from "../cache/redis.js";
import { InternalConfig } from "../config.js";

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
      res.status(400).send({ message: "Name does not pass profanity filter." });
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

        try {
          await Promise.all([cacheCreateRoomPromise, cacheAddPlayerPromise]);
        } catch {
          res.status(500).send({
            data: { roomId: gameServerRespBody.data.roomId },
          });
        }
        res.status(200).send({
          data: { roomId: gameServerRespBody.data.roomId },
        });
      } else {
        res.status(gameServerResp.status).send();
      }
    } catch (err) {
      console.log(
        "Failed to request from game service: " + (err as unknown as Error),
      );
      console.log(config.gameServiceUrl);
      res.status(500).send();
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
    const doesRoomExist = await roomExists(roomId);

    if (!roomId || !playerId || !playerName || !playerSecret) {
      res.status(400).send({ message: "Missing parameters" });
      return;
    } else if (!doesRoomExist) {
      res.status(400).send({ message: "Room is no longer available" });
      return;
    } else if (isStringProfane(playerName)) {
      res.status(400).send({ message: "Name does not pass profanity filter." });
      return;
    }

    const roomPasscode = await getRoomPasscode(roomId);
    if (roomPasscode !== password) {
      res.status(401).send({ message: "Invalid password" });
      return;
    }

    const cachedUser = await fetchUser(playerId);
    if (cachedUser?.connectedRoom && cachedUser?.connectedRoom !== roomId) {
      console.log(
        "User in a different room already. Kicking them out of their previous room",
      );
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
        console.log(err);
        res.status(500).send();
        return;
      }
      res.status(200).send({ data: { roomId: roomId } });
    } else {
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
      const doesRoomExist = await roomExists(roomId);
      if (!roomId || !playerId || !doesRoomExist) {
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

    const roomDetails = await getRoomFromName(page, limit, searchTerm);

    const roomResponse = await Promise.all(
      roomDetails.map(async (room) => {
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
      roomId: string;
      isOngoing: boolean;
      hostName?: string;
      hasPassword: boolean;
    }>,
    Empty,
    { roomId?: string }
  >("/lobby-service/get-room", async (req, res) => {
    const { roomId } = req.query || {};

    const roomListDetails = await getRoomListDetails(roomId);

    if (!roomListDetails) {
      res.status(404).send({ message: "Room not found." });
      return;
    }

    res.status(200).send({
      data: roomListDetails,
    });
  });
};
