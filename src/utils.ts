import { RefObject, useRef } from "react";
import { GameOptions } from "./context/GameStateContext";

export const getOrInitializeUUID = () => {
  const localStorageUUID = localStorage.getItem('uuid');

  if (localStorageUUID) {
    return localStorageUUID;
  }

  const newUUID = crypto.randomUUID();
  localStorage.setItem('uuid', newUUID);

  return newUUID;
};

export const getName = () => {
  return localStorage.getItem('name') || '';
}

export const getAvatar = () => {
  return localStorage.getItem('avatarId') || '1';
}

export const getGameOptions = () => {
  const defaultGameOptions: GameOptions = {
    format: 'random',
    offenseAdvantage: {
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 1,
      accuracy: 0,
      evasion: 0,
    },
    timersEnabled: true,
    banTimerDuration: 15,
    chessTimerDuration: 15,
    pokemonTimerIncrement: 1,
    chessTimerIncrement: 5,
  };
  const localStorageGameOptions = localStorage.getItem('defaultGameOptions');
  return localStorageGameOptions ? JSON.parse(localStorageGameOptions ) : defaultGameOptions;
}

export const useDebounce = (cb: Function, delay: number) => {
  let timer: RefObject<NodeJS.Timeout | null> = useRef(null);
  return (...args: any) => {
    if (timer?.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      cb.apply(this, args);
    }, delay);
  };
}

export const wait = async (ms: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      return resolve();
    }, ms)
  });
}

export const timer = (ms: number) => {
  let timerId: NodeJS.Timeout;

  const start = () => new Promise<void>((resolve) => {
    timerId = setTimeout(() => {
      return resolve();
    }, ms)
  });

  const stop = () => {
    if (timerId) {
      clearTimeout(timerId);
    }
  }

  return { start, stop };
}

export function generateDailyNumber(min: number, max: number) {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const random = Math.sin(seed) * 10000;
  const number = Math.floor((random - Math.floor(random)) * (max - min + 1)) + min;
  return number;
}