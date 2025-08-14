import { Color } from "chess.js";
import { Timer } from "../../shared/types/Game.js";

export default class GameTimer {
  public whitePlayerTimerExpiration: number;
  public blackPlayerTimerExpiration: number;
  public whitePlayerLastMoveTime: number;
  public blackPlayerLastMoveTime: number;
  public whitePlayerTimerPaused: boolean;
  public blackPlayerTimerPaused: boolean;
  private chessTimerIncrement: number;
  private pokemonTimerIncrement: number;

  constructor(chessTimerIncrement: number, pokemonTimerIncrement: number) {
    this.whitePlayerTimerExpiration = new Date().getTime();
    this.whitePlayerLastMoveTime = new Date().getTime();
    this.blackPlayerTimerExpiration = new Date().getTime();
    this.blackPlayerLastMoveTime = new Date().getTime();
    this.whitePlayerTimerPaused = false;
    this.blackPlayerTimerPaused = true;
    this.chessTimerIncrement = chessTimerIncrement;
    this.pokemonTimerIncrement = pokemonTimerIncrement;
  }

  public initializeGameTimer({
    timeDuration,
    whitePlayerTimerExpiration,
    whitePlayerTimeSinceLastMove,
    whitePlayerTimerPaused,
    blackPlayerTimerExpiration,
    blackPlayerTimeSinceLastMove,
    blackPlayerTimerPaused,
  }: {
    timeDuration?: number;
    whitePlayerTimerExpiration?: number;
    whitePlayerTimeSinceLastMove?: number;
    whitePlayerTimerPaused?: boolean;
    blackPlayerTimerExpiration?: number;
    blackPlayerTimeSinceLastMove?: number;
    blackPlayerTimerPaused?: boolean;
  }) {
    if (
      whitePlayerTimerExpiration &&
      !Number.isNaN(whitePlayerTimerExpiration) &&
      whitePlayerTimeSinceLastMove &&
      !Number.isNaN(whitePlayerTimeSinceLastMove) &&
      blackPlayerTimerExpiration &&
      !Number.isNaN(blackPlayerTimerExpiration) &&
      blackPlayerTimeSinceLastMove &&
      !Number.isNaN(blackPlayerTimeSinceLastMove)
    ) {
      this.whitePlayerTimerExpiration = whitePlayerTimerExpiration;
      this.whitePlayerLastMoveTime = whitePlayerTimeSinceLastMove;
      this.whitePlayerTimerPaused = whitePlayerTimerPaused || false;

      this.blackPlayerTimerExpiration = blackPlayerTimerExpiration;
      this.blackPlayerLastMoveTime = blackPlayerTimeSinceLastMove;
      this.blackPlayerTimerPaused = blackPlayerTimerPaused || false;
    } else if (timeDuration) {
      this.whitePlayerTimerExpiration = new Date().getTime() + timeDuration;
      this.whitePlayerLastMoveTime = new Date().getTime();
      this.blackPlayerTimerExpiration = new Date().getTime() + timeDuration;
      this.blackPlayerLastMoveTime = new Date().getTime();
    }
  }

  public startTimer(color: Color) {
    if (color === "w") {
      this.whitePlayerTimerExpiration +=
        new Date().getTime() - this.whitePlayerLastMoveTime;
      this.whitePlayerTimerPaused = false;
    } else {
      this.blackPlayerTimerExpiration +=
        new Date().getTime() - this.blackPlayerLastMoveTime;
      this.blackPlayerTimerPaused = false;
    }
  }

  public stopTimer(color: Color) {
    if (color === "w") {
      this.whitePlayerLastMoveTime = new Date().getTime();
      this.whitePlayerTimerPaused = true;
    } else if (color === "b") {
      this.blackPlayerLastMoveTime = new Date().getTime();
      this.blackPlayerTimerPaused = true;
    }
  }

  public getTimers(hasStarted: boolean = true): Timer {
    return {
      white: {
        timerExpiration: this.whitePlayerTimerExpiration,
        pause: this.whitePlayerTimerPaused,
        hasStarted,
      },
      black: {
        timerExpiration: this.blackPlayerTimerExpiration,
        pause: this.blackPlayerTimerPaused,
        hasStarted,
      },
    };
  }

  public getTimersWithLastMoveShift(): Timer {
    return {
      white: {
        timerExpiration:
          this.whitePlayerTimerExpiration +
          (new Date().getTime() - this.whitePlayerLastMoveTime) *
            (this.whitePlayerTimerPaused ? 0 : 1),
        pause: !this.whitePlayerTimerPaused,
        hasStarted: true,
      },
      black: {
        timerExpiration:
          this.blackPlayerTimerExpiration +
          (new Date().getTime() - this.blackPlayerLastMoveTime) *
            (this.blackPlayerTimerPaused ? 0 : 1),
        pause: !this.blackPlayerTimerPaused,
        hasStarted: true,
      },
    };
  }

  public processChessMove(
    currentTurnWhite: boolean,
    startingPokemonBattle?: boolean,
  ) {
    if (currentTurnWhite) {
      const diff = new Date().getTime() - this.whitePlayerLastMoveTime;
      this.whitePlayerLastMoveTime += diff < 100 ? 100 : diff;
      this.whitePlayerTimerExpiration += this.chessTimerIncrement * 1000;
    } else {
      const diff = new Date().getTime() - this.blackPlayerLastMoveTime;
      this.blackPlayerLastMoveTime += diff < 100 ? 100 : diff;
      this.blackPlayerTimerExpiration += this.chessTimerIncrement * 1000;
    }

    if (startingPokemonBattle) {
      this.startTimer("w");
      this.startTimer("b");
    } else {
      this.stopTimer(currentTurnWhite ? "w" : "b");
      this.startTimer(currentTurnWhite ? "b" : "w");
    }
  }

  public processPokemonMove(
    endingPokemonBattle?: boolean,
    currentTurnWhite?: boolean,
  ) {
    this.whitePlayerTimerExpiration += this.pokemonTimerIncrement * 1000;
    this.blackPlayerTimerExpiration += this.pokemonTimerIncrement * 1000;

    if (endingPokemonBattle) {
      this.stopTimer(currentTurnWhite ? "w" : "b");
      this.startTimer(currentTurnWhite ? "b" : "w");
    } else {
      this.startTimer("w");
      this.startTimer("b");
    }

    const wDiff = new Date().getTime() - this.whitePlayerLastMoveTime;
    this.whitePlayerLastMoveTime += wDiff < 100 ? 100 : wDiff;
    const bDiff = new Date().getTime() - this.blackPlayerLastMoveTime;
    this.blackPlayerLastMoveTime += bDiff < 100 ? 100 : bDiff;
  }

  public isTimeExpired() {
    const currentTimestamp = new Date().getTime();

    return {
      white:
        this.whitePlayerTimerExpiration < currentTimestamp &&
        !this.whitePlayerTimerPaused,
      black:
        this.blackPlayerTimerExpiration < currentTimestamp &&
        !this.blackPlayerTimerPaused,
    };
  }
}
