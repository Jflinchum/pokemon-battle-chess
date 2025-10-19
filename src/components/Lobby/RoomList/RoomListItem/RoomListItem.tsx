import { faEllipsis, faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tooltip from "../../../common/Tooltip/Tooltip";
import { Room } from "../RoomList";
import "./RoomListItem.css";

export interface RoomListItemProps {
  room: Room;
  onClick: () => void;
}

const RoomListItem = ({ room, onClick }: RoomListItemProps) => {
  return (
    <li data-testid="room-list-item">
      <button
        data-testid="room-list-item-button"
        className="roomListItemButton"
        onClick={onClick}
      >
        <span data-testid="room-list-item-name">{room.hostName}</span>
        <span className="roomListIconContainer">
          {room.hasPassword && (
            <>
              <span
                data-testid="room-list-item-lock-icon"
                data-tooltip-id="roomListPasscodeIcon"
              >
                <FontAwesomeIcon icon={faLock} />
              </span>
              <Tooltip anchorSelect={`[data-tooltip-id=roomListPasscodeIcon]`}>
                {"Requires Passcode"}
              </Tooltip>
            </>
          )}
          {room.isOngoing && (
            <>
              <span
                data-testid="room-list-item-in-progress-icon"
                data-tooltip-id="roomListInProgressIcon"
              >
                <FontAwesomeIcon icon={faEllipsis} />
              </span>
              <Tooltip
                anchorSelect={`[data-tooltip-id=roomListInProgressIcon]`}
              >
                {"Game In Progress"}
              </Tooltip>
            </>
          )}
          <span
            data-testid="room-list-item-player-count"
            data-tooltip-id="roomListPlayerCountIcon"
          >
            <FontAwesomeIcon icon={faUser} /> {room.playerCount}
          </span>
          <Tooltip anchorSelect={`[data-tooltip-id=roomListPlayerCountIcon]`}>
            {"Total Player Count"}
          </Tooltip>
        </span>
      </button>
    </li>
  );
};

export default RoomListItem;
