import { Server } from "socket.io";
import GameRoom from "./GameRoom.js";
import User from "../../shared/models/User.js";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/types/Socket.js";
import {
  createRoom as createRoomInCache,
  movePlayerToActive,
  deleteRoom,
  doesRoomExist,
  fetchRoomCode,
  fetchPlayerSecret,
  fetchUser,
  fetchAllUsersInRoom,
  fetchHostPlayerId,
  fetchPlayer1Id,
  fetchPlayer2Id,
  fetchWhitePlayerId,
  fetchBlackPlayerId,
  fetchGameOptions,
  fetchGame,
  fetchPlayerSpectating,
  setPlayerSpectating,
  setGameRoomOptions,
  removePlayerIdFromRoom,
  setUserAsTransient,
  pushPlayerToRandomQueue,
  pushPlayerToDraftQueue,
  removePlayerFromRandomQueue,
  removePlayerFromDraftQueue,
  getFirstPlayerInRandomQueue,
  getFirstPlayerInDraftQueue,
  getRoomIdFromHostId,
  setPlayerAsPlayer1,
  setPlayerAsPlayer2,
  deletePlayerFromCache,
  getUserTransient,
} from "../cache/redis.js";
import { Player } from "../../shared/types/Player.js";
import { Color } from "chess.js";
import { GameOptions } from "../../shared/types/GameOptions.js";
import { DEFAULT_GAME_OPTIONS } from "../constants/gameConstants.js";

interface GameRoomList {
  [roomId: string]: GameRoom;
}

export default class GameRoomManager {
  public currentRooms: GameRoomList;

  public randomBattleMatchQueue: User[];
  public draftBattleMatchQueue: User[];

  public transientPlayerList: Record<User["playerId"], NodeJS.Timeout> = {};

  private io: Server;

  constructor(
    rooms = {},
    io: Server<ClientToServerEvents, ServerToClientEvents>,
  ) {
    this.currentRooms = rooms;
    this.io = io;

    this.randomBattleMatchQueue = [];
    this.draftBattleMatchQueue = [];
  }

  public async getCachedRoom(roomId?: string): Promise<GameRoom | null> {
    if (!roomId) {
      return null;
    }
    return await fetchGame(roomId);
  }

  public async getUser(playerId?: string): Promise<User | null> {
    if (!playerId) {
      return null;
    }
    return await fetchUser(playerId);
  }

  public async getRoomOptions(roomId: string): Promise<GameOptions> {
    const gameRoomOptions = await fetchGameOptions(roomId);
    if (gameRoomOptions) {
      return gameRoomOptions;
    }
    console.log("Defaulting game room options");

    return {
      format: "random",
      offenseAdvantage: {
        atk: 0,
        def: 0,
        spa: 0,
        spd: 1,
        spe: 0,
        accuracy: 0,
        evasion: 0,
      },
      weatherWars: false,
      timersEnabled: true,
      banTimerDuration: 30,
      chessTimerDuration: 15,
      chessTimerIncrement: 5,
      pokemonTimerIncrement: 1,
    };
  }

  public async getPublicPlayerList(roomId: string): Promise<Player[]> {
    const [
      users,
      player1Id,
      player2Id,
      hostPlayerId,
      whitePlayerId,
      blackPlayerId,
    ] = await Promise.all([
      fetchAllUsersInRoom(roomId),
      fetchPlayer1Id(roomId),
      fetchPlayer2Id(roomId),
      fetchHostPlayerId(roomId),
      fetchWhitePlayerId(roomId),
      fetchBlackPlayerId(roomId),
    ]);

    return users.map((user) =>
      this.convertUserToPlayer({
        user,
        isHost: user.playerId === hostPlayerId,
        isPlayer1: user.playerId === player1Id,
        isPlayer2: user.playerId === player2Id,
        color:
          user.playerId === whitePlayerId
            ? "w"
            : user.playerId === blackPlayerId
              ? "b"
              : null,
        isTransient: user.transient,
        isSpectator: user.playerId !== player1Id && user.playerId !== player2Id,
      }),
    );
  }

  private convertUserToPlayer = ({
    user,
    isHost,
    isPlayer1,
    isPlayer2,
    isSpectator,
    isTransient,
    color,
  }: {
    user: User;
    isHost: boolean;
    isPlayer1: boolean;
    isPlayer2: boolean;
    isSpectator: boolean;
    isTransient: boolean;
    color: Color | null;
  }): Player => {
    return {
      playerName: user.playerName,
      playerId: user.playerId,
      avatarId: user.avatarId,
      transient: isTransient,
      viewingResults: user.viewingResults,
      isHost,
      isPlayer1,
      isPlayer2,
      color,
      isSpectator,
    };
  };

  public async cachedRoomExists(roomId: string) {
    return await doesRoomExist(roomId);
  }

  public async togglePlayerSpectating({
    roomId,
    playerId,
  }: {
    roomId: string;
    playerId: string;
  }) {
    const isSpectating = await fetchPlayerSpectating(playerId);
    return await setPlayerSpectating(roomId, playerId, !isSpectating);
  }

