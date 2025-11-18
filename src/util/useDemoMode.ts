import { useMemo } from "react";
import { useGameState } from "../context/GameState/GameStateContext";

export const useDemoMode = () => {
  const { gameState } = useGameState();

  const demoModeEnabled = useMemo(() => {
    return gameState.isDemoMode;
  }, [gameState.isDemoMode]);

  return {
    demoModeEnabled,
  };
};
