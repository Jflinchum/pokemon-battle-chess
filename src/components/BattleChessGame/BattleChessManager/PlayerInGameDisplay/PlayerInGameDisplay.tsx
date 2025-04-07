import { Sprites } from "@pkmn/img";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlugCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { Player } from "../../../Room/Room/Room";
import TakenChessPieces from "../../ChessManager/TakenChessPieces/TakenChessPieces";
import { PokemonPiece } from "../../PokemonManager/PokemonBattleChessManager";
import './PlayerInGameDisplay.css';

interface PlayerInGameDisplayProps {
  player?: Player;
  takenChessPieces: PokemonPiece[];
}

const PlayerInGameDisplay = ({ player, takenChessPieces }: PlayerInGameDisplayProps) => {
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
      <TakenChessPieces
        takenPieces={takenChessPieces}
      />
    </div>
  );
};

export default PlayerInGameDisplay;