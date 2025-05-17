import { Square } from "chess.js";
import { socket } from "../socket";
import { useUserState } from "../context/UserStateContext";
import { GameOptions } from "../../shared/types/GameOptions";
import { CommonClientArgs } from "../../shared/types/Socket";

export const useSocketRequests = () => {
  const { userState } = useUserState();
  const commonClientArgs: CommonClientArgs = {
    playerId: userState.id,
    roomId: userState.currentRoomId,
    secretId: userState.secretId,
  };

  return {
    requestChessMove: (san: string) => {
      socket.emit('requestChessMove', { sanMove: san, ...commonClientArgs });
    },
    requestDraftPokemon: (square: Square, draftPokemonIndex: number) => {
      socket.emit('requestDraftPokemon', { square, draftPokemonIndex, ...commonClientArgs });
    },
    requestBanPokemon: (draftPokemonIndex: number) => {
      socket.emit('requestDraftPokemon', { draftPokemonIndex, isBan: true, ...commonClientArgs });
    },
    requestPokemonMove: (pokemonMove: string, cb: (err?: Error) => void) => {
      socket.timeout(10000).emit('requestPokemonMove', { pokemonMove, ...commonClientArgs }, cb);
    },
    requestSetViewingResults: (viewingResults: boolean) => {
      socket.emit('setViewingResults', { viewingResults, ...commonClientArgs });
    },
    requestReturnEveryoneToRoom: () => {
      socket.emit('requestEndGameAsHost', commonClientArgs);
    },
    requestStartGame: () => {
      socket.emit('requestStartGame', commonClientArgs);
    },
    requestToggleSpectating: () => {
      socket.emit('requestToggleSpectating', commonClientArgs);
    },
    requestChangeGameOptions: (options: GameOptions) => {
      socket.emit('requestChangeGameOptions', { options, ...commonClientArgs });
    },
    requestKickPlayer: (playerId: string) => {
      socket.emit('requestKickPlayer', { kickedPlayerId: playerId, ...commonClientArgs });
    },
    requestMovePlayerToSpectator: (playerId: string) => {
      socket.emit('requestMovePlayerToSpectator', { spectatorPlayerId: playerId, ...commonClientArgs });
    },
    requestJoinGame: () => {
      socket.emit('joinRoom', { roomCode: userState.currentRoomCode, ...commonClientArgs });
    },
    requestSync: () => {
      socket.emit('requestSync', commonClientArgs);
    },
    sendChatMessage: (message: string) => {
      socket.emit('sendChatMessage', { message, ...commonClientArgs });
    }
  };
};