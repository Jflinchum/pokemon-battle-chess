import { useEffect, useMemo, useState } from "react";
import { useGameState } from "../../../context/GameStateContext";
import { useUserState } from "../../../context/UserStateContext";
import { socket } from "../../../socket";
import './Room.css';
import Button from "../../common/Button/Button";
import { Sprites } from "@pkmn/img";

interface Player {
  playerName: string;
  playerId: string;
  avatarId: string;
  transient: boolean;
  viewingResults: boolean;
  isHost: boolean;
  isClient: boolean;
  isSpectator: boolean;
}

const buildDefaultPlayer = (playerName: string, playerId: string, avatarId: string, isHost: boolean): Player => {
  return {
    playerName,
    playerId,
    avatarId,
    transient: false,
    viewingResults: false,
    isHost,
    isClient: !isHost,
    isSpectator: false,
  }
}

const Room = () => {
  const { userState, dispatch: dispatchUserState } = useUserState();
  const { gameState, dispatch } = useGameState();

  const [connectedPlayers, setConnectedPlayers] = useState<Player[]>([buildDefaultPlayer(userState.name, userState.id, userState.avatarId, gameState.isHost)]);

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

  const hostPlayer = useMemo(() => {
    return connectedPlayers.find((player) => player.isHost);
  }, [connectedPlayers]);

  const clientPlayer = useMemo(() => {
    return connectedPlayers.find((player) => player.isClient);
  }, [connectedPlayers]);

  return (
    <div className="roomContainer">
      <div className='roomButtons'>
        <Button colorPrimary='green' onClick={handleStartGame} disabled={!gameState.isHost || connectedPlayers.length < 2}>Start Game</Button>
        <Button colorPrimary='brown' onClick={handleLeaveGame}>Leave Game</Button>
      </div>

      <div className='playerContainer'>
        <div className='player'>
          <img src={Sprites.getAvatar(hostPlayer?.avatarId || '1')} />
          <span>{hostPlayer?.playerName}</span>
        </div>
        <span>vs</span>
        <div className='player'>
          {
            clientPlayer ? (
              <>
                <img src={Sprites.getAvatar(clientPlayer?.avatarId || '1')} />
                <span>{clientPlayer?.playerName}</span>
              </>
            ) : null
          }
        </div>
      </div>

      <div className='spectatorList'>
        <span>Spectators</span>
        <hr/>
        <ul>
          {connectedPlayers.map((player) => (
            player.isSpectator ? 
            (
              <li key={player.playerId}>
                {player.playerName} - {player.isHost ? 'Host ' : ' '} {player.viewingResults ? 'Viewing results... ' : ' '}
              </li>
            ) : null
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Room;