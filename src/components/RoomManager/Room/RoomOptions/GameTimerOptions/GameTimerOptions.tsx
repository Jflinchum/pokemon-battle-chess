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
      <div className="gameTimerContainer">
        {TimerId.map((timer) => (
          <Button
            disabled={disabled}
            highlighted={timerId === timer}
            className="roomOptionButtons"
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
