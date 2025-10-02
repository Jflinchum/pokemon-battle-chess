import { faHourglass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import "./Timer.css";

export interface TimerProps {
  timerExpiration: number;
  paused: boolean;
  roundUpRenderedTime: boolean;
  className?: string;
}

const getTimeLeftInMilliSeconds = (expiration: number) => {
  return expiration - new Date().getTime();
};

const getTimeLeftRoundedUpToNearestSecond = (expiration: number) => {
  const timeLeft = expiration - new Date().getTime();
  return timeLeft + (1000 - (timeLeft % 1000));
};

const formatMillisecondsToTime = (milliseconds: number) => {
  if (milliseconds < 0) {
    return "0:00";
  }
  // Report seconds in SS.mm format
  if (milliseconds < 60 * 1000) {
    return `${Math.floor(milliseconds / 1000)}.${Math.floor((milliseconds % 1000) / 10) < 10 ? "0" : ""}${Math.floor((milliseconds % 1000) / 10)}`;
  }
  // Report minutes in MM:SS format
  return `${Math.floor(milliseconds / (60 * 1000))}:${milliseconds % (60 * 1000) < 1000 * 10 ? "0" : ""}${Math.floor((milliseconds % (60 * 1000)) / 1000)}`;
};

const Timer = ({
  timerExpiration,
  paused,
  roundUpRenderedTime,
  className = "",
}: TimerProps) => {
  const [time, setTime] = useState<number>(
    roundUpRenderedTime
      ? getTimeLeftRoundedUpToNearestSecond(timerExpiration)
      : getTimeLeftInMilliSeconds(timerExpiration),
  );
  const [timeInterval, setTimeInterval] = useState<number>(
    getTimeLeftInMilliSeconds(timerExpiration) < 60 * 1000 ? 10 : 1000,
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!paused) {
      timerRef.current = setInterval(() => {
        setTime(() => getTimeLeftInMilliSeconds(timerExpiration));
        // If we're above a minute, report the time every second. Otherwise, set the interval for every 10ms
        if (
          getTimeLeftInMilliSeconds(timerExpiration) < 60 * 1000 + 1000 &&
          timeInterval === 1000
        ) {
          setTimeInterval(10);
        }
      }, timeInterval);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [paused, timerExpiration, timeInterval]);

  useEffect(() => {
    const timeLeft = roundUpRenderedTime
      ? getTimeLeftRoundedUpToNearestSecond(timerExpiration)
      : getTimeLeftInMilliSeconds(timerExpiration);
    setTime(timeLeft);
    setTimeInterval(timeLeft < 60 * 1000 ? 10 : 1000);
  }, [timerExpiration, roundUpRenderedTime]);

  return (
    <span
      className={`timer ${paused ? "paused" : ""} ${className}`}
      data-testid="timer"
    >
      <FontAwesomeIcon icon={faHourglass} />{" "}
      <span>{formatMillisecondsToTime(time)}</span>
    </span>
  );
};

export default Timer;
