import { useEffect, useMemo, useState } from "react";
import { useGameState } from "../../../context/GameStateContext";
import { useUserState } from "../../../context/UserStateContext";
import { socket } from "../../../socket";
import './Room.css';
import Button from "../../common/Button/Button";
import { Sprites } from "@pkmn/img";
import SpectatorList from "./SpectatorList/SpectatorList";
import PlayerName from "./PlayerName/PlayerName";

export interface Player {
  playerName: string;
  playerId: string;
  avatarId: string;
  transient: boolean;
  viewingResults: boolean;
  isHost: boolean;
  isPlayer1: boolean;
  isPlayer2: boolean;
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
    isPlayer1: false,
    isPlayer2: false,
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
  
  const handleToggleSpectating = () => {
    socket.emit('requestToggleSpectating', userState.currentRoomId, userState.id);
  }

  const player1 = useMemo(() => {
    return connectedPlayers.find((player) => player.isPlayer1);
  }, [connectedPlayers]);

  const player2 = useMemo(() => {
    return connectedPlayers.find((player) => player.isPlayer2);
  }, [connectedPlayers]);

  const thisPlayer = useMemo(() => {
    return connectedPlayers.find((player) => player.playerId === userState.id);
  }, [connectedPlayers])

  return (
    <div className="roomContainer">
      <div className='roomButtons'>
        <Button
          colorPrimary='green'
          onClick={handleStartGame}
          disabled={!gameState.isHost || !player1 || !player2 || player1?.viewingResults || player2?.viewingResults}
        >
            Start Game
        </Button>
        <Button disabled={thisPlayer?.isSpectator ? (!!player1 && !!player2) : (false)} colorPrimary='blue' onClick={handleToggleSpectating}>
          {
            thisPlayer?.isSpectator ?
            'Stop Spectating' :
            'Move to Spectators'
          }
        </Button>
        <Button colorPrimary='brown' onClick={handleLeaveGame}>Leave Game</Button>
      </div>

      <div className='playerContainer'>
        <div className='player'>
          {
            player1 ? (
              <>
                <img src={Sprites.getAvatar(player1?.avatarId || '1')} />
                <PlayerName player={player1}/>
              </>
            ) : null
          }
        </div>
        <span>vs</span>
        <div className='player'>
          {
            player2 ? (
              <>
                <img src={Sprites.getAvatar(player2?.avatarId || '1')} />
                <PlayerName player={player2}/>
              </>
            ) : null
          }
        </div>
      </div>

      <SpectatorList players={connectedPlayers} />
    </div>
  );
};

export default Room;