import { useState } from "react";
import RoomListItem from "./RoomListItem";
import { useUserState } from "../../../context/UserStateContext";
import './RoomList.css';

interface RoomListProps {
  availableRooms: { roomId: string, hostName: string }[]
}

const RoomList = ({ availableRooms }: RoomListProps) => {
  const { dispatch } = useUserState();
  const [roomSearch, setRoomSearch] = useState('');

  const handleJoinRoom = (roomId: string) => {
    dispatch({ type: 'JOIN_ROOM', payload: roomId });
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
            <RoomListItem key={room.roomId} name={room.hostName} onClick={() => { handleJoinRoom(room.roomId) }} />
          ))
        } 
      </ul>
    </div>
  );
};

export default RoomList;