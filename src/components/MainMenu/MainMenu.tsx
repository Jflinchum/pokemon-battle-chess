import { useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import LobbyManager from '../Lobby/LobbyManager/LobbyManager'
import RoomManager from '../RoomManager/RoomManager';
import { useUserState } from '../../context/UserStateContext';
import { useModalState } from '../../context/ModalStateContext';
import { useGameState } from '../../context/GameStateContext';
import ErrorBoundary from '../common/ErrorBoundary/ErrorBoundary';
import BattleChessManager from '../BattleChessGame/BattleChessManager/BattleChessManager';
import { clearMostRecentRoom, getMostRecentRoom } from '../../util/localWebData';
import { getRoom } from '../../service/lobby';
import { RejoinMessage } from './RejoinMessage/RejoinMessage';
import './MainMenu.css';

const MainMenu = () => {
  const { userState } = useUserState();
  const { gameState } = useGameState();
  const { dispatch } = useModalState();

  useEffect(() => {
    if (userState.name.length === 0) {
      dispatch({ type: 'OPEN_NAME_MODAL', payload: { required: true } });
      return;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAndOfferRejoin = async ({ roomId, roomCode }: { roomId: string; roomCode: string; }) => {
      const roomResponse = await getRoom({ roomId }, { signal: controller.signal });

      if (roomResponse.status === 200) {
        toast(
          RejoinMessage,
          {
            autoClose: false,
            data: {
              roomId,
              roomCode
            }
          }
        );
      } else {
        clearMostRecentRoom();
      }
    };

    const mostRecentRoom = getMostRecentRoom();
    if (mostRecentRoom && !userState.currentRoomId) {
      fetchAndOfferRejoin({ roomId: mostRecentRoom.roomId, roomCode: mostRecentRoom.roomCode });
    }

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        rtl={false}
        pauseOnFocusLoss
        pauseOnHover
        theme="dark"
      />
      {
        userState.currentRoomId ?
        (<RoomManager />) :
        gameState.isWatchingReplay ?
        (<BattleChessManager matchHistory={gameState.replayHistory} />) :
        (<LobbyManager />)
      }
    </ErrorBoundary>
  );
}

export default MainMenu;