import { faHourglass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import './Timer.css';

const getTimeLeftInSeconds = (expiration: number) => {
  return Math.floor((expiration - new Date().getTime())/1000) + 1;
}

const formatSecondsToMinutes = (seconds: number) => {
  if (seconds < 0) {
    return '0:00';
  }
  return `${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' : ''}${seconds % 60}`;
}

const Timer = ({ timerExpiration, paused, className = '' }: { timerExpiration: number; paused: boolean; className?: string }) => {
  const [time, setTime] = useState<number>(getTimeLeftInSeconds(timerExpiration));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!paused) {
      timerRef.current = setInterval(() => {
        setTime(() => getTimeLeftInSeconds(timerExpiration));
      }, 1000);
    }
  }, [paused, timerExpiration]);

  useEffect(() => {
    setTime(getTimeLeftInSeconds(timerExpiration));
  }, [timerExpiration]);

  return (
    <span className={`timer ${className}`}>
      <FontAwesomeIcon icon={faHourglass} /> <span>{formatSecondsToMinutes(time)}</span>
    </span>
  );
};

export default Timer;