import { Socket } from "socket.io";
import { Chess, Square } from "chess.js";
import { Dex as SimDex, BattleStreams, Teams, PRNGSeed } from '@pkmn/sim';
import { BoostID } from "@pkmn/data";
import { PRNG } from '@pkmn/sim'
import { Protocol } from '@pkmn/protocol';
import { ObjectReadWriteStream } from "@pkmn/streams";
import User from "./User";
import GameRoomManager from "./GameRoomManager";
import { PokemonBattleChessManager } from "./PokemonBattleChessManager";
import { MatchHistory, MatchLog } from "../shared/types/game";
import { GameOptions } from "../shared/types/GameOptions";

export default class GameRoom {
  public roomId: string;
  public roomSeed: PRNGSeed;
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

  public currentPokemonBattleStream: {
    omniscient: ObjectReadWriteStream<string>,
    p1: ObjectReadWriteStream<string>,
    p2: ObjectReadWriteStream<string>,
  } | null;
  public pokemonGameManager: PokemonBattleChessManager;
  public chessManager: Chess;
  public whiteMatchHistory: MatchHistory = [];
  public blackMatchHistory: MatchHistory = [];
  private whitePlayerTimerExpiration: number;
  private blackPlayerTimerExpiration: number;
  private whitePlayerLastMoveTime: number;
  private blackPlayerLastMoveTime: number;
  private whitePlayerTimer: NodeJS.Timeout | null;
  private blackPlayerTimer: NodeJS.Timeout | null;

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
      this.getSpectators().forEach((spectator) => spectator.socket?.emit('startGame', this.buildStartGameArgs('w')));
      this.blackPlayer.socket?.emit('startGame', this.buildStartGameArgs('b'));

