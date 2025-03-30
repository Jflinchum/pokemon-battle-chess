import PlayerName from "../PlayerName/PlayerName";
import { Player } from "../Room";
import './SpectatorList.css';

interface SpectatorListProps {
  players: Player[]
}

const SpectatorList = ({ players }: SpectatorListProps) => {

  return (
    <div className='spectatorListContainer'>
      <div className='spectatorList'>
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

export default SpectatorList;