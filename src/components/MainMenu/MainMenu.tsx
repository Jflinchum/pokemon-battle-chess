import { useCallback, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import LobbyManager from "../Lobby/LobbyManager/LobbyManager";
import RoomManager from "../RoomManager/RoomManager";
import { useUserState } from "../../context/UserState/UserStateContext";
import { useModalState } from "../../context/ModalState/ModalStateContext";
import { useGameState } from "../../context/GameState/GameStateContext";
import ErrorBoundary from "../common/ErrorBoundary/ErrorBoundary";
import BattleChessManager from "../BattleChessGame/BattleChessManager/BattleChessManager";
import {
  clearMostRecentRoom,
  getMostRecentRoom,
} from "../../util/localWebData";
import { getRoom } from "../../service/lobby";
import { RejoinMessage } from "./RejoinMessage/RejoinMessage";
import { joinRoom } from "../../service/lobby";
import "./MainMenu.css";
import { downloadReplay } from "../../util/downloadReplay";

const MainMenu = () => {
  const { userState, dispatch: userStateDispatch } = useUserState();
  const { gameState } = useGameState();
  const { dispatch } = useModalState();

  const handleNoClick = useCallback(() => {
    clearMostRecentRoom();
  }, []);

  const handleYesClick = useCallback(
    async (roomId: string, roomCode: string) => {
      const response = await joinRoom(
        roomId,
        roomCode,
        userState.id,
        userState.name,
        userState.avatarId,
        userState.secretId,
      );

      if (response.status === 200) {
        userStateDispatch({
          type: "JOIN_ROOM",
          payload: { roomId, roomCode },
        });
      } else {
        toast("Error: Failed to join room.", { type: "error" });
      }
    },
    [
      userStateDispatch,
      userState.id,
      userState.name,
      userState.avatarId,
      userState.secretId,
    ],
  );

  useEffect(() => {
    if (userState.name.length === 0) {
      dispatch({
        type: "OPEN_NAME_MODAL",
        payload: { required: true, modalProps: { userFirstTime: true } },
      });
      return;
    }
  }, [dispatch, userState.name]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAndOfferRejoin = async ({
      roomId,
      roomCode,
    }: {
      roomId: string;
      roomCode: string;
    }) => {
      try {
        const roomResponse = await getRoom(
          { roomId },
          { signal: controller.signal },
        );

        if (roomResponse.status === 200) {
          toast(RejoinMessage, {
            autoClose: false,
            data: {
              onYesClick: () => handleYesClick(roomId, roomCode),
              onNoClick: () => handleNoClick(),
            },
          });
        } else {
          clearMostRecentRoom();
        }
      } catch {
        // Do nothing with error
      }
    };

    const mostRecentRoom = getMostRecentRoom();
    if (mostRecentRoom && !userState.currentRoomId) {
      fetchAndOfferRejoin({
        roomId: mostRecentRoom.roomId,
        roomCode: mostRecentRoom.roomCode,
      });
    }

    return () => {
      controller.abort();
    };
  }, [userState.currentRoomId, handleYesClick, handleNoClick]);

  return (
    <ErrorBoundary
      hasMatchHistory={!!gameState.matchHistory.length}
      onMatchHistoryDownloadClick={(error) => downloadReplay(gameState, error)}
    >
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        rtl={false}
        pauseOnFocusLoss
        pauseOnHover
        theme="dark"
      />
      {userState.currentRoomId ? (
        <RoomManager />
      ) : gameState.isWatchingReplay ? (
        <BattleChessManager matchHistory={gameState.replayHistory} />
      ) : (
        <LobbyManager />
      )}
    </ErrorBoundary>
  );
};

export default MainMenu;
