import BattleChessManager from "../BattleChessGame/BattleChessManager/BattleChessManager";
import { useGameState } from "../../context/GameStateContext";
import Room from "./Room/Room";
import { useEffect } from "react";
import { useUserState } from "../../context/UserStateContext";
import { socket } from "../../socket";

const RoomManager = () => {
  const { userState, dispatch: dispatchUserState } = useUserState();
  const { gameState, dispatch } = useGameState();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
      socket.emit('joinRoom', userState.currentRoomId, userState.id, userState.name, userState.currentRoomCode);
      socket.on('endGameFromDisconnect', () => {
        dispatch({ type: 'RETURN_TO_ROOM' });
      });

      socket.on('hostDisconnected', () => {
        dispatchUserState({ type: 'LEAVE_ROOM' });
      });
    }
  }, [userState.currentRoomId]);

  return (
    <>
      <h1 className='mainMenuHeader'>Pokemon Battle Chess</h1>
      {
        gameState.matchStarted ?
        (<BattleChessManager />) :
        (<Room />)
      }
    </>
  );
};

export default RoomManager;