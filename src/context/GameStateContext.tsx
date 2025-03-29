import { Color } from "chess.js";
import { useReducer, createContext, useContext, ReactElement, type Dispatch } from "react";
import { PRNGSeed } from '@pkmn/sim';

interface GameSettings {
  seed: PRNGSeed;
  player1Name: string;
  player2Name: string;
  color: Color;
}

interface GameState {
  matchStarted: boolean;
  isHost: boolean;
  gameSettings?: GameSettings;
}

interface GameStateType {
  gameState: GameState;
  dispatch: Dispatch<GameStateAction>;
}

type GameStateAction = 
  { type: 'RESET_ROOM'; }
  | { type: 'CREATE_ROOM'; }
  | { type: 'RETURN_TO_ROOM'; }
  | { type: 'START_MATCH'; payload: GameSettings };


const initialGameState = {
  matchStarted: false,
  isHost: false,
  gameSettings: undefined,
};

export const GameStateContext = createContext<GameStateType | null>(null);

export const gameStateReducer = (gameState: GameState, action: GameStateAction): GameState => {
  switch (action.type) {
    case 'RESET_ROOM':
      return initialGameState;
    case 'CREATE_ROOM':
      return { ...gameState, isHost: true };
    case 'START_MATCH':
      return { ...gameState, matchStarted: true, gameSettings: action.payload };
    case 'RETURN_TO_ROOM':
      return { ...gameState, matchStarted: false };
    default:
      return gameState;
  }
}

const GameStateProvider = ({ children }: { children: ReactElement }) => {
  const [gameState, dispatch] = useReducer(gameStateReducer, initialGameState);

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