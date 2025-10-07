import { Room } from "../RoomList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis, faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import Tooltip from "../../../common/Tooltip/Tooltip";
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
            <>
              <span data-tooltip-id="roomListPasscodeIcon">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <Tooltip anchorSelect={`[data-tooltip-id=roomListPasscodeIcon]`}>
                {"Requires Passcode"}
              </Tooltip>
            </>
          )}
          {room.isOngoing && (
            <>
              <span data-tooltip-id="roomListInProgressIcon">
                <FontAwesomeIcon icon={faEllipsis} />
              </span>
              <Tooltip
                anchorSelect={`[data-tooltip-id=roomListInProgressIcon]`}
              >
                {"Game In Progress"}
              </Tooltip>
            </>
          )}
          <span data-tooltip-id="roomListPlayerCountIcon">
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
