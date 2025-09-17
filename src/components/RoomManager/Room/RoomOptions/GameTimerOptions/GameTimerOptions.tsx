import Button from "../../../../common/Button/Button";
import "./GameTimerOptions.css";

export const TimerId = ["No Timer", "Long", "Normal", "Bullet"] as const;

export const GameTimerOptions = ({
  timerId,
  onChange,
  disabled,
}: {
  timerId: (typeof TimerId)[number];
  onChange: (timer: (typeof TimerId)[number]) => void;
  disabled?: boolean;
}) => {
  const handleSelectTimerId = (timer: (typeof TimerId)[number]) => {
    onChange(timer);
  };

  return (
    <>
      <div className="roomOptionLabel">
        <span id="gameTimer">Game Timer:</span>
        <p>
          Adds a timer to the game. If players run out of time during the
          draft/ban phase, a random pokemon will be chosen and randomly
          assigned. If players run out of time in the match, then they will
          lose.
        </p>
        <p>
          Long is 30 minutes. Normal is 15 minutes. Bullet is 2 minutes. Each
          move you make in game will prolong your timer.
        </p>
      </div>
      <div className="gameTimerContainer">
        {TimerId.map((timer) => (
          <Button
            disabled={disabled}
            highlighted={timerId === timer}
            className="roomOptionButtons"
            aria-describedby="gameTimer"
            key={timer}
            onClick={() => handleSelectTimerId(timer)}
          >
            {timer}
          </Button>
        ))}
      </div>
    </>
  );
};
