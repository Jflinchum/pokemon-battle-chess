import { Color } from "chess.js";
import { useReducer, createContext, useContext, ReactElement, type Dispatch } from "react";
import { PRNGSeed } from '@pkmn/sim';
import { getGameOptions } from "../utils.ts";
import { Player } from "../components/Room/Room/Room";
import { BoostsTable } from "@pkmn/data";

export interface GameOptions {
  format: FormatID;
  offenseAdvantage: BoostsTable;
}

export type FormatID = 'random' | 'draft';

interface GameSettings {
  seed?: PRNGSeed;
  color?: Color;
  options: GameOptions;
}

interface GameState {
  matchStarted: boolean;
  isHost: boolean;
  players: Player[];
  gameSettings: GameSettings;
}

interface GameStateType {
  gameState: GameState;
  dispatch: Dispatch<GameStateAction>;
}

type GameStateAction = 
  { type: 'RESET_ROOM'; }
  | { type: 'CREATE_ROOM'; }
  | { type: 'SET_HOST'; payload: boolean }
  | { type: 'SET_PLAYERS'; payload: Player[]; }
  | { type: 'RETURN_TO_ROOM'; }
  | { type: 'START_MATCH'; payload: GameSettings; };

export const GameStateContext = createContext<GameStateType | null>(null);

const getInitialGameState = (): GameState => (
  {
    matchStarted: false,
    isHost: false,
    players: [],
    gameSettings: {
      options: getGameOptions()
    },
  }
);

export const gameStateReducer = (gameState: GameState, action: GameStateAction): GameState => {
  switch (action.type) {
    case 'RESET_ROOM':
      return getInitialGameState();
    case 'CREATE_ROOM':
      return { ...gameState, isHost: true };
    case 'SET_PLAYERS':
      return { ...gameState, players: action.payload };
    case 'SET_HOST': 
      return { ...gameState, isHost: action.payload };
    case 'START_MATCH':
      return { ...gameState, matchStarted: true, gameSettings: { ...gameState.gameSettings, seed: action.payload.seed, color: action.payload.color, options: action.payload.options } };
    case 'RETURN_TO_ROOM':
      return { ...gameState, matchStarted: false };
    default:
      return gameState;
  }
}

const GameStateProvider = ({ children }: { children: ReactElement }) => {
  const [gameState, dispatch] = useReducer(gameStateReducer, getInitialGameState());

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