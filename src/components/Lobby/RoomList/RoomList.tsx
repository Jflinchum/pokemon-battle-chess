import { useState } from "react";
import RoomListItem from "./RoomListItem";
import { useUserState } from "../../../context/UserStateContext";
import { useModalState } from "../../../context/ModalStateContext";
import { joinRoom } from "../../../service/lobby";
import './RoomList.css';
import ErrorMessage from "../../common/ErrorMessage/ErrorMessage";
import { useDebounce } from "../../../utils";

export interface Room {
  roomId: string,
  hostName: string,
  hasPassword: boolean,
  playerCount: number,
  matchInProgress: boolean
}

interface RoomListProps {
  availableRooms: Room[];
  errorText?: string;
  onSearch: (searchTerm: string) => void;
}

const RoomList = ({ availableRooms, errorText, onSearch }: RoomListProps) => {
  const { dispatch, userState } = useUserState();
  const { dispatch: dispatchModalState } = useModalState();
  const [roomSearch, setRoomSearch] = useState('');
  const [joinErrorText, setJoinErrorText] = useState('');

  const handleJoinRoom = async ({ roomId, hasPassword }: { roomId: string, hasPassword: boolean }) => {
    setJoinErrorText('');
    if (hasPassword) {
      dispatchModalState({ type: 'OPEN_ROOM_MODAL', payload: { modalProps: { roomId: roomId } } });
    } else {
      const response = await joinRoom(roomId, '', userState.id, userState.name, userState.avatarId);
      if (response.status === 200) {
        dispatch({ type: 'JOIN_ROOM', payload: { roomId: roomId, roomCode: '' } });
      } else {
        setJoinErrorText('Failed to join room.')
      }
    }
  }

  const searchDebounce = useDebounce((searchTerm: string) => onSearch(searchTerm), 1000);

  return (
    <div>
      <ErrorMessage display='block'>{errorText}</ErrorMessage>
      <ErrorMessage display='block'>{joinErrorText}</ErrorMessage>
      <div className='roomListTopActions'>
        <span>Rooms:</span>
        <input value={roomSearch} onChange={(e) => {setRoomSearch(e.target.value); searchDebounce(e.target.value);}} className='roomSearch' placeholder='Search for rooms'/>
      </div>
      <ul className='roomList'>
        {
          availableRooms.map((room) => (
            <RoomListItem
              key={room.roomId} room={room} onClick={() => { handleJoinRoom(room) }} />
          ))
        } 
      </ul>
    </div>
  );
};

export default RoomList;