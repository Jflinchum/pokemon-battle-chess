import { Battle, PRNG, PRNGSeed } from "@pkmn/sim";
import { Chess, Color, Move, Piece, Square } from "chess.js";
import { SQUARE_MODIFIER_TARGET } from "../../shared/constants/gameConstants.js";
import { PokemonBattleChessManager } from "../../shared/models/PokemonBattleChessManager.js";
import User from "../../shared/models/User.js";
import {
  getChessMatchOutput,
  getNewSquareModTargetNumber,
  getPokemonBattleOutput,
  getWeatherChangeOutput,
} from "../../shared/src/gameLogic.js";
import { ChessBoardSquare } from "../../shared/types/ChessBoardSquare.js";
import {
  EndGameReason,
  MatchHistory,
  MatchLog,
  Timer,
} from "../../shared/types/Game.js";
import { GameOptions } from "../../shared/types/GameOptions.js";
import { Player } from "../../shared/types/Player.js";
import { getCastledRookSquare } from "../../shared/util/getCastledRookSquare.js";
import {
  clearPokemonBanList,
  clearPokemonMoveHistory,
  getBlackMatchHistory,
  getBlackPlayerPokemonMove,
  getBlackTimerExpiration,
  getBlackTimerPaused,
  getBlackTimeSinceLastMove,
  getPokemonBanList,
  getPokemonBattleSeed,
  getPokemonBattleStakes,
  getPokemonMoveHistory,
  getRequestedGameSeed,
  getRoomBoard,
  getRoomPokemonIndices,
  getRoomSquareModifiers,
  getRoomSquareModifierTarget,
  getWhiteMatchHistory,
  getWhitePlayerPokemonMove,
  getWhiteTimerExpiration,
  getWhiteTimerPaused,
  getWhiteTimeSinceLastMove,
  initializeGameStart,
  pushBlackMatchHistory,
  pushMatchHistory,
  pushPokemonBanList,
  pushPokemonMoveHistory,
  pushWhiteMatchHistory,
  releaseLockForRoom,
  resetMatchHistory,
  setBlackPlayerPokemonMove,
  setBlackTimerExpiration,
  setBlackTimerPaused,
  setBlackTimeSinceLastMove,
  setChessBoard,
  setGameRoomSeed,
  setGeneratedPokemonIndices,
  setLockForRoom,
  setPlayersViewingResults,
  setPokemonBattleSeed,
  setPokemonBattleStakes,
  setRoomSquareModifiers,
  setRoomSquareModifierTarget,
  setRoomTimers,
  setRoomToOngoing,
  setWhitePlayerPokemonMove,
  setWhiteTimerExpiration,
  setWhiteTimerPaused,
  setWhiteTimeSinceLastMove,
} from "../cache/redis.js";
import {
  packSquareModifierIntoBitField,
  unpackSquareModifierFromBitField,
} from "../cache/squareModifierBitField.js";
import { DEFAULT_GAME_OPTIONS } from "../constants/gameRoomConstants.js";
import GameTimer from "./GameTimer.js";

export default class GameRoom {
  public roomId: string;
  public publicSeed: PRNGSeed;
  public password: string;
  public hostPlayer: User | null = null;
  public player1: User | null = null;
  public player2: User | null = null;
  public playerIdList?: string[];
  public roomGameOptions: GameOptions;
  public isOngoing: boolean;
  public isQuickPlay: boolean;

  public whitePlayer: User | null;
  public blackPlayer: User | null;
  private currentTurnWhite: boolean = true;
  private whitePlayerPokemonMove: string | null = null;
  private blackPlayerPokemonMove: string | null = null;

  public currentPokemonBattle: Battle | null;
  public pokemonGameManager: PokemonBattleChessManager;
  public chessManager: Chess;
  public whiteMatchHistory: MatchHistory = [];
  public blackMatchHistory: MatchHistory = [];
  public gameTimer: GameTimer | null;

  private currentPokemonBattleStakes: { san: string; color: Color } | null =
    null;
  private squareModifierTarget: number;

  constructor(
    roomId: string,
    password: string,
    publicSeed?: PRNGSeed,
    roomGameOptions?: GameOptions,
    playerList?: string[],
    hostPlayer?: User,
    player1?: User,
    player2?: User,
    whitePlayer?: User,
    blackPlayer?: User,
    isOngoing?: boolean,
    isQuickPlay?: boolean,
  ) {
    this.roomId = roomId;
    this.playerIdList = playerList;

    this.isOngoing = isOngoing || false;
    this.isQuickPlay = isQuickPlay || false;
    this.password = password;
    this.publicSeed = publicSeed || PRNG.generateSeed();

    this.chessManager = new Chess();
    this.currentTurnWhite = true;
    this.whiteMatchHistory = [];
    this.blackMatchHistory = [];
    this.roomGameOptions = roomGameOptions || DEFAULT_GAME_OPTIONS;
    this.gameTimer = null;
    this.squareModifierTarget = SQUARE_MODIFIER_TARGET;

    this.pokemonGameManager = new PokemonBattleChessManager({
      seed: this.publicSeed,
      format: this.roomGameOptions.format,
      weatherWars: this.roomGameOptions.weatherWars,
    });
    this.player1 = player1 || null;
    this.player2 = player2 || null;
    this.hostPlayer = hostPlayer || null;
    this.whitePlayer = whitePlayer || null;
    this.blackPlayer = blackPlayer || null;
    this.whitePlayerPokemonMove = null;
    this.blackPlayerPokemonMove = null;
    this.currentPokemonBattle = null;
  }

