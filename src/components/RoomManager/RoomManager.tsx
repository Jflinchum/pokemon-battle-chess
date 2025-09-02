import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import BattleChessManager from "../BattleChessGame/BattleChessManager/BattleChessManager";
import { useGameState } from "../../context/GameState/GameStateContext";
import { useUserState } from "../../context/UserState/UserStateContext";
import { useModalState } from "../../context/ModalState/ModalStateContext";
import { socket } from "../../socket";
import Room from "./Room/Room";
import ChatToggle from "./Chat/ChatToggle/ChatToggle";
import { MatchHistory, Timer } from "../../../shared/types/Game";
import { Player } from "../../../shared/types/Player";
import { useMusicPlayer } from "../../util/useMusicPlayer";
import { useSocketRequests } from "../../util/useSocketRequests";
import "./RoomManager.css";

const RoomManager = () => {
  const { userState, dispatch: dispatchUserState } = useUserState();
  const { gameState, dispatch } = useGameState();
  const { dispatch: dispatchModalState } = useModalState();
  const [matchHistory, setMatchHistory] = useState<MatchHistory>();
  const [timers, setTimers] = useState<Timer>();
  const timerIds = useRef<{ white?: NodeJS.Timeout; black?: NodeJS.Timeout }>(
    {},
  );
  const { requestJoinGame, requestSync, requestValidateTimers } =
    useSocketRequests();

  const { stopSongs } = useMusicPlayer();

  useEffect(() => {
    if (!gameState.inGame) {
      stopSongs();
      toast.dismiss("new-game-notification");
    }
  }, [gameState.inGame, stopSongs]);

  useEffect(() => {
    requestJoinGame();
  }, [requestJoinGame]);

  useEffect(() => {
    const setTimerValidationTimeouts = (timers: Timer) => {
      if (!timers.white.pause) {
        clearTimeout(timerIds.current.white);
        timerIds.current.white = setTimeout(() => {
          requestValidateTimers();
        }, timers.white.timerExpiration - new Date().getTime());
      } else {
        clearTimeout(timerIds.current.white);
      }

      if (!timers.black.pause) {
        clearTimeout(timerIds.current.black);
        timerIds.current.black = setTimeout(() => {
          requestValidateTimers();
        }, timers.black.timerExpiration - new Date().getTime());
      } else {
        clearTimeout(timerIds.current.black);
      }
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("startSync", ({ history }: { history: MatchHistory }, cb) => {
      console.log("starting sync");
      console.log(history);
      setMatchHistory(history);

      cb();
    });

    socket.io.on("reconnect", () => {
      console.log("reconnecting -- attempting resync");
      requestSync();
    });

    socket.on("endGameFromDisconnect", ({ name, isHost }) => {
      if (isHost || !gameState.matchEnded) {
        dispatchModalState({
          type: "OPEN_END_GAME_MODAL",
          payload: {
            modalProps: {
              reason: isHost ? "HOST_DISCONNECTED" : "PLAYER_DISCONNECTED",
              name,
            },
          },
        });
      }
      if (isHost) {
        dispatchUserState({ type: "LEAVE_ROOM" });
      }
    });

    socket.on("connectedPlayers", (players: Player[]) => {
      let isHost = false;
      let isSpectator = false;
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (player.playerId === userState.id) {
          isHost = player.isHost;
          isSpectator = player.isSpectator;
          break;
        }
      }

      dispatch({
        type: "SET_PLAYERS",
        payload: { players: players as Player[], isHost, isSpectator },
      });
    });

    socket.on("roomClosed", () => {
      dispatchUserState({ type: "LEAVE_ROOM" });
    });

    socket.on("currentTimers", (timer: Timer) => {
      setTimers(timer);
      setTimerValidationTimeouts(timer);
    });

    socket.on("startGame", (settings, isSyncing) => {
      if (!isSyncing) {
        setMatchHistory(undefined);
      }
      if (gameState.matchEnded && gameState.inGame) {
        /**
         * If the user is still viewing results from the previous game, let them know that returning to the room
         * will make them start spectating.
         */
        toast(
          "A new game has already started. Return to the room to begin spectating.",
          {
            type: "info",
            autoClose: false,
            toastId: "new-game-notification",
          },
        );
      }
      dispatch({ type: "START_MATCH", payload: settings });
    });

    socket.on("kickedFromRoom", (cb) => {
      dispatchUserState({ type: "LEAVE_ROOM" });
      dispatchModalState({
        type: "OPEN_GENERIC_MODAL",
        payload: {
          modalProps: {
            title: "Disconnected",
            body: "You were kicked from the game by the host.",
          },
        },
      });
      cb?.();
    });

    socket.on("health", (cb) => {
      cb();
    });

    return () => {
      socket.off("connectedPlayers");
      socket.off("roomClosed");
      socket.off("endGameFromDisconnect");
      socket.off("startSync");
      socket.off("currentTimers");
      socket.off("startGame");
      socket.off("kickedFromRoom");
      socket.io.off("reconnect");
    };
  }, [
    gameState.matchEnded,
    gameState.inGame,
    dispatch,
    dispatchModalState,
    dispatchUserState,
    userState.id,
    requestSync,
    requestValidateTimers,
  ]);

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
      {!gameState.inGame ? <ChatToggle className="chatToggleAction" /> : null}
    </>
  );
};

export default RoomManager;
