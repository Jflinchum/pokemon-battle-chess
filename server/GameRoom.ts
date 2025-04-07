import User from "./User";
import { GameOptions } from './GameOptions';
import { PRNG } from '@pkmn/sim'
import { Socket } from "socket.io";
import GameRoomManager from "./GameRoomManager";

export default class GameRoom {
  public roomId: string;
  public roomSeed: string;
  public password: string;
  public hostPlayer: User | null = null;
  public player1: User | null = null;
  public player2: User | null = null;
  public playerList: User[];
  public transientPlayerList: Record<User['playerId'], NodeJS.Timeout> = {};
  // Store list of spectators
  public roomGameOptions: GameOptions;
  public isOngoing: boolean;

  private gameRoomManager: GameRoomManager;
  public whitePlayer: User;
  public blackPlayer: User;
  private currentTurnWhite: boolean = true;
  private whitePlayerPokemonMove: string | null = null;
  private blackPlayerPokemonMove: string | null = null;

  public chessMoveHistory: string[] = [];
  public banHistory: number[] = [];
  public pokemonAssignments: string[] = [];
  public pokemonBattleHistory: string[][] = [];

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
    this.playerList = this.playerList.filter((player) => playerId !== player.playerId);
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
      transient: !!this.transientPlayerList[player.playerId],
      viewingResults: player.viewingResults,
      isHost: player.playerId === this.hostPlayer?.playerId,
      isPlayer1: player.playerId === this.player1?.playerId,
      isPlayer2: player.playerId === this.player2?.playerId,
      color: player.playerId === this.whitePlayer?.playerId ? 'w' : player.playerId === this.blackPlayer?.playerId ? 'b' : null,
      isSpectator: player.playerId !== this.player1?.playerId && player.playerId !== this.player2?.playerId,
    })));
  }

  /**
   * Client, host, or spectator
   */
  public getPlayer(playerIdOrSocket?: string | Socket): User | null {
    return this.playerList.find((player) => {
      if (playerIdOrSocket instanceof Socket) {
        return player.socket?.id === playerIdOrSocket.id
      } else {
        return player.playerId === playerIdOrSocket;
      }
    }) || null;
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
    const transientTimeout = setTimeout(() => {
      console.log('Player disconnection exceeded timeout. Forcing them out of the room.');
      this.gameRoomManager.playerLeaveRoom(this.roomId, player.playerId);
    }, 1000 * 60);
    this.transientPlayerList[player.playerId] = transientTimeout;
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

  public setOptions(options: GameOptions) {
    this.roomGameOptions = {
      format: options.format || 'random',
      offenseAdvantage: options.offenseAdvantage || {
        atk: 0,
        def: 0,
        spa: 0,
        spd: 0,
        spe: 0,
        accuracy: 0,
        evasion: 0,
      }
    };
  }

  public buildStartGameArgs(color: 'w' | 'b') {
    return {
      color,
      seed: this.roomSeed,
      options: this.roomGameOptions,
    };
  }

  public startGame() {
    if (this.hostPlayer && this.player1 && this.player2) {
      this.isOngoing = true;
      this.roomSeed = PRNG.generateSeed();
      const coinFlip = Math.random() > 0.5;

      this.whitePlayer = coinFlip ? this.player1 : this.player2;
      this.blackPlayer = coinFlip ? this.player2 : this.player1;

      this.whitePlayer.socket?.emit('startGame', this.buildStartGameArgs('w'));
      this.blackPlayer.socket?.emit('startGame', this.buildStartGameArgs('b'));
      this.getSpectators().forEach((spectator) => spectator.socket?.emit('startGame', this.buildStartGameArgs('w')));

      if (this.roomGameOptions.format === 'random') {
        // Random formats generate pokemon from a8 -> h8, a7 -> h7, a2 -> h2, a1 -> h1
        for (let i = 0; i < 16; i++) {
          this.pokemonAssignments.push(`b ${i} ${String.fromCharCode(97 + Math.floor(i % 8))}${8 - Math.floor(i / 8)}`)
        }
        for (let i = 0; i < 16; i++) {
          this.pokemonAssignments.push(`w ${i + 16} ${String.fromCharCode(97 + Math.floor(i % 8))}${2 - Math.floor(i / 8)}`)
        }
      }
    }
  }

  public validateAndEmitChessMove({ sanMove, playerId }) {
    if ((this.currentTurnWhite && this.whitePlayer.playerId === playerId) || (!this.currentTurnWhite && this.blackPlayer.playerId === playerId)) {
      this.currentTurnWhite = !this.currentTurnWhite;
      this.chessMoveHistory.push(sanMove);
      if (sanMove.includes('x')) {
        this.pokemonBattleHistory.push([]);
      }

      this.whitePlayer.socket?.emit('startChessMove', { sanMove });
      this.blackPlayer.socket?.emit('startChessMove', { sanMove });
      this.getSpectators().forEach((spectator) => spectator.socket?.emit('startChessMove', { sanMove }))
    }
  }

  public resetRoomForRematch() {
    this.isOngoing = false;
    this.roomSeed = PRNG.generateSeed();
    this.currentTurnWhite = true;
    this.whitePlayerPokemonMove = null;
    this.blackPlayerPokemonMove = null;
    this.chessMoveHistory = [];
    this.pokemonBattleHistory = [];
    this.banHistory = [];
    this.pokemonAssignments = [];
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
          playerId: spectator.playerId
        }
      ))
      this.getSpectators().forEach((spectator) => spectator.socket?.emit('startPokemonMove',
        {
          move: `>p2 move ${this.blackPlayerPokemonMove}`,
          playerId: spectator.playerId
        }
      ))
      this.pokemonBattleHistory[this.pokemonBattleHistory.length - 1].push(`>p1 move ${this.whitePlayerPokemonMove}`);
      this.pokemonBattleHistory[this.pokemonBattleHistory.length - 1].push(`>p2 move ${this.blackPlayerPokemonMove}`);
      this.whitePlayerPokemonMove = null;
      this.blackPlayerPokemonMove = null;
    }
  };

  public validateAndEmitPokemonDraft({ square, draftPokemonIndex, playerId, isBan }) {
    if (isBan) {
      this.banHistory.push(draftPokemonIndex);
    }
    if (playerId === this.whitePlayer.playerId) {
      if (!isBan) {
        this.pokemonAssignments.push(`w ${draftPokemonIndex} ${square}`);
      }
      this.blackPlayer.socket?.emit('startPokemonDraft', { square, draftPokemonIndex, socketColor: 'w', isBan });
      this.getSpectators().forEach((spectator) => spectator.socket?.emit('startPokemonDraft', { square, draftPokemonIndex, socketColor: 'w', isBan }));
    } else if (playerId === this.blackPlayer.playerId) {
      if (!isBan) {
        this.pokemonAssignments.push(`b ${draftPokemonIndex} ${square}`);
      }
      this.whitePlayer.socket?.emit('startPokemonDraft', { square, draftPokemonIndex, socketColor: 'b', isBan });
      this.getSpectators().forEach((spectator) => spectator.socket?.emit('startPokemonDraft', { square, draftPokemonIndex, socketColor: 'b', isBan }));
    }
  };

  public getPokemonBattleHistory(playerId) {
    if (playerId === this.blackPlayer.playerId) {
      return this.pokemonBattleHistory.map((battle) => (
        battle.map((move) => {
          if (move.includes('p1')) {
            return move.replace('p1', 'p2');
          } else {
            return move.replace('p2', 'p1');
          }
        })
      ));
    } else {
      return this.pokemonBattleHistory;
    }
  }
}