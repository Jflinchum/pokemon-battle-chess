import { useState } from "react";
import RoomListItem from "./RoomListItem";
import { useUserState } from "../../../context/UserStateContext";
import { useModalState } from "../../../context/ModalStateContext";
import { joinRoom } from "../../../service/lobby";
import './RoomList.css';

interface RoomListProps {
  availableRooms: { roomId: string, hostName: string, hasPassword: boolean }[]
}

const RoomList = ({ availableRooms }: RoomListProps) => {
  const { dispatch, userState } = useUserState();
  const { dispatch: dispatchModalState } = useModalState();
  const [roomSearch, setRoomSearch] = useState('');

  const handleJoinRoom = async ({ roomId, hasPassword }: { roomId: string, hasPassword: boolean }) => {
    if (hasPassword) {
      dispatchModalState({ type: 'OPEN_ROOM_MODAL', payload: { modalProps: { roomId: roomId } } });
    } else {
      await joinRoom(roomId, '', userState.id, userState.name);
      dispatch({ type: 'JOIN_ROOM', payload: { roomId: roomId, roomCode: '' } });
    }
  }


  // TODO - Debounce room search and send to backend and pagination
  return (
    <div className='roomListContainer'>
      <div>
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
    </div>
  );
};

export default RoomList;