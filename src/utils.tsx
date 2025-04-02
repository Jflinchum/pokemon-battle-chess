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
    }
  };
  const localStorageGameOptions = localStorage.getItem('defaultGameOptions');
  return localStorageGameOptions ? JSON.parse(localStorageGameOptions ) : defaultGameOptions;
}