import { Socket } from "socket.io";
import { Chess, Color, Square } from "chess.js";
import { Dex as SimDex, BattleStreams, Teams, PRNGSeed, Battle } from '@pkmn/sim';
import { BoostID, PokemonSet } from "@pkmn/data";
import { PRNG } from '@pkmn/sim'
import { Protocol } from '@pkmn/protocol';
import { ObjectReadWriteStream } from "@pkmn/streams";
import User from "./User";
import GameRoomManager from "./GameRoomManager";
import { PokemonBattleChessManager, SquareModifier, TerrainNames, WeatherNames } from "../../shared/models/PokemonBattleChessManager";
import { EndGameReason, MatchHistory, MatchLog } from "../../shared/types/game";
import { GameOptions } from "../../shared/types/GameOptions";
import GameTimer from "./GameTimer";
import { TerrainId, WeatherId } from "../../shared/types/PokemonTypes";

export default class GameRoom {
  public roomId: string;
  public roomSeed: PRNGSeed;
  private secretSeed: PRNGSeed;
  private secretPRNG: PRNG;
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
  public currentPokemonBattle: Battle | null;
  public pokemonGameManager: PokemonBattleChessManager;
  public chessManager: Chess;
  public whiteMatchHistory: MatchHistory = [];
  public blackMatchHistory: MatchHistory = [];
  public gameTimer: GameTimer;

  private squareModifierTarget: number;

  constructor(roomId: string, hostPlayer: User, password: string, gameRoomManager: GameRoomManager) {
    this.roomId = roomId;
    this.hostPlayer = hostPlayer;
    this.player1 = hostPlayer;
    this.playerList = [hostPlayer];
    this.isOngoing = false;
    this.password = password;
    this.gameRoomManager = gameRoomManager;
  }

