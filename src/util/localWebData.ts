import { GameOptions } from "../../shared/types/GameOptions";
import { VolumePreference } from "../context/UserState/UserStateContext";

export const getOrInitializeUUID = () => {
  const localStorageUUID = localStorage.getItem("uuid");

  if (localStorageUUID) {
    return localStorageUUID;
  }

  const newUUID = crypto.randomUUID();
  localStorage.setItem("uuid", newUUID);

  return newUUID;
};

export const getOrInitializeSecretUUID = () => {
  const localStorageUUID = localStorage.getItem("secretUUID");

  if (localStorageUUID) {
    return localStorageUUID;
  }

  const newUUID = crypto.randomUUID();
  localStorage.setItem("secretUUID", newUUID);

  return newUUID;
};

export const getName = () => {
  return localStorage.getItem("name") || "";
};

export const setName = (name: string) => {
  localStorage.setItem("name", name);
};

export const getAvatar = () => {
  return localStorage.getItem("avatarId") || "1";
};

export const setAvatar = (avatarId: string) => {
  localStorage.setItem("avatarId", avatarId);
};

export const getDefaultGameOptions = (): GameOptions => {
  return {
    format: "random",
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
    banTimerDuration: 30,
    chessTimerDuration: 15,
    pokemonTimerIncrement: 1,
    chessTimerIncrement: 5,
  };
};

export const getGameOptions = () => {
  const defaultGameOptions = getDefaultGameOptions();
  const localStorageGameOptions = localStorage.getItem(
    "localStorageGameOptions",
  );
  return localStorageGameOptions
    ? JSON.parse(localStorageGameOptions)
    : defaultGameOptions;
};

export const setGameOptions = (gameOptions: GameOptions) => {
  localStorage.setItem("localStorageGameOptions", JSON.stringify(gameOptions));
};

export const getAnimationSpeedPreference = () => {
  return parseInt(localStorage.getItem("animationSpeedPreference") || "1000");
};

export const setAnimationSpeedPreference = (
  animationSpeedPreference: number,
) => {
  localStorage.setItem(
    "animationSpeedPreference",
    `${animationSpeedPreference}`,
  );
};

export const getVolumePreference = () => {
  const defaultVolumePreferences: VolumePreference = {
    pieceVolume: 0.5,
    musicVolume: 0.3,
  };
  const volumePreference = localStorage.getItem("volumePreference");
  return (
    volumePreference ? JSON.parse(volumePreference) : defaultVolumePreferences
  ) as VolumePreference;
};

export const setVolumePreference = (volumePreference: VolumePreference) => {
  localStorage.setItem("volumePreference", JSON.stringify(volumePreference));
};

export const get2DSpritePreference = () => {
  const default2DSpritePreference = false;
  const spritePreference = localStorage.getItem("spritePreference");
  return spritePreference
    ? spritePreference === "true"
    : default2DSpritePreference;
};

export const set2DSpritePreference = (spritePreference: boolean) => {
  localStorage.setItem("spritePreference", `${spritePreference}`);
};

export const getMostRecentRoom = ():
  | { roomId: string; roomCode: string }
  | undefined => {
  const mostRecentRoom = localStorage.getItem("mostRecentRoom");
  if (!mostRecentRoom) {
    return;
  }
  try {
    const parsedJson = JSON.parse(mostRecentRoom);
    const roomId = parsedJson.roomId;

    if (!roomId) {
      return;
    }

    const roomCode = parsedJson.roomCode || "";
    return {
      roomId,
      roomCode,
    };
  } catch (err: unknown) {
    console.log(
      "Unable to parse most recent room from local storage. Clearing it out.",
    );
    console.log(err);
    clearMostRecentRoom();
  }
};

export const setMostRecentRoom = ({
  roomId,
  roomCode,
}: {
  roomId: string;
  roomCode: string;
}) => {
  localStorage.setItem("mostRecentRoom", JSON.stringify({ roomId, roomCode }));
};

export const clearMostRecentRoom = () => {
  localStorage.removeItem("mostRecentRoom");
};
