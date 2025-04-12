import { Server } from "socket.io"
import GameRoomManager from "../GameRoomManager";

export const registerSocketEvents = (io: Server, gameRoomManager: GameRoomManager) => {
  io.on('connection', (socket) => {
    console.log('New User Connection');

    socket.on('disconnect', () => {
      console.log('User Disconnected');

      const room = gameRoomManager.getGameFromUserSocket(socket);
      const player = room?.getPlayer(socket);
      if (room && player) {
        console.log(`Preparing player for disconnect. ${player.playerId}`);
        room.preparePlayerDisconnect(player);
        io.to(room.roomId).emit('connectedPlayers', room.getPublicPlayerList());
      }
    });

    socket.on('joinRoom', (roomId, playerId, playerName, password) => {
      const room = gameRoomManager.getRoom(roomId);
      console.log(`${playerId} requested to join room ${roomId}`);
      if (!room || !playerId || !playerName) {
        console.log(`${playerId} mismatch for ${roomId}`);
        return socket.disconnect();
      }
      if (room.password !== password) {
        console.log(`${playerId} invalid password for ${roomId}`);
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

      if (room.isOngoing) {
        socket.emit('startSync', {
          banHistory: room.banHistory,
          pokemonAssignments: room.pokemonAssignments,
          chessMoveHistory: room.chessMoveHistory,
          pokemonBattleHistory: room.getPokemonBattleHistory(playerId),
        });
        socket.emit('startGame', room.blackPlayer.playerId === playerId ? room.buildStartGameArgs('b') : room.buildStartGameArgs('w'));
      }
    });

    socket.on('requestToggleSpectating', (roomId, playerId) => {
      const room = gameRoomManager.getRoom(roomId);
      console.log(`${playerId} requested to change to spectator for ${roomId}`);

      if (!room || !playerId) {
        console.log(`${playerId} mismatch for ${roomId}.`);
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
      console.log(`${playerId} requested to change game options for ${roomId}`);

      if (!room || room.hostPlayer?.playerId !== playerId) {
        console.log(`${playerId} mismatch for ${roomId}.`);
        return;
      }

      room.setOptions(gameOptions);
      room.hostPlayer?.socket?.broadcast.emit('changeGameOptions', gameOptions);
    });

    socket.on('requestStartGame', (roomId, playerId) => {
      const room = gameRoomManager.getRoom(roomId);
      console.log(`${playerId} requested to start game for ${roomId}`);

      if (!room || room.hostPlayer?.playerId !== playerId) {
        console.log(`${playerId} mismatch for ${roomId}.`);
        return;
      }

      room.startGame();
      io.to(roomId).emit('connectedPlayers', room.getPublicPlayerList());
    });

    socket.on('requestSync', (roomId, playerId) => {
      console.log('request sync received ' + roomId + ' ' + playerId);
      const room = gameRoomManager.getRoom(roomId);
      if (!room) {
        return;
      }

      if (room.isOngoing) {
        if (room.transientPlayerList[playerId]) {
          clearTimeout(room.transientPlayerList[playerId]);
          delete room.transientPlayerList[playerId];
        }
        socket.emit('startSync', {
          banHistory: room.banHistory,
          pokemonAssignments: room.pokemonAssignments,
          chessMoveHistory: room.chessMoveHistory,
          pokemonBattleHistory: room.getPokemonBattleHistory(playerId),
        });
        io.to(room.roomId).emit('connectedPlayers', room.getPublicPlayerList());
      }
    });

    socket.on('requestChessMove', ({ sanMove, roomId, playerId }) => {
      const room = gameRoomManager.getRoom(roomId);
      console.log(`${playerId} requested to chess move ${sanMove} for ${roomId}`);
      if (!room || !playerId) {
        console.log(`${playerId} mismatch for ${roomId}`);
        return;
      }

      room.validateAndEmitChessMove({ sanMove, playerId });
    });

    socket.on('requestPokemonMove', ({ pokemonMove, roomId, playerId }) => {
      const room = gameRoomManager.getRoom(roomId);
      console.log(`${playerId} requested to chess move ${pokemonMove} for ${roomId}`);

      if (!room || !playerId) {
        console.log(`${playerId} mismatch for ${roomId}`);
        return;
      }

      room.validateAndEmitPokemonMove({ pokemonMove, playerId });
    });

    socket.on('requestDraftPokemon', ({ roomId, playerId, square, draftPokemonIndex, isBan }) => {
      const room = gameRoomManager.getRoom(roomId);
      console.log(`${playerId} requested to ${isBan ? 'ban' : 'draft'} pokemon ${draftPokemonIndex} at ${square} for ${roomId}`);

      if (!room || !playerId) {
        console.log(`${playerId} mismatch for ${roomId}`);
        return;
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