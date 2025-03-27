import { useState, useEffect } from "react";
import RoomList from "../RoomList/RoomList";
import MenuOptions from "../MenuOptions/MenuOptions";
import CreateRoomForm from "../CreateRoomForm/CreateRoomForm";
import { useUserState } from "../../../context/UserStateContext";
import { createNewRoom, getAvailableRooms } from "../../../service/lobby";
import { useGameState } from "../../../context/GameStateContext";
import Button from "../../common/Button/Button";
import './LobbyManager.css';

const LobbyManager = () => {
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const { userState, dispatch } = useUserState();
  const { dispatch: dispatchGameState } = useGameState();

  const handleCreateRoom = async ({ password }: { password: string }) => {
    const roomId = await createNewRoom(userState.id, userState.name, password);
    if (roomId) {
      dispatch({ type: 'SET_ROOM', payload: { roomId: roomId, roomCode: password } });
      dispatchGameState({ type: 'CREATE_ROOM' });
    }
  };

  const handleRefreshRoom = () => {
    setRefreshDisabled(true);
    const fetchRooms = async () => {
      const rooms = await getAvailableRooms();
      setAvailableRooms(rooms);
    }
    fetchRooms();
    setTimeout(() => {
      setRefreshDisabled(false);
    }, 1000);
  }

  useEffect(() => {
    handleRefreshRoom();
    // Whenever we're back at the lobby, reset the room to a clean slate
    dispatchGameState({ type: 'RESET_ROOM' });
  }, []);

  return (
    <div className='lobbyContainer'>
      <div>
        <MenuOptions onCreateRoom={() => { setCreatingRoom(!creatingRoom) }} />
        {
          creatingRoom ? (
            <CreateRoomForm handleCreateRoom={handleCreateRoom} handleCancelRoomCreation={() => setCreatingRoom(false)}/>
          ) : null
        }
      </div>
      <div className='roomListLobbyContainer'>
        <Button disabled={refreshDisabled} colorPrimary="brown" className='refreshButton' onClick={handleRefreshRoom}>Refresh Rooms</Button>
        <RoomList availableRooms={availableRooms} />
      </div>
    </div>
  );
};

export default LobbyManager;