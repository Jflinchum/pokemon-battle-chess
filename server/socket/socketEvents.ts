import { Server } from "socket.io";
import GameRoomManager from "../models/GameRoomManager";
import User from "../models/User";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/types/Socket";
import { cleanString } from "../../shared/util/profanityFilter";

export const registerSocketEvents = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  gameRoomManager: GameRoomManager,
) => {
  io.on("connection", (socket) => {
    console.log("New User Connection");

    socket.on("disconnect", () => {
      console.log("User Disconnected");

      const room = gameRoomManager.getGameFromUserSocket(socket);
      const player = room?.getPlayer(socket);
      if (room && player) {
        console.log(`Preparing player for disconnect. ${player.playerId}`);
        room.preparePlayerDisconnect(player);
        io.to(room.roomId).emit("connectedPlayers", room.getPublicPlayerList());
      }

      gameRoomManager.removePlayerFromQueue(socket);
    });

    socket.on(
      "matchSearch",
      ({ playerName, playerId, secretId, avatarId, matchQueue }) => {
        const user = new User(playerName, playerId, avatarId || "1", secretId);
        user.assignSocket(socket);
        gameRoomManager.addPlayerToQueue(user, matchQueue);
      },
    );

    socket.on("joinRoom", ({ roomId, playerId, roomCode, secretId }) => {
      const room = gameRoomManager.getRoom(roomId);
      console.log(`${playerId} requested to join room ${roomId}`);
      if (!room || !playerId) {
        console.log(`${playerId} mismatch for ${roomId}`);
        return socket.disconnect();
      }
      if (room.password !== roomCode) {
        console.log(`${playerId} invalid password for ${roomId}`);
        return socket.disconnect();
      }
      if (!room.verifyPlayer(playerId, secretId)) {
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
      io.to(roomId).emit("connectedPlayers", room.getPublicPlayerList());
      socket.emit("changeGameOptions", room.roomGameOptions);
      console.log(`Player ${playerId} joined room ${roomId}`);

      if (room.isOngoing && room.whitePlayer && room.blackPlayer) {
        socket.emit("startSync", { history: room.getHistory(playerId) });
        if (room.roomGameOptions.timersEnabled && room.gameTimer) {
          socket.emit(
            "currentTimers",
            room.gameTimer.getTimersWithLastMoveShift(),
          );
        }
        socket.emit(
          "startGame",
          room.blackPlayer?.playerId === playerId
            ? room.buildStartGameArgs("b", room.whitePlayer, room.blackPlayer)
            : room.buildStartGameArgs("w", room.whitePlayer, room.blackPlayer),
          true,
        );
      }
    });

    socket.on("requestToggleSpectating", ({ roomId, playerId, secretId }) => {
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
      if (!room.verifyPlayer(playerId, secretId)) {
        return;
      }

      room.toggleSpectating(player);
      io.to(room.roomId).emit("connectedPlayers", room.getPublicPlayerList());
    });

    socket.on(
      "requestChangeGameOptions",
      ({ roomId, playerId, options, secretId }) => {
        const room = gameRoomManager.getRoom(roomId);
        console.log(
          `${playerId} requested to change game options for ${roomId}`,
        );

        if (!room || room.hostPlayer?.playerId !== playerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return;
        }
        if (!room.verifyPlayer(room.hostPlayer.playerId, secretId)) {
          return;
        }

        room.setOptions(options);
        room.hostPlayer?.socket?.broadcast.emit("changeGameOptions", options);
      },
    );

    socket.on("requestStartGame", ({ roomId, playerId, secretId }) => {
      const room = gameRoomManager.getRoom(roomId);
      console.log(`${playerId} requested to start game for ${roomId}`);

      if (!room || room.hostPlayer?.playerId !== playerId) {
        console.log(`${playerId} mismatch for ${roomId}.`);
        return;
      }
      if (!room.verifyPlayer(room.hostPlayer.playerId, secretId)) {
        return;
      }

      room.startGame();
      io.to(roomId).emit("connectedPlayers", room.getPublicPlayerList());
    });

    socket.on("requestEndGameAsHost", ({ roomId, playerId, secretId }) => {
      const room = gameRoomManager.getRoom(roomId);
      console.log(`${playerId} requested to end game for ${roomId}`);

      if (!room || room.hostPlayer?.playerId !== playerId) {
        console.log(`${playerId} mismatch for ${roomId}.`);
        return;
      }
      if (!room.verifyPlayer(room.hostPlayer.playerId, secretId)) {
        return;
      }

      room.endGame("", "HOST_ENDED_GAME");
    });

    socket.on(
      "requestKickPlayer",
      ({ roomId, playerId, kickedPlayerId, secretId }) => {
        const room = gameRoomManager.getRoom(roomId);
        console.log(
          `${playerId} requested to kick ${kickedPlayerId} for ${roomId}`,
        );

        if (!room || !kickedPlayerId || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return;
        }
        const player = room.getPlayer(kickedPlayerId);
        const host = room.getPlayer(playerId);
        if (!player || !host || room.hostPlayer?.playerId !== playerId) {
          return;
        }
        if (!room.verifyPlayer(room.hostPlayer.playerId, secretId)) {
          return;
        }

        player.socket?.timeout(5000).emit("kickedFromRoom", () => {
          player.socket?.disconnect();
        });
        gameRoomManager.playerLeaveRoom(roomId, kickedPlayerId);
      },
    );

    socket.on(
      "requestMovePlayerToSpectator",
      ({ roomId, playerId, spectatorPlayerId, secretId }) => {
        const room = gameRoomManager.getRoom(roomId);
        console.log(
          `${playerId} requested to change ${spectatorPlayerId} to spectator for ${roomId}`,
        );

        if (!room || !playerId || !spectatorPlayerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return;
        }
        const player = room.getPlayer(spectatorPlayerId);
        const host = room.getPlayer(playerId);
        if (!player || !host || room.hostPlayer?.playerId !== playerId) {
          return;
        }
        if (!room.verifyPlayer(room.hostPlayer.playerId, secretId)) {
          return;
        }

        room.toggleSpectating(player);
        io.to(room.roomId).emit("connectedPlayers", room.getPublicPlayerList());
      },
    );

    socket.on("requestSync", ({ roomId, playerId, secretId }) => {
      console.log("request sync received " + roomId + " " + playerId);
      const room = gameRoomManager.getRoom(roomId);
      if (!room) {
        return;
      }
      if (!room.verifyPlayer(playerId, secretId)) {
        return;
      }
      room.getPlayer(playerId)?.assignSocket(socket);

      if (room.isOngoing) {
        if (room.transientPlayerList[playerId]) {
          clearTimeout(room.transientPlayerList[playerId]);
          delete room.transientPlayerList[playerId];
        }
        socket.emit("startSync", { history: room.getHistory(playerId) });
        if (room.roomGameOptions.timersEnabled && room.gameTimer) {
          socket.emit(
            "currentTimers",
            room.gameTimer.getTimersWithLastMoveShift(),
          );
        }
        io.to(room.roomId).emit("connectedPlayers", room.getPublicPlayerList());
      }
    });

    socket.on("requestChessMove", ({ sanMove, roomId, playerId, secretId }) => {
      const room = gameRoomManager.getRoom(roomId);
      console.log(
        `${playerId} requested to chess move ${sanMove} for ${roomId}`,
      );
      if (!room || !playerId) {
        console.log(`${playerId} mismatch for ${roomId}`);
        return;
      }
      if (!room.verifyPlayer(playerId, secretId)) {
        return;
      }

      room.validateAndEmitChessMove({ sanMove, playerId });
    });

    socket.on(
      "requestPokemonMove",
      ({ pokemonMove, roomId, playerId, secretId }, cb) => {
        cb();
        const room = gameRoomManager.getRoom(roomId);
        console.log(
          `${playerId} requested to chess move ${pokemonMove} for ${roomId}`,
        );

        if (!room || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}`);
          return;
        }
        if (!room.verifyPlayer(playerId, secretId)) {
          return;
        }

        room.validateAndEmitPokemonMove({ pokemonMove, playerId });
      },
    );

    socket.on(
      "requestDraftPokemon",
      ({ roomId, playerId, square, draftPokemonIndex, isBan, secretId }) => {
        const room = gameRoomManager.getRoom(roomId);
        console.log(
          `${playerId} requested to ${isBan ? "ban" : "draft"} pokemon ${draftPokemonIndex} at ${square} for ${roomId}`,
        );

        if (!room || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}`);
          return;
        }
        if (!room.verifyPlayer(playerId, secretId)) {
          return;
        }

        if (isBan) {
          room.validateAndEmitPokemonBan({ draftPokemonIndex, playerId });
        } else {
          room.validateAndEmitPokemonDraft({
            square,
            draftPokemonIndex,
            playerId,
          });
        }
      },
    );

    socket.on(
      "setViewingResults",
      ({ roomId, playerId, viewingResults, secretId }) => {
        const room = gameRoomManager.getRoom(roomId);
        if (!room || !playerId || !room.getPlayer(playerId)) {
          return socket.disconnect();
        }
        if (!room.verifyPlayer(playerId, secretId)) {
          return;
        }

        room.getPlayer(playerId)?.setViewingResults(!!viewingResults);
        io.to(room.roomId).emit("connectedPlayers", room.getPublicPlayerList());
      },
    );

    socket.on("sendChatMessage", ({ roomId, playerId, message, secretId }) => {
      const room = gameRoomManager.getRoom(roomId);
      const player = room?.getPlayer(playerId);
      if (!room || !playerId || !player) {
        return socket.disconnect();
      }
      if (!room.verifyPlayer(playerId, secretId)) {
        return;
      }

      socket.to(room.roomId).emit("chatMessage", {
        playerName: player.playerName,
        message: cleanString(message),
      });
    });
  });
};
