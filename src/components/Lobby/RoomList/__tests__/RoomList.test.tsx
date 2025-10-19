import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { toast } from "react-toastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as ModalStateContext from "../../../../context/ModalState/ModalStateContext";
import * as UserStateContext from "../../../../context/UserState/UserStateContext";
import * as LobbyService from "../../../../service/lobby";
import { getMockModalStateContext } from "../../../../testUtils/modalState";
import { createMockRoom } from "../../../../testUtils/room";
import { getMockUserStateContext } from "../../../../testUtils/userState";
import RoomList, { RoomListProps } from "../RoomList";

vi.mock("react-toastify");
vi.mock("../../../../service/lobby");

const mockAvailableRooms = [
  createMockRoom({ roomId: "no-password-room-id" }),
  createMockRoom({
    roomId: "password-room-id",
    hostName: "TestName2",
    hasPassword: true,
    isOngoing: true,
    playerCount: 7,
  }),
];

const mockUserState = {
  id: "user1",
  name: "TestUser",
  avatarId: "1",
  secretId: "secret1",
};

const setup = (props: Partial<RoomListProps> = {}) => {
  const user = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime.bind(vi),
  });
  const availableRooms = mockAvailableRooms;
  const onSearchMock = vi.fn();
  const mockedUserStateContext = getMockUserStateContext({
    name: mockUserState.name,
    id: mockUserState.id,
    avatarId: mockUserState.avatarId,
    secretId: mockUserState.secretId,
  });
  const mockedModalStateContext = getMockModalStateContext();

  vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
    mockedUserStateContext,
  );
  vi.spyOn(ModalStateContext, "useModalState").mockReturnValue(
    mockedModalStateContext,
  );

  const utils = render(
    <RoomList
      availableRooms={availableRooms}
      onSearch={onSearchMock}
      {...props}
    />,
  );

  return {
    user,
    onSearchMock,
    getSearchInput: () => screen.getByTestId("room-list-search-input"),
    getRoomItems: () => screen.queryAllByTestId("room-list-item"),
    mockedUserStateContext,
    mockedModalStateContext,
    ...utils,
  };
};

describe("RoomList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // https://github.com/testing-library/user-event/issues/1115
    vi.stubGlobal("jest", {
      advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render all available rooms", () => {
      const { getRoomItems } = setup();
      expect(getRoomItems()).toHaveLength(mockAvailableRooms.length);
    });

    it("should render room details correctly", () => {
      const { getRoomItems } = setup();
      expect(getRoomItems()[0]).toHaveTextContent("TestName");
      expect(getRoomItems()[0]).toHaveTextContent("3");
      expect(
        getRoomItems()[0].querySelector(
          '[data-testid="room-list-item-lock-icon"]',
        ),
      ).toBeNull();
      expect(
        getRoomItems()[0].querySelector(
          '[data-testid="room-list-item-in-progress-icon"]',
        ),
      ).toBeNull();
      expect(getRoomItems()[1]).toHaveTextContent("TestName2");
      expect(getRoomItems()[1]).toHaveTextContent("7");
      expect(
        getRoomItems()[1].querySelector(
          '[data-testid="room-list-item-lock-icon"]',
        ),
      ).toBeInTheDocument();
      expect(
        getRoomItems()[1].querySelector(
          '[data-testid="room-list-item-in-progress-icon"]',
        ),
      ).toBeInTheDocument();
    });

    it("should render empty list when no rooms are available", () => {
      const { getRoomItems } = setup({ availableRooms: [] });
      expect(getRoomItems()).toHaveLength(0);
    });
  });

  describe("Search", () => {
    it("should call onSearch with debounce when typing in search input", async () => {
      const onSearch = vi.fn();
      const { user, getSearchInput } = setup({ onSearch });

      await user.type(getSearchInput(), "test");

      expect(onSearch).not.toHaveBeenCalledWith("test");
      vi.advanceTimersByTime(1100);
      expect(onSearch).toHaveBeenCalledWith("test");
    });

    it("should update search input value immediately", async () => {
      const { user, getSearchInput } = setup();

      await user.type(getSearchInput(), "test");
      expect(getSearchInput()).toHaveValue("test");
    });
  });

  describe("Room Joining", () => {
    it("should open password modal when trying to join password-protected room", async () => {
      const { user, mockedModalStateContext, getRoomItems } = setup();
      const passwordProtectedRoom = getRoomItems()[1].querySelector("button");
      await user.click(passwordProtectedRoom!);

      expect(mockedModalStateContext.dispatch).toHaveBeenCalledWith({
        type: "OPEN_ROOM_MODAL",
        payload: { modalProps: { roomId: "password-room-id" } },
      });
    });

    it("should join room directly when room has no password", async () => {
      const mockResponse = new Response(null, { status: 200 });
      vi.mocked(LobbyService.joinRoom).mockResolvedValue(mockResponse);

      const { user, mockedUserStateContext, getRoomItems } = setup();
      const noPasswordRoom = getRoomItems()[0].querySelector("button");
      await user.click(noPasswordRoom!);

      expect(LobbyService.joinRoom).toHaveBeenCalledWith(
        "no-password-room-id",
        "",
        mockUserState.id,
        mockUserState.name,
        mockUserState.avatarId,
        mockUserState.secretId,
      );

      expect(mockedUserStateContext.dispatch).toHaveBeenCalledWith({
        type: "JOIN_ROOM",
        payload: { roomId: "no-password-room-id", roomCode: "" },
      });
    });

    it("should show error toast when joining room fails", async () => {
      const mockResponse = new Response(null, { status: 500 });
      vi.mocked(LobbyService.joinRoom).mockResolvedValue(mockResponse);
      const { user, getRoomItems } = setup();

      const noPasswordRoom = getRoomItems()[0].querySelector("button");
      await user.click(noPasswordRoom!);

      expect(toast).toHaveBeenCalledWith("Error: Failed to join room.", {
        type: "error",
      });
    });
  });
});