      if (this.roomGameOptions.timersEnabled) {
        const timerDuration = this.roomGameOptions.format === 'random' ? this.roomGameOptions.chessTimerDuration*60*1000 : this.roomGameOptions.banTimerDuration*1000;

        this.whitePlayerTimerExpiration = new Date().getTime() + timerDuration;
        this.whitePlayerLastMoveTime = new Date().getTime();
        this.blackPlayerTimerExpiration = new Date().getTime() + timerDuration;
        this.blackPlayerLastMoveTime = new Date().getTime();

        this.startTimer(() => this.randomDraftPick(), 'w');
        this.broadcastTimers();
      }
    }
  }

  public async validateAndEmitChessMove({ sanMove, playerId }) {
    if (this.currentTurnWhite && this.whitePlayer.playerId !== playerId) {
      return;
    } else if (!this.currentTurnWhite && this.blackPlayer.playerId !== playerId) {
      return;
    }
    if (this.currentPokemonBattleStream) {
      return;
    }
    const chessMove = this.chessManager.moves({verbose: true, continueOnCheck: true }).find((move) => move.san === sanMove);
    if (!chessMove) {
      return;
    }

    if (chessMove.isCapture()) {
      const p1Pokemon = this.currentTurnWhite ? this.pokemonGameManager.getPokemonFromSquare(chessMove.from) : this.pokemonGameManager.getPokemonFromSquare(chessMove.to);
      const p2Pokemon = this.currentTurnWhite ? this.pokemonGameManager.getPokemonFromSquare(chessMove.to) : this.pokemonGameManager.getPokemonFromSquare(chessMove.from);;

      const moveSucceeds = await this.createPokemonBattleStream({ p1Set: p1Pokemon?.pkmn, p2Set: p2Pokemon?.pkmn, attemptedMove: { san: sanMove, color: chessMove.color } });

      let capturedPieceSquare;
      if (chessMove.isEnPassant()) {
        capturedPieceSquare = `${chessMove.to[0] + (parseInt(chessMove.to[1]) + (chessMove.color === 'w' ? -1 : 1))}`;
      } else {
        capturedPieceSquare = chessMove.to;  
      }
      // Clear out the old battle stream
      this.currentPokemonBattleStream = null;

      if (moveSucceeds) {
        const lostPiece = this.chessManager.get(capturedPieceSquare);
        this.pokemonGameManager.movePokemonToSquare(
          chessMove.from,
          chessMove.to,
          chessMove.promotion
        );
        this.chessManager.move(sanMove, { continueOnCheck: true });

        const chessData: MatchLog = { type: 'chess', data: { color: this.currentTurnWhite ? 'w' : 'b', san: sanMove, failed: false } };
        this.pushHistory(chessData);
        this.broadcastAll('gameOutput', chessData);
        if (lostPiece?.type === 'k') {
          // Game ender
          this.endGame(this.currentTurnWhite ? 'w' : 'b');
          return;
        }
      } else {
        const lostPiece = this.chessManager.get(chessMove.from);
        this.pokemonGameManager.getPokemonFromSquare(chessMove.from)!.square = null;
        const tempPiece = this.chessManager.get(capturedPieceSquare);
        this.chessManager.move(sanMove, { continueOnCheck: true });
        this.chessManager.remove(chessMove.to);
        this.chessManager.put(tempPiece!, capturedPieceSquare);

        const chessData: MatchLog = { type: 'chess', data: { color: this.currentTurnWhite ? 'w' : 'b', san: sanMove, failed: true } };
        this.pushHistory(chessData);
        this.broadcastAll('gameOutput', chessData);
        if (lostPiece?.type === 'k') {
          // Game ender
          this.endGame(this.currentTurnWhite ? 'w' : 'b');
          return;
        }
      } 
    } else {
      this.pokemonGameManager.movePokemonToSquare(
        chessMove.from,
        chessMove.to,
        chessMove.promotion
      );
      this.chessManager.move(sanMove, { continueOnCheck: true });
      const chessData: MatchLog = { type: 'chess', data: { color: this.currentTurnWhite ? 'w' : 'b', san: sanMove } };
      this.pushHistory(chessData)
      this.broadcastAll('gameOutput', chessData)
    }

    if (this.roomGameOptions.timersEnabled) {
      if (this.currentTurnWhite) {
        this.whitePlayerLastMoveTime = new Date().getTime();
        this.whitePlayerTimerExpiration += this.roomGameOptions.chessTimerIncrement*1000;
      } else {
        this.blackPlayerLastMoveTime = new Date().getTime();
        this.blackPlayerTimerExpiration += this.roomGameOptions.chessTimerIncrement*1000;
      }

      this.stopTimer(this.currentTurnWhite ? 'w' : 'b');
      this.startTimer(() => this.endGameDueToTimeout(this.currentTurnWhite ? 'b' : 'w'), this.currentTurnWhite ? 'b' : 'w');
      this.broadcastTimers();
    }

    this.currentTurnWhite = !this.currentTurnWhite;
  }

  private endGameDueToTimeout(color) {
    this.endGame(color === 'w' ? 'b' : 'w');
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

    possibleSquares = possibleSquares.filter((square) => !this.pokemonGameManager.getPokemonFromSquare(square as Square));
    const randomSquareIndex = Math.floor(Math.random() * possibleSquares.length);
    const randomPokemonIndex = Math.floor(Math.random() * (38 - this.pokemonGameManager.banPieces.length - this.pokemonGameManager.chessPieces.length));

    this.validateAndEmitPokemonDraft({
      square: possibleSquares[randomSquareIndex],
      draftPokemonIndex: randomPokemonIndex,
      playerId,
      isBan: this.pokemonGameManager.banPieces.length < 6,
    });
  }

  public endGame(color) {
    const gameData: MatchLog = { type: 'generic', data: { event: 'gameEnd', color } };
    this.pushHistory(gameData);
    this.broadcastAll('gameOutput', gameData);
    this.playerList.forEach((player) => {
      player.setViewingResults(true);
    });
    this.broadcastAll('connectedPlayers', this.getPublicPlayerList());
    if (this.roomGameOptions.timersEnabled) {
      this.stopTimer('w');
      this.stopTimer('b');
      this.broadcastTimers();
    }
  }

  public resetRoomForRematch() {
    this.isOngoing = false;
    this.roomSeed = PRNG.generateSeed();
    this.chessManager = new Chess();
    this.pokemonGameManager = new PokemonBattleChessManager(this.roomSeed, this.roomGameOptions.format)
    this.currentTurnWhite = true;
    this.whitePlayerPokemonMove = null;
    this.blackPlayerPokemonMove = null;
    this.whiteMatchHistory = [];
    this.blackMatchHistory = [];
    this.whitePlayerTimerExpiration = new Date().getTime();
    this.blackPlayerTimerExpiration = new Date().getTime();
    if (this.whitePlayerTimer) {
      clearTimeout(this.whitePlayerTimer);
      this.whitePlayerTimer = null;
    }
    if (this.blackPlayerTimer) {
      clearTimeout(this.blackPlayerTimer);
      this.blackPlayerTimer = null;
    }
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
          this.stopTimer('b');
        }
      }
    }

    if (this.whitePlayerPokemonMove && this.blackPlayerPokemonMove) {
      this.currentPokemonBattleStream?.p1.write(`move ${this.whitePlayerPokemonMove}`);
      this.currentPokemonBattleStream?.p2.write(`move ${this.blackPlayerPokemonMove}`);
      this.whitePlayerPokemonMove = null;
      this.blackPlayerPokemonMove = null;

      if (this.roomGameOptions.timersEnabled) {
        this.whitePlayerTimerExpiration += this.roomGameOptions.pokemonTimerIncrement*1000;
        this.blackPlayerTimerExpiration += this.roomGameOptions.pokemonTimerIncrement*1000;
        this.whitePlayerLastMoveTime = new Date().getTime();
        this.blackPlayerLastMoveTime = new Date().getTime();
        this.startTimer(() => this.endGameDueToTimeout('w'), 'w');
        this.startTimer(() => this.endGameDueToTimeout('b'), 'b');
      }
    }

    if (this.roomGameOptions.timersEnabled) {
      this.broadcastTimers();
    }
  };

  public validateAndEmitPokemonDraft({ square, draftPokemonIndex, playerId, isBan }) {
    const chessSquare = this.chessManager.get(square);
    if (!isBan && !chessSquare) {
      return;
    }
    if (playerId === this.whitePlayer.playerId) {
      let matchLog: MatchLog;
      if (isBan) {
        this.pokemonGameManager.banDraftPiece(draftPokemonIndex);
        matchLog = { type: 'ban', data: { index: draftPokemonIndex, color: 'w' } };
      } else {
        this.pokemonGameManager.assignPokemonToSquare(
          draftPokemonIndex, square, chessSquare!.type, 'w',
        );
        matchLog = { type: 'draft', data: { square, index: draftPokemonIndex, color: 'w' } };
      }
      this.pushHistory(matchLog);
      this.broadcastAll('gameOutput', matchLog);
    } else if (playerId === this.blackPlayer.playerId) {
      let matchLog: MatchLog;
      if (isBan) {
        this.pokemonGameManager.banDraftPiece(draftPokemonIndex);
        matchLog = { type: 'ban', data: { index: draftPokemonIndex, color: 'b' } };
      } else {
        this.pokemonGameManager.assignPokemonToSquare(
          draftPokemonIndex, square, chessSquare!.type, 'b',
        );
        matchLog = { type: 'draft', data: { square, index: draftPokemonIndex, color: 'b' } }
      }
      this.pushHistory(matchLog)
      this.broadcastAll('gameOutput', matchLog);
    }

    if (this.roomGameOptions.timersEnabled) {
      this.stopTimer(this.currentTurnWhite ? 'w' : 'b');

      if (this.pokemonGameManager.chessPieces.length < 32) {
        // Continue draft
        this.whitePlayerTimerExpiration = new Date().getTime() + this.roomGameOptions.banTimerDuration*1000;
        this.whitePlayerLastMoveTime = new Date().getTime();
        this.blackPlayerTimerExpiration = new Date().getTime() + this.roomGameOptions.banTimerDuration*1000;
        this.blackPlayerLastMoveTime = new Date().getTime();
        this.startTimer(() => this.randomDraftPick(), this.currentTurnWhite ? 'b' : 'w');
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
    this.currentTurnWhite = !this.currentTurnWhite;
  };

  private broadcastAll(event: string, ...args) {
    this.whitePlayer.socket?.emit(event, ...args);
    this.blackPlayer.socket?.emit(event, ...args);
    this.getSpectators().forEach((spectator) => spectator.socket?.emit(event, ...args));
  };

  private pushHistory(log: MatchLog) {
    this.whiteMatchHistory.push(log);
    this.blackMatchHistory.push(log);
  }

  public getHistory(playerId) {
    if (playerId === this.blackPlayer.playerId) {
      return this.blackMatchHistory
    } else {
      return this.whiteMatchHistory;
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
    this.broadcastAll('currentTimers', {
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

  private async createPokemonBattleStream({ p1Set, p2Set, attemptedMove }) {
    const p1Spec = { name: this.whitePlayer.playerId, team: Teams.pack([p1Set]) };
    const p2Spec = { name: this.blackPlayer.playerId, team: Teams.pack([p2Set]) };
    const battleStartData: MatchLog = { type: 'pokemon', data: { event: 'battleStart', p1Pokemon: p1Set, p2Pokemon: p2Set, attemptedMove } };
    this.broadcastAll('gameOutput', battleStartData);
    this.pushHistory(battleStartData);
    if (this.roomGameOptions.timersEnabled) {
      this.startTimer(() => this.endGameDueToTimeout('w'), 'w');
      this.startTimer(() => this.endGameDueToTimeout('b'), 'b');
      this.broadcastTimers();
    }

    return new Promise((resolve) => {
      const offenseAdvantage = this.roomGameOptions.offenseAdvantage;
      const advantageSide = this.currentTurnWhite ? 'p1' : 'p2';
      const pokemonBattleChessMod = SimDex.mod('pokemonbattlechess', { Formats: [{
          name: 'pbc',
          mod: 'gen9',
          onSwitchIn(pokemon) {
            if (pokemon.side.id === advantageSide) {
              pokemon.boostBy(offenseAdvantage);
              for (let stat in offenseAdvantage) {
                if (offenseAdvantage[stat as BoostID]) {
                  this.add('message', `${pokemon.name} receives a stat boost from starting the battle!`);
                  this.add('-boost', pokemon.fullname.replace(/(p[1-2])/g, '$1a'), stat, `${offenseAdvantage[stat as BoostID]}`);
                }
              }
            }
          },
        }]
      });
      const battleStream = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream({}, pokemonBattleChessMod));
      this.currentPokemonBattleStream = battleStream;
      const spec = { formatid: 'pbc', seed: this.roomSeed };
      battleStream.omniscient.write(`>start ${JSON.stringify(spec)}`);
      battleStream.omniscient.write(`>player p1 ${JSON.stringify(p1Spec)}`);
      battleStream.omniscient.write(`>player p2 ${JSON.stringify(p2Spec)}`);
      const whiteBattleStreamHandler = async () => {
        for await (const chunk of battleStream.p1) {
          const pokemonData: MatchLog = { type: 'pokemon', data: { event: 'streamOutput', chunk } };
          this.whiteMatchHistory.push(pokemonData);
          this.whitePlayer.socket?.emit('gameOutput', pokemonData);
          this.getSpectators().forEach((spectator) => spectator.socket?.emit('gameOutput', pokemonData));
        }
      }
      const blackBattleStreamHandler = async () => {
        for await (const chunk of battleStream.p2) {
          const pokemonData: MatchLog = { type: 'pokemon', data: { event: 'streamOutput', chunk } };
          this.blackMatchHistory.push(pokemonData);
          this.blackPlayer.socket?.emit('gameOutput', pokemonData);
        }
      }
      const omniscientBattleStreamHandler = async () => {
        for await (const chunk of battleStream.omniscient) {
          for (const { args } of Protocol.parse(chunk)) {
            if (args[0] === 'win') {
              if (this.roomGameOptions.timersEnabled) {
                this.stopTimer('w');
                this.stopTimer('b');
              }
              if ((this.currentTurnWhite && args[1] === this.whitePlayer.playerId) || (!this.currentTurnWhite && args[1] === this.blackPlayer.playerId)) {
                const data: MatchLog = { type: 'pokemon', data: { event: 'victory', color: this.currentTurnWhite ? 'w' : 'b' } };
                this.pushHistory(data);
                this.broadcastAll('gameOutput', data);
                return resolve(true);
              }
              const data: MatchLog = { type: 'pokemon', data: { event: 'victory', color: this.currentTurnWhite ? 'b' : 'w' } };
              this.pushHistory(data);
              this.broadcastAll('gameOutput', data);
              return resolve(false);
            }
          }
        }
      }
      whiteBattleStreamHandler();
      blackBattleStreamHandler();
      omniscientBattleStreamHandler();

      return battleStream;
    });
  }
}