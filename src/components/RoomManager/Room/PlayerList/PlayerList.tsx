import { faEye, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Sprites } from "@pkmn/img";
import { toast } from "react-toastify";
import { Player } from "../../../../../shared/types/Player";
import { useGameState } from "../../../../context/GameState/GameStateContext";
import { useUserState } from "../../../../context/UserState/UserStateContext";
import { useSocketRequests } from "../../../../util/useSocketRequests";
import Button from "../../../common/Button/Button";
import Tooltip from "../../../common/Tooltip/Tooltip";
import PlayerName from "../PlayerName/PlayerName";
import "./PlayerList.css";

interface PlayerListProps extends React.HTMLAttributes<HTMLDivElement> {
  players: Player[];
}

const PlayerList = ({ players, className = "", ...props }: PlayerListProps) => {
  const { gameState } = useGameState();
  const { userState } = useUserState();
  const { requestKickPlayer, requestMovePlayerToSpectator } =
    useSocketRequests();

  const handleKickClick = async (playerId: string) => {
    try {
      await requestKickPlayer(playerId);
    } catch (err) {
      toast(`Error: ${err}`, { type: "error" });
    }
  };

  const handleMovePlayerToSpectator = async (playerId: string) => {
    try {
      await requestMovePlayerToSpectator(playerId);
    } catch (err) {
      toast(`Error: ${err}`, { type: "error" });
    }
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
                alt={`${player.playerName} Avatar`}
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
