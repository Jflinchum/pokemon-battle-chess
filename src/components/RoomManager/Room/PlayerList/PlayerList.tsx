import { Sprites } from "@pkmn/img";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faX } from "@fortawesome/free-solid-svg-icons";
import PlayerName from "../PlayerName/PlayerName";
import { Player } from "../../../../../shared/types/Player";
import Button from "../../../common/Button/Button";
import { useGameState } from "../../../../context/GameState/GameStateContext";
import { useUserState } from "../../../../context/UserState/UserStateContext";
import { useSocketRequests } from "../../../../util/useSocketRequests";
import "./PlayerList.css";
import Tooltip from "../../../common/Tooltip/Tooltip";

interface PlayerListProps extends React.HTMLAttributes<HTMLDivElement> {
  players: Player[];
}

const PlayerList = ({ players, className = "", ...props }: PlayerListProps) => {
  const { gameState } = useGameState();
  const { userState } = useUserState();
  const { requestKickPlayer, requestMovePlayerToSpectator } =
    useSocketRequests();

  const handleKickClick = (playerId: string) => {
    requestKickPlayer(playerId);
  };

  const handleMovePlayerToSpectator = (playerId: string) => {
    requestMovePlayerToSpectator(playerId);
  };

  return (
    <div {...props} className={`playerListContainer ${className}`}>
      <div className="playerList">
        <span>Players</span>
        <hr />
        <ul>
          {players.map((player) => (
            <li key={player.playerId}>
              <img
                className="playerListSprite"
                src={Sprites.getAvatar(player.avatarId || "1")}
              />
              <PlayerName className="playerListName" player={player} />

              {gameState.isHost && player.playerId !== userState.id && (
                <div className="playerActions">
                  {(player.isPlayer1 || player.isPlayer2) &&
                    !gameState.inGame && (
                      <>
                        <Button
                          data-tooltip-id="playerListMoveToSpectator"
                          className="playerAction"
                          onClick={() =>
                            handleMovePlayerToSpectator(player.playerId)
                          }
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                        <Tooltip
                          anchorSelect={`[data-tooltip-id=playerListMoveToSpectator]`}
                        >
                          {"Move Player To Spectator"}
                        </Tooltip>
                      </>
                    )}
                  <Button
                    className="playerAction"
                    data-tooltip-id="playerListKickPlayer"
                    onClick={() => handleKickClick(player.playerId)}
                  >
                    <FontAwesomeIcon icon={faX} />
                  </Button>
                  <Tooltip
                    anchorSelect={`[data-tooltip-id=playerListKickPlayer]`}
                  >
                    {"Kick Player"}
                  </Tooltip>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PlayerList;
