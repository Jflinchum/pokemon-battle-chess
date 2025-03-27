import { useState, useEffect } from "react";
import RoomList from "../RoomList/RoomList";
import MenuOptions from "../MenuOptions/MenuOptions";
import { getAvailableRooms } from "../../../service/lobby";
import { useGameState } from "../../../context/GameStateContext";
import './LobbyManager.css';
import { useModalState } from "../../../context/ModalStateContext";

const LobbyManager = () => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const { dispatch } = useModalState();
  const { dispatch: dispatchGameState } = useGameState();


  const handleRefreshRoom = () => {
    const fetchRooms = async () => {
      const rooms = await getAvailableRooms();
      setAvailableRooms(rooms);
    }
    fetchRooms();
  }

  useEffect(() => {
    handleRefreshRoom();
    // Whenever we're back at the lobby, reset the room to a clean slate
    dispatchGameState({ type: 'RESET_ROOM' });
  }, []);

  return (
    <div className='lobbyContainer'>
      <div>
        <MenuOptions onCreateRoom={() => { dispatch({ type: 'OPEN_CREATE_ROOM_MODAL', payload: {} }); }} />
      </div>
      <div className='roomListLobbyContainer'>
        <RoomList availableRooms={availableRooms} onRefresh={handleRefreshRoom}/>
      </div>
    </div>
  );
};

export default LobbyManager;