import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faBookOpen, faEye } from "@fortawesome/free-solid-svg-icons";
import { Player } from "../Room";
import './PlayerName.css';

interface PlayerNameProps {
  player: Player;
}

const PlayerName = ({ player }: PlayerNameProps) => {
  return (
    <span>
      {
        player.isHost ? (
          <FontAwesomeIcon icon={faCrown} className='nameIcon' title='Host'/>
        ) : null
      }
      {
        player.viewingResults ? (
          <FontAwesomeIcon icon={faBookOpen} className='nameIcon' title='Viewing Results' />
        ) : null
      }
      {
        player.isSpectator ? (
          <FontAwesomeIcon icon={faEye} className='nameIcon' title='Spectating' />
        ) : null
      }
      {player.playerName}
    </span>
  );
};

export default PlayerName;