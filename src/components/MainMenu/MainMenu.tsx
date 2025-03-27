import { useEffect } from 'react';
import LobbyManager from '../Lobby/LobbyManager/LobbyManager'
import RoomManager from '../Room/RoomManager';
import { useModalState } from '../../context/ModalStateContext';
import { useUserState } from '../../context/UserStateContext';
import './MainMenu.css';

const MainMenu = () => {
  const { userState } = useUserState();
  const { dispatch } = useModalState();

  useEffect(() => {
    if (userState.name.length === 0) {
      dispatch({ type: 'OPEN_NAME_MODAL', payload: { required: true } })
    }
  }, [userState.name]);

  return (
    <div>
      <h1 className='mainMenuHeader'>Pokemon Battle Chess</h1>
      {
        userState.currentRoomId ?
        (<RoomManager />) :
        (<LobbyManager />)
      }
    </div>
  );
}

export default MainMenu;