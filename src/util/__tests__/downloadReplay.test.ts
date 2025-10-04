import { toast } from "react-toastify";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { downloadReplay } from "../downloadReplay";
import { getMockGameState } from "../../testUtils/gameState";
import { getMockPlayer } from "../../testUtils/player";
import { getDefaultGameOptions } from "../localWebData";

vi.mock("react-toastify");

describe("downloadReplay.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should validate game state and handle errors if there is no seed in state", () => {
    downloadReplay(
      getMockGameState({
        gameSettings: {
          whitePlayer: getMockPlayer(),
          blackPlayer: getMockPlayer(),
          options: getDefaultGameOptions(),
          seed: undefined,
        },
      }),
    );
    expect(toast).toHaveBeenCalledWith("Error: Unable to download the replay", {
      type: "error",
    });
  });

  it("should validate game state and handle errors if there is no white player in state", () => {
    downloadReplay(
      getMockGameState({
        gameSettings: {
          blackPlayer: getMockPlayer(),
          options: getDefaultGameOptions(),
          seed: "1234,1234",
        },
      }),
    );
    expect(toast).toHaveBeenCalledWith("Error: Unable to download the replay", {
      type: "error",
    });
  });

  it("should validate game state and handle errors if there is no black player in state", () => {
    downloadReplay(
      getMockGameState({
        gameSettings: {
          whitePlayer: getMockPlayer(),
          options: getDefaultGameOptions(),
          seed: "1234,1234",
        },
      }),
    );
    expect(toast).toHaveBeenCalledWith("Error: Unable to download the replay", {
      type: "error",
    });
  });

  it("should generate a link and click it to download replay from game state", async () => {
    const mockDate = new Date(1759431707092);
    vi.setSystemTime(mockDate);

    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();

    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    global.document.createElement = vi.fn().mockReturnValueOnce(mockLink);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();

    const mockGameState = getMockGameState({
      gameSettings: {
        whitePlayer: getMockPlayer(),
        blackPlayer: getMockPlayer(),
        options: getDefaultGameOptions(),
        seed: "1234,1234",
      },
    });

    downloadReplay(mockGameState);
    expect(global.document.createElement).toHaveBeenCalledOnce();
    expect(global.document.body.appendChild).toHaveBeenCalledOnce();
    expect(global.document.body.removeChild).toHaveBeenCalledOnce();
    expect(mockLink.click).toHaveBeenCalledOnce();
    expect(mockLink.download).toBe("2025-2-4-19147.replay");
  });

  it("should set the downloaded Blob to the match history and relevant game settings and while disabling timers", async () => {
    const mockDate = new Date(1759431707092);
    vi.setSystemTime(mockDate);

    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();

    global.Blob = vi.fn();

    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    global.document.createElement = vi.fn().mockReturnValueOnce(mockLink);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();

    const mockGameState = getMockGameState({
      gameSettings: {
        whitePlayer: getMockPlayer(),
        blackPlayer: getMockPlayer(),
        options: {
          ...getDefaultGameOptions(),
          timersEnabled: true,
        },
        seed: "1234,1234",
      },
    });

    downloadReplay(mockGameState);
    expect(global.Blob).toHaveBeenCalledWith(
      [
        JSON.stringify({
          players: [
            mockGameState.gameSettings.whitePlayer,
            mockGameState.gameSettings.blackPlayer,
          ],
          whitePlayer: mockGameState.gameSettings.whitePlayer,
          blackPlayer: mockGameState.gameSettings.blackPlayer,
          seed: mockGameState.gameSettings.seed,
          options: {
            ...mockGameState.gameSettings.options,
            timersEnabled: false,
          },
          matchHistory: mockGameState.matchHistory,
        }),
      ],
      { type: "application/json" },
    );
  });

  it("should include an error name, message, and stack if given one", async () => {
    const mockDate = new Date(1759431707092);
    vi.setSystemTime(mockDate);

    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();

    global.Blob = vi.fn();

    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    global.document.createElement = vi.fn().mockReturnValueOnce(mockLink);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();

    const mockGameState = getMockGameState({
      gameSettings: {
        whitePlayer: getMockPlayer(),
        blackPlayer: getMockPlayer(),
        options: {
          ...getDefaultGameOptions(),
          timersEnabled: true,
        },
        seed: "1234,1234",
      },
    });

    const mockError = new Error("Test Error");
    mockError.stack = "Test Error Stack";
    downloadReplay(mockGameState, mockError);
    expect(global.Blob).toHaveBeenCalledWith(
      [
        JSON.stringify({
          players: [
            mockGameState.gameSettings.whitePlayer,
            mockGameState.gameSettings.blackPlayer,
          ],
          whitePlayer: mockGameState.gameSettings.whitePlayer,
          blackPlayer: mockGameState.gameSettings.blackPlayer,
          seed: mockGameState.gameSettings.seed,
          options: {
            ...mockGameState.gameSettings.options,
            timersEnabled: false,
          },
          matchHistory: mockGameState.matchHistory,
          errorName: "Error",
          errorMessage: "Test Error",
          errorStack: "Test Error Stack",
        }),
      ],
      { type: "application/json" },
    );
  });
});
