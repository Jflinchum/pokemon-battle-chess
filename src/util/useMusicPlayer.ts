import { useCallback, useEffect } from "react";
import { useAudio } from "../context/AudioState/AudioContext";
import { useUserState } from "../context/UserState/UserStateContext";
import {
  getRandomBattleMusic,
  getRandomOutOfBattleMusic,
  getSpecialBattleMusic,
} from "./getMusic";

export const useMusicPlayer = () => {
  const { global, battle } = useAudio();
  const { userState } = useUserState();

  useEffect(() => {
    global.volume = userState.volumePreference.musicVolume;
    battle.volume = userState.volumePreference.musicVolume;
  }, [userState.volumePreference.musicVolume, battle, global]);

  const playGlobalSongAndPauseOther = useCallback(() => {
    battle.pause();
    global.play();
  }, [battle, global]);

  const playBattleSongAndPauseOther = useCallback(() => {
    global.pause();
    battle.play();
  }, [battle, global]);

  const playGlobalSong = useCallback(
    ({ force = false, loop = true } = {}) => {
      if (global.paused || force) {
        global.src = getRandomOutOfBattleMusic();
        global.loop = loop;
        playGlobalSongAndPauseOther();
      }
    },
    [global, playGlobalSongAndPauseOther],
  );

  const playBattleSong = useCallback(
    ({
      force = false,
      loop = true,
      p1PokemonIdentifier,
      p2PokemonIdentifier,
      isDramatic,
    }: {
      force?: boolean;
      loop?: boolean;
      p1PokemonIdentifier?: string;
      p2PokemonIdentifier?: string;
      isDramatic?: boolean;
    } = {}) => {
      if (battle.paused || force) {
        if (isDramatic) {
          battle.src = getSpecialBattleMusic(
            p1PokemonIdentifier,
            p2PokemonIdentifier,
          );
        } else {
          battle.src = getRandomBattleMusic();
        }
        battle.loop = loop;
        playBattleSongAndPauseOther();
      }
    },
    [battle, playBattleSongAndPauseOther],
  );

  const stopSongs = () => {
    global.pause();
    battle.pause();
  };

  return {
    playGlobalSong,
    playBattleSong,
    stopSongs,
  };
};
