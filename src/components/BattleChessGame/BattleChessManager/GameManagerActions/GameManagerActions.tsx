import { useCallback } from "react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faDoorOpen,
  faDownload,
  faFlag,
  faForwardFast,
} from "@fortawesome/free-solid-svg-icons";
import { useGameState } from "../../../../context/GameState/GameStateContext";
import { useUserState } from "../../../../context/UserState/UserStateContext";
import NavOptions from "../../../common/NavOptions/NavOptions";
import { NavOptionButton } from "../../../common/NavOptions/NavOptionButton/NavOptionButton";
import { useModalState } from "../../../../context/ModalState/ModalStateContext";
import { downloadReplay } from "../../../../util/downloadReplay";
import { useSocketRequests } from "../../../../util/useSocketRequests";
import "./GameManagerActions.css";

const GameManagerActions = () => {
  const { dispatch } = useUserState();
  const { gameState, dispatch: dispatchGameState } = useGameState();
  const { dispatch: dispatchModalState } = useModalState();
  const { requestSetViewingResults, requestReturnEveryoneToRoom } =
    useSocketRequests();

  const handleLeaveRoom = () => {
    dispatch({ type: "LEAVE_ROOM" });
    dispatchGameState({ type: "RESET_ROOM" });
  };

  const handleOptionsClick = () => {
    dispatchModalState({ type: "OPEN_OPTIONS_MODAL", payload: {} });
  };

  const handleReturn = () => {
    dispatchGameState({ type: "RETURN_TO_ROOM" });
    requestSetViewingResults(false);
  };

  const handleDownloadReplay = useCallback(() => {
    downloadReplay(gameState);
  }, [gameState]);

  const handleReturnEveryoneToRoom = async () => {
    try {
      await requestReturnEveryoneToRoom();
    } catch (err) {
      toast(`Error: ${err}`, { type: "error" });
    }
  };

  return (
    <NavOptions minimal={true} className="gameManagerActionContainer">
      <div className="gameManagerActionHeaderContainer">
        <span className="gameManagerActionHeader">Pokemon</span>
        <span className="gameManagerActionHeader">Gambit</span>
      </div>
      <div className="gameManagerActions">
        {gameState.isCatchingUp &&
          !gameState.isSkippingAhead &&
          !gameState.isWatchingReplay && (
            <NavOptionButton
              className="gameManagerAction"
              onClick={() => {
                dispatchGameState({
                  type: "SET_SKIPPING_AHEAD",
                  payload: !gameState.isSkippingAhead,
                });
              }}
            >
              <span className="gameManagerActionIcon">
                <FontAwesomeIcon icon={faForwardFast} />
              </span>
              <span className="gameManagerActionLabel">
                Skip to Current Turn
              </span>
            </NavOptionButton>
          )}
        {gameState.matchEnded &&
          gameState.inGame &&
          !gameState.gameSettings.isQuickPlay &&
          !gameState.isWatchingReplay && (
            <NavOptionButton
              className="gameManagerAction"
              onClick={handleReturn}
            >
              <span className="gameManagerActionIcon">
                <FontAwesomeIcon icon={faDoorOpen} />
              </span>
              <span className="gameManagerActionLabel">Return to Room</span>
            </NavOptionButton>
          )}
        <NavOptionButton
          className="gameManagerAction"
          onClick={() => handleLeaveRoom()}
        >
          <span className="gameManagerActionIcon">
            <FontAwesomeIcon icon={faFlag} />
          </span>
          <span className="gameManagerActionLabel">Return to Main Menu</span>
        </NavOptionButton>
        {!gameState.matchEnded &&
          gameState.inGame &&
          !gameState.isWatchingReplay &&
          gameState.isHost && (
            <NavOptionButton
              className="gameManagerAction"
              onClick={() => handleReturnEveryoneToRoom()}
            >
              <span className="gameManagerActionIcon">
                <FontAwesomeIcon icon={faDoorOpen} />
              </span>
              <span className="gameManagerActionLabel">
                Return Everyone to Room
              </span>
            </NavOptionButton>
          )}
        <NavOptionButton
          className="gameManagerAction"
          onClick={() => handleOptionsClick()}
        >
          <span className="gameManagerActionIcon">
            <FontAwesomeIcon icon={faCog} />
          </span>
          <span className="gameManagerActionLabel">Options</span>
        </NavOptionButton>
        {!gameState.isWatchingReplay && gameState.matchHistory && (
          <NavOptionButton
            className="gameManagerAction"
            onClick={() => handleDownloadReplay()}
          >
            <span className="gameManagerActionIcon">
              <FontAwesomeIcon icon={faDownload} />
            </span>
            <span className="gameManagerActionLabel">Download Replay</span>
          </NavOptionButton>
        )}
      </div>
    </NavOptions>
  );
};

export default GameManagerActions;
