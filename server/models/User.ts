import { Socket } from "socket.io";

export default class User {
  public playerName: string;
  public playerId: string;
  public avatarId: string;
  public playerSecret: string;
  public socket: Socket | null;
  // If the socket has disconnected temporarily
  public viewingResults: boolean;

  constructor(name: string, id: string, avatarId: string, secret: string) {
    this.playerName = name;
    this.playerId = id;
    this.avatarId = avatarId;
    this.viewingResults = false;
    this.playerSecret = secret;
    this.socket = null;
  }

  public assignSocket(socket:Socket) {
    this.socket = socket;
  }

  public setViewingResults(v: boolean) {
    this.viewingResults = v;
  }
}