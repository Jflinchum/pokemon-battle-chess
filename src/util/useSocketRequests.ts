import { Square } from "chess.js";
import { useCallback, useMemo } from "react";
import { GameOptions } from "../../shared/types/GameOptions";
import {
  CommonClientArgs,
  CommonServerResponse,
} from "../../shared/types/Socket";
import { usePlayAgainstComputerUtil } from "../components/RoomManager/usePlayAgainstComputerUtil";
import { useUserState } from "../context/UserState/UserStateContext";
import { socket } from "../socket";

const SOCKET_TIMEOUT = 10 * 1000;

const handleCommonServerResponse = (
  {
    err,
    resp,
  }: {
    err: Error;
    resp?: CommonServerResponse;
  },
  {
    resolve,
    reject,
  }: { resolve: (s?: string) => void; reject: (s?: string) => void },
) => {
  if (err) {
    console.trace();
    console.error(err);
    return reject("Could not connect to the server. Please try again");
  } else if (resp?.status === "err") {
    console.trace();
    console.error(resp);
    return reject(resp.message);
  } else {
    return resolve(resp?.status);
  }
};

export const useSocketRequests = () => {
  const { userState } = useUserState();
  const commonClientArgs: CommonClientArgs = useMemo(
    () => ({
      playerId: userState.id,
      roomId: userState.currentRoomId,
      secretId: userState.secretId,
    }),
    [userState.id, userState.currentRoomId, userState.secretId],
  );
  const { isUserInOfflineMode } = usePlayAgainstComputerUtil();

  const requestChessMove = useCallback(
    (sanMove: string) => {
      if (isUserInOfflineMode()) return Promise.resolve();
      return new Promise((resolve, reject) => {
        socket
          .timeout(SOCKET_TIMEOUT)
          .emit(
            "requestChessMove",
            { sanMove, ...commonClientArgs },
            (err, resp) =>
              handleCommonServerResponse({ err, resp }, { resolve, reject }),
          );
      });
    },
    [commonClientArgs, isUserInOfflineMode],
  );

  const requestDraftPokemon = useCallback(
    (square: Square, draftPokemonIndex: number) => {
      if (isUserInOfflineMode()) return Promise.resolve();
      return new Promise((resolve, reject) => {
        socket.timeout(SOCKET_TIMEOUT).emit(
          "requestDraftPokemon",
          {
            square,
            draftPokemonIndex,
            ...commonClientArgs,
          },
          (err, resp) =>
            handleCommonServerResponse({ err, resp }, { resolve, reject }),
        );
      });
    },
    [commonClientArgs, isUserInOfflineMode],
  );

  const requestBanPokemon = useCallback(
    (draftPokemonIndex: number) => {
      if (isUserInOfflineMode()) return Promise.resolve();
      return new Promise((resolve, reject) => {
        socket.timeout(SOCKET_TIMEOUT).emit(
          "requestDraftPokemon",
          {
            draftPokemonIndex,
            isBan: true,
            ...commonClientArgs,
          },
          (err, resp) =>
            handleCommonServerResponse({ err, resp }, { resolve, reject }),
        );
      });
    },
    [commonClientArgs, isUserInOfflineMode],
  );

  const requestPokemonMove = useCallback(
    (pokemonMove: string) => {
      if (isUserInOfflineMode()) return Promise.resolve();
      return new Promise((resolve, reject) => {
        socket
          .timeout(SOCKET_TIMEOUT)
          .emit(
            "requestPokemonMove",
            { pokemonMove, ...commonClientArgs },
            (err, resp) =>
              handleCommonServerResponse({ err, resp }, { resolve, reject }),
          );
      });
    },
    [commonClientArgs, isUserInOfflineMode],
  );

  const requestValidateTimers = useCallback(() => {
    if (isUserInOfflineMode()) return;
    socket.emit("requestValidateTimers", { ...commonClientArgs });
  }, [commonClientArgs, isUserInOfflineMode]);

  const requestSetViewingResults = useCallback(
    (viewingResults: boolean) => {
      if (isUserInOfflineMode()) return;
      socket.emit("setViewingResults", { viewingResults, ...commonClientArgs });
    },
    [commonClientArgs, isUserInOfflineMode],
  );

  const requestReturnEveryoneToRoom = useCallback(() => {
    if (isUserInOfflineMode()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      socket
        .timeout(SOCKET_TIMEOUT)
        .emit("requestEndGameAsHost", commonClientArgs, (err, resp) =>
          handleCommonServerResponse({ err, resp }, { resolve, reject }),
        );
    });
  }, [commonClientArgs, isUserInOfflineMode]);

  const requestStartGame = useCallback(() => {
    if (isUserInOfflineMode()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      socket
        .timeout(SOCKET_TIMEOUT)
        .emit("requestStartGame", commonClientArgs, (err, resp) =>
          handleCommonServerResponse({ err, resp }, { resolve, reject }),
        );
    });
  }, [commonClientArgs, isUserInOfflineMode]);

  const requestToggleSpectating = useCallback(() => {
    if (isUserInOfflineMode()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      socket
        .timeout(SOCKET_TIMEOUT)
        .emit("requestToggleSpectating", commonClientArgs, (err, resp) =>
          handleCommonServerResponse({ err, resp }, { resolve, reject }),
        );
    });
  }, [commonClientArgs, isUserInOfflineMode]);

  const requestChangeGameOptions = useCallback(
    (options: GameOptions) => {
      if (isUserInOfflineMode()) return Promise.resolve();
      return new Promise((resolve, reject) => {
        socket
          .timeout(SOCKET_TIMEOUT)
          .emit(
            "requestChangeGameOptions",
            { options, ...commonClientArgs },
            (err, resp) =>
              handleCommonServerResponse({ err, resp }, { resolve, reject }),
          );
      });
    },
    [commonClientArgs, isUserInOfflineMode],
  );

  const requestKickPlayer = useCallback(
    (playerId: string) => {
      if (isUserInOfflineMode()) return Promise.resolve();
      return new Promise((resolve, reject) => {
        socket.timeout(SOCKET_TIMEOUT).emit(
          "requestKickPlayer",
          {
            kickedPlayerId: playerId,
            ...commonClientArgs,
          },
          (err, resp) =>
            handleCommonServerResponse({ err, resp }, { resolve, reject }),
        );
      });
    },
    [commonClientArgs, isUserInOfflineMode],
  );

  const requestMovePlayerToSpectator = useCallback(
    (playerId: string) => {
      if (isUserInOfflineMode()) return Promise.resolve();
      return new Promise((resolve, reject) => {
        socket.timeout(SOCKET_TIMEOUT).emit(
          "requestMovePlayerToSpectator",
          {
            spectatorPlayerId: playerId,
            ...commonClientArgs,
          },
          (err, resp) =>
            handleCommonServerResponse({ err, resp }, { resolve, reject }),
        );
      });
    },
    [commonClientArgs, isUserInOfflineMode],
  );

  const requestJoinGame = useCallback(() => {
    if (isUserInOfflineMode()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      socket.timeout(SOCKET_TIMEOUT).emit(
        "joinRoom",
        {
          roomCode: userState.currentRoomCode,
          ...commonClientArgs,
        },
        (err, resp) =>
          handleCommonServerResponse({ err, resp }, { resolve, reject }),
      );
    });
  }, [userState.currentRoomCode, isUserInOfflineMode, commonClientArgs]);

  const requestSync = useCallback(() => {
    if (isUserInOfflineMode()) return;
    socket.emit("requestSync", commonClientArgs);
  }, [commonClientArgs, isUserInOfflineMode]);

  const sendChatMessage = useCallback(
    (message: string) => {
      if (isUserInOfflineMode()) return;
      socket.emit("sendChatMessage", { message, ...commonClientArgs });
    },
    [commonClientArgs, isUserInOfflineMode],
  );

  const requestMatchSearch = useCallback(
    (matchQueue: "random" | "draft") => {
      return new Promise((resolve, reject) => {
        socket.timeout(SOCKET_TIMEOUT).emit(
          "matchSearch",
          {
            playerId: userState.id,
            playerName: userState.name,
            avatarId: userState.avatarId,
            secretId: userState.secretId,
            matchQueue,
          },
          (err, resp) =>
            handleCommonServerResponse({ err, resp }, { resolve, reject }),
        );
      });
    },
    [userState.id, userState.name, userState.avatarId, userState.secretId],
  );

  return {
    requestChessMove,
    requestDraftPokemon,
    requestBanPokemon,
    requestPokemonMove,
    requestValidateTimers,
    requestSetViewingResults,
    requestReturnEveryoneToRoom,
    requestStartGame,
    requestToggleSpectating,
    requestChangeGameOptions,
    requestKickPlayer,
    requestMovePlayerToSpectator,
    requestJoinGame,
    requestSync,
    sendChatMessage,
    requestMatchSearch,
  };
};
