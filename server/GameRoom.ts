import User from "./User";
import GameOptions from './GameOptions';
import { PRNG } from '@pkmn/sim'
import { Socket } from "socket.io";
import GameRoomManager from "./GameRoomManager";

export default class GameRoom {
  public roomId: string;
  public roomSeed: string;
  public password: string;
  public hostPlayer: User | null = null;
  public clientPlayer: User | null = null;
  public roomGameOptions: GameOptions;
  public isOngoing: boolean;

  private gameRoomManager: GameRoomManager;
  private whitePlayer: User;
  private blackPlayer: User;
  private currentTurnWhite: boolean = true;
  private whitePlayerPokemonMove: string | null = null;
  private blackPlayerPokemonMove: string | null = null;

  constructor(roomId: string, hostPlayer: User, password: string, gameRoomManager: GameRoomManager) {
    this.roomId = roomId;
    this.hostPlayer = hostPlayer;
    this.roomSeed = PRNG.generateSeed();
    this.isOngoing = false;
    this.password = password;
    this.gameRoomManager = gameRoomManager;
  }

  public joinRoom(player: User) {
    this.clientPlayer = player;
  }

  public leaveRoom(playerId?: string) {
    if (this.clientPlayer?.playerId === playerId) {
      this.clientPlayer = null;
    } else if (this.hostPlayer?.playerId === playerId) {
      this.hostPlayer = null;
    }
  }

  public hasPlayers() {
    return this.hostPlayer || this.clientPlayer;
  }

  public getPlayers(): User[] {
    const currentPlayers: (User | null)[] = [this.hostPlayer, this.clientPlayer];
    return (currentPlayers.filter((player) => player) as User[]);
  }


  public getPublicPlayerList() {
    const currentPlayers: (User | null)[] = [this.hostPlayer, this.clientPlayer];
    return (currentPlayers.filter((player) => player).map((player) => ({
      playerName: player?.playerName,
      playerId: player?.playerId,
      transient: !!player?.transient,
      viewingResults: player?.viewingResults,
      isHost: player?.playerId === this.hostPlayer?.playerId
    })));
  }

  public getTransientPlayers(): User[] {
    const currentPlayers: (User | null)[] = [this.hostPlayer, this.clientPlayer];
    return currentPlayers.filter((player) => player && player.transient) as User[];
  }

  /**
   * Client, host, or spectator
   */
  public getPlayer(playerIdOrSocket?: string | Socket): User | null {
    if (typeof playerIdOrSocket === 'string') {
      if (this.hostPlayer?.playerId === playerIdOrSocket) {
        return this.hostPlayer;
      } else if (this.clientPlayer?.playerId === playerIdOrSocket) {
        return this.clientPlayer;
      }
    } else if (playerIdOrSocket instanceof Socket) {
      if (this.hostPlayer?.socket?.id === playerIdOrSocket.id) {
        return this.hostPlayer;
      } else if (this.clientPlayer?.socket?.id === playerIdOrSocket.id) {
        return this.clientPlayer;
      }
    }

    return null;
  }

  /**
   * Either the client or host. Does not get spectators 
   */
  public getActivePlayer(playerIdOrSocket?: string | Socket): User | null {
    if (typeof playerIdOrSocket === 'string') {
      if (this.hostPlayer?.playerId === playerIdOrSocket) {
        return this.hostPlayer;
      } else if (this.clientPlayer?.playerId === playerIdOrSocket) {
        return this.clientPlayer;
      }
    } else if (playerIdOrSocket instanceof Socket) {
      if (this.hostPlayer?.socket?.id === playerIdOrSocket.id) {
        return this.hostPlayer;
      } else if (this.clientPlayer?.socket?.id === playerIdOrSocket.id) {
        return this.clientPlayer;
      }
    }

    return null;
  }

  public promoteToHost(playerId) {
    const player = this.getPlayer(playerId);
    if (player) {
      if (this.clientPlayer?.playerId === player.playerId) {
        let temp = this.clientPlayer;
        this.clientPlayer = this.hostPlayer;
        this.hostPlayer = temp;
      }
      // Spectators
    }
  }

  public preparePlayerDisconnect(player: User) {
    // const transientTimeout = setTimeout(() => {
    //   this.gameRoomManager.playerLeaveRoom(player.playerId);
    // }, 1000 * 60)
    //player.setTransient(transientTimeout.ref());
  }

  public startGame() {
    if (this.hostPlayer && this.clientPlayer) {
      this.isOngoing = true;
      this.roomSeed = PRNG.generateSeed();
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

  public resetRoomForRematch() {
    this.isOngoing = false;
    this.roomSeed = PRNG.generateSeed();
    this.currentTurnWhite = true;
    this.whitePlayerPokemonMove = null;
    this.blackPlayerPokemonMove = null;
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