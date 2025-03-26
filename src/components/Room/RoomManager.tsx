import BattleChessManager from "../BattleChessGame/BattleChessManager/BattleChessManager";
import { useGameState } from "../../context/GameStateContext";
import Room from "./Room/Room";
import { useEffect } from "react";
import { useUserState } from "../../context/UserStateContext";
import { socket } from "../../socket";

const RoomManager = () => {
  const { userState } = useUserState();
  const { gameState } = useGameState();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
      socket.emit('joinRoom', userState.currentRoomId, userState.id, userState.name);
    }
  }, [userState.currentRoomId]);

  return (
    <div>
      {
        gameState.matchStarted ?
        (<BattleChessManager />) :
        (<Room />)
      }
    </div>
  );
};

export default RoomManager;