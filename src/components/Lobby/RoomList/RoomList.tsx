import { useState } from "react";
import RoomListItem from "./RoomListItem";
import { useUserState } from "../../../context/UserStateContext";
import { useModalState } from "../../../context/ModalStateContext";
import { joinRoom } from "../../../service/lobby";
import Button from "../../common/Button/Button";
import './RoomList.css';

interface RoomListProps {
  availableRooms: { roomId: string, hostName: string, hasPassword: boolean }[];
  onRefresh: () => void;
}

const RoomList = ({ availableRooms, onRefresh }: RoomListProps) => {
  const { dispatch, userState } = useUserState();
  const { dispatch: dispatchModalState } = useModalState();
  const [roomSearch, setRoomSearch] = useState('');
  const [refreshDisabled, setRefreshDisabled] = useState(false);

  const handleRefreshRoom = () => {
    setRefreshDisabled(true);

    onRefresh();
  
    setTimeout(() => {
      setRefreshDisabled(false);
    }, 1000);
  }

  const handleJoinRoom = async ({ roomId, hasPassword }: { roomId: string, hasPassword: boolean }) => {
    if (hasPassword) {
      dispatchModalState({ type: 'OPEN_ROOM_MODAL', payload: { modalProps: { roomId: roomId } } });
    } else {
      await joinRoom(roomId, '', userState.id, userState.name, userState.avatarId);
      dispatch({ type: 'JOIN_ROOM', payload: { roomId: roomId, roomCode: '' } });
    }
  }


  // TODO - Debounce room search and send to backend and pagination
  return (
    <div className='roomListContainer'>
      <div className='roomListTopActions'>
        <span>Rooms:</span>
        <input value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)} className='roomSearch' placeholder='Search for rooms'/>
      </div>
      <ul className='roomList'>
        {
          availableRooms.filter((room) => !roomSearch || room.hostName.toLowerCase().includes(roomSearch.toLowerCase())).map((room) => (
            <RoomListItem key={room.roomId} name={room.hostName} locked={room.hasPassword} onClick={() => { handleJoinRoom(room) }} />
          ))
        } 
      </ul>
      <div className='roomListBottomActions'>
        <Button disabled={refreshDisabled} colorPrimary="brown" className='refreshButton' onClick={handleRefreshRoom}>Refresh Rooms</Button>
      </div>
    </div>
  );
};

export default RoomList;