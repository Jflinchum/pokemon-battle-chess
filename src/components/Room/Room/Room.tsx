import { useEffect, useState } from "react";
import { useGameState } from "../../../context/GameStateContext";
import { useUserState } from "../../../context/UserStateContext";
import { socket } from "../../../socket";
import './Room.css';
import Button from "../../common/Button/Button";

interface Player {
  playerName: string;
  playerId: string;
  transient: boolean;
  viewingResults: boolean;
  isHost: boolean;
}

const buildDefaultPlayer = (playerName: string, playerId: string, isHost: boolean): Player => {
  return {
    playerName,
    playerId,
    transient: false,
    viewingResults: false,
    isHost,
  }
}

const Room = () => {
  const { userState, dispatch: dispatchUserState } = useUserState();
  const { gameState, dispatch } = useGameState();

  const [connectedPlayers, setConnectedPlayers] = useState<Player[]>([buildDefaultPlayer(userState.name, userState.id, gameState.isHost)]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('connected');
    });
    socket.on('disconnect', () => {
      console.log('disconnected');
    });

    socket.on('connectedPlayers', (players: Player[]) => {
      setConnectedPlayers(players);
    });

    socket.on('startGame', (gameOptions) => {
      dispatch({ type: 'START_MATCH', payload: gameOptions });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    }
  }, []);

  const handleStartGame = () => {
    socket.emit('requestStartGame', userState.currentRoomId, userState.id);
  }

  const handleLeaveGame = () => {
    dispatchUserState({ type: 'LEAVE_ROOM' });
  }

  return (
    <div className="roomContainer">
      <div>
        Connected Players:
        <ul className='roomPlayerList'>
          {connectedPlayers.map((player) => (
            <li key={player.playerId}>
              {player.playerName} - {player.isHost ? 'Host ' : ' '} {player.viewingResults ? 'Viewing results... ' : ' '}
            </li>
          ))}
        </ul>
      </div>

      <div className='roomButtons'>
        <Button colorPrimary='brown' onClick={handleLeaveGame}>Leave Game</Button>
        <Button colorPrimary='green' onClick={handleStartGame} disabled={!gameState.isHost || connectedPlayers.length < 2}>Start Game</Button>
      </div>
    </div>
  );
};

export default Room;