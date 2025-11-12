import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { MatchHistory, Timer } from "../../../shared/types/Game";
import { useGameState } from "../../context/GameState/GameStateContext";
import { useMusicPlayer } from "../../util/useMusicPlayer";
import { useSocketRequests } from "../../util/useSocketRequests";
import BattleChessManager from "../BattleChessGame/BattleChessManager/BattleChessManager";
import ChatToggle from "./Chat/ChatToggle/ChatToggle";
import Room from "./Room/Room";
import "./RoomManager.css";
import { usePlayAgainstComputerUtil } from "./usePlayAgainstComputerUtil";
import { useRoomManagerSocketEvents } from "./useRoomManagerSocketEvents";

const RoomManager = () => {
  const { gameState, dispatch } = useGameState();
  const [matchHistory, setMatchHistory] = useState<MatchHistory>();
  const [timers, setTimers] = useState<Timer>();
  const timerIds = useRef<{ white?: NodeJS.Timeout; black?: NodeJS.Timeout }>(
    {},
  );
  const { requestJoinGame, requestSync, requestValidateTimers } =
    useSocketRequests();

  const { stopSongs } = useMusicPlayer();
  const { isUserInOfflineMode } = usePlayAgainstComputerUtil();

  useEffect(() => {
    if (!gameState.inGame) {
      stopSongs();
      toast.dismiss("new-game-notification");
    }
  }, [gameState.inGame, stopSongs]);

  useEffect(() => {
    const joinRoomOnMount = async () => {
      try {
        await requestJoinGame();
      } catch (err) {
        toast(`Error: ${err}`, { type: "error" });
      }
    };

    if (!isUserInOfflineMode()) {
      joinRoomOnMount();
    }
  }, [requestJoinGame, isUserInOfflineMode, dispatch]);

  const updateTimers = (timer: Timer) => {
    setTimers(timer);

    if (!timer.white.pause) {
      clearTimeout(timerIds.current.white);
      timerIds.current.white = setTimeout(() => {
        requestValidateTimers();
      }, timer.white.timerExpiration - new Date().getTime());
    } else {
      clearTimeout(timerIds.current.white);
    }

    if (!timer.black.pause) {
      clearTimeout(timerIds.current.black);
      timerIds.current.black = setTimeout(() => {
        requestValidateTimers();
      }, timer.black.timerExpiration - new Date().getTime());
    } else {
      clearTimeout(timerIds.current.black);
    }
  };

  useRoomManagerSocketEvents(setMatchHistory, requestSync, updateTimers);

  return (
    <>
      <div className="roomManagerContainer">
        {gameState.inGame ? (
          <BattleChessManager
            matchHistory={matchHistory}
            timers={
              gameState.gameSettings.options.timersEnabled ? timers : undefined
            }
          />
        ) : (
          <Room />
        )}
      </div>
      {!gameState.inGame && !isUserInOfflineMode() ? (
        <ChatToggle className="chatToggleAction" />
      ) : null}
    </>
  );
};

export default RoomManager;
