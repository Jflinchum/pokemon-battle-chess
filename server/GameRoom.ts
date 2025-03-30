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
  // Rename to player 1 and player 2, since host can spectate
  public player1: User | null = null;
  public player2: User | null = null;
  public playerList: User[];
  // Store list of spectators
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
    this.player1 = hostPlayer;
    this.playerList = [hostPlayer];
    this.roomSeed = PRNG.generateSeed();
    this.isOngoing = false;
    this.password = password;
    this.gameRoomManager = gameRoomManager;
  }

  public joinRoom(player: User) {
    if (this.player2 === null) {
      this.player2 = player;
    }
    this.playerList.push(player);
  }

  public leaveRoom(playerId?: string) {
    if (this.player1?.playerId === playerId) {
      this.player1 = null;
    }
    if (this.player2?.playerId === playerId) {
      this.player2 = null;
    }
    if (this.hostPlayer?.playerId === playerId) {
      this.hostPlayer = null;
    }
    this.playerList.filter((player) => playerId !== player.playerId);
  }

  public hasPlayers() {
    return this.playerList.length > 0;
  }

  public getPlayers(): User[] {
    return this.playerList;
  }

  public getPublicPlayerList() {
    return (this.playerList.map((player) => ({
      playerName: player.playerName,
      playerId: player.playerId,
      avatarId: player.avatarId,
      transient: !!player.transient,
      viewingResults: player.viewingResults,
      isHost: player.playerId === this.hostPlayer?.playerId,
      isPlayer1: player.playerId === this.player1?.playerId,
      isPlayer2: player.playerId === this.player2?.playerId,
      isSpectator: player.playerId !== this.player1?.playerId && player.playerId !== this.player2?.playerId,
    })));
  }

  public getTransientPlayers(): User[] {
    return this.playerList.filter((player) => player && player.transient) as User[];
  }

  /**
   * Client, host, or spectator
   */
  public getPlayer(playerIdOrSocket?: string | Socket): User | null {
    return this.playerList.find((player) => (player.playerId === playerIdOrSocket || player.socket?.id === playerIdOrSocket)) || null;
  }

  /**
   * Either the client or host. Does not get spectators 
   */
  public getActivePlayer(playerIdOrSocket?: string | Socket): User | null {
    if (typeof playerIdOrSocket === 'string') {
      if (this.player1?.playerId === playerIdOrSocket) {
        return this.player1;
      } else if (this.player2?.playerId === playerIdOrSocket) {
        return this.player2;
      }
    } else if (playerIdOrSocket instanceof Socket) {
      if (this.player1?.socket?.id === playerIdOrSocket.id) {
        return this.player1;
      } else if (this.player2?.socket?.id === playerIdOrSocket.id) {
        return this.player2;
      }
    }

    return null;
  }

  public preparePlayerDisconnect(player: User) {
    // const transientTimeout = setTimeout(() => {
    //   this.gameRoomManager.playerLeaveRoom(player.playerId);
    // }, 1000 * 60)
    //player.setTransient(transientTimeout.ref());
  }

  public toggleSpectating(player: User) {
    if (player.playerId === this.player1?.playerId) {
      this.player1 = null;
    } else if (player.playerId === this.player2?.playerId) {
      this.player2 = null;
    } else {
      if (!this.player1) {
        this.player1 = player;
      } else if (!this.player2) {
        this.player2 = player;
      }
    }
  }

  public getSpectators() {
    return this.playerList.filter((player) =>
      player.playerId !== this.player1?.playerId &&
      player.playerId !== this.player2?.playerId
    );
  }

  public startGame() {
    if (this.hostPlayer && this.player1 && this.player2) {
      this.isOngoing = true;
      this.roomSeed = PRNG.generateSeed();
      const coinFlip = Math.random() > 0.5;

      this.whitePlayer = coinFlip ? this.player1 : this.player2;
      this.blackPlayer = coinFlip ? this.player2 : this.player1;

      this.whitePlayer.socket?.emit('startGame', { color: 'w', seed: this.roomSeed, player1Name: this.whitePlayer.playerName, player2Name: this.blackPlayer.playerName });
      this.blackPlayer.socket?.emit('startGame', { color: 'b', seed: this.roomSeed, player1Name: this.blackPlayer.playerName, player2Name: this.whitePlayer.playerName });
      this.getSpectators().forEach((spectator) => spectator.socket?.emit('startGame', { color: 'w', seed: this.roomSeed, player1Name: this.whitePlayer.playerName, player2Name: this.blackPlayer.playerName }))
    }
  }

  public validateAndEmitChessMove({ fromSquare, toSquare, promotion, playerId }) {
    if ((this.currentTurnWhite && this.whitePlayer.playerId === playerId) || (!this.currentTurnWhite && this.blackPlayer.playerId === playerId)) {
      this.currentTurnWhite = !this.currentTurnWhite;
      this.whitePlayer.socket?.emit('startChessMove', { fromSquare, toSquare, promotion });
      this.blackPlayer.socket?.emit('startChessMove', { fromSquare, toSquare, promotion });
      this.getSpectators().forEach((spectator) => spectator.socket?.emit('startChessMove', { fromSquare, toSquare, promotion }))
    }
  }

  public resetRoomForRematch() {
    this.isOngoing = false;
    this.roomSeed = PRNG.generateSeed();
    this.currentTurnWhite = true;
    this.whitePlayerPokemonMove = null;
    this.blackPlayerPokemonMove = null;
  }

  public validateAndEmitPokemonMove({ pokemonMove, playerId }) {
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
      this.whitePlayer.socket?.emit('startPokemonMove',
        {
          move: `>p1 move ${this.whitePlayerPokemonMove}`,
          playerId: this.whitePlayer.playerId
        }
      );
      this.whitePlayer.socket?.emit('startPokemonMove',
        {
          move: `>p2 move ${this.blackPlayerPokemonMove}`,
          playerId: this.whitePlayer.playerId
        }
      );
      this.blackPlayer.socket?.emit('startPokemonMove',
        {
          move: `>p1 move ${this.blackPlayerPokemonMove}`,
          playerId: this.blackPlayer.playerId
        }
      );
      this.blackPlayer.socket?.emit('startPokemonMove',
        {
          move: `>p2 move ${this.whitePlayerPokemonMove}`,
          playerId: this.blackPlayer.playerId
        }
      );
      this.getSpectators().forEach((spectator) => spectator.socket?.emit('startPokemonMove',
        {
          move: `>p1 move ${this.whitePlayerPokemonMove}`,
          playerId: this.whitePlayer.playerId
        }
      ))
      this.getSpectators().forEach((spectator) => spectator.socket?.emit('startPokemonMove',
        {
          move: `>p2 move ${this.blackPlayerPokemonMove}`,
          playerId: this.whitePlayer.playerId
        }
      ))
      this.whitePlayerPokemonMove = null;
      this.blackPlayerPokemonMove = null;
    }
  }
}