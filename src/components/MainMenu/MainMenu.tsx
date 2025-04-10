import LobbyManager from '../Lobby/LobbyManager/LobbyManager'
import RoomManager from '../Room/RoomManager';
import { useUserState } from '../../context/UserStateContext';
import './MainMenu.css';
import { useEffect } from 'react';
import { useModalState } from '../../context/ModalStateContext';
import ErrorBoundary from '../common/ErrorBoundary/ErrorBoundary';

const MainMenu = () => {
  const { userState } = useUserState();
  const { dispatch } = useModalState();

  useEffect(() => {
    if (userState.name.length === 0) {
      dispatch({ type: 'OPEN_NAME_MODAL', payload: { required: true } });
      return;
    }
  }, [])

  return (
    <ErrorBoundary>
      {
        userState.currentRoomId ?
        (<RoomManager />) :
        (<LobbyManager />)
      }
    </ErrorBoundary>
  );
}

export default MainMenu;