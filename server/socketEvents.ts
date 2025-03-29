import { Server } from "socket.io"
import GameRoomManager from "./GameRoomManager";

/**
 * Custom Socket events
 * - joinRoom
 * - connectedPlayers
 * - transientPlayers
 *   - TODO - remove and wrap everything under 'connectedPlayers'
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
        room.preparePlayerDisconnect(player);
        io.to(room.roomId).emit('transientPlayers', room.getTransientPlayers());
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
      if (user?.transient) {
        clearTimeout(user.transient);
        user?.setTransient(null);
      }

      socket.join(room.roomId);
      io.to(roomId).emit('connectedPlayers', room.getPublicPlayerList());
      io.to(roomId).emit('transientPlayers', room.getTransientPlayers());
      console.log(`Player ${playerId} joined room ${roomId}`);

      /**
       * TODO - Send match history if game is ongoing
       */
    });

    socket.on('requestStartGame', (roomId, playerId) => {
      const room = gameRoomManager.getRoom(roomId);

      if (!room || room.hostPlayer?.playerId !== playerId) {
        socket.disconnect();
        return;
      }

      room.startGame();
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

      room.validateAndEmitePokemonMove({ pokemonMove, playerId });
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
    })
  });
}