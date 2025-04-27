import { Color } from "chess.js";
import { useReducer, createContext, useContext, ReactElement, type Dispatch } from "react";
import { PRNGSeed } from '@pkmn/sim';
import { getGameOptions } from "../utils.ts";
import { Player } from "../components/RoomManager/Room/Room.tsx";
import { GameOptions } from '../../shared/types/GameOptions';
import { ReplayData } from "../components/BattleChessGame/BattleChessManager/GameManagerActions/downloadReplay.ts";
import { MatchHistory } from "../../shared/types/game.ts";

export type FormatID = 'random' | 'draft';

interface GameSettings {
  whitePlayer?: Player;
  blackPlayer?: Player;
  seed?: PRNGSeed;
  color?: Color;
  options: GameOptions;
}

export interface GameState {
  inGame: boolean;
  matchEnded: boolean;
  isSkippingAhead: boolean;
  isCatchingUp: boolean;
  isHost: boolean;
  isWatchingReplay: boolean;
  replayHistory: MatchHistory;
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
  | { type: 'SET_SKIPPING_AHEAD'; payload: boolean }
  | { type: 'SET_CATCHING_UP'; payload: boolean }
  | { type: 'SET_PLAYERS'; payload: Player[]; }
  | { type: 'RETURN_TO_ROOM'; }
  | { type: 'END_MATCH'; }
  | { type: 'START_REPLAY'; payload: ReplayData; }
  | { type: 'START_MATCH'; payload: GameSettings; };

export const GameStateContext = createContext<GameStateType | null>(null);

const getInitialGameState = (): GameState => (
  {
    inGame: false,
    matchEnded: false,
    isHost: false,
    isSkippingAhead: false,
    isCatchingUp: false,
    isWatchingReplay: false,
    replayHistory: [],
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
      return { ...gameState, isHost: true, matchEnded: false };
    case 'SET_PLAYERS':
      return { ...gameState, players: action.payload };
    case 'SET_HOST': 
      return { ...gameState, isHost: action.payload };
    case 'SET_SKIPPING_AHEAD':
      return { ...gameState, isSkippingAhead: action.payload };
    case 'SET_CATCHING_UP':
      return { ...gameState, isCatchingUp: action.payload };
    case 'END_MATCH':
      return { ...gameState, matchEnded: true };
    case 'START_REPLAY':
      return {
        ...gameState,
        isWatchingReplay: true,
        players: action.payload.players,
        replayHistory: action.payload.matchHistory,
        gameSettings: {
          ...gameState.gameSettings,
          seed: action.payload.seed,
          color: 'w',
          options: action.payload.options
        }
      };
    case 'START_MATCH':
      return {
        ...gameState,
        inGame: true,
        matchEnded: false,
        gameSettings: {
          ...gameState.gameSettings,
          whitePlayer: gameState.players.find((player) => player.color == 'w'),
          blackPlayer: gameState.players.find((player) => player.color == 'b'),
          seed: action.payload.seed,
          color: action.payload.color,
          options: action.payload.options
        }
      };
    case 'RETURN_TO_ROOM':
      return { ...gameState, inGame: false, replayHistory: [], isWatchingReplay: false, players: [] };
    default:
      return gameState;
  }
}

const GameStateProvider = ({ children }: { children: ReactElement }) => {
  const [gameState, dispatch] = useReducer(gameStateReducer, getInitialGameState());

  return (
    <GameStateContext value={{ gameState, dispatch }}>
      {children}
    </GameStateContext>
  );
}

export const useGameState = () => {
  return useContext(GameStateContext) as GameStateType;
}

export default GameStateProvider;