import { faHourglass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import './Timer.css';

interface TimerProps {
  timerExpiration: number;
  paused: boolean;
  hasStarted: boolean;
  startingTime: number;
  className?: string
}

const getTimeLeftInMilliSeconds = (expiration: number) => {
  return Math.floor((expiration - new Date().getTime())) + 1;
}

const formatMillisecondsToTime = (milliseconds: number) => {
  if (milliseconds < 0) {
    return '0:00';
  }
  // Report seconds in 32.142 format
  if (milliseconds < (60 * 1000)) {
    return `${Math.floor(milliseconds / 1000)}.${Math.floor((milliseconds % 1000) / 10) < 10 ? '0' : ''}${Math.floor((milliseconds % 1000) / 10)}`;
  }
  // Report minutes in 1:32 format
  return `${Math.floor(milliseconds / (60 * 1000))}:${milliseconds % (60 * 1000) < 1000 ? '0' : ''}${Math.floor((milliseconds % (60 * 1000)) / 1000)}`;
}

const Timer = ({ timerExpiration, paused, hasStarted, startingTime, className = '' }: TimerProps) => {
  const [time, setTime] = useState<number>(
    hasStarted ?
      getTimeLeftInMilliSeconds(timerExpiration) :
      startingTime
  );
  const [timeInterval, setTimeInterval] = useState<number>(getTimeLeftInMilliSeconds(timerExpiration) < (60 * 100) ? 10 : 1000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!paused) {
      timerRef.current = setInterval(() => {
        setTime(() => getTimeLeftInMilliSeconds(timerExpiration));
      }, timeInterval);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  }, [paused, timerExpiration, timeInterval]);

  useEffect(() => {
    const timeLeft = hasStarted ?
      getTimeLeftInMilliSeconds(timerExpiration) :
      startingTime;
    setTime(timeLeft);
    setTimeInterval(timeLeft < 60 * 1000 ? 10 : 1000);
  }, [timerExpiration]);

  return (
    <span className={`timer ${className}`}>
      <FontAwesomeIcon icon={faHourglass} /> <span>{formatMillisecondsToTime(time)}</span>
    </span>
  );
};

export default Timer;