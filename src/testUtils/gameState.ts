import { vi } from "vitest";
import {
  GameState,
  GameStateType,
} from "../context/GameState/GameStateContext";
import { getDefaultGameOptions } from "../util/localWebData";

export const getMockGameState = (
  overrides: Partial<GameState> = {},
): GameState => ({
  inGame: true,
  matchEnded: false,
  isSkippingAhead: false,
  isCatchingUp: false,
  isHost: true,
  isSpectator: false,
  isWatchingReplay: false,
  replayHistory: [],
  matchHistory: [],
  players: [],
  gameSettings: {
    options: getDefaultGameOptions(),
  },
  cpuDifficulty: "Easy",
  isDemoMode: false,
  ...overrides,
});

export const getMockGameStateContext = (
  gameStateOverrides: Partial<GameState> = {},
): GameStateType => {
  const mockDispatch = vi.fn();
  return {
    gameState: getMockGameState(gameStateOverrides),
    dispatch: mockDispatch,
  };
};
