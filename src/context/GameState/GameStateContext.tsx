import { createContext, useContext, type Dispatch } from "react";
import { MatchHistory } from "../../../shared/types/Game.js";
import { GameSettings } from "../../../shared/types/GameOptions.ts";
import { Player } from "../../../shared/types/Player.ts";
import { ReplayData } from "../../util/downloadReplay.ts";
import {
  getDefaultGameOptions,
  getGameOptions,
} from "../../util/localWebData.ts";
import {
  cpuDifficultyLevels,
  getCpuPlayerData,
  getOfflinePlayerData,
} from "../../util/offlineUtil.ts";

export type FormatID = "random" | "draft";

export interface GameState {
  inGame: boolean;
  matchEnded: boolean;
  isSkippingAhead: boolean;
  isCatchingUp: boolean;
  isHost: boolean;
  isSpectator: boolean;
  isWatchingReplay: boolean;
  replayHistory: MatchHistory;
  matchHistory: MatchHistory;
  players: Player[];
  gameSettings: GameSettings;
  cpuDifficulty: (typeof cpuDifficultyLevels)[number];
}

export interface GameStateType {
  gameState: GameState;
  dispatch: Dispatch<GameStateAction>;
}

type GameStateAction =
  | { type: "RESET_ROOM" }
  | {
      type: "CREATE_ROOM";
      payload?: {
        offline: boolean;
        playerName: string;
        playerId: string;
        avatarId: string;
      };
    }
  | { type: "SET_SKIPPING_AHEAD"; payload: boolean }
  | { type: "SET_CATCHING_UP"; payload: boolean }
  | { type: "SET_MATCH_HISTORY"; payload: MatchHistory }
  | {
      type: "SET_PLAYERS";
      payload: { players: Player[]; isSpectator: boolean; isHost: boolean };
    }
  | { type: "RETURN_TO_ROOM" }
  | { type: "END_MATCH" }
  | { type: "START_REPLAY"; payload: ReplayData }
  | { type: "START_DEMO" }
  | {
      type: "SET_CPU_DIFFICULTY";
      payload: (typeof cpuDifficultyLevels)[number];
    }
  | { type: "TOGGLE_SPECTATE_CPU" }
  | {
      type: "START_MATCH";
      payload: { settings: GameSettings; isSkippingAhead: boolean };
    };

export const GameStateContext = createContext<GameStateType | null>(null);

export const getInitialGameState = (
  persistantGameState: Partial<GameState>,
): GameState => ({
  inGame: false,
  matchEnded: false,
  isHost: false,
  isSpectator: false,
  isSkippingAhead: false,
  isCatchingUp: false,
  isWatchingReplay: false,
  replayHistory: [],
  cpuDifficulty: "Easy",
  players: [],
  gameSettings: {
    options: getGameOptions(),
  },
  matchHistory: [],
  ...persistantGameState,
});

const initalizeOfflinePlayers = ({
  playerName,
  playerId,
  avatarId,
  isSpectating,
  cpuDifficulty,
}: {
  playerName: string;
  playerId: string;
  avatarId: string;
  isSpectating: boolean;
  cpuDifficulty: (typeof cpuDifficultyLevels)[number];
}) => {
  const playerData = getOfflinePlayerData({ playerName, playerId, avatarId });
  const offlinePlayerList: Player[] = [];
  if (isSpectating) {
    playerData.isSpectator = true;
    playerData.isPlayer1 = false;
  }
  offlinePlayerList.push(playerData);

  offlinePlayerList.push(getCpuPlayerData({ playerSide: "p2", cpuDifficulty }));

  if (isSpectating) {
    offlinePlayerList.push(
      getCpuPlayerData({ playerSide: "p1", cpuDifficulty }),
    );
  }

  return offlinePlayerList;
};

export const gameStateReducer = (
  gameState: GameState,
  action: GameStateAction,
): GameState => {
  switch (action.type) {
    case "RESET_ROOM":
      return getInitialGameState({ cpuDifficulty: gameState.cpuDifficulty });
    case "CREATE_ROOM":
      if (action.payload?.offline) {
        return {
          ...gameState,
          players: initalizeOfflinePlayers({
            ...action.payload,
            isSpectating: false,
            cpuDifficulty: gameState.cpuDifficulty,
          }),
          isHost: true,
          matchEnded: false,
        };
      }
      return { ...gameState, isHost: true, matchEnded: false };
    case "SET_PLAYERS":
      return {
        ...gameState,
        players: action.payload.players,
        isSpectator: action.payload.isSpectator,
        isHost: action.payload.isHost,
      };
    case "SET_CPU_DIFFICULTY": {
      const currentPlayer = gameState.players.find(
        (player) => !player.playerId.includes("offline"),
      )!;
      return {
        ...gameState,
        players: initalizeOfflinePlayers({
          ...currentPlayer,
          isSpectating: currentPlayer.isSpectator,
          cpuDifficulty: action.payload,
        }),
        cpuDifficulty: action.payload,
      };
    }
    case "SET_SKIPPING_AHEAD":
      return { ...gameState, isSkippingAhead: action.payload };
    case "SET_CATCHING_UP":
      return { ...gameState, isCatchingUp: action.payload };
    case "SET_MATCH_HISTORY":
      return { ...gameState, matchHistory: action.payload };
    case "END_MATCH":
      return { ...gameState, matchEnded: true };
    case "START_REPLAY":
      return {
        ...gameState,
        isWatchingReplay: true,
        players: action.payload.players,
        replayHistory: action.payload.matchHistory,
        gameSettings: {
          ...gameState.gameSettings,
          whitePlayer: action.payload.whitePlayer,
          blackPlayer: action.payload.blackPlayer,
          seed: action.payload.seed,
          color: "w",
          options: action.payload.options,
        },
      };
    case "START_DEMO":
      return {
        ...gameState,
        matchEnded: false,
        gameSettings: {
          ...gameState.gameSettings,
          options: {
            ...getDefaultGameOptions(),
          },
          seed: "1234,tutorial",
          color: "w",
        },
      };
    case "START_MATCH":
      return {
        ...gameState,
        inGame: true,
        matchEnded: false,
        isSkippingAhead: action.payload.isSkippingAhead,
        gameSettings: {
          ...gameState.gameSettings,
          ...action.payload.settings,
        },
      };
    case "RETURN_TO_ROOM":
      return {
        ...gameState,
        inGame: false,
        replayHistory: [],
        matchHistory: [],
        isWatchingReplay: false,
      };
    case "TOGGLE_SPECTATE_CPU": {
      const currentPlayer = gameState.players.find(
        (player) => !player.playerId.includes("offline"),
      )!;

      const playerList = initalizeOfflinePlayers({
        ...currentPlayer,
        isSpectating: !currentPlayer.isSpectator,
        cpuDifficulty: gameState.cpuDifficulty,
      });

      return {
        ...gameState,
        players: playerList,
        isSpectator: !currentPlayer.isSpectator,
      };
    }
    default:
      return gameState;
  }
};

export const useGameState = () => {
  return useContext(GameStateContext) as GameStateType;
};
