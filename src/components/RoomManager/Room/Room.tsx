import { useEffect, useMemo, useState } from "react";
import { Color } from "chess.js";
import { Sprites } from "@pkmn/img";
import { useGameState } from "../../../context/GameStateContext";
import { socket } from "../../../socket";
import AnimatedBackground from "../../AnimatedBackground/AnimatedBackground";
import Button from "../../common/Button/Button";
import PlayerList from "./PlayerList/PlayerList";
import PlayerName from "./PlayerName/PlayerName";
import RoomOptions from "./RoomOptions/RoomOptions";
import { GameOptions } from "../../../../shared/types/GameOptions";
import GameManagerActions from "../../BattleChessGame/BattleChessManager/GameManagerActions/GameManagerActions";
import { useSocketRequests } from "../../../util/useSocketRequests";
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
  const { gameState } = useGameState();
  const [gameOptions, setGameOptions] = useState<GameOptions>(gameState.gameSettings.options);
  const connectedPlayers = useMemo(() => gameState.players, [gameState.players]);
  const { requestStartGame, requestToggleSpectating, requestChangeGameOptions } = useSocketRequests();

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

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('changeGameOptions');
    }
  }, []);

  const handleStartGame = (e: React.MouseEvent) => {
    e.preventDefault();
    setGameOptions(gameOptions);
    requestStartGame();
  }
  
  const handleToggleSpectating = () => {
    requestToggleSpectating();
  }

  const handleRoomOptionsChange = (options: GameOptions) => {
    if (options && gameState.isHost) {
      requestChangeGameOptions(options);
      setGameOptions(options);
    }
  }

  const player1 = useMemo(() => {
    return connectedPlayers.find((player) => player.isPlayer1);
  }, [connectedPlayers]);

  const player2 = useMemo(() => {
    return connectedPlayers.find((player) => player.isPlayer2);
  }, [connectedPlayers]);

  return (
    <>
      <GameManagerActions />
      <AnimatedBackground />
      <div className='roomContainer'>
        <div className='roomForm'>
          <div className="roomPlayerContainer">
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
            <div className='roomButtons'>
              <Button disabled={gameState.isSpectator ? (!!player1 && !!player2) : (false)} onClick={handleToggleSpectating}>
                {
                  gameState.isSpectator ?
                  'Stop Spectating' :
                  'Move to Spectators'
                }
              </Button>
              <Button
                color='primary'
                onClick={handleStartGame}
                disabled={!gameState.isHost || !player1 || !player2 || player1?.viewingResults || player2?.viewingResults}
              >
                  Start Game
              </Button>
            </div>

            <PlayerList players={connectedPlayers} />
          </div>
          <hr/>
          <RoomOptions isHost={gameState.isHost} gameOptions={gameOptions} onChange={handleRoomOptionsChange} />
        </div>
      </div>
    </>
  );
};

export default Room;