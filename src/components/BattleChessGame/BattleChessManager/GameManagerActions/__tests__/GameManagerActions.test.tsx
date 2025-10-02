import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "react-toastify";
import GameManagerActions from "../GameManagerActions";
import * as GameStateContext from "../../../../../context/GameState/GameStateContext";
import * as UserStateContext from "../../../../../context/UserState/UserStateContext";
import * as ModalStateContext from "../../../../../context/ModalState/ModalStateContext";
import * as SocketRequests from "../../../../../util/useSocketRequests";
import * as DownloadReplay from "../../../../../util/downloadReplay";
import { getMockGameStateContext } from "../../../../../testUtils/gameState";
import { getMockUserStateContext } from "../../../../../testUtils/userState";
import { getMockModalStateContext } from "../../../../../testUtils/modalState";
import { getMockSocketRequests } from "../../../../../testUtils/socket";
import { getMockMatchHistory } from "../../../../../testUtils/matchHistory";
import { getDefaultGameOptions } from "../../../../../util/localWebData";

vi.mock("react-toastify");
vi.mock("../../../../../util/downloadReplay");

const mockRequestSetViewingResults = vi.fn();
const mockRequestReturnEveryoneToRoom = vi.fn();

const setup = (
  gameStateOverrides: Partial<GameStateContext.GameState> = {},
) => {
  const mockedGameStateContext = getMockGameStateContext(gameStateOverrides);
  const mockedUserStateContext = getMockUserStateContext();
  const mockedModalStateContext = getMockModalStateContext();
  const mockedSocketRequests = getMockSocketRequests({
    requestSetViewingResults: mockRequestSetViewingResults,
    requestReturnEveryoneToRoom: mockRequestReturnEveryoneToRoom,
  });

  vi.spyOn(GameStateContext, "useGameState").mockReturnValue(
    mockedGameStateContext,
  );
  vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
    mockedUserStateContext,
  );
  vi.spyOn(ModalStateContext, "useModalState").mockReturnValue(
    mockedModalStateContext,
  );
  vi.spyOn(SocketRequests, "useSocketRequests").mockReturnValue(
    mockedSocketRequests,
  );

  const utils = render(<GameManagerActions />);
  const header = screen.getByTestId("game-manager-game-header");
  const skipButton = screen.queryByTestId("game-manager-skip-ahead-button");
  const menuButton = screen.getByTestId("game-manager-return-to-menu-button");
  const returnEveryoneButton = screen.queryByTestId(
    "game-manager-return-everyone-button",
  );
  const optionsButton = screen.getByTestId("game-manager-options-button");
  const replayButton = screen.queryByTestId(
    "game-manager-download-replay-button",
  );
  const returnToRoomButton = screen.queryByTestId(
    "game-manager-return-to-room-button",
  );
  return {
    header,
    skipButton,
    menuButton,
    returnEveryoneButton,
    optionsButton,
    replayButton,
    returnToRoomButton,
    mockedGameStateContext,
    mockedUserStateContext,
    mockedModalStateContext,
    mockedSocketRequests,
    ...utils,
  };
};

