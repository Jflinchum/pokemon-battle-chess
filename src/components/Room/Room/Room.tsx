import { useEffect, useState } from "react";
import { useGameState } from "../../../context/GameStateContext";
import { useUserState } from "../../../context/UserStateContext";
import { socket } from "../../../socket";
import './Room.css';

const Room = () => {
  const { userState, dispatch: dispatchUserState } = useUserState();
  const { gameState, dispatch } = useGameState();

  const [connectedPlayers, setConnectedPlayers] = useState([userState.name]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('connected');
    });
    socket.on('disconnect', () => {
      console.log('disconnected');
    });

    socket.on('connectedPlayers', (playerNames) => {
      setConnectedPlayers(playerNames);
    });

    socket.on('playerDisconnected', (playerName) => {
      setConnectedPlayers((curr) => curr.filter((name) => name !== playerName));
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
        Room: {userState.currentRoomId}
      </div>

      <div>
        Connected Players:
        <ul>
          {connectedPlayers.map((player, index) => (
            <li key={index}>
              {player}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={handleStartGame} disabled={!gameState.isHost || connectedPlayers.length < 2}>Start Game</button>
      <button onClick={handleLeaveGame}>Leave Game</button>
    </div>
  );
};

export default Room;