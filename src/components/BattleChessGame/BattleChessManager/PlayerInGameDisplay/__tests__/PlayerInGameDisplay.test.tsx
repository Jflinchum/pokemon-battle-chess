import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as UserStateContext from "../../../../../context/UserState/UserStateContext";
import { createMockPokemonPieces } from "../../../../../testUtils/chess";
import { getMockUserStateContext } from "../../../../../testUtils/userState";
import PlayerInGameDisplay, {
  PlayerInGameDisplayProps,
} from "../PlayerInGameDisplay";

vi.mock("@pkmn/img", () => ({
  Sprites: {
    getAvatar: (id: number) => `mock-avatar-${id}`,
    getPokemon: vi.fn().mockReturnValue({ url: "mock-pokemon-url" }),
  },
}));

const setup = (props: Partial<PlayerInGameDisplayProps> = {}) => {
  vi.spyOn(UserStateContext, "useUserState").mockReturnValue(
    getMockUserStateContext(),
  );

  const mockPlayerName = props.playerName || "TestPlayer";

  const utils = render(
    <PlayerInGameDisplay
      playerAvatarId="24"
      playerName={mockPlayerName}
      takenChessPieces={createMockPokemonPieces()}
      connectionIssues={false}
      {...props}
    />,
  );

  return {
    getAvatar: () => screen.queryByTestId("player-in-game-display-avatar"),
    getPlayerName: () => screen.queryByText(mockPlayerName),
    getConnectionIcon: () =>
      screen.queryByTestId("player-in-game-display-connection-issues-icon"),
    getTimer: () => screen.queryByTestId("timer"),
    getTakenChessPieces: () => screen.queryByTestId("taken-pieces-container"),
    ...utils,
  };
};

describe("PlayerInGameDisplay", () => {
  describe("Rendering", () => {
    it("should render with all props", () => {
      const { getAvatar, getPlayerName } = setup();

      const avatar = getAvatar();
      const playerName = getPlayerName();

      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute("src", "mock-avatar-24");
      expect(playerName).toBeInTheDocument();
    });

    it("should return null when no player info is provided", () => {
      const { container } = setup({
        playerName: undefined,
        playerAvatarId: undefined,
      });
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Player", () => {
    it("should default to avatar id 1 if not given one", () => {
      const { getAvatar, getPlayerName } = setup({ playerAvatarId: undefined });

      const avatar = getAvatar();
      const playerName = getPlayerName();

      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute("src", "mock-avatar-1");
      expect(playerName).toBeInTheDocument();
    });
  });

  describe("Connection Status", () => {
    it("should show connection issues icon when connectionIssues is true", () => {
      const { getConnectionIcon } = setup({ connectionIssues: true });
      expect(getConnectionIcon()).toBeInTheDocument();
    });

    it("should not show connection issues icon when connectionIssues is false", () => {
      const { getConnectionIcon } = setup({ connectionIssues: false });
      expect(getConnectionIcon()).not.toBeInTheDocument();
    });
  });

  describe("Timer Display", () => {
    it("should render timer when timer prop is provided", () => {
      const { getTimer } = setup({
        timer: {
          timerExpiration: Date.now() + 60000,
          pause: false,
          hasStarted: true,
        },
      });
      expect(getTimer()).toBeInTheDocument();
    });

    it("should not render timer when timer prop is not provided", () => {
      const { getTimer } = setup({ timer: undefined });
      expect(getTimer()).not.toBeInTheDocument();
    });
  });

  describe("Taken Chess Pieces", () => {
    it("should render TakenChessPieces component with provided pieces", () => {
      const { getTakenChessPieces } = setup();

      expect(getTakenChessPieces()).toBeInTheDocument();
      expect(getTakenChessPieces()?.children).toHaveLength(2);
    });

    it("should not render any taken pieces when not provided pieces", () => {
      const { getTakenChessPieces } = setup({ takenChessPieces: [] });

      expect(getTakenChessPieces()).toBeInTheDocument();
      expect(getTakenChessPieces()?.children).toHaveLength(0);
    });
  });
});
