import { Socket } from "socket.io";
import GameRoom from "./GameRoom";

interface GameRoomList {
  [roomId: string]: GameRoom
}

export default class GameRoomManager{
  public currentRooms: GameRoomList;
  constructor(rooms = {}) {
    this.currentRooms = rooms;
  }

  getRoom(roomId) {
    return this.currentRooms[roomId];
  }

  addRoom(roomId: string, room: GameRoom) {
    console.log(`Creating room ${roomId}`);
    return this.currentRooms[roomId] = room;
  }

  removeRoom(roomId) {
    console.log(`Cleaning up room ${roomId}`);
    delete this.currentRooms[roomId];
  }

  getAllRooms(): GameRoom['roomId'][] {
    return Object.keys(this.currentRooms);
  }

  getGameFromUserSocket(socket: Socket): GameRoom | null {
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

  disconnectUserFromSocket(socket: Socket): GameRoom | null {
    const gameRoom = this.getGameFromUserSocket(socket);
    if (!gameRoom) {
      return null;
    }

    if (gameRoom.clientPlayer?.socket?.id === socket.id) {
      gameRoom.leaveRoom(gameRoom.clientPlayer.playerId);
    } else if (gameRoom.hostPlayer?.socket?.id === socket.id) {
      gameRoom.leaveRoom(gameRoom.hostPlayer.playerId);
    }
    return gameRoom;
  }
}