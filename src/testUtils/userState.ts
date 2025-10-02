import { vi } from "vitest";
import {
  UserState,
  UserStateType,
} from "../context/UserState/UserStateContext";

export const getMockUserState = (
  overrides: Partial<UserState> = {},
): UserState => ({
  name: "Test Name",
  avatarId: "1",
  id: "1234",
  secretId: "secret-id",
  animationSpeedPreference: 1,
  volumePreference: {
    pieceVolume: 50,
    pokemonBattleVolume: 50,
    musicVolume: 50,
  },
  use2DSprites: false,
  animatedBackgroundEnabled: true,
  currentRoomId: "room-id",
  currentRoomCode: "room-code",
  chatHistory: [],
  ...overrides,
});

export const getMockUserStateContext = (
  userStateOverrides: Partial<UserState> = {},
): UserStateType => {
  const mockDispatch = vi.fn();
  return {
    userState: getMockUserState(userStateOverrides),
    dispatch: mockDispatch,
  };
};
