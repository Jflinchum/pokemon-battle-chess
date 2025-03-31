import { useState, useEffect } from "react";
import RoomList from "../RoomList/RoomList";
import MenuOptions from "../MenuOptions/MenuOptions";
import { getAvailableRooms } from "../../../service/lobby";
import { useGameState } from "../../../context/GameStateContext";
import './LobbyManager.css';

const LobbyManager = () => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const { dispatch: dispatchGameState } = useGameState();
  const [errorText, setErrorText] = useState('');

  const handleRefreshRoom = () => {
    setErrorText('');
    const fetchRooms = async () => {
      const response = await getAvailableRooms();
      if (response.status === 200) {
        const { rooms } = await response.json();
        setAvailableRooms(rooms || []);
      } else {
        setErrorText('Error while getting rooms.');
      }
    }
    fetchRooms();
  }

  useEffect(() => {
    handleRefreshRoom();
    // Whenever we're back at the lobby, reset the room to a clean slate
    dispatchGameState({ type: 'RESET_ROOM' });

    const refreshInterval = setInterval(() => {
      handleRefreshRoom();
    }, 1000 * 10);
    return () => {
      clearInterval(refreshInterval);
    }
  }, []);

  return (
    <>
      <div className='lobbyContainer'>
        <MenuOptions />
        <div className='roomListLobbyContainer'>
          <h1 className='mainMenuHeader'>Pokemon Battle Chess</h1>
          <RoomList availableRooms={availableRooms} onRefresh={handleRefreshRoom} errorText={errorText}/>
        </div>
      </div>
    </>
  );
};

export default LobbyManager;