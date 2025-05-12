import PlayerName from "../PlayerName/PlayerName";
import { Player } from "../Room";
import './PlayerList.css';

interface PlayerListProps {
  players: Player[]
}

const PlayerList = ({ players }: PlayerListProps) => {

  return (
    <div className='playerListContainer'>
      <div className='playerList'>
        <span>Players</span>
        <hr/>
        <ul>
          {players.map((player) => (
            <li key={player.playerId}>
              <PlayerName player={player} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PlayerList;