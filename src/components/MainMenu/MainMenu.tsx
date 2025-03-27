import { useUserState } from '../../context/UserStateContext';
import LobbyManager from '../Lobby/LobbyManager/LobbyManager'
import RoomManager from '../Room/RoomManager';
import './MainMenu.css';

const MainMenu = () => {
  const { userState } = useUserState();

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