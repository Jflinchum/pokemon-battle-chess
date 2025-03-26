import RoomListItem from "./RoomListItem";
import { useUserState } from "../../../context/UserStateContext";

interface RoomListProps {
  availableRooms: { roomId: string, hostName: string }[]
}

const RoomList = ({ availableRooms }: RoomListProps) => {
  const { dispatch } = useUserState();

  const handleJoinRoom = (roomId: string) => {
    dispatch({ type: 'JOIN_ROOM', payload: roomId });
  }

  return (
    <div>
      <p>Rooms:</p>
      <ul>
        {
          availableRooms.map((room) => (
            <RoomListItem key={room.roomId} name={room.hostName} onClick={() => { handleJoinRoom(room.roomId) }} />
          ))
        } 
      </ul>
    </div>
  );
};

export default RoomList;