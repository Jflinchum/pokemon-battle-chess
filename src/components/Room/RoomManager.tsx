import { useEffect, useState } from "react";
import BattleChessManager from "../BattleChessGame/BattleChessManager/BattleChessManager";
import { useGameState } from "../../context/GameStateContext";
import { useUserState } from "../../context/UserStateContext";
import { useModalState } from "../../context/ModalStateContext";
import { socket } from "../../socket";
import Room, { Player } from "./Room/Room";
import GameManagerActions from "./GameManagerActions/GameManagerActions";
import ChatToggle from "./GameManagerActions/ChatToggle/ChatToggle";
import { MatchHistory, Timer } from "../../../shared/types/game";
import './RoomManager.css';

const RoomManager = () => {
  const { userState, dispatch: dispatchUserState } = useUserState();
  const { gameState, dispatch } = useGameState();
  const { dispatch: dispatchModalState } = useModalState();
  const [matchHistory, setMatchHistory] = useState<MatchHistory>();
  const [timers, setTimers] = useState<Timer>();

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

    socket.on('currentTimers', (timer) => {
      console.log('received timers');
      console.log(timer);
      setTimers(timer);
    });

    return () => {
      socket.off('connectedPlayers');
      socket.off('roomClosed');
      socket.off('endGameFromDisconnect');
      socket.off('startSync');
      socket.off('currentTimers');
    }
  }, [gameState.matchEnded]);

  return (
    <>
      <GameManagerActions />
      <div className='roomManagerContainer'>
        {
          gameState.inGame ?
          (<BattleChessManager matchHistory={matchHistory} timers={timers} />) :
          (<Room />)
        }
      </div>
      <ChatToggle className='chatToggleAction' />
    </>
  );
};

export default RoomManager;