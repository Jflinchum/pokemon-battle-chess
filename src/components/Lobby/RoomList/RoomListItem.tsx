import './RoomListItem.css';
import { Room } from './RoomList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad, faLock, faUser } from '@fortawesome/free-solid-svg-icons';

interface RoomListItem {
  room: Room;
  onClick: () => void;
}

const RoomListItem = ({ room, onClick }: RoomListItem) => {
  return (
    <li>
      <button className='roomListItemButton' onClick={onClick}>
        <span>{room.hostName}</span>
        <span className='roomListIconContainer'>
          {
            room.hasPassword &&
            (<span title='Requires Passcode'><FontAwesomeIcon icon={faLock}/></span>) 
          }
          {
            room.matchInProgress &&
            (<span title='Game In Progress'><FontAwesomeIcon icon={faGamepad}/></span>) 
          }
          <span title='Total Player Count'>
            <FontAwesomeIcon icon={faUser} /> {room.playerCount}
          </span>
        </span>
      </button>
    </li>
  );
};

export default RoomListItem;