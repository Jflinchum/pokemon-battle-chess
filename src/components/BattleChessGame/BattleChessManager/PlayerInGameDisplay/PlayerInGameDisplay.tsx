import { Sprites } from "@pkmn/img";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlugCircleXmark } from "@fortawesome/free-solid-svg-icons";
import TakenChessPieces from "../../ChessManager/TakenChessPieces/TakenChessPieces";
import { PokemonPiece } from "../../../../../shared/models/PokemonBattleChessManager";
import { Timer as TimerType } from "../../../../../shared/types/Game.js";
import Timer from "../../../common/Timer/Timer";
import "./PlayerInGameDisplay.css";

interface PlayerInGameDisplayProps {
  playerAvatarId?: string;
  playerName?: string;
  connectionIssues?: boolean;
  takenChessPieces: PokemonPiece[];
  timer?: TimerType["white"] | TimerType["black"];
  className?: string;
}

const PlayerInGameDisplay = ({
  playerAvatarId,
  playerName,
  connectionIssues,
  takenChessPieces,
  timer,
  className = "",
}: PlayerInGameDisplayProps) => {
  if (!playerName && !playerAvatarId) {
    return null;
  }
  return (
    <div className={`playerGameDisplayContainer ${className}`}>
      <img
        className="playerGameDisplaySprite"
        src={Sprites.getAvatar(playerAvatarId || 1)}
      />
      <div className="nameContainer">
        {connectionIssues ? (
          <FontAwesomeIcon
            icon={faPlugCircleXmark}
            className="nameIcon"
            title="Connection Issues"
          />
        ) : null}
        {playerName}
      </div>
      <TakenChessPieces takenPieces={takenChessPieces} />
      {timer && (
        <Timer
          timerExpiration={timer.timerExpiration}
          paused={timer.pause}
          roundUpRenderedTime={!timer.hasStarted}
          className="playerTimer"
        />
      )}
    </div>
  );
};

export default PlayerInGameDisplay;
