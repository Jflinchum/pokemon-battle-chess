import { Server, Socket } from "socket.io";
import GameRoom from "./GameRoom";
import User from "./User";

interface GameRoomList {
  [roomId: string]: GameRoom
}

export default class GameRoomManager {
  public currentRooms: GameRoomList;
  private io: Server;

  constructor(rooms = {}, io: Server) {
    this.currentRooms = rooms;
    this.io = io;
  }

  public getRoom(roomId?: string): GameRoom | undefined {
    return this.currentRooms[roomId || ''];
  }

  public addRoom(roomId: string, room: GameRoom) {
    console.log(`Creating room ${roomId}`);
    return this.currentRooms[roomId] = room;
  }

  public removeRoom(roomId) {
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
  }
}