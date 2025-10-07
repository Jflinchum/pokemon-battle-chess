import { Room } from "../components/Lobby/RoomList/RoomList";

export const createMockRoom = (overrides: Partial<Room> = {}): Room => {
  return {
    roomId: "1234",
    hostName: "TestName",
    hasPassword: false,
    playerCount: 3,
    isOngoing: false,
    ...overrides,
  };
};
