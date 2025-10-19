import { ReactElement, useReducer } from "react";
import {
  GameStateContext,
  gameStateReducer,
  getInitialGameState,
} from "./GameStateContext";

const GameStateProvider = ({ children }: { children: ReactElement }) => {
  const [gameState, dispatch] = useReducer(
    gameStateReducer,
    getInitialGameState(),
  );

  return (
    <GameStateContext value={{ gameState, dispatch }}>
      {children}
    </GameStateContext>
  );
};

export default GameStateProvider;
