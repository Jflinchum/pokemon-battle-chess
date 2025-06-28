import path from "path";
import { Express } from "express";
import User from "../models/User.js";
import GameRoom from "../models/GameRoom.js";
import GameRoomManager from "../models/GameRoomManager.js";
import { isStringProfane } from "../../shared/util/profanityFilter.js";
import {
  addPlayerIdToRoom,
  createRoom,
  getRoomIdFromHostname,
  getRoomListDetails,
  getRoomPasscode,
  removePlayerIdFromRoom,
  roomExists,
  scanRoomNames,
} from "../cache/redis.js";

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
  >("/api/createRoom", async (req, res) => {
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

    await createRoom(newRoomId, password, host.playerName, host.playerId);
    await addPlayerIdToRoom(newRoomId, playerId);

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
  >("/api/joinRoom", async (req, res) => {
    const roomId = req.body.roomId;
    const playerId = req.body.playerId;
    const playerName = req.body.playerName;
    const password = req.body.password;
    const avatarId = req.body.avatarId;
    const playerSecret = req.body.playerSecret;
    const room = gameRoomManager.getRoom(roomId);
    const doesRoomExist = await roomExists(roomId);

    if (!roomId || !playerId || !playerName) {
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

    /**
     * Call game service to join room and let game service handle transient player
     */
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
  app.post<
    Empty,
    APIResponse<Empty>,
    { roomId?: GameRoom["roomId"]; playerId?: User["playerId"] }
  >("/api/leaveRoom", (req, res) => {
    const roomId = req.body.roomId;
    const playerId = req.body.playerId;
    const doesRoomExist = roomExists(roomId);
    if (!roomId || !playerId || !doesRoomExist) {
      res.status(204).send();
      return;
    }
    gameRoomManager.playerLeaveRoom(roomId, req.body.playerId);
    removePlayerIdFromRoom(roomId, playerId);
    res.status(200).send();
  });

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
        roomId: GameRoom["roomId"];
        hostName: User["playerName"];
        hasPassword: boolean;
      }[];
      pageCount: number;
    }>,
    Empty,
    { page?: number; limit?: number; searchTerm?: string }
  >("/api/getRooms", async (req, res) => {
    const { page = 1, limit = 10, searchTerm = "" } = req.query || {};

    const getRoomNamesFromSearchTerm = await scanRoomNames(
      page,
      limit,
      searchTerm,
    );

    const cachedRoomResponse = getRoomNamesFromSearchTerm.keys.map(
      async (hostName) => {
        try {
          const roomId = await getRoomIdFromHostname(hostName);
          const roomListDetails = await getRoomListDetails(roomId);
          return roomListDetails;
        } catch {
          return Promise.resolve(null);
        }
      },
    );

    const roomResponse = (await Promise.all(cachedRoomResponse)).filter(
      (room) => room !== null,
    );

    // const roomResponse = gameRoomManager
    //   .getAllRooms()
    //   .filter(async (id) => {
    //     const hostPlayerName =
    //       gameRoomManager.getRoom(id)?.hostPlayer?.playerName;
    //     if (!hostPlayerName) {
    //       return false;
    //     }
    //     if (gameRoomManager.getRoom(id)?.isQuickPlay) {
    //       return false;
    //     }
    //     return hostPlayerName.toLowerCase().includes(searchTerm.toLowerCase());
    //   })
    //   .map((id) => {
    //     const room = gameRoomManager.getRoom(id);
    //     return {
    //       roomId: id,
    //       hostName: room!.hostPlayer!.playerName,
    //       hasPassword: !!room?.password,
    //       playerCount: room?.getPlayers()?.length,
    //       matchInProgress: room?.isOngoing,
    //     };
    //   })
    //   .slice((page - 1) * limit, (page - 1) * limit + limit);

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
  >("/api/getRoom", async (req, res) => {
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
