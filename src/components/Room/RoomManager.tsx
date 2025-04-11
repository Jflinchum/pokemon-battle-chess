import { useEffect, useState } from "react";
import BattleChessManager from "../BattleChessGame/BattleChessManager/BattleChessManager";
import { useGameState } from "../../context/GameStateContext";
import { useUserState } from "../../context/UserStateContext";
import { socket } from "../../socket";
import Room, { Player } from "./Room/Room";
import GameManagerActions from "./GameManagerActions/GameManagerActions";
import ChatToggle from "./GameManagerActions/ChatToggle/ChatToggle";
import './RoomManager.css';

export interface MatchHistory {
  banHistory: number[];
  chessMoveHistory: string[];
  pokemonAssignments: string[];
  pokemonBattleHistory: string[][];
}

const RoomManager = () => {
  const { userState, dispatch: dispatchUserState } = useUserState();
  const { gameState, dispatch } = useGameState();
  const [matchHistory, setMatchHistory] = useState<MatchHistory>();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('joinRoom', userState.currentRoomId, userState.id, userState.name, userState.currentRoomCode);

    socket.on('startSync', (matchHistory: MatchHistory) => {
      console.log('starting sync');
      console.log(matchHistory);
      setMatchHistory(matchHistory)
    });

    socket.io.on('reconnect', () => {
      console.log('reconnecting -- attempting resync');
      socket.emit('requestSync', userState.currentRoomId, userState.id);
    });

    socket.on('endGameFromDisconnect', () => {
      dispatch({ type: 'RETURN_TO_ROOM' });
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
    return () => {
      socket.off('connectedPlayers');
      socket.off('roomClosed');
      socket.off('endGameFromDisconnect');
      socket.off('startSync');
    }
  }, []);

  return (
    <>
      <GameManagerActions />
      <div className='roomManagerContainer'>
        {
          gameState.inGame ?
          (<BattleChessManager matchHistory={matchHistory} />) :
          (<Room />)
        }
      </div>
      <ChatToggle className='chatToggleAction' />
    </>
  );
};

export default RoomManager;