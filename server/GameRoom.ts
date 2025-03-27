import User from "./User";
import GameOptions from './GameOptions';
import { PRNG, PRNGSeed } from '@pkmn/sim'

export default class GameRoom {
  public roomId: string;
  public roomSeed: string;
  public password: string;
  public hostPlayer: User | null = null;
  public clientPlayer: User | null = null;
  public roomGameOptions: GameOptions;
  public isOngoing: boolean;

  public whitePlayer: User;
  public blackPlayer: User;
  public currentTurnWhite: boolean = true;
  public whitePlayerPokemonMove: string | null = null;
  public blackPlayerPokemonMove: string | null = null;

  constructor(roomId: string, hostPlayer: User, password: string) {
    this.roomId = roomId;
    this.hostPlayer = hostPlayer;
    this.roomSeed = PRNG.generateSeed();
    this.isOngoing = false;
    this.password = password;
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

  public validateAndEmitChessMove({ fromSquare, toSquare, promotion, playerId }) {
    if ((this.currentTurnWhite && this.whitePlayer.playerId === playerId) || (!this.currentTurnWhite && this.blackPlayer.playerId === playerId)) {
      this.currentTurnWhite = !this.currentTurnWhite;
      this.whitePlayer.socket.emit('startChessMove', { fromSquare, toSquare, promotion });
      this.blackPlayer.socket.emit('startChessMove', { fromSquare, toSquare, promotion });
    }
  }

  public validateAndEmitePokemonMove({ pokemonMove, playerId }) {
    const isUndo = pokemonMove === 'undo'
    if (playerId === this.whitePlayer.playerId) {
      if (isUndo) {
        this.whitePlayerPokemonMove = null;
      } else {
        this.whitePlayerPokemonMove = pokemonMove;
      }
    } else if (playerId === this.blackPlayer.playerId) {
      if (isUndo) {
        this.blackPlayerPokemonMove = null;
      } else {
        this.blackPlayerPokemonMove = pokemonMove;
      }
    }

    if (this.whitePlayerPokemonMove && this.blackPlayerPokemonMove) {
      this.whitePlayer.socket.emit('startPokemonMove',
        {
          move: `>p1 move ${this.whitePlayerPokemonMove}`,
          playerId: this.whitePlayer.playerId
        }
      );
      this.whitePlayer.socket.emit('startPokemonMove',
        {
          move: `>p2 move ${this.blackPlayerPokemonMove}`,
          playerId: this.whitePlayer.playerId
        }
      );
      this.blackPlayer.socket.emit('startPokemonMove',
        {
          move: `>p1 move ${this.blackPlayerPokemonMove}`,
          playerId: this.blackPlayer.playerId
        }
      );
      this.blackPlayer.socket.emit('startPokemonMove',
        {
          move: `>p2 move ${this.whitePlayerPokemonMove}`,
          playerId: this.blackPlayer.playerId
        }
      );
      this.whitePlayerPokemonMove = null;
      this.blackPlayerPokemonMove = null;
    }
  }
}