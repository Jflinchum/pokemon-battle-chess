

export default class GameTimer {
  private whitePlayerTimerExpiration: number;
  private blackPlayerTimerExpiration: number;
  private whitePlayerLastMoveTime: number;
  private blackPlayerLastMoveTime: number;
  private whitePlayerTimer: NodeJS.Timeout | null;
  private blackPlayerTimer: NodeJS.Timeout | null;
  private banTimerDuration: number;
  private chessTimerDuration: number;
  private chessTimerIncrement: number;
  private pokemonTimerIncrement: number;
  private timersEnabled: boolean;

  constructor(banTimerDuration: number, chessTimerDuration: number, chessTimerIncrement: number, pokemonTimerIncrement: number, timersEnabled: boolean) {
    this.banTimerDuration = banTimerDuration;
    this.chessTimerDuration = chessTimerDuration;
    this.chessTimerIncrement = chessTimerIncrement;
    this.pokemonTimerIncrement = pokemonTimerIncrement;
    this.timersEnabled = timersEnabled;
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

  public startTimer(cb, color) {
		if (this.timersEnabled) {
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
		}
  };

  public stopTimer(color) {
		if (this.timersEnabled) {
			if (color === 'w' && this.whitePlayerTimer) {
				clearTimeout(this.whitePlayerTimer);
				this.whitePlayerTimer = null;
				this.whitePlayerLastMoveTime = new Date().getTime();
			} else if (color === 'b' && this.blackPlayerTimer) {
				clearTimeout(this.blackPlayerTimer);
				this.blackPlayerTimer = null;
				this.blackPlayerLastMoveTime = new Date().getTime();
			}
		}
  };

  public getTimers() {
    return {
      white: {
        timerExpiration: this.whitePlayerTimerExpiration,
        pause: !this.whitePlayerTimer,
      },
      black: {
        timerExpiration: this.blackPlayerTimerExpiration,
        pause: !this.blackPlayerTimer,
      }
    };
  }

	public stopTimers() {
    if (this.timersEnabled) {
      this.stopTimer('w');
      this.stopTimer('b');
    }
	}

	public pauseTimer(color) {
		if (this.timersEnabled) {
			if (color === 'w') {
				this.whitePlayerLastMoveTime = new Date().getTime();
				this.stopTimer('w');
			} else {
				this.blackPlayerLastMoveTime = new Date().getTime();
				this.stopTimer('b');
			}
		}
	}

  public getTimersWithLastMoveShift() {
    return {
      white: {
        timerExpiration: this.whitePlayerTimerExpiration + (new Date().getTime() - this.whitePlayerLastMoveTime) * (this.whitePlayerTimer ? 0 : 1),
        pause: !this.whitePlayerTimer,
      },
      black: {
        timerExpiration: this.blackPlayerTimerExpiration  + (new Date().getTime() - this.blackPlayerLastMoveTime) * (this.blackPlayerTimer ? 0 : 1),
        pause: !this.blackPlayerTimer,
      }
    };
  }

  public processChessMove(currentTurnWhite: boolean, cb: Function) {
		if (this.timersEnabled) {
      if (currentTurnWhite) {
        this.whitePlayerLastMoveTime = new Date().getTime();
        this.whitePlayerTimerExpiration += this.chessTimerIncrement*1000;
      } else {
        this.blackPlayerLastMoveTime = new Date().getTime();
        this.blackPlayerTimerExpiration += this.chessTimerIncrement*1000;
      }

      this.stopTimer(currentTurnWhite ? 'w' : 'b');
      this.startTimer(cb, currentTurnWhite ? 'b' : 'w');
		}
  }

	public processPokemonMove(cb: Function) {
		if (this.timersEnabled) {
			this.whitePlayerTimerExpiration += this.pokemonTimerIncrement*1000;
			this.blackPlayerTimerExpiration += this.pokemonTimerIncrement*1000;

			this.startTimer(() => cb('w'), 'w');
			this.startTimer(() => cb('b'), 'b');
		
			this.whitePlayerLastMoveTime = new Date().getTime();
			this.blackPlayerLastMoveTime = new Date().getTime();
		}
	}
}