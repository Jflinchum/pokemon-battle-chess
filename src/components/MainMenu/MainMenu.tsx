import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import LobbyManager from '../Lobby/LobbyManager/LobbyManager'
import RoomManager from '../RoomManager/RoomManager';
import { useUserState } from '../../context/UserStateContext';
import { useModalState } from '../../context/ModalStateContext';
import { useGameState } from '../../context/GameStateContext';
import ErrorBoundary from '../common/ErrorBoundary/ErrorBoundary';
import BattleChessManager from '../BattleChessGame/BattleChessManager/BattleChessManager';
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