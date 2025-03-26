import { useReducer, createContext, useContext, ReactElement, type Dispatch } from "react";

interface GameState {
  matchStarted: boolean
}

interface GameStateType {
  gameState: GameState;
  dispatch: Dispatch<GameStateAction>;
}

type GameStateAction = 
  { type: 'START_MATCH'; };

export const GameStateContext = createContext<GameStateType | null>(null);

export const gameStateReducer = (gameState: GameState, action: GameStateAction): GameState => {
  switch (action.type) {
    case 'START_MATCH':
      return { ...gameState, matchStarted: true };
    default:
      return gameState;
  }
}

const GameStateProvider = ({ children }: { children: ReactElement }) => {
  const [gameState, dispatch] = useReducer(gameStateReducer, {
    matchStarted: false
  });

  return (

    <GameStateContext.Provider value={{ gameState, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
}

export const useGameState = () => {
  return useContext(GameStateContext) as GameStateType;
}

export default GameStateProvider;