import { Sprites } from "@pkmn/img";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlugCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { Player } from "../../../../../shared/types/Player";
import TakenChessPieces from "../../ChessManager/TakenChessPieces/TakenChessPieces";
import { PokemonPiece } from "../../../../../shared/models/PokemonBattleChessManager";
import { Timer as TimerType } from "../../../../../shared/types/game";
import Timer from "../../../common/Timer/Timer";
import { useGameState } from "../../../../context/GameStateContext";
import './PlayerInGameDisplay.css';

interface PlayerInGameDisplayProps {
  player?: Player;
  takenChessPieces: PokemonPiece[];
  timer?: TimerType['white'] | TimerType['black'];
}

const PlayerInGameDisplay = ({ player, takenChessPieces, timer }: PlayerInGameDisplayProps) => {
  const { gameState } = useGameState();
  if (!player) {
    return null;
  }
  return (
    <div className='playerGameDisplayContainer'>
      <img className='playerGameDisplaySprite' src={Sprites.getAvatar(player.avatarId || 1)} />
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
      {
        timer && (
          <Timer
            timerExpiration={timer.timerExpiration}
            paused={timer.pause}
            hasStarted={timer.hasStarted}
            startingTime={gameState.gameSettings.options.chessTimerDuration * 60 * 1000}
            className='playerTimer'
          />
        )
      }
    </div>
  );
};

export default PlayerInGameDisplay;