  public joinRoom(player: User) {
    if (this.player2 === null) {
      this.player2 = player;
    }
    const existingPlayer = this.getPlayer(player.playerId);
    if (!existingPlayer) {
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

  private convertUserToPlayer(user: User) {
    return {
      playerName: user.playerName,
      playerId: user.playerId,
      avatarId: user.avatarId,
      transient: !!this.transientPlayerList[user.playerId],
      viewingResults: user.viewingResults,
      isHost: user.playerId === this.hostPlayer?.playerId,
      isPlayer1: user.playerId === this.player1?.playerId,
      isPlayer2: user.playerId === this.player2?.playerId,
      color: user.playerId === this.whitePlayer?.playerId ? 'w' : user.playerId === this.blackPlayer?.playerId ? 'b' : null,
      isSpectator: user.playerId !== this.player1?.playerId && user.playerId !== this.player2?.playerId,
    }
  }

  public getPublicPlayerList() {
    return this.playerList.map((user) => this.convertUserToPlayer(user));
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
      format: typeof options.format === 'string' ? options.format : 'random',
      offenseAdvantage: options.offenseAdvantage || {
        atk: 0,
        def: 0,
        spa: 0,
        spd: 1,
        spe: 0,
        accuracy: 0,
        evasion: 0,
      },
      weatherWars: typeof options.weatherWars === 'boolean' ? options.weatherWars : false,
      timersEnabled: typeof options.timersEnabled === 'boolean' ? options.timersEnabled : true,
      banTimerDuration: typeof options.banTimerDuration === 'number' ? options.banTimerDuration : 15,
      chessTimerDuration: typeof options.chessTimerDuration === 'number' ? options.chessTimerDuration : 15,
      chessTimerIncrement: typeof options.chessTimerIncrement === 'number' ? options.chessTimerIncrement : 5,
      pokemonTimerIncrement: typeof options.pokemonTimerIncrement === 'number' ? options.pokemonTimerIncrement : 1,
    };
  }

  public buildStartGameArgs(color: 'w' | 'b') {
    return {
      color,
      seed: this.roomSeed,
      options: this.roomGameOptions,
      whitePlayer: this.convertUserToPlayer(this.whitePlayer),
      blackPlayer: this.convertUserToPlayer(this.blackPlayer),
    };
  }

  public startGame() {
    if (this.hostPlayer && this.player1 && this.player2) {
      this.resetRoomForRematch();
      this.isOngoing = true;
      const coinFlip = Math.random() > 0.5;

      this.whitePlayer = coinFlip ? this.player1 : this.player2;
      this.blackPlayer = coinFlip ? this.player2 : this.player1;

      this.broadcastTimers();
      this.whitePlayer.socket?.emit('startGame', this.buildStartGameArgs('w'));
      this.getSpectators().forEach((spectator) => spectator.socket?.emit('startGame', this.buildStartGameArgs('w')));
      this.blackPlayer.socket?.emit('startGame', this.buildStartGameArgs('b'));
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

    if (chessMove.isCapture() || chessMove.isEnPassant()) {
      let capturedPieceSquare;
      if (chessMove.isEnPassant()) {
        capturedPieceSquare = `${chessMove.to[0] + (parseInt(chessMove.to[1]) + (chessMove.color === 'w' ? -1 : 1))}`;
      } else {
        capturedPieceSquare = chessMove.to;  
      }

      const p1Pokemon = this.currentTurnWhite ? this.pokemonGameManager.getPokemonFromSquare(chessMove.from) : this.pokemonGameManager.getPokemonFromSquare(capturedPieceSquare);
      const p2Pokemon = this.currentTurnWhite ? this.pokemonGameManager.getPokemonFromSquare(capturedPieceSquare) : this.pokemonGameManager.getPokemonFromSquare(chessMove.from);

      const moveSucceeds = await this.createPokemonBattleStream({
        p1Set: p1Pokemon!.pkmn,
        p2Set: p2Pokemon!.pkmn,
        attemptedMove: { san: sanMove, color: chessMove.color },
        squareModifier: this.pokemonGameManager.squareModifiers.find(sqMod => sqMod.square === capturedPieceSquare),
        battleSquare: capturedPieceSquare,
      });

      // Clear out the old battle stream
      this.currentPokemonBattleStream = null;
      this.currentPokemonBattle = null;

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
          this.endGame(this.currentTurnWhite ? 'w' : 'b', 'KING_CAPTURED');
          return;
        }
      } else {
        const lostPiece = this.chessManager.get(chessMove.from);
        this.pokemonGameManager.getPokemonFromSquare(chessMove.from)!.square = null;
        this.chessManager.remove(chessMove.from);
        this.chessManager.forceAdvanceTurn();

        const chessData: MatchLog = { type: 'chess', data: { color: this.currentTurnWhite ? 'w' : 'b', san: sanMove, failed: true } };
        this.pushHistory(chessData);
        this.broadcastAll('gameOutput', chessData);
        if (lostPiece?.type === 'k') {
          // Game ender
          this.endGame(this.currentTurnWhite ? 'w' : 'b', 'KING_CAPTURED');
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
      this.pushHistory(chessData);
      this.broadcastAll('gameOutput', chessData);
    }

    this.gameTimer.processChessMove(this.currentTurnWhite, () => this.endGameDueToTimeout(this.currentTurnWhite ? 'b' : 'w'));
    this.broadcastTimers();

    this.currentTurnWhite = !this.currentTurnWhite;

    if (this.currentTurnWhite) {
      this.pokemonGameManager.tickSquareModifiers();
    }
    if (this.roomGameOptions.weatherWars && this.currentTurnWhite) {
      if (this.chessManager.moveNumber() % 10 === 0) {
        this.squareModifierTarget = this.secretPRNG.random(10, 20);
      }
      const numSquares = this.pokemonGameManager.createNewSquareModifiers(this.squareModifierTarget, this.secretPRNG);
      if (numSquares && numSquares > 0) {
        const squareModifierData: MatchLog = { type: 'weather', data: { event: 'weatherChange', squareModifiers: this.pokemonGameManager.squareModifiers } };
        this.pushHistory(JSON.parse(JSON.stringify(squareModifierData)));
        this.broadcastAll('gameOutput', squareModifierData);
      }
    }
  }

  private endGameDueToTimeout(color) {
    this.endGame(color === 'w' ? 'b' : 'w', 'TIMEOUT');
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

  public endGame(color: Color | '', reason: EndGameReason) {
    const gameData: MatchLog = { type: 'generic', data: { event: 'gameEnd', color, reason } };
    this.pushHistory(gameData);
    this.broadcastAll('gameOutput', gameData);
    this.playerList.forEach((player) => {
      player.setViewingResults(true);
    });
    this.broadcastAll('connectedPlayers', this.getPublicPlayerList());
    this.gameTimer.stopTimers();
    this.broadcastTimers();
  }

  public resetRoomForRematch() {
    this.isOngoing = false;
    this.roomSeed = PRNG.generateSeed();
    this.secretSeed = PRNG.generateSeed();
    this.secretPRNG = new PRNG(this.secretSeed);

    this.chessManager = new Chess();
    this.currentTurnWhite = true;
    this.whiteMatchHistory = [];
    this.blackMatchHistory = [];

    this.pokemonGameManager = new PokemonBattleChessManager({
      seed: this.roomSeed,
      format: this.roomGameOptions.format,
      weatherWars: this.roomGameOptions.weatherWars
    });
    this.whitePlayerPokemonMove = null;
    this.blackPlayerPokemonMove = null;
    this.currentPokemonBattleStream = null;
    this.currentPokemonBattle = null;

    /**
     * Timers
     */
    if (this.gameTimer) {
      this.gameTimer.clearTimeouts();
    }
    const timerDuration = this.roomGameOptions.format === 'random' ? this.roomGameOptions.chessTimerDuration*60*1000 : this.roomGameOptions.banTimerDuration*1000;
    const callback = this.roomGameOptions.format === 'random' ? () => this.endGameDueToTimeout('w') : () => this.randomDraftPick();

    this.gameTimer = new GameTimer(
      this.roomGameOptions.chessTimerIncrement,
      this.roomGameOptions.pokemonTimerIncrement,
      this.roomGameOptions.timersEnabled,
    );
    this.gameTimer.initializeGameTimer(timerDuration);
    this.gameTimer.startTimer(callback, 'w');

    /**
     * Weather Wars init 
     */
    if (this.roomGameOptions.weatherWars) {
      this.squareModifierTarget = this.secretPRNG.random(10, 20);
    }
  }

  public validateAndEmitPokemonMove({ pokemonMove, playerId }) {
    const isUndo = pokemonMove === 'undo';
    const isForfeit = pokemonMove === 'forfeit';
    if (playerId === this.whitePlayer.playerId) {
      if (isUndo) {
        this.whitePlayerPokemonMove = null;
        if (this.roomGameOptions.timersEnabled) {
          this.gameTimer.startTimer(() => this.endGameDueToTimeout('w'), 'w');
        }
      } else if (isForfeit && this.currentPokemonBattleStream) {
        this.currentPokemonBattle?.add('message', `${playerId} has forefeitted`);
        // Custom forfeit command to reduce hp to 0 on client
        this.currentPokemonBattle?.add('-forfeit', 'p1')
        this.currentPokemonBattle?.sendUpdates();
        this.currentPokemonBattleStream.omniscient.write('>forcelose p1');
      } else {
        this.whitePlayerPokemonMove = pokemonMove;
        this.gameTimer.pauseTimer('w');
      }
    } else if (playerId === this.blackPlayer.playerId) {
      if (isUndo) {
        this.blackPlayerPokemonMove = null;
        if (this.roomGameOptions.timersEnabled) {
          this.gameTimer.startTimer(() => this.endGameDueToTimeout('b'), 'b');
        }
      } else if (isForfeit && this.currentPokemonBattleStream) {
        this.currentPokemonBattle?.add('message', `${playerId} has forefeitted`);
        // Custom forfeit command to reduce hp to 0 on client
        this.currentPokemonBattle?.add('-forfeit', 'p2');
        this.currentPokemonBattle?.sendUpdates();
        this.currentPokemonBattleStream.omniscient.write('>forcelose p2');
      } else {
        this.blackPlayerPokemonMove = pokemonMove;
        this.gameTimer.pauseTimer('b');
      }
    }

    if (this.whitePlayerPokemonMove && this.blackPlayerPokemonMove) {
      this.currentPokemonBattleStream?.p1.write(`move ${this.whitePlayerPokemonMove}`);
      this.currentPokemonBattleStream?.p2.write(`move ${this.blackPlayerPokemonMove}`);
      this.whitePlayerPokemonMove = null;
      this.blackPlayerPokemonMove = null;
      this.gameTimer.processPokemonMove((color) => this.endGameDueToTimeout(color));
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
      this.gameTimer.stopTimer(this.currentTurnWhite ? 'w' : 'b');

      if (this.pokemonGameManager.chessPieces.length < 32) {
        // Continue draft
        this.gameTimer.initializeGameTimer(this.roomGameOptions.banTimerDuration*1000);
        this.gameTimer.startTimer(() => this.randomDraftPick(), this.currentTurnWhite ? 'b' : 'w');
        this.broadcastTimers();
      } else {
        // Start chess game + timers
        this.gameTimer.initializeGameTimer(this.roomGameOptions.chessTimerDuration*60*1000);
        this.gameTimer.startTimer(() => this.endGameDueToTimeout('w'), 'w');
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

  public broadcastTimers() {
    if (this.roomGameOptions.timersEnabled) {
      this.broadcastAll('currentTimers', this.gameTimer.getTimers());
    }
  }

  private async createPokemonBattleStream({ p1Set, p2Set, attemptedMove, squareModifier, battleSquare }: { p1Set: PokemonSet, p2Set: PokemonSet, attemptedMove: { san: string, color: Color }, squareModifier?: SquareModifier, battleSquare: Square }) {
    const p1Spec = { name: this.whitePlayer.playerId, team: Teams.pack([p1Set]) };
    const p2Spec = { name: this.blackPlayer.playerId, team: Teams.pack([p2Set]) };
    const battleStartData: MatchLog = { type: 'pokemon', data: { event: 'battleStart', p1Pokemon: p1Set, p2Pokemon: p2Set, attemptedMove } };
    const gameRoomScope = this;
    this.broadcastAll('gameOutput', battleStartData);
    this.pushHistory(battleStartData);

    this.gameTimer.startTimer(() => this.endGameDueToTimeout('w'), 'w');
    this.gameTimer.startTimer(() => this.endGameDueToTimeout('b'), 'b');
    this.broadcastTimers();

    return new Promise((resolve) => {
      const offenseAdvantage = this.roomGameOptions.offenseAdvantage;
      const advantageSide = this.currentTurnWhite ? 'p1' : 'p2';
      const modifiers = squareModifier?.modifiers;
      let addedModifiers = false;
      let weatherChanges: WeatherId;
      let terrainChanges: TerrainId;

      const pokemonBattleChessMod = SimDex.mod('pokemonbattlechess', { Formats: [{
          name: 'pbc',
          mod: 'gen9',
          onBegin() {
            gameRoomScope.currentPokemonBattle = this;
          },
          onWeatherChange(target, _, sourceEffect) {
            if (sourceEffect && WeatherNames.includes(target.battle.field.weather as WeatherId)) {
              weatherChanges = target.battle.field.weather as WeatherId;
            }
          },
          onTerrainChange(target, _, sourceEffect) {
            if (sourceEffect && TerrainNames.includes(target.battle.field.terrain as TerrainId)) {
              terrainChanges = target.battle.field.terrain as TerrainId;
            }
          },
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
            if (!addedModifiers) {

              if (modifiers?.weather) {
                this.field.setWeather(modifiers.weather.id, 'debug');
              }
              if (modifiers?.terrain) {
                this.field.setTerrain(modifiers.terrain.id, 'debug');
              }
              addedModifiers = true;
            }
          },
        }]
      });
      const battleStream = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream({}, pokemonBattleChessMod));
      this.currentPokemonBattleStream = battleStream;
      const spec = { formatid: 'pbc' };
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
              this.gameTimer.stopTimers();

              if ((weatherChanges || terrainChanges) && this.roomGameOptions.weatherWars) {
                this.pokemonGameManager.updateSquareWeather(battleSquare, weatherChanges);
                this.pokemonGameManager.updateSquareTerrain(battleSquare, terrainChanges);
                const squareModifierData: MatchLog = { type: 'weather', data: { event: 'weatherChange', squareModifiers: this.pokemonGameManager.squareModifiers } };
                this.pushHistory(JSON.parse(JSON.stringify(squareModifierData)));
                this.broadcastAll('gameOutput', squareModifierData);
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