import { Socket } from "socket.io";

export default class User {
  public playerName: string;
  public playerId: string;
  public socket: Socket;

  constructor(name: string, id: string) {
    this.playerName = name;
    this.playerId = id;
  }

  public assignSocket(socket:Socket) {
    this.socket = socket;
  }
}