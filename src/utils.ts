import { RefObject, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useDebounce = (cb: (arg: any) => void, delay: number) => {
  const timer: RefObject<NodeJS.Timeout | null> = useRef(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any) => {
    if (timer?.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      cb.apply(this, args);
    }, delay);
  };
};

export const wait = async (ms: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      return resolve();
    }, ms);
  });
};

export const timer = (ms: number) => {
  let timerId: NodeJS.Timeout;

  const start = () =>
    new Promise<void>((resolve) => {
      timerId = setTimeout(() => {
        return resolve();
      }, ms);
    });

  const stop = () => {
    if (timerId) {
      clearTimeout(timerId);
    }
  };

  return { start, stop };
};

export function generateDailyNumber(min: number, max: number) {
  const now = new Date();
  const seed =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const random = Math.sin(seed) * 10000;
  const number =
    Math.floor((random - Math.floor(random)) * (max - min + 1)) + min;
  return number;
}

/**
 * Remove an element from an unsorted array significantly faster
 * than .splice
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fastPop = (list: any[], index: number) => {
  const length = list.length;
  if (index < 0 || index >= list.length) {
    throw new Error(`Index ${index} out of bounds for given array`);
  }

  const element = list[index];
  list[index] = list[length - 1];
  list.pop();
  return element;
};
