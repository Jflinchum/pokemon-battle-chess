import Button from "../../../../common/Button/Button";
import "./GameTimerOptions.css";

export type TimerId =
  | "No Timer"
  | "30 + 20 + 10"
  | "30"
  | "15 + 10 + 5"
  | "10 + 5 + 1"
  | "10"
  | "5"
  | "3 + 2 + 1"
  | "3"
  | "2 + 1"
  | "1 + 1"
  | "1";

const timerCategoryMapping: Record<string, TimerId[]> = {
  Classic: ["No Timer", "30 + 20 + 10", "30"],
  Rapid: ["15 + 10 + 5", "10 + 5 + 1", "10"],
  Blitz: ["5", "3 + 2 + 1", "3"],
  Bullet: ["2 + 1", "1 + 1", "1"],
};

export const GameTimerOptions = ({
  timerId,
  onChange,
  disabled,
}: {
  timerId: TimerId;
  onChange: (timer: TimerId) => void;
  disabled?: boolean;
}) => {
  const handleSelectTimerId = (timer: TimerId) => {
    onChange(timer);
  };

  return (
    <>
      <div className="gameTimerContainer">
        {Object.keys(timerCategoryMapping).map((category) => (
          <div key={category}>
            <p className="gameTimerLabel">{category}</p>
            {timerCategoryMapping[category].map((timer) => (
              <Button
                disabled={disabled}
                highlighted={timerId === timer}
                className="gameTimerButton"
                key={timer}
                onClick={() => handleSelectTimerId(timer)}
              >
                {timer}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};