  private convertUserToPlayer(user: User): Player {
    return {
      playerName: user.playerName,
      playerId: user.playerId,
      avatarId: user.avatarId,
      transient: false,
      viewingResults: user.viewingResults,
      isHost: user.playerId === this.hostPlayer?.playerId,
      isPlayer1: user.playerId === this.player1?.playerId,
      isPlayer2: user.playerId === this.player2?.playerId,
      color:
        user.playerId === this.whitePlayer?.playerId
          ? "w"
          : user.playerId === this.blackPlayer?.playerId
            ? "b"
            : null,
      isSpectator:
        user.playerId !== this.player1?.playerId &&
        user.playerId !== this.player2?.playerId,
    };
  }

  public getSpectators() {
    return this.playerIdList?.filter(
      (p) => p !== this.player1?.playerId && p !== this.player2?.playerId,
    );
  }

  public setOptions(options: GameOptions) {
    this.roomGameOptions = {
      format: typeof options.format === "string" ? options.format : "random",
      offenseAdvantage:
        options.offenseAdvantage || DEFAULT_GAME_OPTIONS.offenseAdvantage,
      weatherWars:
        typeof options.weatherWars === "boolean"
          ? options.weatherWars
          : DEFAULT_GAME_OPTIONS.weatherWars,
      timersEnabled:
        typeof options.timersEnabled === "boolean"
          ? options.timersEnabled
          : DEFAULT_GAME_OPTIONS.timersEnabled,
      banTimerDuration:
        typeof options.banTimerDuration === "number"
          ? options.banTimerDuration
          : DEFAULT_GAME_OPTIONS.banTimerDuration,
      chessTimerDuration:
        typeof options.chessTimerDuration === "number"
          ? options.chessTimerDuration
          : DEFAULT_GAME_OPTIONS.chessTimerDuration,
      chessTimerIncrement:
        typeof options.chessTimerIncrement === "number"
          ? options.chessTimerIncrement
          : DEFAULT_GAME_OPTIONS.chessTimerIncrement,
      pokemonTimerIncrement:
        typeof options.pokemonTimerIncrement === "number"
          ? options.pokemonTimerIncrement
          : DEFAULT_GAME_OPTIONS.pokemonTimerIncrement,
    };
  }

  public buildStartGameArgs(
    color: "w" | "b",
    whitePlayer: User,
    blackPlayer: User,
  ) {
    return {
      color,
      seed: this.publicSeed,
      options: this.roomGameOptions,
      whitePlayer: this.convertUserToPlayer(whitePlayer),
      blackPlayer: this.convertUserToPlayer(blackPlayer),
      isQuickPlay: this.isQuickPlay,
    };
  }

  public async initializeGame() {
    if (this.player1 && this.player2) {
      await this.resetRoomForRematch();
      const coinFlip = Math.random() > 0.5;

      const white = coinFlip ? this.player1 : this.player2;
      const black = coinFlip ? this.player2 : this.player1;
      this.whitePlayer = white;
      this.blackPlayer = black;
      await initializeGameStart(this.roomId, white.playerId, black.playerId);
      if (this.roomGameOptions.timersEnabled) {
        await this.initializeTimers();
      }

      return {
        whiteStartGame: this.buildStartGameArgs("w", white, black),
        blackStartGame: this.buildStartGameArgs("b", white, black),
        timers: this.gameTimer?.getTimers(false),
      };
    }
    throw new Error("Players not initialized");
  }

  private async setGameState() {
    return Promise.all([
      this.setChessState(),
      this.setPokemonManagerState(),
      this.setPokemonBattleState(),
      this.setTimerState(),
    ]);
  }

  private async setChessState() {
    const chessFen = await getRoomBoard(this.roomId);
    if (!chessFen) {
      throw Error("Unable to retreive chess fen.");
    }
    this.chessManager = new Chess(chessFen, { skipValidation: true });
    this.chessManager.board();
    this.currentTurnWhite = this.chessManager.turn() === "w";
  }

  private async setPokemonManagerState() {
    const pokemonPieceIndices = await getRoomPokemonIndices(this.roomId);
    const pokemonBannedIndices = await getPokemonBanList(this.roomId);
    const squareModifiers = (await getRoomSquareModifiers(this.roomId)).map(
      unpackSquareModifierFromBitField,
    );
    this.squareModifierTarget =
      (await getRoomSquareModifierTarget(this.roomId)) ||
      SQUARE_MODIFIER_TARGET;
    this.pokemonGameManager = new PokemonBattleChessManager({
      seed: this.publicSeed,
      format: this.roomGameOptions.format,
      weatherWars: this.roomGameOptions.weatherWars,
      chessBoard: this.chessManager.board(),
      pokemonPieceIndices,
      pokemonBannedIndices,
      squareModifiers,
    });
  }

