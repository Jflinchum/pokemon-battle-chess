import { toast } from "react-toastify";
import { PRNGSeed } from "@pkmn/sim";
import { MatchHistory } from "../../../../../shared/types/Game.js";
import { GameState } from "../../../../context/GameState/GameStateContext";
import { Player } from "../../../../../shared/types/Player";
import { GameOptions } from "../../../../../shared/types/GameOptions";

export interface ReplayData {
  players: Player[];
  whitePlayer: Player;
  blackPlayer: Player;
  seed: PRNGSeed;
  options: GameOptions;
  matchHistory: MatchHistory;
}

export const downloadReplay = (
  gameState: GameState,
  matchHistory: MatchHistory,
) => {
  const whitePlayer = gameState.gameSettings.whitePlayer;
  const blackPlayer = gameState.gameSettings.blackPlayer;
  const seed = gameState.gameSettings.seed;

  if (!whitePlayer || !blackPlayer || !seed) {
    toast("Error: Unable to download replay", { type: "error" });
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
    matchHistory,
  };

  const fileName = `${new Date().getFullYear()}-${new Date().getDate()}-${new Date().getDay()}-${new Date().getHours()}${new Date().getMinutes()}${new Date().getSeconds()}`;
  const json = JSON.stringify(replayData, null, 2);
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
