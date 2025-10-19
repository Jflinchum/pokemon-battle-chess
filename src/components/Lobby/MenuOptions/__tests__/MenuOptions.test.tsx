import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { toast } from "react-toastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as GameStateContext from "../../../../context/GameState/GameStateContext";
import * as ModalStateContext from "../../../../context/ModalState/ModalStateContext";
import * as UserStateContext from "../../../../context/UserState/UserStateContext";
import { getMockGameStateContext } from "../../../../testUtils/gameState";
import { getMockReplayData } from "../../../../testUtils/matchHistory";
import { getMockModalStateContext } from "../../../../testUtils/modalState";
import { getMockUserStateContext } from "../../../../testUtils/userState";
import MenuOptions from "../MenuOptions";
import * as ValidateReplay from "../validateReplay";

vi.mock("./../validateReplay");
vi.mock("react-toastify");
vi.mock("@pkmn/img", () => ({
  Sprites: {
    getAvatar: (id: number) => `mock-avatar-${id}`,
    getPokemon: vi.fn().mockReturnValue({ url: "mock-url" }),
  },
}));

const mockUserState = {
  name: "TestUser",
  avatarId: "24",
  id: "user1",
};

const setup = () => {
  const mockedUserStateContext = getMockUserStateContext({
    name: mockUserState.name,
    id: mockUserState.id,
    avatarId: mockUserState.avatarId,
  });
  const mockedModalStateContext = getMockModalStateContext();
  const mockedGameStateContext = getMockGameStateContext();

  vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
    mockedUserStateContext,
  );
  vi.spyOn(ModalStateContext, "useModalState").mockReturnValue(
    mockedModalStateContext,
  );
  vi.spyOn(GameStateContext, "useGameState").mockReturnValue(
    mockedGameStateContext,
  );
  vi.spyOn(ValidateReplay, "validateReplay").mockReturnValue(true);

  const utils = render(<MenuOptions />);

  return {
    getUsername: () => screen.getByTestId("menu-option-username"),
    getAvatar: () => screen.getByTestId("menu-option-avatar"),
    getPokemonOfTheDay: () => screen.getByTestId("menu-option-potd"),
    getQuickPlayButton: () => screen.getByTestId("menu-option-quick-play"),
    getCreateRoomButton: () =>
      screen.getByTestId("menu-option-create-new-room"),
    getCustomizeButton: () => screen.getByTestId("menu-option-customize"),
    getHowToPlayButton: () => screen.getByTestId("menu-option-how-to-play"),
    getWatchReplayButton: () => screen.getByTestId("menu-option-watch-replay"),
    getOptionsButton: () => screen.getByTestId("menu-option-options"),
    getCreditsButton: () => screen.getByTestId("menu-option-credits"),
    getFileInput: () => screen.getByTestId("menu-option-replay-upload-input"),
    mockedUserStateContext,
    mockedModalStateContext,
    mockedGameStateContext,
    ...utils,
  };
};

describe("MenuOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("User Info Display", () => {
    it("should display user info when user has a name", () => {
      const { getUsername, getAvatar } = setup();
      expect(screen.getByText("Name:")).toBeInTheDocument();
      expect(getUsername()).toHaveTextContent("TestUser");
      expect(getAvatar()).toHaveAttribute("src", "mock-avatar-24");
    });

    it("should not display user info when user has no name", () => {
      const mockedUserStateContext = getMockUserStateContext({
        name: "",
        avatarId: "",
      });
      vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
        mockedUserStateContext,
      );
      render(<MenuOptions />);
      expect(screen.queryByText("Name:")).not.toBeInTheDocument();
    });
  });

  describe("Pokemon of the Day", () => {
    it("should render pokemon of the day", () => {
      const { getPokemonOfTheDay } = setup();

      expect(getPokemonOfTheDay()).toBeInTheDocument();
    });
  });

  describe("Menu Buttons", () => {
    it("should open quick play modal when clicking quick play", async () => {
      const { getQuickPlayButton, mockedModalStateContext } = setup();
      await userEvent.click(getQuickPlayButton());
      expect(mockedModalStateContext.dispatch).toHaveBeenCalledWith({
        type: "OPEN_QUICK_MATCH_MODAL",
        payload: {},
      });
    });

    it("should open create room modal when clicking create new room", async () => {
      const { getCreateRoomButton, mockedModalStateContext } = setup();
      await userEvent.click(getCreateRoomButton());
      expect(mockedModalStateContext.dispatch).toHaveBeenCalledWith({
        type: "OPEN_CREATE_ROOM_MODAL",
        payload: {},
      });
    });

    it("should open customize modal when clicking customize", async () => {
      const { getCustomizeButton, mockedModalStateContext } = setup();
      await userEvent.click(getCustomizeButton());
      expect(mockedModalStateContext.dispatch).toHaveBeenCalledWith({
        type: "OPEN_CUSTOMIZE_MODAL",
        payload: {},
      });
    });

    it("should open how to play modal when clicking how to play", async () => {
      const { getHowToPlayButton, mockedModalStateContext } = setup();
      await userEvent.click(getHowToPlayButton());
      expect(mockedModalStateContext.dispatch).toHaveBeenCalledWith({
        type: "OPEN_HOW_TO_PLAY_MODAL",
        payload: {},
      });
    });

    it("should open options modal when clicking options", async () => {
      const { getOptionsButton, mockedModalStateContext } = setup();
      await userEvent.click(getOptionsButton());
      expect(mockedModalStateContext.dispatch).toHaveBeenCalledWith({
        type: "OPEN_OPTIONS_MODAL",
        payload: {},
      });
    });

    it("should open credits modal when clicking credits", async () => {
      const { getCreditsButton, mockedModalStateContext } = setup();
      await userEvent.click(getCreditsButton());
      expect(mockedModalStateContext.dispatch).toHaveBeenCalledWith({
        type: "OPEN_CREDITS_MODAL",
        payload: {},
      });
    });

    it("should trigger file input when clicking watch replay", async () => {
      const { getWatchReplayButton, getFileInput } = setup();
      const fileInput = getFileInput();
      const clickSpy = vi.spyOn(fileInput, "click");

      await userEvent.click(getWatchReplayButton());
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe("Replay Upload", () => {
    it("should handle valid replay file upload", async () => {
      const { getFileInput, mockedGameStateContext } = setup();
      const validReplayData = getMockReplayData();
      const file = new File(
        [JSON.stringify(validReplayData)],
        "replay.replay",
        { type: "application/json" },
      );

      const fileInput = getFileInput();
      await userEvent.upload(fileInput, file);

      expect(mockedGameStateContext.dispatch).toHaveBeenCalledWith({
        type: "START_REPLAY",
        payload: validReplayData,
      });
    });

    it("should show error toast for invalid replay file", async () => {
      const { getFileInput } = setup();
      const invalidReplayData = { invalid: "data" };
      vi.mocked(ValidateReplay.validateReplay).mockReturnValue(false);

      const file = new File(
        [JSON.stringify(invalidReplayData)],
        "invalid.replay",
        { type: "application/json" },
      );

      const fileInput = getFileInput();
      await userEvent.upload(fileInput, file);

      expect(toast).toHaveBeenCalledWith("Error: Replay file invalid", {
        type: "error",
      });
    });

    it("should show error toast for malformed JSON", async () => {
      const { getFileInput } = setup();
      const file = new File(["invalid json content"], "invalid.replay", {
        type: "application/json",
      });

      const fileInput = getFileInput();
      await userEvent.upload(fileInput, file);

      expect(toast).toHaveBeenCalledWith("Error: Unable to read replay file", {
        type: "error",
      });
    });
  });
});
