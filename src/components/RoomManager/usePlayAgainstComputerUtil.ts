import { PRNG } from "@pkmn/sim";
import { useCallback } from "react";
import { GameOptions } from "../../../shared/types/GameOptions";
import { useGameState } from "../../context/GameState/GameStateContext";
import { useUserState } from "../../context/UserState/UserStateContext";
import {
  cpuDifficultyLevels,
  getCpuPlayerData,
  getOfflinePlayerData,
  offlineRoomId,
} from "../../util/offlineUtil";

export const usePlayAgainstComputerUtil = () => {
  const { userState } = useUserState();
  const { gameState, dispatch } = useGameState();

  const isUserInOfflineMode = useCallback(() => {
    return userState.currentRoomId === offlineRoomId;
  }, [userState.currentRoomId]);

  const initializeMatch = (
    cpuDifficulty: (typeof cpuDifficultyLevels)[number],
    gameOptions: GameOptions,
  ) => {
    const isUserWhite = Math.random() > 0.5;
    const cpuPlayer = getCpuPlayerData({ playerSide: "p2", cpuDifficulty });
    const currentPlayer = getOfflinePlayerData({
      playerName: userState.name,
      playerId: userState.id,
      avatarId: userState.avatarId,
    });

    let opposingPlayer = currentPlayer;

    const playerList = [cpuPlayer, currentPlayer];
    if (gameState.isSpectator) {
      opposingPlayer = getCpuPlayerData({ playerSide: "p1", cpuDifficulty });
      playerList.push(opposingPlayer);

      currentPlayer.isSpectator = true;
      currentPlayer.isPlayer1 = false;
      opposingPlayer.isPlayer1 = true;
    }

    opposingPlayer.color = isUserWhite ? "w" : "b";
    cpuPlayer.color = isUserWhite ? "b" : "w";

    dispatch({
      type: "SET_PLAYERS",
      payload: {
        players: playerList,
        isHost: true,
        isSpectator: gameState.isSpectator,
      },
    });
    dispatch({
      type: "START_MATCH",
      payload: {
        settings: {
          whitePlayer: isUserWhite ? opposingPlayer : cpuPlayer,
          blackPlayer: isUserWhite ? cpuPlayer : opposingPlayer,
          color: isUserWhite ? "w" : "b",
          seed: new PRNG().getSeed(),
          options: {
            ...gameOptions,
            timersEnabled: false,
          },
        },
        isSkippingAhead: false,
      },
    });
  };

  return { initializeMatch, isUserInOfflineMode };
};
