import { useUserState } from '../../context/UserStateContext';
import LobbyManager from '../Lobby/LobbyManager/LobbyManager'
import RoomManager from '../Room/RoomManager';

const MainMenu = () => {
  const { userState } = useUserState();

  return (
    <div>
      {
        userState.currentRoomId ?
        (<RoomManager />) :
        (<LobbyManager />)
      }
    </div>
  );
}

export default MainMenu;