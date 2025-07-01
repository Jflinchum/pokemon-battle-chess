import { Color } from "chess.js";
import { Timer } from "../../shared/types/Game.js";

export default class GameTimer {
  private whitePlayerTimerExpiration: number;
  private blackPlayerTimerExpiration: number;
  private whitePlayerLastMoveTime: number;
  private blackPlayerLastMoveTime: number;
  private whitePlayerTimer: NodeJS.Timeout | null;
  private blackPlayerTimer: NodeJS.Timeout | null;
  private chessTimerIncrement: number;
  private pokemonTimerIncrement: number;
  private timersEnabled: boolean;
  private whiteTimerStarted: boolean;
  private blackTimerStarted: boolean;

  constructor(
    chessTimerIncrement: number,
    pokemonTimerIncrement: number,
    timersEnabled: boolean,
  ) {
    this.whitePlayerTimerExpiration = new Date().getTime();
    this.whitePlayerLastMoveTime = new Date().getTime();
    this.blackPlayerTimerExpiration = new Date().getTime();
    this.blackPlayerLastMoveTime = new Date().getTime();
    this.whitePlayerTimer = null;
    this.blackPlayerTimer = null;
    this.chessTimerIncrement = chessTimerIncrement;
    this.pokemonTimerIncrement = pokemonTimerIncrement;
    this.timersEnabled = timersEnabled;

    this.whiteTimerStarted = false;
    this.blackTimerStarted = false;
  }

  public initializeGameTimer(timeDuration: number) {
    if (this.timersEnabled) {
      this.whitePlayerTimerExpiration = new Date().getTime() + timeDuration;
      this.whitePlayerLastMoveTime = new Date().getTime();
      this.blackPlayerTimerExpiration = new Date().getTime() + timeDuration;
      this.blackPlayerLastMoveTime = new Date().getTime();
    }
  }

  public clearTimeouts() {
    if (this.whitePlayerTimer) {
      clearTimeout(this.whitePlayerTimer);
      this.whitePlayerTimer = null;
    }
    if (this.blackPlayerTimer) {
      clearTimeout(this.blackPlayerTimer);
      this.blackPlayerTimer = null;
    }
  }

  public startTimer(cb: () => void, color: Color) {
    if (this.timersEnabled) {
      if (color === "w") {
        this.whitePlayerTimerExpiration +=
          new Date().getTime() - this.whitePlayerLastMoveTime;
        if (this.whitePlayerTimer) {
          clearTimeout(this.whitePlayerTimer);
        }
        this.whitePlayerTimer = setTimeout(
          cb,
          this.whitePlayerTimerExpiration - new Date().getTime(),
        );
        this.whiteTimerStarted = true;
      } else {
        this.blackPlayerTimerExpiration +=
          new Date().getTime() - this.blackPlayerLastMoveTime;
        if (this.blackPlayerTimer) {
          clearTimeout(this.blackPlayerTimer);
        }
        this.blackPlayerTimer = setTimeout(
          cb,
          this.blackPlayerTimerExpiration - new Date().getTime(),
        );
        this.blackTimerStarted = true;
      }
    }
  }

  public stopTimer(color: Color) {
    if (this.timersEnabled) {
      if (color === "w" && this.whitePlayerTimer) {
        clearTimeout(this.whitePlayerTimer);
        this.whitePlayerTimer = null;
        this.whitePlayerLastMoveTime = new Date().getTime();
      } else if (color === "b" && this.blackPlayerTimer) {
        clearTimeout(this.blackPlayerTimer);
        this.blackPlayerTimer = null;
        this.blackPlayerLastMoveTime = new Date().getTime();
      }
    }
  }

  public getTimers(): Timer {
    return {
      white: {
        timerExpiration: this.whitePlayerTimerExpiration,
        pause: !this.whitePlayerTimer,
        hasStarted: this.whiteTimerStarted,
      },
      black: {
        timerExpiration: this.blackPlayerTimerExpiration,
        pause: !this.blackPlayerTimer,
        hasStarted: this.blackTimerStarted,
      },
    };
  }

  public stopTimers() {
    if (this.timersEnabled) {
      this.stopTimer("w");
      this.stopTimer("b");
    }
  }

  public pauseTimer(color: Color) {
    if (this.timersEnabled) {
      if (color === "w") {
        this.whitePlayerLastMoveTime = new Date().getTime();
        this.stopTimer("w");
      } else {
        this.blackPlayerLastMoveTime = new Date().getTime();
        this.stopTimer("b");
      }
    }
  }

  public getTimersWithLastMoveShift(): Timer {
    return {
      white: {
        timerExpiration:
          this.whitePlayerTimerExpiration +
          (new Date().getTime() - this.whitePlayerLastMoveTime) *
            (this.whitePlayerTimer ? 0 : 1),
        pause: !this.whitePlayerTimer,
        hasStarted: this.whiteTimerStarted,
      },
      black: {
        timerExpiration:
          this.blackPlayerTimerExpiration +
          (new Date().getTime() - this.blackPlayerLastMoveTime) *
            (this.blackPlayerTimer ? 0 : 1),
        pause: !this.blackPlayerTimer,
        hasStarted: this.blackTimerStarted,
      },
    };
  }

  public processChessMove(currentTurnWhite: boolean, cb: () => void) {
    if (this.timersEnabled) {
      if (currentTurnWhite) {
        const diff = new Date().getTime() - this.whitePlayerLastMoveTime;
        this.whitePlayerLastMoveTime += diff < 100 ? 100 : diff;
        this.whitePlayerTimerExpiration += this.chessTimerIncrement * 1000;
      } else {
        const diff = new Date().getTime() - this.blackPlayerLastMoveTime;
        this.blackPlayerLastMoveTime += diff < 100 ? 100 : diff;
        this.blackPlayerTimerExpiration += this.chessTimerIncrement * 1000;
      }

      this.stopTimer(currentTurnWhite ? "w" : "b");
      this.startTimer(cb, currentTurnWhite ? "b" : "w");
    }
  }

  public processPokemonMove(cb: (color: Color) => void) {
    if (this.timersEnabled) {
      this.whitePlayerTimerExpiration += this.pokemonTimerIncrement * 1000;
      this.blackPlayerTimerExpiration += this.pokemonTimerIncrement * 1000;

      this.startTimer(() => cb("w"), "w");
      this.startTimer(() => cb("b"), "b");

      const wDiff = new Date().getTime() - this.whitePlayerLastMoveTime;
      this.whitePlayerLastMoveTime += wDiff < 100 ? 100 : wDiff;
      const bDiff = new Date().getTime() - this.blackPlayerLastMoveTime;
      this.blackPlayerLastMoveTime += bDiff < 100 ? 100 : bDiff;
    }
  }
}
