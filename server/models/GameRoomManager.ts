import { Server, Socket } from "socket.io";
import GameRoom from "./GameRoom";
import User from "./User";
import { GameOptions } from "../../shared/types/GameOptions";
import { ClientToServerEvents, ServerToClientEvents } from "../../shared/types/Socket";

interface GameRoomList {
  [roomId: string]: GameRoom
}

export default class GameRoomManager {
  public currentRooms: GameRoomList;

  public randomBattleMatchQueue: User[];
  public draftBattleMatchQueue: User[];

  private io: Server;

  constructor(rooms = {}, io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.currentRooms = rooms;
    this.io = io;

    this.randomBattleMatchQueue = [];
    this.draftBattleMatchQueue = [];
    setInterval(() => {
      this.processAllQueues();
    }, 10 * 1000);
  }

  public getRoom(roomId?: string): GameRoom | undefined {
    if (!roomId) {
      return;
    }
    return this.currentRooms[roomId];
  }

  public addRoom(roomId: string, room: GameRoom) {
    console.log(`Creating room ${roomId}`);
    return this.currentRooms[roomId] = room;
  }

  public removeRoom(roomId: string) {
    console.log(`Cleaning up room ${roomId}`);
    this.io.to(roomId).emit('roomClosed');
    delete this.currentRooms[roomId];
  }

  public getAllRooms(): GameRoom['roomId'][] {
    return Object.keys(this.currentRooms);
  }

  public getGameFromUserSocket(socket: Socket): GameRoom | null {
    let gameRoom: GameRoom | null = null;
    for (let room in this.currentRooms) {
      if (this.currentRooms[room].getPlayer(socket)) {
        gameRoom = this.currentRooms[room];
        break;
      }
    }
    return gameRoom;
  }

  public getPlayer(playerId: string) {
    let player: User | null = null;
    let gameRoom: GameRoom | null = null;
    for (let room in this.currentRooms) {
      if (this.currentRooms[room].getPlayer(playerId)) {
        player = this.currentRooms[room].getPlayer(playerId);
        gameRoom = this.currentRooms[room];
        break;
      }
    }
    return { player, room: gameRoom };
  }
  
  public playerLeaveRoom(roomId: string, playerId?: string) {
    const room = this.getRoom(roomId);
    const player = room?.getPlayer(playerId);
    if (!room || !player) {
      return;
    }

    const isActivePlayer = room.getActivePlayer(player?.playerId);

    if (playerId && room.transientPlayerList[playerId]) {
      clearTimeout(room.transientPlayerList[playerId]);
      delete room.transientPlayerList[playerId];
    }

    if (room.hostPlayer?.playerId === playerId) {
      this.io.to(room.roomId).emit('endGameFromDisconnect', { name: player?.playerName, isHost: true });
      this.removeRoom(room.roomId);
      return;
    }
    if (room.isOngoing && isActivePlayer) {
      this.io.to(room.roomId).emit('endGameFromDisconnect', { name: player?.playerName, isHost: false });
      room.resetRoomForRematch();
    } 

    room.leaveRoom(player?.playerId);

    if (!room.hasPlayers()) {
      this.removeRoom(room.roomId);
    } else {
      this.io.to(room.roomId).emit('connectedPlayers', room.getPublicPlayerList());
    }
  };

  public addPlayerToQueue(user: User, queue: 'random' | 'draft') {
    if (queue === 'random') {
      this.randomBattleMatchQueue.push(user)
    } else if (queue === 'draft') {
      this.draftBattleMatchQueue.push(user);
    }
  }

  public removePlayerFromQueue(socket: Socket, queue?: 'random' | 'draft') {
    if (queue || queue === 'random') {
      this.randomBattleMatchQueue = this.randomBattleMatchQueue.filter((user) => user.socket?.id !== socket.id);
    }
    if (queue || queue === 'draft') {
      this.draftBattleMatchQueue = this.draftBattleMatchQueue.filter((user) => user.socket?.id !== socket.id);
    }
  }

  private processAllQueues() {
    this.randomBattleMatchQueue = this.randomBattleMatchQueue.filter((user) => user.socket?.connected === true);
    this.draftBattleMatchQueue = this.draftBattleMatchQueue.filter((user) => user.socket?.connected === true);
    const gameOptions = {
      offenseAdvantage: {
        atk: 0,
        def: 0,
        spa: 0,
        spd: 1,
        spe: 0,
        accuracy: 0,
        evasion: 0,
      },
      weatherWars: true,
      timersEnabled: true,
      banTimerDuration: 30,
      chessTimerDuration: 15,
      chessTimerIncrement: 5,
      pokemonTimerIncrement: 1,
    };

    this.randomBattleMatchQueue = this.createGamesForQueue(this.randomBattleMatchQueue, {
      format: 'random',
      ...gameOptions,
    });

    this.draftBattleMatchQueue = this.createGamesForQueue(this.draftBattleMatchQueue, {
      format: 'draft',
      ...gameOptions,
    });
  }

  private createGamesForQueue(queue: User[], gameOptions: GameOptions) {
    let remainingQueue: User[] = [];
    for (let i = 0; i < queue.length - 1; i += 2) {
      const newRoomId = crypto.randomUUID();

      this.currentRooms[newRoomId] = new GameRoom(newRoomId, null, '', this, true);
      this.currentRooms[newRoomId].joinRoom(queue[i]);
      this.currentRooms[newRoomId].joinRoom(queue[i + 1]);
      this.currentRooms[newRoomId].setOptions(gameOptions);
      queue[i].socket?.emit('foundMatch', { roomId: newRoomId });
      queue[i + 1].socket?.emit('foundMatch', { roomId: newRoomId });
      this.currentRooms[newRoomId].startGame();
    }

    if (queue.length % 2 !== 0) {
      remainingQueue.push(queue[queue.length - 1]);
    }
    return remainingQueue;
  }
}