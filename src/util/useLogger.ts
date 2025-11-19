import { useMemo } from "react";
import { useGameState } from "../context/GameState/GameStateContext";
import { useUserState } from "../context/UserState/UserStateContext";
import { logToService } from "../service/lobby";

export const useLogger = () => {
  const { gameState } = useGameState();
  const { userState } = useUserState();

  const additionalLogInfo = useMemo(() => {
    return {
      playerId: userState.id,
      playerName: userState.name,
      avatarId: userState.avatarId,
      roomId: userState.currentRoomId,
      inGame: gameState.inGame,
      isWatchingReplay: gameState.isWatchingReplay,
      gameSeed: gameState.gameSettings.seed as string,
    };
  }, [
    userState.id,
    userState.name,
    userState.avatarId,
    userState.currentRoomId,
    gameState.inGame,
    gameState.isWatchingReplay,
    gameState.gameSettings.seed,
  ]);

  const logger = useMemo(() => {
    const info = (
      logName: string,
      logPayload?: { [key: string]: string | boolean | undefined },
    ) => {
      console.log({
        message: logName,
        ...logPayload,
      });
      logToService(logName, {
        ...additionalLogInfo,
        ...logPayload,
        level: "info",
      });
    };
    const warn = (
      logName: string,
      logPayload?: { [key: string]: string | boolean | undefined },
    ) => {
      console.warn({
        message: logName,
        ...logPayload,
      });
      logToService(logName, {
        ...additionalLogInfo,
        ...logPayload,
        level: "warn",
      });
    };

    const error = (
      logName: string,
      logPayload?: { [key: string]: string | boolean | undefined },
    ) => {
      console.error({
        message: logName,
        ...logPayload,
      });
      logToService(logName, {
        ...additionalLogInfo,
        ...logPayload,
        level: "error",
      });
    };

    return {
      info,
      warn,
      error,
    };
  }, [additionalLogInfo]);

  return {
    logger,
  };
};
