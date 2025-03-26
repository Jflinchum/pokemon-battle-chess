import { useState, useEffect } from "react";
import RoomList from "../RoomList/RoomList";
import MenuOptions from "../MenuOptions/MenuOptions";
import CreateLobbyForm from "../CreateLobbyForm/CreateLobbyForm";
import { useUserState } from "../../../context/UserStateContext";
import { createNewRoom, getAvailableRooms } from "../../../service/lobby";

const LobbyManager = () => {
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const { userState, dispatch } = useUserState();

  const handleCreateLobby = async () => {
    const roomId = await createNewRoom(userState.id, userState.name);
    dispatch({ type: 'SET_ROOM', payload: roomId });
  };

  const handleRefreshRoom = () => {
    const fetchRooms = async () => {
      const rooms = await getAvailableRooms();
      setAvailableRooms(rooms);
    }
    fetchRooms();
  }

  useEffect(() => {
    const fetchRooms = async () => {
      const rooms = await getAvailableRooms();
      setAvailableRooms(rooms);
    }
    fetchRooms();
  }, []);

  return (
    <div>
      <MenuOptions onCreateRoom={() => { setCreatingRoom(true) }} />
      <RoomList availableRooms={availableRooms} />
      <button onClick={handleRefreshRoom}>Refresh Rooms</button>
      {
        creatingRoom ? (
          <CreateLobbyForm handleCreateLobby={handleCreateLobby} handleCancelLobbyCreation={() => setCreatingRoom(false)}/>
        ) : null
      }
    </div>
  );
};

export default LobbyManager;