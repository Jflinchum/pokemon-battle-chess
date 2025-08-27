import { Sprites } from "@pkmn/img";
import {
  EndGameModalProps,
  useModalState,
} from "../../../../../context/ModalState/ModalStateContext";
import { useUserState } from "../../../../../context/UserState/UserStateContext";
import { useGameState } from "../../../../../context/GameState/GameStateContext";
import Button from "../../../Button/Button";
import { EndGameReason } from "../../../../../../shared/types/Game";
import "./EndGameModal.css";
import { useMemo } from "react";
import { useSocketRequests } from "../../../../../util/useSocketRequests";

const getEndGameTitle = (
  isSpectator: boolean,
  playerVictory: boolean,
  reason: EndGameReason,
) => {
  if (
    isSpectator ||
    reason === "HOST_DISCONNECTED" ||
    reason === "PLAYER_DISCONNECTED" ||
    reason === "HOST_ENDED_GAME"
  ) {
    return "End Game";
  } else if (playerVictory) {
    return "You Win!";
  } else {
    return "You Lose...";
  }
};

const getEndgameSubtitle = (reason: EndGameReason, loseName: string) => {
  switch (reason) {
    case "KING_CAPTURED":
      return `${loseName} had their King captured!`;
    case "TIMEOUT":
      return `${loseName} ran out of time.`;
    case "HOST_DISCONNECTED":
      return `Game ended because the host has left the game.`;
    case "PLAYER_DISCONNECTED":
      return `${loseName} left the game.`;
    case "HOST_ENDED_GAME":
      return "The host has ended the game.";
  }
};

const EndGameModal = () => {
  const { modalState, dispatch } = useModalState();
  const { dispatch: userStateDispatch } = useUserState();
  const { gameState, dispatch: gameStateDispatch } = useGameState();
  const { requestSetViewingResults } = useSocketRequests();

  const currentColor = gameState.gameSettings?.color;
  const { victor, reason } = modalState.modalProps as EndGameModalProps;

  const handleBackToMenu = () => {
    userStateDispatch({ type: "LEAVE_ROOM" });
    gameStateDispatch({ type: "RESET_ROOM" });
    dispatch({ type: "CLOSE_MODAL" });
  };

  const handleReturn = () => {
    gameStateDispatch({ type: "RETURN_TO_ROOM" });
    requestSetViewingResults(false);
    dispatch({ type: "CLOSE_MODAL" });
  };

  const player1 = useMemo(
    () => gameState.gameSettings.whitePlayer,
    [gameState.gameSettings.whitePlayer],
  );
  const player2 = useMemo(
    () => gameState.gameSettings.blackPlayer,
    [gameState.gameSettings.blackPlayer],
  );
  const loseName = useMemo(() => {
    if (victor === "w") {
      return gameState.gameSettings.blackPlayer?.playerName || "";
    } else {
      return gameState.gameSettings.whitePlayer?.playerName || "";
    }
  }, [
    gameState.gameSettings.whitePlayer,
    gameState.gameSettings.blackPlayer,
    victor,
  ]);

  return (
    <div className="endGameModalContainer">
      <h2 className="endGameTitle">
        {getEndGameTitle(
          !!gameState.isSpectator,
          currentColor === victor,
          reason,
        )}
      </h2>
      <h4>{getEndgameSubtitle(reason, loseName)}</h4>
      {reason !== "HOST_DISCONNECTED" && (
        <div className="endGamePlayerList">
          <div className="endGamePlayer">
            <p>{player1?.playerName}</p>
            <img src={Sprites.getAvatar(player1?.avatarId || 1)} />
          </div>
          <p>vs</p>
          <div className="endGamePlayer">
            <p>{player2?.playerName}</p>
            <img src={Sprites.getAvatar(player2?.avatarId || 1)} />
          </div>
        </div>
      )}
      {reason !== "HOST_DISCONNECTED" && (
        <div className="endGameBottomActions">
          <Button color="danger" onClick={handleBackToMenu}>
            Back To Main Menu
          </Button>
          {!gameState.isWatchingReplay &&
            !gameState.gameSettings.isQuickPlay && (
              <Button
                className="endGameRematch"
                onClick={handleReturn}
                color="primary"
              >
                Return to Room
              </Button>
            )}
        </div>
      )}
    </div>
  );
};

export default EndGameModal;