  private async setPokemonBattleState() {
    this.currentPokemonBattleStakes = await getPokemonBattleStakes(this.roomId);
    this.whitePlayerPokemonMove = await getWhitePlayerPokemonMove(this.roomId);
    this.blackPlayerPokemonMove = await getBlackPlayerPokemonMove(this.roomId);
  }

  public async lockAndValidateTimer(): Promise<
    { matchOutput: MatchLog[]; timer: Timer | undefined } | undefined
  > {
    const reservedLock = await setLockForRoom(this.roomId);

    if (reservedLock) {
      try {
        await this.setGameState();

        const timerValidation = await this.validateGameTimer();
        return timerValidation;
      } finally {
        await releaseLockForRoom(reservedLock);
      }
    } else {
      return;
    }
  }

  private async validateGameTimer(): Promise<
    { matchOutput: MatchLog[]; timer: Timer | undefined } | undefined
  > {
    const timerExpired = this.gameTimer?.isTimeExpired();
    if (!timerExpired?.white && !timerExpired?.black) {
      return;
    }

    if (
      this.pokemonGameManager.draftPieces.length > 0 &&
      this.chessManager.moveNumber() === 1
    ) {
      try {
        if (timerExpired.white) {
          return await this.randomDraftPick("w");
        } else if (timerExpired.black) {
          return await this.randomDraftPick("b");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      if (timerExpired.white) {
        return {
          matchOutput: [this.endGameDueToTimeout("w")],
          timer: this.gameTimer?.getTimers(),
        };
      } else if (timerExpired.black) {
        return {
          matchOutput: [this.endGameDueToTimeout("b")],
          timer: this.gameTimer?.getTimers(),
        };
      }
    }
  }

  public async validateAndEmitChessMove({
    sanMove,
    playerId,
  }: {
    sanMove: string;
    playerId: string;
  }): Promise<
    | {
        whiteStreamOutput: MatchLog[];
        blackStreamOutput: MatchLog[];
        timers?: Timer;
      }
    | undefined
  > {
    const whiteStreamOutput: MatchLog[] = [];
    const blackStreamOutput: MatchLog[] = [];

    try {
      await this.setGameState();
    } catch (err) {
      console.error(err);
      return;
    }
    if (!this.whitePlayer || !this.blackPlayer || !this.isOngoing) {
      console.error("State error");
      return;
    }
    if (this.currentTurnWhite && this.whitePlayer.playerId !== playerId) {
      console.warn("Player id does not match with white");
      return;
    } else if (
      !this.currentTurnWhite &&
      this.blackPlayer.playerId !== playerId
    ) {
      console.warn("Player id does not match with black");
      return;
    }
    if (this.currentPokemonBattleStakes) {
      console.warn("Already pokemon stakes. No chess moves allowed");
      return;
    }
    const hasTimerExpired = await this.validateGameTimer();
    if (hasTimerExpired) {
      return {
        whiteStreamOutput: hasTimerExpired.matchOutput,
        blackStreamOutput: hasTimerExpired.matchOutput,
        timers: hasTimerExpired.timer,
      };
    }

    const chessMatchOutput = await getChessMatchOutput({
      sanMove,
      currentTurn: this.currentTurnWhite ? "w" : "b",
      gameOptions: this.roomGameOptions,
      chessManager: this.chessManager,
      pokemonManager: this.pokemonGameManager,
      whitePlayerId: this.whitePlayer.playerId,
      blackPlayerId: this.blackPlayer.playerId,
      onPokemonBattleCreated: async ({ attemptedMove, battleSeed }) =>
        await this.initiatePokemonBattle({ attemptedMove, battleSeed }),
      onMoveChessPiece: async (move) => await this.moveChessPiece(move),
      onGameEnd: async (winner: Color) => {
        this.endGame(winner, "KING_CAPTURED");
      },
      onRemoveChessPiece: async () => {
        await setGeneratedPokemonIndices(
          this.roomId,
          this.pokemonGameManager.getPokemonIndexedBoardLocations(),
        );
        await setChessBoard(this.roomId, this.chessManager.fen());
      },
      onSquareModifiersUpdate: async () => {
        await setRoomSquareModifiers(
          this.roomId,
          this.pokemonGameManager.squareModifiers.map(
            packSquareModifierIntoBitField,
          ),
        );
      },
    });

    whiteStreamOutput.push(...(chessMatchOutput?.whiteStreamOutput || []));
    blackStreamOutput.push(...(chessMatchOutput?.blackStreamOutput || []));
    await this.pushWhiteHistory(whiteStreamOutput);
    await this.pushBlackHistory(blackStreamOutput);

    let timers: Timer | undefined;
    if (this.roomGameOptions.timersEnabled) {
      timers = await this.processRoomTimers(
        whiteStreamOutput.find((log) => log.type === "pokemon")
          ? "chessStartBattle"
          : "chess",
      );
    }

    const weatherChangeOutput = getWeatherChangeOutput({
      gameOptions: this.roomGameOptions,
      currentTurn: this.currentTurnWhite ? "w" : "b",
      chessManager: this.chessManager,
      pokemonManager: this.pokemonGameManager,
      squareModifierTarget: this.squareModifierTarget,
    });

    if (weatherChangeOutput?.newModifierTarget) {
      await setRoomSquareModifierTarget(
        this.roomId,
        weatherChangeOutput.newModifierTarget,
      );
    }

    if (weatherChangeOutput?.squareModifierLog) {
      await setRoomSquareModifiers(
        this.roomId,
        this.pokemonGameManager.squareModifiers.map(
          packSquareModifierIntoBitField,
        ),
      );
      await this.pushHistory(
        JSON.parse(JSON.stringify(weatherChangeOutput.squareModifierLog)),
      );
      whiteStreamOutput.push(weatherChangeOutput.squareModifierLog);
      blackStreamOutput.push(weatherChangeOutput.squareModifierLog);
    }

    return { whiteStreamOutput, blackStreamOutput, timers };
  }

  private async processRoomTimers(
    mode:
      | "chess"
      | "chessStartBattle"
      | "pokemonMovesFinalized"
      | "pokemonEndBattle"
      | "pokemonUpdate"
      | "pokemonBan"
      | "pokemonDraft",
  ) {
    if (this.gameTimer) {
      if (mode === "chess") {
        this.gameTimer.processChessMove(this.currentTurnWhite);
      } else if (mode === "chessStartBattle") {
        this.gameTimer.processChessMove(this.currentTurnWhite, true);
      } else if (mode === "pokemonMovesFinalized") {
        this.gameTimer.processPokemonMove();
      } else if (mode === "pokemonEndBattle") {
        this.gameTimer.processPokemonMove(true, this.currentTurnWhite);
      } else if (mode === "pokemonBan" || mode === "pokemonDraft") {
        const whiteDraftOrBan =
          this.pokemonGameManager.draftPieces.length % 2 === 0;
        this.gameTimer.stopTimer(whiteDraftOrBan ? "b" : "w");

        if (this.pokemonGameManager.chessPieces.length < 32) {
          // Continue draft
          this.gameTimer.initializeGameTimer({
            timeDuration: this.roomGameOptions.banTimerDuration * 1000,
          });
          this.gameTimer.startTimer(whiteDraftOrBan ? "w" : "b");
        } else {
          // Start chess game + timers
          this.gameTimer.initializeGameTimer({
            timeDuration: this.roomGameOptions.chessTimerDuration * 60 * 1000,
          });
          this.gameTimer.startTimer("w");
        }
      }

      await setRoomTimers(this.roomId, {
        whitePlayerTimerExpiration: this.gameTimer.whitePlayerTimerExpiration,
        whitePlayerTimeSinceLastMove: this.gameTimer.whitePlayerLastMoveTime,
        whitePlayerTimerPaused: this.gameTimer.whitePlayerTimerPaused,
        blackPlayerTimerExpiration: this.gameTimer.blackPlayerTimerExpiration,
        blackPlayerTimeSinceLastMove: this.gameTimer.blackPlayerLastMoveTime,
        blackPlayerTimerPaused: this.gameTimer.blackPlayerTimerPaused,
      });
      return this.gameTimer.getTimers(
        !(mode === "pokemonBan" || mode === "pokemonDraft"),
      );
    }
  }

  private async moveChessPiece(chessMove: Move) {
    this.pokemonGameManager.movePokemonToSquare(
      chessMove.from,
      chessMove.to,
      chessMove.promotion,
    );
    if (chessMove.isKingsideCastle() || chessMove.isQueensideCastle()) {
      const { to: toCastledRookSquare, from: fromCastledRookSquare } =
        getCastledRookSquare(chessMove.color, chessMove.isKingsideCastle());
      this.pokemonGameManager.movePokemonToSquare(
        fromCastledRookSquare,
        toCastledRookSquare,
      );
    }
    // if castle, move rook piece within pokemon game manager
    this.chessManager.move(chessMove.san, { continueOnCheck: true });
    await setGeneratedPokemonIndices(
      this.roomId,
      this.pokemonGameManager.getPokemonIndexedBoardLocations(),
    );
    await setChessBoard(this.roomId, this.chessManager.fen());
  }

  private endGameDueToTimeout(color: Color) {
    return this.endGame(color === "w" ? "b" : "w", "TIMEOUT");
  }

  private async randomDraftPick(color: Color) {
    if (!this.whitePlayer || !this.blackPlayer) {
      return;
    }
    let possibleSquares: string[] = [];
    let playerId;
    if (color === "w") {
      playerId = this.whitePlayer.playerId;
      for (let i = 0; i < 16; i++) {
        possibleSquares.push(
          `${String.fromCharCode(97 + Math.floor(i % 8))}${2 - Math.floor(i / 8)}`,
        );
      }
    } else {
      playerId = this.blackPlayer.playerId;
      for (let i = 0; i < 16; i++) {
        possibleSquares.push(
          `${String.fromCharCode(97 + Math.floor(i % 8))}${8 - Math.floor(i / 8)}`,
        );
      }
    }

    possibleSquares = possibleSquares.filter(
      (square) =>
        !this.pokemonGameManager.getPokemonFromSquare(square as Square),
    );
    const randomSquareIndex = Math.floor(
      Math.random() * possibleSquares.length,
    );
    const randomPokemonIndex =
      this.pokemonGameManager.draftPieces[
        Math.floor(Math.random() * this.pokemonGameManager.draftPieces.length)
      ].index;

    if (this.pokemonGameManager.banPieces.length < 6) {
      return await this.banPokemon(playerId, randomPokemonIndex);
    } else {
      const chessSquare = possibleSquares[randomSquareIndex] as Square;
      const chessPiece = this.chessManager.get(chessSquare)!;
      return await this.draftPokemon(
        possibleSquares[randomSquareIndex] as Square,
        chessPiece,
        playerId,
        randomPokemonIndex,
      );
    }
  }

  public endGame(color: Color | "", reason: EndGameReason): MatchLog {
    const gameData: MatchLog = {
      type: "generic",
      data: { event: "gameEnd", color, reason },
    };
    this.pushHistory(gameData);
    setRoomToOngoing(this.roomId, false);
    setPlayersViewingResults(this.playerIdList || [], true);
    return gameData;
  }

  private async generatePublicSeed() {
    if (process.env.NODE_ENV === "production") {
      this.publicSeed = PRNG.generateSeed();
    } else {
      this.publicSeed =
        (await getRequestedGameSeed(this.roomId)) || PRNG.generateSeed();
    }
    return await setGameRoomSeed(this.roomId, this.publicSeed);
  }

  private async resetChessBoard() {
    this.chessManager = new Chess();
    return await setChessBoard(this.roomId, this.chessManager.fen());
  }

  private async generateSquareModifierTarget() {
    this.squareModifierTarget = getNewSquareModTargetNumber();
    return await setRoomSquareModifierTarget(
      this.roomId,
      this.squareModifierTarget,
    );
  }

  private async initiatePokemonBattle({
    attemptedMove,
    battleSeed,
  }: {
    attemptedMove: { san: string; color: Color };
    battleSeed: string;
  }) {
    await Promise.all([
      setPokemonBattleStakes(this.roomId, attemptedMove),
      setPokemonBattleSeed(this.roomId, battleSeed),
    ]);
  }

  public async resetRoomForRematch() {
    await this.generatePublicSeed();

    await this.resetChessBoard();
    await resetMatchHistory(this.roomId);

    this.pokemonGameManager = new PokemonBattleChessManager({
      seed: this.publicSeed,
      format: this.roomGameOptions.format,
      weatherWars: this.roomGameOptions.weatherWars,
    });
    await setGeneratedPokemonIndices(
      this.roomId,
      this.pokemonGameManager.getPokemonIndexedBoardLocations(),
    );
    await setRoomSquareModifiers(
      this.roomId,
      this.pokemonGameManager.squareModifiers.map(
        packSquareModifierIntoBitField,
      ),
    );

    await setWhitePlayerPokemonMove(this.roomId, null);
    await setBlackPlayerPokemonMove(this.roomId, null);
    await setPokemonBattleStakes(this.roomId);
    await setPokemonBattleSeed(this.roomId);
    await clearPokemonMoveHistory(this.roomId);
    await clearPokemonBanList(this.roomId);
    this.currentPokemonBattle = null;

    /**
     * Timers
     */
    await setWhiteTimerExpiration(this.roomId);
    await setWhiteTimeSinceLastMove(this.roomId);
    await setBlackTimerExpiration(this.roomId);
    await setBlackTimeSinceLastMove(this.roomId);

    /**
     * Weather Wars init
     */
    if (this.roomGameOptions.weatherWars) {
      await this.generateSquareModifierTarget();
    }
  }

  public async validateAndEmitPokemonMove({
    pokemonMove,
    playerId,
  }: {
    pokemonMove: string;
    playerId: string;
  }): Promise<
    | {
        whiteStreamOutput: MatchLog[];
        blackStreamOutput: MatchLog[];
        timers?: Timer;
      }
    | undefined
  > {
    const whiteStreamOutput: MatchLog[] = [];
    const blackStreamOutput: MatchLog[] = [];
    try {
      await this.setGameState();
    } catch (err) {
      console.error(err);
      return;
    }
    if (
      !this.whitePlayer ||
      !this.blackPlayer ||
      !this.isOngoing ||
      !this.currentPokemonBattleStakes
    ) {
      console.warn("Players or stakes are not set");
      return;
    }

    const timerValidationOutput = await this.validateGameTimer();
    if (timerValidationOutput) {
      return {
        whiteStreamOutput: timerValidationOutput.matchOutput,
        blackStreamOutput: timerValidationOutput.matchOutput,
        timers: timerValidationOutput.timer,
      };
    }

    const isUndo = pokemonMove === "undo";
    if (playerId === this.whitePlayer.playerId) {
      if (isUndo) {
        await this.setPlayerPokemonMove("w", null);
        if (this.roomGameOptions.timersEnabled) {
          this.gameTimer?.startTimer("w");
        }
      } else {
        await this.setPlayerPokemonMove("w", pokemonMove);
        if (this.roomGameOptions.timersEnabled) {
          this.gameTimer?.stopTimer("w");
        }
      }
    } else if (playerId === this.blackPlayer.playerId) {
      if (isUndo) {
        await this.setPlayerPokemonMove("b", null);
        if (this.roomGameOptions.timersEnabled) {
          this.gameTimer?.startTimer("b");
        }
      } else {
        await this.setPlayerPokemonMove("b", pokemonMove);
        if (this.roomGameOptions.timersEnabled) {
          this.gameTimer?.stopTimer("b");
        }
      }
    }

    if (
      (this.whitePlayerPokemonMove && this.blackPlayerPokemonMove) ||
      this.whitePlayerPokemonMove === "forfeit" ||
      this.blackPlayerPokemonMove === "forfeit"
    ) {
      try {
        const { whiteStream, blackStream, omniscientStream } =
          (await this.getPokemonMatchOutput(
            this.whitePlayerPokemonMove || undefined,
            this.blackPlayerPokemonMove || undefined,
          )) || { whiteStream: [], blackStream: [], omniscientStream: [] };
        whiteStreamOutput.push(...whiteStream);
        whiteStreamOutput.push(...omniscientStream);
        blackStreamOutput.push(...blackStream);
        blackStreamOutput.push(...omniscientStream);

        const matchVictory = !!omniscientStream.find(
          (log) => log.type === "pokemon" && log.data.event === "victory",
        );
        if (matchVictory) {
          await this.processRoomTimers("pokemonEndBattle");
        } else {
          await this.processRoomTimers("pokemonMovesFinalized");
        }
      } catch (err) {
        console.error(err);
        return;
      }
    } else {
      await this.processRoomTimers("pokemonUpdate");
    }

    this.pushWhiteHistory(whiteStreamOutput);
    this.pushBlackHistory(blackStreamOutput);

    return {
      whiteStreamOutput,
      blackStreamOutput,
      timers: this.roomGameOptions.timersEnabled
        ? this.gameTimer?.getTimers()
        : undefined,
    };
  }

  private setPlayerPokemonMove = async (color: Color, move: string | null) => {
    if (color === "w") {
      this.whitePlayerPokemonMove = move;
      await setWhitePlayerPokemonMove(this.roomId, move);
    }
    if (color === "b") {
      this.blackPlayerPokemonMove = move;
      await setBlackPlayerPokemonMove(this.roomId, move);
    }
  };

  private getPokemonMatchOutput = async (
    whitePokemonMove?: string,
    blackPokemonMove?: string,
  ) => {
    if (!this.currentPokemonBattleStakes) {
      throw new Error("Battle stakes not initialized");
    }
    if (!this.whitePlayer || !this.blackPlayer) {
      throw new Error("Players not initialized");
    }
    const moveHistory = await getPokemonMoveHistory(this.roomId);
    const battleSeed =
      ((await getPokemonBattleSeed(this.roomId)) as PRNGSeed) ||
      new PRNG().getSeed();

    const matchOutput = await getPokemonBattleOutput({
      p1PokemonMove: whitePokemonMove,
      p2PokemonMove: blackPokemonMove,
      moveHistory,
      seed: battleSeed,
      whitePlayerId: this.whitePlayer?.playerId,
      blackPlayerId: this.blackPlayer?.playerId,
      advantageSide: this.currentTurnWhite ? "p1" : "p2",
      gameOptions: this.roomGameOptions,
      pokemonManager: this.pokemonGameManager,
      chessManager: this.chessManager,
      currentPokemonBattleStakes: this.currentPokemonBattleStakes,
      onMoveChessPiece: async (move) => await this.moveChessPiece(move),
      onGameEnd: async (winner: Color) => {
        this.endGame(winner, "KING_CAPTURED");
      },
      onRemoveChessPiece: async (move) => {
        this.pokemonGameManager.getPokemonFromSquare(move.from)!.square = null;
        this.chessManager.remove(move.from);
        this.chessManager.forceAdvanceTurn();
        await setGeneratedPokemonIndices(
          this.roomId,
          this.pokemonGameManager.getPokemonIndexedBoardLocations(),
        );
        await setChessBoard(this.roomId, this.chessManager.fen());
      },
      onSquareModifiersUpdate: async () => {
        await setRoomSquareModifiers(
          this.roomId,
          this.pokemonGameManager.squareModifiers.map(
            packSquareModifierIntoBitField,
          ),
        );
      },
    });

    if (
      matchOutput?.omniscientStream.find(
        (log) => log.type === "pokemon" && log.data.event === "victory",
      )
    ) {
      await Promise.all([
        setPokemonBattleStakes(this.roomId),
        setPokemonBattleSeed(this.roomId),
        clearPokemonMoveHistory(this.roomId),
        this.setPlayerPokemonMove("w", null),
        this.setPlayerPokemonMove("b", null),
      ]);
    } else {
      await Promise.all([
        pushPokemonMoveHistory(
          this.roomId,
          `>p1 move ${whitePokemonMove}`,
          `>p2 move ${blackPokemonMove}`,
        ),
        this.setPlayerPokemonMove("w", null),
        this.setPlayerPokemonMove("b", null),
      ]);
    }
    return matchOutput;
  };

  public async validateAndEmitPokemonBan({
    draftPokemonIndex,
    playerId,
  }: {
    draftPokemonIndex: number;
    playerId: string;
  }): Promise<
    { matchOutput: MatchLog[]; timer: Timer | undefined } | undefined
  > {
    try {
      await this.setGameState();
    } catch (err) {
      console.error("Error setting state:", (err as unknown as Error).message);
    }
    if (
      !this.whitePlayer ||
      !this.blackPlayer ||
      !this.pokemonGameManager.draftPieces.length ||
      this.chessManager.moveNumber() > 1
    ) {
      console.warn("Incorrect state for pokemon ban");
      return;
    }

    const timerValidationOutput = await this.validateGameTimer();
    if (timerValidationOutput) {
      return timerValidationOutput;
    }

    return this.banPokemon(playerId, draftPokemonIndex);
  }

  private async banPokemon(playerId: string, banPokemonIndex: number) {
    const banOutput: MatchLog[] = [];
    if (
      this.pokemonGameManager.banPieces.find(
        (p) => p.index === banPokemonIndex,
      ) ||
      this.pokemonGameManager.chessPieces.find(
        (p) => p.index === banPokemonIndex,
      )
    ) {
      throw Error(
        "Can not ban a pokemon that has already been banned or drafted",
      );
    }

    if (
      playerId === this.whitePlayer?.playerId &&
      this.pokemonGameManager.draftPieces.length % 2 === 0
    ) {
      await this.updateBanState(banPokemonIndex);
      const matchLog: MatchLog = {
        type: "ban",
        data: { index: banPokemonIndex, color: "w" },
      };
      await this.pushHistory(matchLog);
      banOutput.push(matchLog);
    } else if (
      playerId === this.blackPlayer?.playerId &&
      this.pokemonGameManager.draftPieces.length % 2 === 1
    ) {
      await this.updateBanState(banPokemonIndex);
      const matchLog: MatchLog = {
        type: "ban",
        data: { index: banPokemonIndex, color: "b" },
      };
      await this.pushHistory(matchLog);
      banOutput.push(matchLog);
    } else {
      return;
    }

    let timer: Timer | undefined;
    if (this.roomGameOptions.timersEnabled) {
      timer = await this.processRoomTimers("pokemonBan");
    }

    return { matchOutput: banOutput, timer };
  }

  private async updateBanState(draftPokemonIndex: number) {
    await pushPokemonBanList(this.roomId, draftPokemonIndex);
    this.pokemonGameManager.banDraftPiece(draftPokemonIndex);
  }

  public async validateAndEmitPokemonDraft({
    square,
    draftPokemonIndex,
    playerId,
  }: {
    square?: Square;
    draftPokemonIndex: number;
    playerId: string;
  }): Promise<
    { matchOutput: MatchLog[]; timer: Timer | undefined } | undefined
  > {
    const chessPiece = square ? this.chessManager.get(square) : null;
    try {
      await this.setGameState();
    } catch (err) {
      console.error("Error setting state:", (err as unknown as Error).message);
    }
    if (
      !square ||
      !chessPiece ||
      !this.whitePlayer ||
      !this.blackPlayer ||
      !this.isOngoing ||
      !this.pokemonGameManager.draftPieces.length ||
      this.chessManager.moveNumber() > 1
    ) {
      console.warn("Incorrect state for pokemon ban");
      return;
    }

    const timerValidationOutput = await this.validateGameTimer();
    if (timerValidationOutput) {
      return timerValidationOutput;
    }

    return this.draftPokemon(square, chessPiece, playerId, draftPokemonIndex);
  }

  private async draftPokemon(
    square: Square,
    chessPiece: Piece,
    playerId: string,
    draftPokemonIndex: number,
  ) {
    const draftOutput: MatchLog[] = [];
    const chessPieceSquare = {
      square,
      type: chessPiece.type,
      color: chessPiece.color,
    };
    if (
      this.pokemonGameManager.chessPieces.find(
        (p) => p.index === draftPokemonIndex,
      ) ||
      this.pokemonGameManager.banPieces.find(
        (p) => p.index === draftPokemonIndex,
      )
    ) {
      throw Error(
        "Can not draft a pokemon that has already been drafted or banned.",
      );
    }

    if (
      playerId === this.whitePlayer?.playerId &&
      this.pokemonGameManager.draftPieces.length % 2 === 0
    ) {
      await this.updateDraftState(draftPokemonIndex, chessPieceSquare, "w");
      const matchLog: MatchLog = {
        type: "draft",
        data: { square, index: draftPokemonIndex, color: "w" },
      };
      await this.pushHistory(matchLog);
      draftOutput.push(matchLog);
    } else if (
      playerId === this.blackPlayer?.playerId &&
      this.pokemonGameManager.draftPieces.length % 2 === 1
    ) {
      await this.updateDraftState(draftPokemonIndex, chessPieceSquare, "b");
      const matchLog: MatchLog = {
        type: "draft",
        data: { square, index: draftPokemonIndex, color: "b" },
      };
      await this.pushHistory(matchLog);
      draftOutput.push(matchLog);
    } else {
      return;
    }

    let timer: Timer | undefined;
    if (this.roomGameOptions.timersEnabled) {
      timer = await this.processRoomTimers("pokemonDraft");
    }
    return { matchOutput: draftOutput, timer };
  }

  private async updateDraftState(
    index: number,
    chessSquare: Exclude<ChessBoardSquare, null>,
    color: Color,
  ) {
    this.pokemonGameManager.assignPokemonToSquare(
      index,
      chessSquare.square,
      chessSquare.type,
      color,
    );
    await setGeneratedPokemonIndices(
      this.roomId,
      this.pokemonGameManager.getPokemonIndexedBoardLocations(),
    );
  }

  private async pushWhiteHistory(log: MatchLog | MatchLog[]) {
    if (Array.isArray(log)) {
      if (log.length > 0) {
        this.whiteMatchHistory.push(...log);
        return await pushWhiteMatchHistory(
          this.roomId,
          ...log.map((l) => JSON.stringify(l)),
        );
      }
    } else {
      this.whiteMatchHistory.push(log);
      return await pushWhiteMatchHistory(this.roomId, JSON.stringify(log));
    }
  }

  private async pushBlackHistory(log: MatchLog | MatchLog[]) {
    if (Array.isArray(log)) {
      if (log.length > 0) {
        this.blackMatchHistory.push(...log);
        return await pushBlackMatchHistory(
          this.roomId,
          ...log.map((l) => JSON.stringify(l)),
        );
      }
    } else {
      this.blackMatchHistory.push(log);
      return await pushBlackMatchHistory(this.roomId, JSON.stringify(log));
    }
  }

  private async pushHistory(log: MatchLog) {
    this.whiteMatchHistory.push(log);
    this.blackMatchHistory.push(log);
    return await pushMatchHistory(this.roomId, log);
  }

  public async getHistory(playerId: string): Promise<MatchLog[]> {
    if (playerId === this.blackPlayer?.playerId) {
      return (await getBlackMatchHistory(this.roomId)).map((log) =>
        JSON.parse(log),
      );
    } else {
      return (await getWhiteMatchHistory(this.roomId)).map((log) =>
        JSON.parse(log),
      );
    }
  }

  public async setTimerState() {
    if (this.roomGameOptions.timersEnabled) {
      this.gameTimer = new GameTimer(
        this.roomGameOptions.chessTimerIncrement,
        this.roomGameOptions.pokemonTimerIncrement,
      );

      const whitePlayerTimerExpiration = parseInt(
        (await getWhiteTimerExpiration(this.roomId)) || "",
      );
      const whitePlayerTimeSinceLastMove = parseInt(
        (await getWhiteTimeSinceLastMove(this.roomId)) || "",
      );
      const whitePlayerTimerPaused = await getWhiteTimerPaused(this.roomId);
      const blackPlayerTimerExpiration = parseInt(
        (await getBlackTimerExpiration(this.roomId)) || "",
      );
      const blackPlayerTimeSinceLastMove = parseInt(
        (await getBlackTimeSinceLastMove(this.roomId)) || "",
      );
      const blackPlayerTimerPaused = await getBlackTimerPaused(this.roomId);

      this.gameTimer.initializeGameTimer({
        whitePlayerTimerExpiration,
        whitePlayerTimeSinceLastMove,
        whitePlayerTimerPaused,
        blackPlayerTimerExpiration,
        blackPlayerTimeSinceLastMove,
        blackPlayerTimerPaused,
      });
    }
  }

  private async initializeTimers() {
    const timeDuration =
      this.roomGameOptions.format === "random"
        ? this.roomGameOptions.chessTimerDuration * 60 * 1000
        : this.roomGameOptions.banTimerDuration * 1000;

    this.gameTimer = new GameTimer(
      this.roomGameOptions.chessTimerIncrement,
      this.roomGameOptions.pokemonTimerIncrement,
    );
    this.gameTimer.initializeGameTimer({
      timeDuration,
    });

    await setWhiteTimerExpiration(
      this.roomId,
      `${this.gameTimer.whitePlayerTimerExpiration}`,
    );
    await setWhiteTimeSinceLastMove(
      this.roomId,
      `${this.gameTimer.whitePlayerLastMoveTime}`,
    );
    await setWhiteTimerPaused(this.roomId, false);
    await setBlackTimerExpiration(
      this.roomId,
      `${this.gameTimer.blackPlayerTimerExpiration}`,
    );
    await setBlackTimeSinceLastMove(
      this.roomId,
      `${this.gameTimer.blackPlayerLastMoveTime}`,
    );
    await setBlackTimerPaused(this.roomId, true);
  }
}
