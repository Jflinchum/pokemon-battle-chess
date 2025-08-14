import { Square } from "chess.js";
import { socket } from "../socket";
import { useUserState } from "../context/UserState/UserStateContext";
import { GameOptions } from "../../shared/types/GameOptions";
import { CommonClientArgs } from "../../shared/types/Socket";
import { useCallback, useMemo } from "react";

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
      socket.emit("requestChessMove", { sanMove, ...commonClientArgs });
    },
    [commonClientArgs],
  );

  const requestDraftPokemon = useCallback(
    (square: Square, draftPokemonIndex: number) => {
      socket.emit("requestDraftPokemon", {
        square,
        draftPokemonIndex,
        ...commonClientArgs,
      });
    },
    [commonClientArgs],
  );

  const requestBanPokemon = useCallback(
    (draftPokemonIndex: number) => {
      socket.emit("requestDraftPokemon", {
        draftPokemonIndex,
        isBan: true,
        ...commonClientArgs,
      });
    },
    [commonClientArgs],
  );

  const requestPokemonMove = useCallback(
    (pokemonMove: string, cb: (err?: Error) => void) => {
      socket
        .timeout(10000)
        .emit("requestPokemonMove", { pokemonMove, ...commonClientArgs }, cb);
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
    socket.emit("requestEndGameAsHost", commonClientArgs);
  }, [commonClientArgs]);

  const requestStartGame = useCallback(() => {
    socket.emit("requestStartGame", commonClientArgs);
  }, [commonClientArgs]);

  const requestToggleSpectating = useCallback(() => {
    socket.emit("requestToggleSpectating", commonClientArgs);
  }, [commonClientArgs]);

  const requestChangeGameOptions = useCallback(
    (options: GameOptions) => {
      socket.emit("requestChangeGameOptions", { options, ...commonClientArgs });
    },
    [commonClientArgs],
  );

  const requestKickPlayer = useCallback(
    (playerId: string) => {
      socket.emit("requestKickPlayer", {
        kickedPlayerId: playerId,
        ...commonClientArgs,
      });
    },
    [commonClientArgs],
  );

  const requestMovePlayerToSpectator = useCallback(
    (playerId: string) => {
      socket.emit("requestMovePlayerToSpectator", {
        spectatorPlayerId: playerId,
        ...commonClientArgs,
      });
    },
    [commonClientArgs],
  );

  const requestJoinGame = useCallback(() => {
    socket.emit("joinRoom", {
      roomCode: userState.currentRoomCode,
      ...commonClientArgs,
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
  };
};
