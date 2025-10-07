import { beforeEach, describe, expect, it, vi } from "vitest";
import RoomListItem, { RoomListItemProps } from "../RoomListItem";
import { render, screen } from "@testing-library/react";
import { Room } from "../../RoomList";
import userEvent from "@testing-library/user-event";

const createMockRoom = (overrides: Partial<Room> = {}): Room => {
  return {
    roomId: "1234",
    hostName: "TestName",
    hasPassword: false,
    playerCount: 3,
    isOngoing: false,
    ...overrides,
  };
};

const setup = (props: Partial<RoomListItemProps> = {}) => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  const onClickMock = vi.fn();
  const utils = render(
    <RoomListItem room={createMockRoom()} onClick={onClickMock} {...props} />,
  );

  const getRoomListItemButton = () =>
    screen.getByTestId("room-list-item-button");
  const getRoomListItemName = () => screen.getByTestId("room-list-item-name");
  const getRoomListLockIcon = () =>
    screen.queryByTestId("room-list-item-lock-icon");
  const getRoomListLockTooltip = () => screen.queryByText("Requires Passcode");
  const getRoomListInProgressIcon = () =>
    screen.queryByTestId("room-list-item-in-progress-icon");
  const getRoomListInProgressTooltip = () =>
    screen.queryByText("Game In Progress");
  const getRoomListPlayerCount = () =>
    screen.getByTestId("room-list-item-player-count");
  const getRoomListPlayerCountTooltip = () =>
    screen.queryByText("Total Player Count");

  return {
    onClickMock,
    getRoomListItemButton,
    getRoomListItemName,
    getRoomListLockIcon,
    getRoomListLockTooltip,
    getRoomListInProgressIcon,
    getRoomListInProgressTooltip,
    getRoomListPlayerCount,
    getRoomListPlayerCountTooltip,
    ...utils,
  };
};

describe("RoomListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe("Rendering", () => {
    it("should render a button containing the room name and the amount of players", async () => {
      const {
        getRoomListItemButton,
        getRoomListItemName,
        getRoomListPlayerCount,
        getRoomListPlayerCountTooltip,
      } = setup();

      expect(getRoomListItemButton()).toBeInTheDocument();
      expect(getRoomListItemName()).toHaveTextContent("TestName");
      expect(getRoomListPlayerCount()).toHaveTextContent("3");

      expect(getRoomListPlayerCountTooltip()).not.toBeInTheDocument();
      await userEvent.hover(getRoomListPlayerCount());
      expect(getRoomListPlayerCountTooltip()).toBeInTheDocument();
    });

    it("should render a lock icon if the room has a passcode", async () => {
      const { getRoomListLockIcon, getRoomListLockTooltip } = setup({
        room: createMockRoom({ hasPassword: true }),
      });

      expect(getRoomListLockIcon()).toBeInTheDocument();
      expect(getRoomListLockTooltip()).not.toBeInTheDocument();
      await userEvent.hover(getRoomListLockIcon()!);
      expect(getRoomListLockTooltip()).toBeInTheDocument();
    });
    it("should not render a lock icon if the room does not have a passcode", () => {
      const { getRoomListLockIcon, getRoomListLockTooltip } = setup({
        room: createMockRoom({ hasPassword: false }),
      });

      expect(getRoomListLockIcon()).not.toBeInTheDocument();
      expect(getRoomListLockTooltip()).not.toBeInTheDocument();
    });
    it("should render an in progress icon if the room has a game in progress", async () => {
      const { getRoomListInProgressIcon, getRoomListInProgressTooltip } = setup(
        {
          room: createMockRoom({ isOngoing: true }),
        },
      );

      expect(getRoomListInProgressIcon()).toBeInTheDocument();
      expect(getRoomListInProgressTooltip()).not.toBeInTheDocument();
      await userEvent.hover(getRoomListInProgressIcon()!);
      expect(getRoomListInProgressTooltip()).toBeInTheDocument();
    });
    it("should not render an in progress icon if the room does not have a game in progress", () => {
      const { getRoomListInProgressIcon, getRoomListInProgressTooltip } = setup(
        {
          room: createMockRoom({ isOngoing: false }),
        },
      );

      expect(getRoomListInProgressIcon()).not.toBeInTheDocument();
      expect(getRoomListInProgressTooltip()).not.toBeInTheDocument();
    });
  });

  describe("Event Handling", () => {
    it("should trigger onClick when the room item button is clicked", async () => {
      const { getRoomListItemButton, onClickMock } = setup();

      expect(onClickMock).not.toHaveBeenCalled();
      await userEvent.click(getRoomListItemButton());
      expect(onClickMock).toHaveBeenCalledOnce();
    });
  });
});
