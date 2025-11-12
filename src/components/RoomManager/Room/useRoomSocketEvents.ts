import { useEffect } from "react";
import { GameOptions } from "../../../../shared/types/GameOptions";
import { useGameState } from "../../../context/GameState/GameStateContext";
import { socket } from "../../../socket";
import { usePlayAgainstComputerUtil } from "../usePlayAgainstComputerUtil";

export const useRoomSocketEvents = (
  setGameOptions: (options: GameOptions) => void,
) => {
  const { gameState } = useGameState();
  const { isUserInOfflineMode } = usePlayAgainstComputerUtil();

  useEffect(() => {
    if (isUserInOfflineMode()) {
      return;
    }

    socket.on("changeGameOptions", (options: GameOptions) => {
      if (!gameState.isHost) {
        setGameOptions(options);
      }
    });

    return () => {
      socket.off("changeGameOptions");
    };
  }, [gameState.isHost, setGameOptions, isUserInOfflineMode]);
};
