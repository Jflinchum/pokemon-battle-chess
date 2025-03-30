import { Server, Socket } from "socket.io";
import GameRoom from "./GameRoom";
import User from "./User";

interface GameRoomList {
  [roomId: string]: GameRoom
}

export default class GameRoomManager{
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
    delete this.currentRooms[roomId];
  }

  public getAllRooms(): GameRoom['roomId'][] {
    return Object.keys(this.currentRooms);
  }

  public getGameFromUserSocket(socket: Socket): GameRoom | null {
    let gameRoom: GameRoom | null = null;
    for (let room in this.currentRooms) {
      if (this.currentRooms[room].hostPlayer?.socket?.id === socket.id) {
        gameRoom = this.currentRooms[room];
        break;
      }
      if (this.currentRooms[room].clientPlayer?.socket?.id === socket.id) {
        gameRoom = this.currentRooms[room];
        break;
      }
    }
    return gameRoom;
  }

  public getPlayer(playerId: string) {
    let player: User | null = null;
    for (let room in this.currentRooms) {
      if (this.currentRooms[room].getPlayer(playerId)) {
        player = this.currentRooms[room].getPlayer(playerId);
        break;
      }
    }
    return player;
  }
  
  public playerLeaveRoom (roomId: string, playerId?: string) {
    const room = this.getRoom(roomId);

    if (room) {
      const player = room.getPlayer(playerId);
      const isActivePlayer = room.getActivePlayer(player?.playerId);

      if (room.isOngoing && isActivePlayer) {
        this.io.to(room.roomId).emit('endGameFromDisconnect', player?.playerName);
      } 
      if (room.hostPlayer?.playerId === playerId) {
        this.io.to(room.roomId).emit('hostDisconnected');
        console.log('Cleaning up unused room');
        delete this.currentRooms[room.roomId];
        return;
      }

      room.leaveRoom(player?.playerId);
      this.io.to(room.roomId).emit('connectedPlayers', room.getPublicPlayerList());

      if (!room.hasPlayers()) {
        console.log('Cleaning up unused room');
        delete this.currentRooms[room.roomId];
      }
    }
  }
}