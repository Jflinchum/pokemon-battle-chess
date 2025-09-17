import { Square } from "chess.js";
import { useCallback, useMemo } from "react";
import { socket } from "../socket";
import { useUserState } from "../context/UserState/UserStateContext";
import { GameOptions } from "../../shared/types/GameOptions";
import {
  CommonClientArgs,
  CommonServerResponse,
} from "../../shared/types/Socket";

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
    return reject("Could not connect to the server");
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

  const requestChessMove = useCallback(
    (sanMove: string) => {
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
    [commonClientArgs],
  );

  const requestDraftPokemon = useCallback(
    (square: Square, draftPokemonIndex: number) => {
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
    [commonClientArgs],
  );

  const requestBanPokemon = useCallback(
    (draftPokemonIndex: number) => {
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
    [commonClientArgs],
  );

  const requestPokemonMove = useCallback(
    (pokemonMove: string) => {
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
    [commonClientArgs],
  );

  const requestValidateTimers = useCallback(() => {
    socket.emit("requestValidateTimers", { ...commonClientArgs });
  }, [commonClientArgs]);

  const requestSetViewingResults = useCallback(
    (viewingResults: boolean) => {
      socket.emit("setViewingResults", { viewingResults, ...commonClientArgs });
    },
    [commonClientArgs],
  );

  const requestReturnEveryoneToRoom = useCallback(() => {
    return new Promise((resolve, reject) => {
      socket
        .timeout(SOCKET_TIMEOUT)
        .emit("requestEndGameAsHost", commonClientArgs, (err, resp) =>
          handleCommonServerResponse({ err, resp }, { resolve, reject }),
        );
    });
  }, [commonClientArgs]);

  const requestStartGame = useCallback(() => {
    return new Promise((resolve, reject) => {
      socket
        .timeout(SOCKET_TIMEOUT)
        .emit("requestStartGame", commonClientArgs, (err, resp) =>
          handleCommonServerResponse({ err, resp }, { resolve, reject }),
        );
    });
  }, [commonClientArgs]);

  const requestToggleSpectating = useCallback(() => {
    return new Promise((resolve, reject) => {
      socket
        .timeout(SOCKET_TIMEOUT)
        .emit("requestToggleSpectating", commonClientArgs, (err, resp) =>
          handleCommonServerResponse({ err, resp }, { resolve, reject }),
        );
    });
  }, [commonClientArgs]);

  const requestChangeGameOptions = useCallback(
    (options: GameOptions) => {
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
    [commonClientArgs],
  );

  const requestKickPlayer = useCallback(
    (playerId: string) => {
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
    [commonClientArgs],
  );

  const requestMovePlayerToSpectator = useCallback(
    (playerId: string) => {
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
    [commonClientArgs],
  );

  const requestJoinGame = useCallback(() => {
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
  }, [userState.currentRoomCode, commonClientArgs]);

  const requestSync = useCallback(() => {
    socket.emit("requestSync", commonClientArgs);
  }, [commonClientArgs]);

  const sendChatMessage = useCallback(
    (message: string) => {
      socket.emit("sendChatMessage", { message, ...commonClientArgs });
    },
    [commonClientArgs],
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
