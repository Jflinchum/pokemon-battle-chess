import { Sprites } from "@pkmn/img";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlugCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { Player } from "../../../Room/Room/Room";
import './PlayerInGameDisplay.css';

interface PlayerInGameDisplayProps {
  player?: Player;
}

const PlayerInGameDisplay = ({ player }: PlayerInGameDisplayProps) => {
  if (!player) {
    return null;
  }
  return (
    <div className='playerGameDisplayContainer'>
      <img src={Sprites.getAvatar(player.avatarId || 1)} />
      <div className='nameContainer'>
        {
          player.transient ? (
            <FontAwesomeIcon icon={faPlugCircleXmark} className='nameIcon' title='Connection Issues' />
          ) : null
        }
        {player?.playerName}
      </div>
    </div>
  );
};

export default PlayerInGameDisplay;