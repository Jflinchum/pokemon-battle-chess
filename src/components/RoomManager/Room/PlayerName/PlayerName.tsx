import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown,
  faBookOpen,
  faEye,
  faPlugCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Player } from "../../../../../shared/types/Player";
import "./PlayerName.css";

interface PlayerNameProps extends React.HTMLAttributes<HTMLSpanElement> {
  player: Player;
}

const PlayerName = ({ player, ...props }: PlayerNameProps) => {
  return (
    <span {...props}>
      {player.isHost ? (
        <FontAwesomeIcon icon={faCrown} className="nameIcon" title="Host" />
      ) : null}
      {player.viewingResults ? (
        <FontAwesomeIcon
          icon={faBookOpen}
          className="nameIcon"
          title="Viewing Results"
        />
      ) : null}
      {player.isSpectator ? (
        <FontAwesomeIcon icon={faEye} className="nameIcon" title="Spectating" />
      ) : null}
      {player.transient ? (
        <FontAwesomeIcon
          icon={faPlugCircleXmark}
          className="nameIcon"
          title="Connection Issues"
        />
      ) : null}
      {player.playerName}
    </span>
  );
};

export default PlayerName;
