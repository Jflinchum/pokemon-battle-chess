import { Sprites } from "@pkmn/img";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDoorOpen, faEye } from "@fortawesome/free-solid-svg-icons";
import PlayerName from "../PlayerName/PlayerName";
import { Player } from "../Room";
import Button from "../../../common/Button/Button";
import { useGameState } from "../../../../context/GameStateContext";
import { useUserState } from "../../../../context/UserStateContext";
import { socket } from "../../../../socket";
import './PlayerList.css';

interface PlayerListProps {
  players: Player[]
}

const PlayerList = ({ players }: PlayerListProps) => {
  const { gameState } = useGameState();
  const { userState } = useUserState();

  const handleKickClick = (playerId: string) => {
    socket.emit('requestKickPlayer', userState.currentRoomId, userState.id, playerId);
  };

  const handleMovePlayerToSpectator = (playerId: string) => {
    socket.emit('requestMovePlayerToSpectator', userState.currentRoomId, userState.id, playerId)
  }

  return (
    <div className='playerListContainer'>
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
                      (player.isPlayer1 || player.isPlayer2) &&
                      <Button className='playerAction' title='Move Player To Spectator' onClick={() => handleMovePlayerToSpectator(player.playerId)}>
                        <FontAwesomeIcon icon={faEye}/>
                      </Button>
                    }
                    <Button className='playerAction' title='Kick Player' onClick={() => handleKickClick(player.playerId)}>
                      <FontAwesomeIcon icon={faDoorOpen}/>
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