import { useState, useEffect } from "react";
import RoomList from "../RoomList/RoomList";
import MenuOptions from "../MenuOptions/MenuOptions";
import { getAvailableRooms } from "../../../service/lobby";
import { useGameState } from "../../../context/GameStateContext";
import './LobbyManager.css';

const LobbyManager = () => {
  const [availableRooms, setAvailableRooms] = useState([]);
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
    <>
      <div className='lobbyContainer'>
        <MenuOptions />
        <div className='roomListLobbyContainer'>
          <h1 className='mainMenuHeader'>Pokemon Battle Chess</h1>
          <RoomList availableRooms={availableRooms} onRefresh={handleRefreshRoom}/>
        </div>
      </div>
    </>
  );
};

export default LobbyManager;