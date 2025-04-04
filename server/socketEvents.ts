import { Server } from "socket.io"
import GameRoomManager from "./GameRoomManager";

/**
 * Custom Socket events
 * - joinRoom
 * - connectedPlayers
 * - requestStartGame
 * - startGame
 * - requestChessMove
 * - startChessMove
 * - requestPokemonMove
 * - startPokemonMove
 * - endGameFromDisconnect
 */

export const assignSocketEvents = (io: Server, gameRoomManager: GameRoomManager) => {
  io.on('connection', (socket) => {
    console.log('New User Connection');

    socket.on('disconnect', () => {
      console.log('User Disconnected');

      const room = gameRoomManager.getGameFromUserSocket(socket);
      const player = room?.getPlayer(socket);
      if (room && player) {
        if (room.hostPlayer?.playerId === player.playerId) {
          console.log('Host disconnected. Closing room');
          room.leaveRoom(player.playerId);
        } else {
          console.log(`Preparing player for disconnect. ${player.playerId}`);
          room.preparePlayerDisconnect(player);
          io.to(room.roomId).emit('connectedPlayers', room.getPublicPlayerList());
        }
      }
    });

    socket.on('joinRoom', (roomId, playerId, playerName, password) => {
      const room = gameRoomManager.getRoom(roomId);
      if (!room || !playerId || !playerName) {
        return socket.disconnect();
      }
      if (room.password !== password) {
        return socket.disconnect();
      }

      /**
       * TODO - Move logic into room manager
       */
      const user = room.getPlayer(playerId);
      user?.assignSocket(socket);
      if (room.transientPlayerList[playerId]) {
        clearTimeout(room.transientPlayerList[playerId]);
        delete room.transientPlayerList[playerId];
      }

      socket.join(room.roomId);
      io.to(roomId).emit('connectedPlayers', room.getPublicPlayerList());
      socket.emit('changeGameOptions', room.roomGameOptions);
      console.log(`Player ${playerId} joined room ${roomId}`);

      /**
       * TODO - Send match history if game is ongoing
       */
    });

    socket.on('requestToggleSpectating', (roomId, playerId) => {
      const room = gameRoomManager.getRoom(roomId);

      if (!room || !playerId) {
        socket.disconnect();
        return;
      }
      const player = room.getPlayer(playerId);
      if (!player) {
        return;
      }

      room.toggleSpectating(player);
      io.to(room.roomId).emit('connectedPlayers', room.getPublicPlayerList());
    });

    socket.on('requestChangeGameOptions', (roomId, playerId, gameOptions) => {
      const room = gameRoomManager.getRoom(roomId);

      if (!room || room.hostPlayer?.playerId !== playerId) {
        socket.disconnect();
        return;
      }

      room.setOptions(gameOptions);
      room.hostPlayer?.socket?.broadcast.emit('changeGameOptions', gameOptions);
    });

    socket.on('requestStartGame', (roomId, playerId) => {
      const room = gameRoomManager.getRoom(roomId);

      if (!room || room.hostPlayer?.playerId !== playerId) {
        socket.disconnect();
        return;
      }

      room.startGame();
      io.to(roomId).emit('connectedPlayers', room.getPublicPlayerList());
    });

    socket.on('requestChessMove', ({ fromSquare, toSquare, promotion, roomId, playerId }) => {
      const room = gameRoomManager.getRoom(roomId);
      if (!room || !playerId) {
        return socket.disconnect();
      }

      room.validateAndEmitChessMove({ fromSquare, toSquare, promotion, playerId });
    });

    socket.on('requestPokemonMove', ({ pokemonMove, roomId, playerId }) => {
      const room = gameRoomManager.getRoom(roomId);
      if (!room || !playerId) {
        return socket.disconnect();
      }

      room.validateAndEmitPokemonMove({ pokemonMove, playerId });
    });

    socket.on('requestDraftPokemon', ({ roomId, playerId, square, draftPokemonIndex, isBan }) => {
      const room = gameRoomManager.getRoom(roomId);
      if (!room || !playerId) {
        return socket.disconnect();
      }

      room.validateAndEmitPokemonDraft({ square, draftPokemonIndex, playerId, isBan });
    });

    socket.on('setViewingResults', (roomId, playerId, viewingResults: boolean) => {
      const room = gameRoomManager.getRoom(roomId);
      if (!room || !playerId || !room.getPlayer(playerId)) {
        return socket.disconnect();
      }

      if (room.isOngoing) {
        room.resetRoomForRematch();
      }
      room.getPlayer(playerId)?.setViewingResults(!!viewingResults);
      io.to(room.roomId).emit('connectedPlayers', room.getPublicPlayerList());
    });

    socket.on('sendChatMessage', ({ roomId, playerId, message }) => {
      const room = gameRoomManager.getRoom(roomId);
      if (!room || !playerId || !room.getPlayer(playerId)) {
        return socket.disconnect();
      }

      socket.broadcast.emit('chatMessage', { playerName: room.getPlayer(playerId)?.playerName, message })
    });
  });
}