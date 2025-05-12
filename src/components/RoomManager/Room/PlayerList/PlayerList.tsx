import { Sprites } from "@pkmn/img";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faX } from "@fortawesome/free-solid-svg-icons";
import PlayerName from "../PlayerName/PlayerName";
import { Player } from "../Room";
import Button from "../../../common/Button/Button";
import { useGameState } from "../../../../context/GameStateContext";
import { useUserState } from "../../../../context/UserStateContext";
import { socket } from "../../../../socket";
import './PlayerList.css';

interface PlayerListProps extends React.HTMLAttributes<HTMLDivElement> {
  players: Player[]
}

const PlayerList = ({ players, className = '', ...props }: PlayerListProps) => {
  const { gameState } = useGameState();
  const { userState } = useUserState();

  const handleKickClick = (playerId: string) => {
    socket.emit('requestKickPlayer', userState.currentRoomId, userState.id, playerId);
  };

  const handleMovePlayerToSpectator = (playerId: string) => {
    socket.emit('requestMovePlayerToSpectator', userState.currentRoomId, userState.id, playerId)
  }

  return (
    <div {...props} className={`playerListContainer ${className}`}>
      <div className='playerList'>
        <span>Players</span>
        <hr/>
        <ul>
          {players.map((player) => (
            <li key={player.playerId}>
              <img className='playerListSprite' src={Sprites.getAvatar(player.avatarId || '1')} />
              <PlayerName className='playerListName' player={player} />

              {
                gameState.isHost && player.playerId !== userState.id && (
                  <span className='playerActions'>
                    {
                      (player.isPlayer1 || player.isPlayer2) && !gameState.inGame &&
                      <Button className='playerAction' title='Move Player To Spectator' onClick={() => handleMovePlayerToSpectator(player.playerId)}>
                        <FontAwesomeIcon icon={faEye}/>
                      </Button>
                    }
                    <Button className='playerAction' title='Kick Player' onClick={() => handleKickClick(player.playerId)}>
                      <FontAwesomeIcon icon={faX}/>
                    </Button>
                  </span>
                )
              }
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PlayerList;