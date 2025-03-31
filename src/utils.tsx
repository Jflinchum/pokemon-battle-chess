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
  };
  const localStorageGameOptions = localStorage.getItem('defaultGameOptions');
  return localStorageGameOptions ? JSON.parse(localStorageGameOptions ) : defaultGameOptions;
}