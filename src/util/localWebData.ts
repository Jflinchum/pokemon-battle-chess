import { GameOptions } from '../../shared/types/GameOptions';
import { VolumePreference } from "../context/UserStateContext";

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
};

export const setName = (name: string) => {
  localStorage.setItem('name', name);
};

export const getAvatar = () => {
  return localStorage.getItem('avatarId') || '1';
};

export const setAvatar = (avatarId: string) => {
  localStorage.setItem('avatarId', avatarId);
};

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
    weatherWars: false,
    timersEnabled: true,
    banTimerDuration: 15,
    chessTimerDuration: 15,
    pokemonTimerIncrement: 1,
    chessTimerIncrement: 5,
  };
  const localStorageGameOptions = localStorage.getItem('localStorageGameOptions');
  return localStorageGameOptions ? JSON.parse(localStorageGameOptions) : defaultGameOptions;
};

export const setGameOptions = (gameOptions: GameOptions) => {
  localStorage.setItem('localStorageGameOptions', JSON.stringify(gameOptions));
};

export const getAnimationSpeedPreference = () => {
  return parseInt(localStorage.getItem('animationSpeedPreference') || '1000');
};

export const setAnimationSpeedPreference = (animationSpeedPreference: number) => {
  localStorage.setItem('animationSpeedPreference', `${animationSpeedPreference}`);
};

export const getVolumePreference = () => {
  const defaultVolumePreferences: VolumePreference = {
    pieceVolume: 0.50,
    musicVolume: 0.50,
  };
  const volumePreference = localStorage.getItem('volumePreference');
  return (volumePreference ? JSON.parse(volumePreference) : defaultVolumePreferences) as VolumePreference;
};

export const setVolumePreference = (volumePreference: VolumePreference) => {
  localStorage.setItem('volumePreference', JSON.stringify(volumePreference));
};

export const get2DSpritePreference = () => {
  const default2DSpritePreference = false;
  const spritePreference = localStorage.getItem('spritePreference');
  return (spritePreference ? spritePreference === 'true' : default2DSpritePreference);
};

export const set2DSpritePreference = (spritePreference: boolean) => {
  localStorage.setItem('spritePreference', `${spritePreference}`);
};