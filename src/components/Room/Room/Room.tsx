import { useEffect, useMemo, useState } from "react";
import { Color } from "chess.js";
import { Sprites } from "@pkmn/img";
import { useGameState, GameOptions } from "../../../context/GameStateContext";
import { useUserState } from "../../../context/UserStateContext";
import { socket } from "../../../socket";
import AnimatedBackground from "../../AnimatedBackground/AnimatedBackground";
import Button from "../../common/Button/Button";
import SpectatorList from "./SpectatorList/SpectatorList";
import PlayerName from "./PlayerName/PlayerName";
import RoomOptions from "./RoomOptions/RoomOptions";
import './Room.css';

export interface Player {
  playerName: string;
  playerId: string;
  avatarId: string;
  transient: boolean;
  viewingResults: boolean;
  isHost: boolean;
  isPlayer1: boolean;
  isPlayer2: boolean;
  color: Color | null;
  isSpectator: boolean;
}

const Room = () => {
  const { userState } = useUserState();
  const { gameState, dispatch } = useGameState();
  const [gameOptions, setGameOptions] = useState<GameOptions>(gameState.gameSettings.options);
  const connectedPlayers = useMemo(() => gameState.players, [gameState.players]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('connected');
    });
    socket.on('disconnect', () => {
      console.log('disconnected');
    });

    socket.on('changeGameOptions', (options: GameOptions) => {
      if (!gameState.isHost) {
        setGameOptions(options);
      }
    });

    socket.on('startGame', (settings) => {
      dispatch({ type: 'START_MATCH', payload: settings });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('changeGameOptions');
      socket.off('startGame');
    }
  }, []);

  const handleStartGame = (e: React.MouseEvent) => {
    e.preventDefault();
    socket.emit('requestStartGame', userState.currentRoomId, userState.id);
  }
  
  const handleToggleSpectating = () => {
    socket.emit('requestToggleSpectating', userState.currentRoomId, userState.id);
  }

  const handleRoomOptionsChange = (options: GameOptions) => {
    if (options && gameState.isHost) {
      socket.emit('requestChangeGameOptions', userState.currentRoomId, userState.id, options);
      setGameOptions(options);
    }
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
    <>
      <div className='roomContainer'>
        <AnimatedBackground />
        <div className="roomPlayerContainer">
          <div className='roomButtons'>
            <Button
              color='primary'
              onClick={handleStartGame}
              disabled={!thisPlayer?.isHost || !player1 || !player2 || player1?.viewingResults || player2?.viewingResults}
            >
                Start Game
            </Button>
            <Button disabled={thisPlayer?.isSpectator ? (!!player1 && !!player2) : (false)} onClick={handleToggleSpectating}>
              {
                thisPlayer?.isSpectator ?
                'Stop Spectating' :
                'Move to Spectators'
              }
            </Button>
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
        <hr/>
        <RoomOptions isHost={thisPlayer?.isHost} gameOptions={gameOptions} onChange={handleRoomOptionsChange} />
      </div>
    </>
  );
};

export default Room;