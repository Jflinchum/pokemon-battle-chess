import { Sprites } from "@pkmn/img";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlugCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { Player } from "../../../../../shared/types/Player";
import TakenChessPieces from "../../ChessManager/TakenChessPieces/TakenChessPieces";
import { PokemonPiece } from "../../../../../shared/models/PokemonBattleChessManager";
import { Timer as TimerType } from "../../../../../shared/types/Game.js";
import Timer from "../../../common/Timer/Timer";
import "./PlayerInGameDisplay.css";

interface PlayerInGameDisplayProps {
  player?: Player;
  connectionIssues?: boolean;
  takenChessPieces: PokemonPiece[];
  timer?: TimerType["white"] | TimerType["black"];
  className?: string;
}

const PlayerInGameDisplay = ({
  player,
  connectionIssues,
  takenChessPieces,
  timer,
  className = "",
}: PlayerInGameDisplayProps) => {
  if (!player) {
    return null;
  }
  return (
    <div className={`playerGameDisplayContainer ${className}`}>
      <img
        className="playerGameDisplaySprite"
        src={Sprites.getAvatar(player.avatarId || 1)}
      />
      <div className="nameContainer">
        {connectionIssues ? (
          <FontAwesomeIcon
            icon={faPlugCircleXmark}
            className="nameIcon"
            title="Connection Issues"
          />
        ) : null}
        {player?.playerName}
      </div>
      <TakenChessPieces takenPieces={takenChessPieces} />
      {timer && (
        <Timer
          timerExpiration={timer.timerExpiration}
          paused={timer.pause}
          hasStarted={timer.hasStarted}
          className="playerTimer"
        />
      )}
    </div>
  );
};

export default PlayerInGameDisplay;