  public async verifyPlayerConnection(
    {
      roomId,
      playerId,
      secretId,
    }: { roomId?: string; playerId?: string; secretId?: string },
    altOptions?: { roomCode?: string },
  ): Promise<boolean> {
    if (!roomId || !playerId || !secretId) {
      console.log(`${playerId} mismatch for ${roomId}`);
      return false;
    }

    const cachedRoomExist = await doesRoomExist(roomId);
    if (cachedRoomExist === 0) {
      console.log(`${roomId} does not exist`);
      return false;
    }

    if (altOptions) {
      const roomCode = await fetchRoomCode(roomId);
      if (altOptions.roomCode !== roomCode) {
        console.log(`${playerId} invalid password for ${roomId}`);
        return false;
      }
    }

    const cachedPlayerSecret = await fetchPlayerSecret(playerId);
    if (cachedPlayerSecret !== secretId) {
      console.log(`${playerId} invalid player secret`);
      return false;
    }

    return true;
  }

  public async createAndCacheNewRoom(
    playerId: string,
    password: string,
    matchMaking?: "random" | "draft",
  ) {
    // Player already owns a room
    const roomIds = await getRoomIdFromHostId(playerId);

    // Player already owns a room
    if (roomIds) {
      try {
        await Promise.all(
          roomIds.map((roomId) => removePlayerIdFromRoom(roomId, playerId, 0)),
        );
      } catch (err) {
        console.log(err);
        // attempt to continue with creating the new room, anyways
      }
    }

    const newRoomId = crypto.randomUUID();

    let gameOptions;

    if (matchMaking) {
      gameOptions = DEFAULT_GAME_OPTIONS;
    }

    const gameRoom = new GameRoom(newRoomId, password, undefined, gameOptions);
    console.log(`Creating room ${newRoomId}`);
    await createRoomInCache(newRoomId, gameRoom, !!matchMaking);
    return gameRoom;
  }

  public removeRoom(roomId: string) {
    console.log(`Cleaning up room ${roomId}`);
    this.io.to(roomId).emit("roomClosed");
    deleteRoom(roomId);
  }

  public async playerCreatedRoomId(
    playerId: string,
  ): Promise<string | undefined> {
    const player = await fetchUser(playerId);
    const gameRoomExists = await doesRoomExist(player?.connectedRoom);
    if (gameRoomExists) {
      return player!.connectedRoom || undefined;
    }
    return;
  }

  public async playerJoinRoom(roomId: string, playerId: string) {
    await movePlayerToActive(roomId, playerId);
  }

  public async player1JoinRoom(roomId: string, playerId: string) {
    await setPlayerAsPlayer1(roomId, playerId);
  }

  public async player2JoinRoom(roomId: string, playerId: string) {
    await setPlayerAsPlayer2(roomId, playerId);
  }

  public async isPlayerActive(roomId: string, playerId: string) {
    const [player1Id, player2Id] = await Promise.all([
      fetchPlayer1Id(roomId),
      fetchPlayer2Id(roomId),
    ]);

    if (player1Id === playerId) {
      return 1;
    }

    if (player2Id === playerId) {
      return 2;
    }
    return 0;
  }

  public async setRoomOptions(roomId: string, options: GameOptions) {
    await setGameRoomOptions(roomId, options);
  }

  public async playerLeaveRoom(roomId: string, playerId?: string) {
    const room = await this.getCachedRoom(roomId);
    if (!room || !playerId) {
      return;
    }

    const activePlayerSlot = await this.isPlayerActive(roomId, playerId);

    if (room.hostPlayer?.playerId === playerId) {
      this.io.to(room.roomId).emit("endGameFromDisconnect", {
        name: room.hostPlayer.playerName,
        isHost: true,
      });
      this.removeRoom(room.roomId);
      return;
    }
    if (room.isOngoing && activePlayerSlot) {
      this.io
        .to(room.roomId)
        .emit(
          "gameOutput",
          room.endGame(
            room.whitePlayer?.playerId === playerId ? "b" : "w",
            "PLAYER_DISCONNECTED",
          ),
          () => {},
        );
    }

    await removePlayerIdFromRoom(roomId, playerId, activePlayerSlot);

    this.io
      .to(room.roomId)
      .emit("connectedPlayers", await this.getPublicPlayerList(roomId));
  }

  public async clearPlayerTransientState(playerId: string) {
    if (this.transientPlayerList[playerId]) {
      clearTimeout(this.transientPlayerList[playerId]);
      delete this.transientPlayerList[playerId];
    }

    await setUserAsTransient(playerId, 0);
  }

  public async preparePlayerDisconnect(playerId: string, roomId?: string) {
    const transientTimeout = setTimeout(async () => {
      const stillTransient = await getUserTransient(playerId);

      if (stillTransient && stillTransient !== "0") {
        if (roomId) {
          console.log(
            "Player disconnection exceeded timeout. Forcing them out of the room.",
          );
          this.playerLeaveRoom(roomId, playerId);
        } else {
          deletePlayerFromCache(playerId);
        }
      }
    }, 1000 * 60);
    this.transientPlayerList[playerId] = transientTimeout;
    await setUserAsTransient(playerId, new Date().getTime());
  }

  public async addPlayerToQueue(user: User, queue: "random" | "draft") {
    if (queue === "random") {
      return await pushPlayerToRandomQueue(user);
    } else if (queue === "draft") {
      return await pushPlayerToDraftQueue(user);
    }
  }

  public async getPlayerFromQueue(queue: "random" | "draft") {
    if (queue === "random") {
      return await getFirstPlayerInRandomQueue();
    } else if (queue === "draft") {
      return await getFirstPlayerInDraftQueue();
    }
  }

  public async removePlayerFromQueue(
    playerId: string,
    queue?: "random" | "draft",
  ) {
    if (!queue || queue === "random") {
      return await removePlayerFromRandomQueue(playerId);
    }
    if (!queue || queue === "draft") {
      return await removePlayerFromDraftQueue(playerId);
    }
  }
}
