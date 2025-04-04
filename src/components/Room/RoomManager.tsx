import { useEffect } from "react";
import BattleChessManager from "../BattleChessGame/BattleChessManager/BattleChessManager";
import { useGameState } from "../../context/GameStateContext";
import { useUserState } from "../../context/UserStateContext";
import { socket } from "../../socket";
import Room, { Player } from "./Room/Room";
import GameManagerActions from "./GameManagerActions/GameManagerActions";

const RoomManager = () => {
  const { userState, dispatch: dispatchUserState } = useUserState();
  const { gameState, dispatch } = useGameState();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('joinRoom', userState.currentRoomId, userState.id, userState.name, userState.currentRoomCode);
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

    socket.on('hostDisconnected', () => {
      dispatchUserState({ type: 'LEAVE_ROOM' });
    });
    return () => {
      socket.off('connectedPlayers');
      socket.off('hostDisconnected');
    }
  }, []);

  return (
    <>
      <h1 className='mainMenuHeader'>Pokemon Chess Arena</h1>
      {
        gameState.matchStarted ?
        (<BattleChessManager />) :
        (<Room />)
      }
      <GameManagerActions />
    </>
  );
};

export default RoomManager;