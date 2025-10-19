import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getMockPlayer } from "../../../../../testUtils/player";
import PlayerName, { PlayerNameProps } from "../PlayerName";

const setup = (props: PlayerNameProps = { player: getMockPlayer() }) => {
  const utils = render(<PlayerName {...props} />);
  const hostIcon = screen.queryByTestId("player-host-icon");
  const viewingResultsIcon = screen.queryByTestId(
    "player-viewing-results-icon",
  );
  const spectatorIcon = screen.queryByTestId("player-spectator-icon");
  const transientIcon = screen.queryByTestId("player-transient-icon");
  const playerNameElement = screen.getByText(props.player.playerName);

  return {
    hostIcon,
    viewingResultsIcon,
    spectatorIcon,
    transientIcon,
    playerNameElement,
    ...utils,
  };
};

describe("PlayerName", () => {
  it("should render player name without any icons by default", () => {
    const {
      hostIcon,
      viewingResultsIcon,
      spectatorIcon,
      transientIcon,
      playerNameElement,
    } = setup({
      player: getMockPlayer({ isSpectator: false }),
    });

    expect(playerNameElement).toBeInTheDocument();
    expect(hostIcon).not.toBeInTheDocument();
    expect(viewingResultsIcon).not.toBeInTheDocument();
    expect(spectatorIcon).not.toBeInTheDocument();
    expect(transientIcon).not.toBeInTheDocument();
  });

  it("should render host icon when player is host", () => {
    const { hostIcon } = setup({
      player: getMockPlayer({ isHost: true, isSpectator: false }),
    });
    expect(hostIcon).toBeInTheDocument();
  });

  it("should render viewing results icon when player is viewing results", () => {
    const { viewingResultsIcon } = setup({
      player: getMockPlayer({ viewingResults: true, isSpectator: false }),
    });
    expect(viewingResultsIcon).toBeInTheDocument();
  });

  it("should render spectator icon when player is spectating", () => {
    const { spectatorIcon } = setup({
      player: getMockPlayer({ isSpectator: true }),
    });
    expect(spectatorIcon).toBeInTheDocument();
  });

  it("should render transient icon when player has connection issues", () => {
    const { transientIcon } = setup({
      player: getMockPlayer({ transient: true, isSpectator: false }),
    });
    expect(transientIcon).toBeInTheDocument();
  });

  it("should render multiple icons when player has multiple states", () => {
    const { hostIcon, viewingResultsIcon, spectatorIcon } = setup({
      player: getMockPlayer({
        isHost: true,
        viewingResults: true,
        isSpectator: true,
      }),
    });

    expect(hostIcon).toBeInTheDocument();
    expect(viewingResultsIcon).toBeInTheDocument();
    expect(spectatorIcon).toBeInTheDocument();
  });
});
