import { socket } from "../socket";
import { useUserState } from "../context/UserStateContext";
import { Square } from "chess.js";
import { GameOptions } from "../../shared/types/GameOptions";

export const useSocketRequests = () => {
  const { userState } = useUserState();
  const { id, secretId, currentRoomId } = userState;


  return {
    requestChessMove: (san: string) => {
      socket.emit('requestChessMove', { sanMove: san, roomId: currentRoomId, playerId: id, secretId });
    },
    requestDraftPokemon: (square: Square, draftPokemonIndex: number) => {
      socket.emit('requestDraftPokemon', { square, draftPokemonIndex, roomId: currentRoomId, playerId: id, secretId });
    },
    requestBanPokemon: (draftPokemonIndex: number) => {
      socket.emit('requestDraftPokemon', { draftPokemonIndex, isBan: true, roomId: currentRoomId, playerId: id, secretId });
    },
    requestPokemonMove: (pokemonMove: string) => {
      socket.emit('requestPokemonMove', { pokemonMove, roomId: userState.currentRoomId, playerId: userState.id });
    },
    requestSetViewingResults: (viewingResults: boolean) => {
      socket.emit('setViewingResults', userState.currentRoomId, userState.id, viewingResults);
    },
    requestReturnEveryoneToRoom: () => {
      socket.emit('requestEndGameAsHost', userState.currentRoomId, userState.id);
    },
    requestStartGame: () => {
      socket.emit('requestStartGame', userState.currentRoomId, userState.id);
    },
    requestToggleSpectating: () => {
      socket.emit('requestToggleSpectating', userState.currentRoomId, userState.id);
    },
    requestChangeGameOptions: (options: GameOptions) => {
      socket.emit('requestChangeGameOptions', userState.currentRoomId, userState.id, options);
    },
    requestKickPlayer: (playerId: string) => {
      socket.emit('requestKickPlayer', userState.currentRoomId, userState.id, playerId);
    },
    requestMovePlayerToSpectator: (playerId: string) => {
      socket.emit('requestMovePlayerToSpectator', userState.currentRoomId, userState.id, playerId);
    },
    requestJoinGame: () => {
      socket.emit('joinRoom', userState.currentRoomId, userState.id, userState.name, userState.currentRoomCode);
    },
    requestSync: () => {
      socket.emit('requestSync', userState.currentRoomId, userState.id);
    },
    sendChatMessage: (message: string) => {
      socket.emit('sendChatMessage', { message, playerId: userState.id, roomId: userState.currentRoomId });
    }
  };
};