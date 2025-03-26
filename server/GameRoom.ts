import User from "./User";

export default class GameRoom {
  public roomId: string;
  public roomSeed: string;
  public hostPlayer: User | null;
  public clientPlayer: User | null;

  constructor(roomId: string, hostPlayer: User) {
    this.roomId = roomId;
    this.hostPlayer = hostPlayer;
    this.roomSeed = '';
  }


  public joinRoom(player: User) {
    this.clientPlayer = player;
  }

  public leaveRoom(playerId: string) {
    if (this.clientPlayer?.playerId === playerId) {
      this.clientPlayer = null;
    } else if (this.hostPlayer?.playerId === playerId) {
      this.hostPlayer = null;
    }
  }

  public getSeed() {
    return this.roomSeed;
  }

  public hasPlayers() {
    return this.hostPlayer || this.clientPlayer;
  }

  public getPlayerNames() {
    const currentPlayers: User['playerName'][] = [];
    if (this.hostPlayer) {
      currentPlayers.push(this.hostPlayer.playerName);
    }
    
    if (this.clientPlayer) {
      currentPlayers.push(this.clientPlayer.playerName);
    }
    return currentPlayers;
  }
}