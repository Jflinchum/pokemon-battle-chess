import { Room } from "./RoomList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis, faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import "./RoomListItem.css";

interface RoomListItem {
  room: Room;
  onClick: () => void;
}

const RoomListItem = ({ room, onClick }: RoomListItem) => {
  return (
    <li>
      <button className="roomListItemButton" onClick={onClick}>
        <span>{room.hostName}</span>
        <span className="roomListIconContainer">
          {room.hasPassword && (
            <span title="Requires Passcode">
              <FontAwesomeIcon icon={faLock} />
            </span>
          )}
          {room.isOngoing && (
            <span title="Game In Progress">
              <FontAwesomeIcon icon={faEllipsis} />
            </span>
          )}
          <span title="Total Player Count">
            <FontAwesomeIcon icon={faUser} /> {room.playerCount}
          </span>
        </span>
      </button>
    </li>
  );
};

export default RoomListItem;
