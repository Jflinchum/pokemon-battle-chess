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

  private whitePlayerTimerExpiration: number;
  private blackPlayerTimerExpiration: number;
  private whitePlayerLastMoveTime: number;
  private blackPlayerLastMoveTime: number;
  private whitePlayerTimer: NodeJS.Timeout | null;
  private blackPlayerTimer: NodeJS.Timeout | null;

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
    if (!this.playerList.some((roomPlayer) => roomPlayer.playerId === player.playerId)) {
      this.playerList.push(player);
    }
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
        spd: 1,
        spe: 0,
        accuracy: 0,
        evasion: 0,
      },
      timersEnabled: options.timersEnabled || true,
      banTimerDuration: options.banTimerDuration || 15,
      chessTimerDuration: options.chessTimerDuration || 15,
      chessTimerIncrement: options.chessTimerIncrement || 5,
      pokemonTimerIncrement: options.pokemonTimerIncrement || 1,
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
      this.resetRoomForRematch();
      this.isOngoing = true;
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

        if (this.roomGameOptions.timersEnabled) {
          this.whitePlayerTimerExpiration = new Date().getTime() + this.roomGameOptions.chessTimerDuration*60*1000;
          this.whitePlayerLastMoveTime = new Date().getTime();
          this.blackPlayerTimerExpiration = new Date().getTime() + this.roomGameOptions.chessTimerDuration*60*1000;
          this.blackPlayerLastMoveTime = new Date().getTime();

          this.startTimer(() => this.endGameDueToTimeout('w'), 'w');
          this.broadcastTimers();
        }
      } else {
        if (this.roomGameOptions.timersEnabled) {
          this.whitePlayerTimerExpiration = new Date().getTime() + this.roomGameOptions.banTimerDuration*1000;
          this.whitePlayerLastMoveTime = new Date().getTime();
          this.blackPlayerTimerExpiration = new Date().getTime() + this.roomGameOptions.banTimerDuration*1000;
          this.blackPlayerLastMoveTime = new Date().getTime();

          this.startTimer(() => this.randomDraftPick(), 'w');
          this.broadcastTimers();
        }
      }
    }
  }

  private endGameDueToTimeout(color) {
    this.isOngoing = false;
    this.broadcastAllPlayers('endGameDueToTimeout', color);
  }

  private randomDraftPick() {
    let possibleSquares: string[] = [];
    let playerId;
    if (this.currentTurnWhite) {
      playerId = this.whitePlayer.playerId;
      for (let i = 0; i < 16; i++) {
        possibleSquares.push(`${String.fromCharCode(97 + Math.floor(i % 8))}${2 - Math.floor(i / 8)}`);
      }
    } else {
      playerId = this.blackPlayer.playerId;
      for (let i = 0; i < 16; i++) {
        possibleSquares.push(`${String.fromCharCode(97 + Math.floor(i % 8))}${8 - Math.floor(i / 8)}`)
      }
    }
    possibleSquares = possibleSquares.filter((square) => !this.pokemonAssignments.some((assigned) => assigned.includes(square)));
    const randomSquareIndex = Math.floor(Math.random() * possibleSquares.length);
    const randomPokemonIndex = Math.floor(Math.random() * (38 - this.banHistory.length - this.pokemonAssignments.length));

    this.validateAndEmitPokemonDraft({
      square: possibleSquares[randomSquareIndex],
      draftPokemonIndex: randomPokemonIndex,
      playerId,
      isBan: this.banHistory.length < 6,
    });
  }

  public validateAndEmitChessMove({ sanMove, playerId }) {
    if ((this.currentTurnWhite && this.whitePlayer.playerId !== playerId) || (!this.currentTurnWhite && this.blackPlayer.playerId !== playerId)) {
      return;
    }
    this.chessMoveHistory.push(sanMove);
    if (sanMove.includes('x')) {
      this.pokemonBattleHistory.push([]);
    }

    this.broadcastAllPlayers('startChessMove', { sanMove });

    if (this.roomGameOptions.timersEnabled) {
      
      // If sanMove includes an ('x'), start both timers for pokemon battle
      if (sanMove.includes('x')) {
        this.whitePlayerLastMoveTime = new Date().getTime();
        this.blackPlayerLastMoveTime = new Date().getTime();
        this.startTimer(() => this.endGameDueToTimeout('w'), 'w');
        this.startTimer(() => this.endGameDueToTimeout('b'), 'b');
      } else {
        this.stopTimer(this.currentTurnWhite ? 'w' : 'b');
        if (this.currentTurnWhite) {
          this.whitePlayerLastMoveTime = new Date().getTime();
          this.whitePlayerTimerExpiration += this.roomGameOptions.chessTimerIncrement*1000;
        } else {
          this.blackPlayerLastMoveTime = new Date().getTime();
          this.blackPlayerTimerExpiration += this.roomGameOptions.chessTimerIncrement*1000;
        }

        this.startTimer(() => this.endGameDueToTimeout(this.currentTurnWhite ? 'b' : 'w'), this.currentTurnWhite ? 'b' : 'w');
      }

      this.broadcastTimers();
    }

    this.currentTurnWhite = !this.currentTurnWhite;
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
        if (this.roomGameOptions.timersEnabled) {
          this.startTimer(() => this.endGameDueToTimeout('w'), 'w');
        }
      } else {
        this.whitePlayerPokemonMove = pokemonMove;
        if (this.roomGameOptions.timersEnabled) {
          this.whitePlayerLastMoveTime = new Date().getTime();
          this.stopTimer('w');
        }
      }
    } else if (playerId === this.blackPlayer.playerId) {
      if (isUndo) {
        this.blackPlayerPokemonMove = null;
        if (this.roomGameOptions.timersEnabled) {
          this.startTimer(() => this.endGameDueToTimeout('b'), 'b');
        }
      } else {
        this.blackPlayerPokemonMove = pokemonMove;
        if (this.roomGameOptions.timersEnabled) {
          this.blackPlayerLastMoveTime = new Date().getTime();
          this.stopTimer('w');
        }
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

      if (this.roomGameOptions.timersEnabled) {
        this.whitePlayerTimerExpiration += this.roomGameOptions.pokemonTimerIncrement*1000;
        this.blackPlayerTimerExpiration += this.roomGameOptions.pokemonTimerIncrement*1000;
        this.startTimer(() => this.endGameDueToTimeout('w'), 'w');
        this.startTimer(() => this.endGameDueToTimeout('b'), 'b');
      }
    }

    if (this.roomGameOptions.timersEnabled) {
      this.broadcastTimers();
    }
  };

  public validateAndEmitPokemonDraft({ square, draftPokemonIndex, playerId, isBan }) {
    if (this.currentTurnWhite && playerId !== this.whitePlayer.playerId) {
      return;
    } else if (!this.currentTurnWhite && playerId !== this.blackPlayer.playerId) {
      return;
    }

    if (isBan || this.banHistory.length < 6) {
      this.banHistory.push(draftPokemonIndex);
    } else {
      this.pokemonAssignments.push(`${this.currentTurnWhite ? 'w' : 'b'} ${draftPokemonIndex} ${square}`);
    }
    const packagedDraftPick = { square, draftPokemonIndex, socketColor: this.currentTurnWhite ? 'w' : 'b', isBan };
    this.broadcastAllPlayers('startPokemonDraft', packagedDraftPick);

    this.currentTurnWhite = !this.currentTurnWhite;

    if (this.roomGameOptions.timersEnabled) {
      // If it's white's turn, then black was the previous player and we need to stop their timer
      this.stopTimer(this.currentTurnWhite ? 'b' : 'w');

      if (this.pokemonAssignments.length < 32) {
        // Continue draft
        this.whitePlayerTimerExpiration = new Date().getTime() + this.roomGameOptions.banTimerDuration*1000;
        this.whitePlayerLastMoveTime = new Date().getTime();
        this.blackPlayerTimerExpiration = new Date().getTime() + this.roomGameOptions.banTimerDuration*1000;
        this.blackPlayerLastMoveTime = new Date().getTime();
        this.startTimer(() => this.randomDraftPick(), this.currentTurnWhite ? 'w' : 'b');
        this.broadcastTimers();
      } else {
        // Start chess game + timers
        this.whitePlayerTimerExpiration = new Date().getTime() + this.roomGameOptions.chessTimerDuration*60*1000;
        this.whitePlayerLastMoveTime = new Date().getTime();
        this.blackPlayerTimerExpiration = new Date().getTime() + this.roomGameOptions.chessTimerDuration*60*1000;
        this.blackPlayerLastMoveTime = new Date().getTime();
        this.startTimer(() => this.endGameDueToTimeout('w'), 'w');
        this.broadcastTimers();
      }
    }
  };

  public startTimer(cb, color) {
    if (color === 'w') {
      this.whitePlayerTimerExpiration += (new Date().getTime() - this.whitePlayerLastMoveTime);
      if (this.whitePlayerTimer) {
        clearTimeout(this.whitePlayerTimer);
      }
      this.whitePlayerTimer = setTimeout(cb, this.whitePlayerTimerExpiration - new Date().getTime());
    } else {
      this.blackPlayerTimerExpiration += (new Date().getTime() - this.blackPlayerLastMoveTime);
      if (this.blackPlayerTimer) {
        clearTimeout(this.blackPlayerTimer);
      }
      this.blackPlayerTimer = setTimeout(cb, this.blackPlayerTimerExpiration - new Date().getTime());
    }
  };

  public stopTimer(color) {
    if (color === 'w' && this.whitePlayerTimer) {
      clearTimeout(this.whitePlayerTimer);
      this.whitePlayerTimer = null;
      this.whitePlayerLastMoveTime = new Date().getTime();
    } else if (color === 'b' && this.blackPlayerTimer){
      clearTimeout(this.blackPlayerTimer);
      this.blackPlayerTimer = null;
      this.blackPlayerLastMoveTime = new Date().getTime();
    }
  };

  public broadcastTimers() {
    this.broadcastAllPlayers('currentTimers', {
      white: {
        timerExpiration: this.whitePlayerTimerExpiration,
        pause: !this.whitePlayerTimer,
      },
      black: {
        timerExpiration: this.blackPlayerTimerExpiration,
        pause: !this.blackPlayerTimer,
      }
    });
  }

  private broadcastAllPlayers(eventName, ...args) {
    this.whitePlayer.socket?.emit(eventName, ...args);
    this.blackPlayer.socket?.emit(eventName, ...args);
    this.getSpectators().forEach((spectator) => spectator.socket?.emit(eventName, ...args));
  }

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