describe("GameManagerActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the header correctly", () => {
    const { header } = setup();
    expect(header).toBeInTheDocument();
    expect(header.textContent).toBe("PokemonGambit");
  });

  describe("Skip Ahead", () => {
    it("should show skip ahead button when catching up", async () => {
      const { skipButton } = setup({
        isCatchingUp: true,
      });
      expect(skipButton).toBeInTheDocument();
    });

    it("should not show skip ahead button when already skipping", () => {
      const { skipButton } = setup({
        isCatchingUp: true,
        isSkippingAhead: true,
      });
      expect(skipButton).not.toBeInTheDocument();
    });

    it("should not show skip ahead button when watching replay", () => {
      const { skipButton } = setup({
        isCatchingUp: true,
        isWatchingReplay: true,
      });
      expect(skipButton).not.toBeInTheDocument();
    });

    it("should dispatch to game state when the user clicks skip ahead", async () => {
      const { skipButton, mockedGameStateContext } = setup({
        isCatchingUp: true,
      });

      await userEvent.click(skipButton!);
      expect(mockedGameStateContext.dispatch).toHaveBeenCalledWith({
        type: "SET_SKIPPING_AHEAD",
        payload: true,
      });
    });
  });

  describe("Return to Room", () => {
    it("should show return to room button when match has ended", async () => {
      const { returnToRoomButton, mockedGameStateContext } = setup({
        matchEnded: true,
        inGame: true,
      });
      expect(returnToRoomButton).toBeInTheDocument();

      await userEvent.click(returnToRoomButton!);
      expect(mockedGameStateContext.dispatch).toHaveBeenCalledWith({
        type: "RETURN_TO_ROOM",
      });
      expect(mockRequestSetViewingResults).toHaveBeenCalledWith(false);
    });

    it("should not show return to room button in quickplay mode", () => {
      const { returnToRoomButton } = setup({
        matchEnded: true,
        inGame: true,
        gameSettings: { isQuickPlay: true, options: getDefaultGameOptions() },
      });
      expect(returnToRoomButton).not.toBeInTheDocument();
    });

    it("should not show return to room button when watching replay", () => {
      const { returnToRoomButton } = setup({
        isWatchingReplay: true,
      });
      expect(returnToRoomButton).not.toBeInTheDocument();
    });

    it("should not show return to room button when not in game", () => {
      const { returnToRoomButton } = setup({
        inGame: false,
      });
      expect(returnToRoomButton).not.toBeInTheDocument();
    });

    it("should dispatch to game state when the user clicks return to room", async () => {
      const { returnToRoomButton, mockedGameStateContext } = setup({
        matchEnded: true,
        inGame: true,
      });

      await userEvent.click(returnToRoomButton!);
      expect(mockedGameStateContext.dispatch).toHaveBeenCalledWith({
        type: "RETURN_TO_ROOM",
      });
    });

    it("should send out socket request to set viewing results to false when the user clicks return to room", async () => {
      const { returnToRoomButton, mockedSocketRequests } = setup({
        matchEnded: true,
        inGame: true,
      });

      await userEvent.click(returnToRoomButton!);
      expect(
        mockedSocketRequests.requestSetViewingResults,
      ).toHaveBeenCalledWith(false);
    });
  });

  describe("Return to Menu", () => {
    it("should always show return to menu button", () => {
      const { menuButton } = setup();
      expect(menuButton).toBeInTheDocument();
    });

    it("should dispatch to context when the user clicks return to menu button", async () => {
      const { menuButton, mockedGameStateContext, mockedUserStateContext } =
        setup();

      await userEvent.click(menuButton);
      expect(mockedUserStateContext.dispatch).toHaveBeenCalledWith({
        type: "LEAVE_ROOM",
      });
      expect(mockedGameStateContext.dispatch).toHaveBeenCalledWith({
        type: "RESET_ROOM",
      });
    });
  });

  describe("Return Everyone to Room", () => {
    it("should show return everyone button for host during game", () => {
      const { returnEveryoneButton } = setup({
        isHost: true,
        matchEnded: false,
        inGame: true,
      });
      expect(returnEveryoneButton).toBeInTheDocument();
    });

    it("should not show return everyone button for host if the match has ended", () => {
      const { returnEveryoneButton } = setup({
        isHost: true,
        matchEnded: true,
        inGame: true,
      });
      expect(returnEveryoneButton).not.toBeInTheDocument();
    });

    it("should not show return everyone button for host if watching a replay", () => {
      const { returnEveryoneButton } = setup({
        isHost: true,
        matchEnded: false,
        inGame: true,
        isWatchingReplay: true,
      });
      expect(returnEveryoneButton).not.toBeInTheDocument();
    });

    it("should send out socket request to return everyone to the room when the user clicks return everyone button", async () => {
      const { returnEveryoneButton } = setup({
        isHost: true,
        matchEnded: false,
        inGame: true,
      });
      expect(returnEveryoneButton).toBeInTheDocument();

      await userEvent.click(returnEveryoneButton!);
      expect(mockRequestReturnEveryoneToRoom).toHaveBeenCalled();
    });

    it("should display toast and handle errors when returning everyone to room", async () => {
      const error = new Error("Network error");
      mockRequestReturnEveryoneToRoom.mockRejectedValueOnce(error);

      const { returnEveryoneButton } = setup({
        isHost: true,
        matchEnded: false,
        inGame: true,
      });

      await userEvent.click(returnEveryoneButton!);
      expect(toast).toHaveBeenCalledWith(`Error: ${error}`, { type: "error" });
    });
  });

  describe("Options", () => {
    it("should always show options button", () => {
      const { optionsButton } = setup();
      expect(optionsButton).toBeInTheDocument();
    });

    it("should open the options modal when the user clicks the options button", async () => {
      const { optionsButton, mockedModalStateContext } = setup();
      expect(optionsButton).toBeInTheDocument();

      await userEvent.click(optionsButton);
      expect(mockedModalStateContext.dispatch).toHaveBeenCalledWith({
        type: "OPEN_OPTIONS_MODAL",
        payload: {},
      });
    });
  });

  describe("Download Replay", () => {
    it("should show download replay button when match history exists", async () => {
      const mockHistory = getMockMatchHistory();
      const { replayButton } = setup({
        matchHistory: mockHistory,
        isWatchingReplay: false,
      });

      expect(replayButton).toBeInTheDocument();

      await userEvent.click(replayButton!);
      expect(DownloadReplay.downloadReplay).toHaveBeenCalledWith(
        expect.objectContaining({
          matchHistory: mockHistory,
        }),
      );
    });

    it("should not show download replay button when watching replay", () => {
      const { replayButton } = setup({
        matchHistory: [],
        isWatchingReplay: true,
      });
      expect(replayButton).not.toBeInTheDocument();
    });
  });
});
