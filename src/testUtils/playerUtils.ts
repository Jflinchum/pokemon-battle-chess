import { Player } from "../../shared/types/Player";

export const getMockPlayer = (partialPlayer: Partial<Player> = {}): Player => {
  return {
    playerName: "Test Name",
    playerId: "1234",
    avatarId: "1",
    transient: false,
    viewingResults: false,
    isHost: false,
    isPlayer1: false,
    isPlayer2: false,
    color: null,
    isSpectator: true,
    ...partialPlayer,
  };
};
