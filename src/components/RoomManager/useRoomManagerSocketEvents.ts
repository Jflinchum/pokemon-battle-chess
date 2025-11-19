import { useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { MatchHistory, Timer } from "../../../shared/types/Game";
import { GameSettings } from "../../../shared/types/GameOptions";
import { Player } from "../../../shared/types/Player";
import { useGameState } from "../../context/GameState/GameStateContext";
import { useModalState } from "../../context/ModalState/ModalStateContext";
import { useUserState } from "../../context/UserState/UserStateContext";
import { socket } from "../../socket";
import { usePlayAgainstComputerUtil } from "./usePlayAgainstComputerUtil";

export const useRoomManagerSocketEvents = (
  setMatchHistory: (history?: MatchHistory) => void,
  requestSync: () => void,
  updateTimers: (timer: Timer) => void,
) => {
  const { userState, dispatch: dispatchUserState } = useUserState();
  const { gameState, dispatch } = useGameState();
  const { dispatch: dispatchModalState } = useModalState();

  const startSync = useCallback(
    ({ history }: { history: MatchHistory }, cb: () => void) => {
      console.debug("starting sync");
      console.debug(history);
      setMatchHistory(history);

      cb();
    },
    [setMatchHistory],
  );

  const reconnect = useCallback(() => {
    console.debug("reconnecting -- attempting resync");
    requestSync();
  }, [requestSync]);

  const connectedPlayers = useCallback(
    (players: Player[]) => {
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
    },
    [dispatch, userState.id],
  );

  const endGameFromDisconnect = useCallback(
    ({ name, isHost }: { name: string; isHost?: boolean }) => {
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
    },
    [dispatchModalState, dispatchUserState, gameState.matchEnded],
  );

  const roomClosed = useCallback(() => {
    dispatchUserState({ type: "LEAVE_ROOM" });
  }, [dispatchUserState]);

  const currentTimers = useCallback(
    (timer: Timer) => {
      updateTimers(timer);
    },
    [updateTimers],
  );

  const startGame = useCallback(
    (settings: GameSettings, isSyncing?: boolean) => {
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
      dispatch({
        type: "START_MATCH",
        payload: {
          settings,
          isSkippingAhead:
            settings.blackPlayer?.playerId === userState.id ||
            settings.whitePlayer?.playerId === userState.id,
        },
      });
    },
    [
      dispatch,
      gameState.matchEnded,
      gameState.inGame,
      userState.id,
      setMatchHistory,
    ],
  );

  const kickedFromRoom = useCallback(
    (cb?: () => void) => {
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
    },
    [dispatchUserState, dispatchModalState],
  );

  const { isUserInOfflineMode } = usePlayAgainstComputerUtil();

  useEffect(() => {
    if (isUserInOfflineMode()) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("startSync", startSync);

    socket.io.on("reconnect", reconnect);

    socket.on("endGameFromDisconnect", endGameFromDisconnect);

    socket.on("connectedPlayers", connectedPlayers);

    socket.on("roomClosed", roomClosed);

    socket.on("currentTimers", currentTimers);

    socket.on("startGame", startGame);

    socket.on("kickedFromRoom", kickedFromRoom);

    socket.on("connect", () => {
      console.debug("connected");
    });
    socket.on("disconnect", () => {
      console.debug("disconnected");
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
      socket.off("connect");
      socket.off("disconnect");
      socket.off("health");
      socket.io.off("reconnect");
    };
  }, [
    isUserInOfflineMode,
    kickedFromRoom,
    currentTimers,
    roomClosed,
    startSync,
    reconnect,
    connectedPlayers,
    endGameFromDisconnect,
    startGame,
  ]);
};
