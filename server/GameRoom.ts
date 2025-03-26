import User from "./User";
import GameOptions from './GameOptions';
import { PRNG, PRNGSeed } from '@pkmn/sim'

export default class GameRoom {
  public roomId: string;
  public roomSeed: string;
  public roomPasscode: string;
  public hostPlayer: User | null;
  public clientPlayer: User | null;
  public roomGameOptions: GameOptions;
  public isOngoing: boolean;

  public whitePlayer: User;
  public blackPlayer: User;

  constructor(roomId: string, hostPlayer: User) {
    this.roomId = roomId;
    this.hostPlayer = hostPlayer;
    this.roomSeed = PRNG.generateSeed();
    this.isOngoing = false;
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

  public startGame() {
    if (this.hostPlayer && this.clientPlayer) {
      this.isOngoing = true;
      const coinFlip = Math.random() > 0.5;

      this.whitePlayer = coinFlip ? this.hostPlayer : this.clientPlayer;
      this.blackPlayer = coinFlip ? this.clientPlayer : this.hostPlayer;

      this.whitePlayer.socket.emit('startGame', { color: 'w', seed: this.roomSeed, player1Name: this.whitePlayer.playerName, player2Name: this.blackPlayer.playerName });
      this.blackPlayer.socket.emit('startGame', { color: 'b', seed: this.roomSeed, player1Name: this.blackPlayer.playerName, player2Name: this.whitePlayer.playerName });
    }
  }
}