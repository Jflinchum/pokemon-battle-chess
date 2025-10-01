import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown,
  faBookOpen,
  faEye,
  faPlugCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Player } from "../../../../../shared/types/Player";
import "./PlayerName.css";

export interface PlayerNameProps extends React.HTMLAttributes<HTMLSpanElement> {
  player: Player;
}

const PlayerName = ({ player, ...props }: PlayerNameProps) => {
  return (
    <span {...props}>
      {player.isHost ? (
        <FontAwesomeIcon
          icon={faCrown}
          className="nameIcon"
          title="Host"
          data-testid="player-host-icon"
        />
      ) : null}
      {player.viewingResults ? (
        <FontAwesomeIcon
          icon={faBookOpen}
          className="nameIcon"
          title="Viewing Results"
          data-testid="player-viewing-results-icon"
        />
      ) : null}
      {player.isSpectator ? (
        <FontAwesomeIcon
          icon={faEye}
          className="nameIcon"
          title="Spectating"
          data-testid="player-spectator-icon"
        />
      ) : null}
      {player.transient ? (
        <FontAwesomeIcon
          icon={faPlugCircleXmark}
          className="nameIcon"
          title="Connection Issues"
          data-testid="player-transient-icon"
        />
      ) : null}
      {player.playerName}
    </span>
  );
};

export default PlayerName;
