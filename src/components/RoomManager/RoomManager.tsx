import { useEffect, useState } from "react";
import BattleChessManager from "../BattleChessGame/BattleChessManager/BattleChessManager";
import { useGameState } from "../../context/GameStateContext";
import { useUserState } from "../../context/UserStateContext";
import { useModalState } from "../../context/ModalStateContext";
import { socket } from "../../socket";
import Room, { Player } from "./Room/Room";
import ChatToggle from "./Chat/ChatToggle/ChatToggle";
import { MatchHistory, Timer } from "../../../shared/types/game";
import { useMusicPlayer } from "../../util/useMusicPlayer";
import './RoomManager.css';

const RoomManager = () => {
  const { userState, dispatch: dispatchUserState } = useUserState();
  const { gameState, dispatch } = useGameState();
  const { dispatch: dispatchModalState } = useModalState();
  const [matchHistory, setMatchHistory] = useState<MatchHistory>();
  const [timers, setTimers] = useState<Timer>();

  const { stopSongs } = useMusicPlayer();
  useEffect(() => {
    stopSongs();
  }, []);

  useEffect(() => {
    socket.emit('joinRoom', userState.currentRoomId, userState.id, userState.name, userState.currentRoomCode);
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('startSync', ({ history }: { history: MatchHistory }) => {
      console.log('starting sync');
      console.log(history);
      setMatchHistory(history);
    });

    socket.io.on('reconnect', () => {
      console.log('reconnecting -- attempting resync');
      socket.emit('requestSync', userState.currentRoomId, userState.id);
    });

    socket.on('endGameFromDisconnect', ({ name, isHost }) => {
      if (isHost || !gameState.matchEnded) {
        dispatchModalState({
          type: 'OPEN_END_GAME_MODAL',
          payload: { modalProps: { reason: isHost ? 'HOST_DISCONNECTED' : 'PLAYER_DISCONNECTED', name } }
        });
      }
      if (isHost) {
        dispatchUserState({ type: 'LEAVE_ROOM' });
      }
    });

    socket.on('connectedPlayers', (players: Player[]) => {
      players.forEach((player) => {
        if (player.playerId === userState.id) {
          if (player.isHost && !gameState.isHost) {
            dispatch({ type: 'SET_HOST', payload: true });
          } else if (!player.isHost && gameState.isHost) {
            dispatch({ type: 'SET_HOST', payload: false });
          }
        }
      })

      dispatch({ type: 'SET_PLAYERS', payload: players });
    });

    socket.on('roomClosed', () => {
      dispatchUserState({ type: 'LEAVE_ROOM' });
    });

    socket.on('currentTimers', (timer: Timer) => {
      setTimers(timer);
    });

    socket.on('startGame', (settings) => {
      setMatchHistory(undefined);
      dispatch({ type: 'START_MATCH', payload: settings });
    });

    return () => {
      socket.off('connectedPlayers');
      socket.off('roomClosed');
      socket.off('endGameFromDisconnect');
      socket.off('startSync');
      socket.off('currentTimers');
      socket.off('startGame');
    }
  }, [gameState.matchEnded]);

  return (
    <>
      <div className='roomManagerContainer'>
        {
          gameState.inGame ?
          (<BattleChessManager matchHistory={matchHistory} timers={gameState.gameSettings.options.timersEnabled ? timers : undefined} />) :
          (<Room />)
        }
      </div>
      <ChatToggle className='chatToggleAction' />
    </>
  );
};

export default RoomManager;