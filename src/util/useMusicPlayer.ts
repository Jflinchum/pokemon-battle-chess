import { useCallback, useEffect } from "react";
import { useAudio } from "../context/AudioState/AudioContext";
import { useUserState } from "../context/UserState/UserStateContext";
import { getRandomBattleMusic, getRandomOutOfBattleMusic } from "./getMusic";

export const useMusicPlayer = () => {
  const { global, battle } = useAudio();
  const { userState } = useUserState();

  useEffect(() => {
    global.volume = userState.volumePreference.musicVolume;
    battle.volume = userState.volumePreference.musicVolume;
  }, [userState.volumePreference.musicVolume, battle, global]);

  const playGlobalSong = useCallback(() => {
    battle.pause();
    global.play();
  }, [battle, global]);

  const playBattleSong = useCallback(() => {
    global.pause();
    battle.play();
  }, [battle, global]);

  const playRandomGlobalSong = useCallback(
    ({ force = false, loop = true } = {}) => {
      if (global.paused || force) {
        global.src = getRandomOutOfBattleMusic();
        global.loop = loop;
        playGlobalSong();
      }
    },
    [global, playGlobalSong],
  );

  const playRandomBattleSong = useCallback(
    ({ force = false, loop = true } = {}) => {
      if (battle.paused || force) {
        battle.src = getRandomBattleMusic();
        battle.loop = loop;
        playBattleSong();
      }
    },
    [battle, playBattleSong],
  );

  const stopSongs = () => {
    global.pause();
    battle.pause();
  };

  return {
    playRandomGlobalSong,
    playRandomBattleSong,
    stopSongs,
  };
};
