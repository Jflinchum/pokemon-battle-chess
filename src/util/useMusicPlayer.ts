import { useEffect } from "react";
import { useAudio } from "../context/AudioContext"
import { useUserState } from "../context/UserStateContext";
import { getRandomBattleMusic, getRandomOutOfBattleMusic } from "./getMusic";

export const useMusicPlayer = () => {
  const { global, battle } = useAudio();
  const { userState } = useUserState();

  useEffect(() => {
    global.volume = userState.volumePreference.musicVolume;
    battle.volume = userState.volumePreference.musicVolume; 
  }, [userState.volumePreference.musicVolume]);


  const playGlobalSong = () => {
    battle.pause();
    global.play();
  };

  const playBattleSong = () => {
    global.pause();
    battle.play();
  };

  const playRandomGlobalSong = ({ force = false, loop = true } = {}) => {
    if (global.paused || force) {
      global.src = getRandomOutOfBattleMusic();
      global.loop = loop;
      playGlobalSong();
    }
  }

  const playRandomBattleSong = ({ force = false, loop = true } = {}) => {
    if (battle.paused || force) {
      battle.src = getRandomBattleMusic();
      battle.loop = loop;
      playBattleSong();
    }
  }

  const stopSongs = () => {
    global.pause();
    battle.pause();
  };

  return {
    playRandomGlobalSong,
    playRandomBattleSong,
    stopSongs,
  }
}
