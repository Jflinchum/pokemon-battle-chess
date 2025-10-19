import { PRNGSeed } from "@pkmn/sim";
import { toast } from "react-toastify";
import { MatchHistory } from "../../shared/types/Game.js";
import { GameOptions } from "../../shared/types/GameOptions.js";
import { Player } from "../../shared/types/Player.js";
import { GameState } from "../context/GameState/GameStateContext.js";

export interface ReplayData {
  players: Player[];
  whitePlayer: Player;
  blackPlayer: Player;
  seed: PRNGSeed;
  options: GameOptions;
  matchHistory: MatchHistory;
  errorName?: string;
  errorMessage?: string;
  errorStack?: string;
}

export const downloadReplay = (gameState: GameState, error?: Error) => {
  const whitePlayer = gameState.gameSettings.whitePlayer;
  const blackPlayer = gameState.gameSettings.blackPlayer;
  const seed = gameState.gameSettings.seed;

  if (!whitePlayer || !blackPlayer || !seed) {
    toast("Error: Unable to download the replay", { type: "error" });
    return;
  }
  const replayData: ReplayData = {
    players: [whitePlayer, blackPlayer],
    whitePlayer: whitePlayer,
    blackPlayer: blackPlayer,
    seed,
    options: {
      ...gameState.gameSettings.options,
      timersEnabled: false,
    },
    matchHistory: gameState.matchHistory,
    errorName: error?.name,
    errorMessage: error?.message,
    errorStack: error?.stack,
  };

  const fileName = `${new Date().getFullYear()}-${new Date().getDate()}-${new Date().getDay()}-${new Date().getHours()}${new Date().getMinutes()}${new Date().getSeconds()}`;
  const json = JSON.stringify(replayData);
  const blob = new Blob([json], { type: "application/json" });
  const href = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = href;
  link.download = fileName + ".replay";
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};
