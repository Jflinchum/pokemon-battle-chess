import { Server } from "socket.io";
import GameRoomManager from "../models/GameRoomManager.js";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/types/Socket.js";
import { cleanString } from "../../shared/util/profanityFilter.js";
import User from "../models/User.js";
import { setPlayerViewingResults } from "../cache/redis.js";
import { MatchLog, Timer } from "../../shared/types/Game.js";

export const registerSocketEvents = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  gameRoomManager: GameRoomManager,
) => {
  io.on("connection", (socket) => {
    console.log("New User Connection");
    let player: User | null = null;

    socket.on("disconnect", async () => {
      console.log("User Disconnected");

      const room = await gameRoomManager.getCachedRoom(
        player?.connectedRoom ?? undefined,
      );

      if (room && player) {
        console.log(`Preparing player for disconnect. ${player.playerId}`);
        await gameRoomManager.preparePlayerDisconnect(
          room.roomId,
          player.playerId,
        );
        io.to(room.roomId).emit(
          "connectedPlayers",
          await gameRoomManager.getPublicPlayerList(room.roomId),
        );
      }

      // gameRoomManager.removePlayerFromQueue(socket);
    });

    // socket.on(
    //   "matchSearch",
    //   ({ playerName, playerId, secretId, avatarId, matchQueue }) => {
    //     const user = new User(playerName, playerId, avatarId || "1", secretId);
    //     user.assignSocket(socket);
    //     gameRoomManager.addPlayerToQueue(user, matchQueue);
    //   },
    // );

    socket.on("joinRoom", async ({ roomId, playerId, roomCode, secretId }) => {
      console.log(`${playerId} requested to join room ${roomId}`);
      if (
        !(await gameRoomManager.verifyPlayerConnection(
          { roomId, playerId, secretId },
          { roomCode },
        ))
      ) {
        socket.disconnect();
        return;
      }
      const user = await gameRoomManager.getUser(playerId);
      const room = await gameRoomManager.getCachedRoom(roomId);
      if (!user || !room) {
        socket.disconnect();
        return;
      }
      player = user;
      player.setRoom(roomId);

      gameRoomManager.clearPlayerTransientState(playerId);

      socket.join([roomId, playerId]);
      const connectedPlayers =
        await gameRoomManager.getPublicPlayerList(roomId);
      io.to(roomId).emit("connectedPlayers", connectedPlayers);
      socket.emit(
        "changeGameOptions",
        await gameRoomManager.getRoomOptions(roomId),
      );
      console.log(`Player ${playerId} joined room ${roomId}`);

      if (room.isOngoing && room.whitePlayer && room.blackPlayer) {
        socket.emit("startSync", { history: await room.getHistory(playerId) });
        // if (room.roomGameOptions.timersEnabled && room.gameTimer) {
        //   socket.emit(
        //     "currentTimers",
        //     room.gameTimer.getTimersWithLastMoveShift(),
        //   );
        // }
        socket.emit(
          "startGame",
          room.blackPlayer?.playerId === playerId
            ? room.buildStartGameArgs("b", room.whitePlayer, room.blackPlayer)
            : room.buildStartGameArgs("w", room.whitePlayer, room.blackPlayer),
          true,
        );
      }
    });

    socket.on(
      "requestToggleSpectating",
      async ({ roomId, playerId, secretId }) => {
        const roomExists = await gameRoomManager.cachedRoomExists(roomId);
        console.log(
          `${playerId} requested to change to spectator for ${roomId}`,
        );

        if (!roomExists || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return;
        }
        const user = await gameRoomManager.getUser(playerId);
        if (!user) {
          return;
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return;
        }

        await gameRoomManager.togglePlayerSpectating({ roomId, playerId });
        const connectedPlayers =
          await gameRoomManager.getPublicPlayerList(roomId);
        io.to(roomId).emit("connectedPlayers", connectedPlayers);
      },
    );

    socket.on(
      "requestChangeGameOptions",
      async ({ roomId, playerId, options, secretId }) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to change game options for ${roomId}`,
        );

        if (!room || room.hostPlayer?.playerId !== playerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return;
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          console.log("Unable to verify player connection");
          return;
        }

        await gameRoomManager.setRoomOptions(roomId, options);

        socket.broadcast.emit("changeGameOptions", options);
      },
    );

    socket.on("requestStartGame", async ({ roomId, playerId, secretId }) => {
      const room = await gameRoomManager.getCachedRoom(roomId);
      console.log(`${playerId} requested to start game for ${roomId}`);

      if (!room || room.hostPlayer?.playerId !== playerId) {
        console.log(`${playerId} mismatch for ${roomId}.`);
        return;
      }
      if (
        !(await gameRoomManager.verifyPlayerConnection({
          roomId,
          playerId,
          secretId,
        }))
      ) {
        console.log("Unable to verify player.");
        return;
      }
      if (!room.player1 || !room.player2) {
        console.log("Player 1 and player 2 slots are not filled.");
        return;
      }

      try {
        const { whiteStartGame, blackStartGame, timers } =
          await room.initializeGame();
        io.to(whiteStartGame.whitePlayer.playerId).emit(
          "startGame",
          whiteStartGame,
        );
        io.to(blackStartGame.blackPlayer.playerId).emit(
          "startGame",
          blackStartGame,
        );
        room.getSpectators()?.forEach((spectatorPlayerId) => {
          io.to(spectatorPlayerId).emit("startGame", whiteStartGame);
        });
        io.to(roomId).emit(
          "connectedPlayers",
          await gameRoomManager.getPublicPlayerList(roomId),
        );

        if (timers) {
          io.to(roomId).emit("currentTimers", timers);
        }
      } catch (e) {
        console.log("Issue starting game: ", (e as unknown as Error).message);
      }
    });

    socket.on(
      "requestEndGameAsHost",
      async ({ roomId, playerId, secretId }) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(`${playerId} requested to end game for ${roomId}`);

        if (!room || room.hostPlayer?.playerId !== playerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return;
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          console.log("Unable to verify player.");
          return;
        }

        io.to(roomId).emit(
          "gameOutput",
          room.endGame("", "HOST_ENDED_GAME"),
          () => {},
        );
        io.to(roomId).emit(
          "connectedPlayers",
          await gameRoomManager.getPublicPlayerList(roomId),
        );

        // this.gameTimer?.stopTimers();
        // this.broadcastTimers();
      },
    );

    socket.on(
      "requestKickPlayer",
      async ({ roomId, playerId, kickedPlayerId, secretId }) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to kick ${kickedPlayerId} for ${roomId}`,
        );

        if (!room || !kickedPlayerId || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return;
        }
        const kickedPlayer = await gameRoomManager.getUser(kickedPlayerId);
        const host = await gameRoomManager.getUser(playerId);
        if (!kickedPlayer || !host || room.hostPlayer?.playerId !== playerId) {
          return;
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return;
        }

        io.to(kickedPlayer.playerId)
          .timeout(5000)
          .emit("kickedFromRoom", () => {
            io.in(kickedPlayer.playerId).disconnectSockets();
          });
        gameRoomManager.playerLeaveRoom(roomId, kickedPlayerId);
      },
    );

    socket.on(
      "requestMovePlayerToSpectator",
      async ({ roomId, playerId, spectatorPlayerId, secretId }) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to change ${spectatorPlayerId} to spectator for ${roomId}`,
        );

        if (!room || !playerId || !spectatorPlayerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return;
        }
        const spectatorUser = await gameRoomManager.getUser(spectatorPlayerId);
        const host = await gameRoomManager.getUser(playerId);
        if (!spectatorUser || !host || room.hostPlayer?.playerId !== playerId) {
          return;
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return;
        }

        await gameRoomManager.togglePlayerSpectating({
          roomId,
          playerId: spectatorPlayerId,
        });
        io.to(room.roomId).emit(
          "connectedPlayers",
          await gameRoomManager.getPublicPlayerList(roomId),
        );
      },
    );

    socket.on("requestSync", async ({ roomId, playerId, secretId }) => {
      console.log("request sync received " + roomId + " " + playerId);
      const room = await gameRoomManager.getCachedRoom(roomId);
      if (!room) {
        return;
      }
      if (
        !(await gameRoomManager.verifyPlayerConnection({
          roomId,
          playerId,
          secretId,
        }))
      ) {
        return;
      }

      player = await gameRoomManager.getUser(playerId);
      player?.setRoom(roomId);
      socket.join([roomId, playerId]);

      if (room.isOngoing) {
        gameRoomManager.clearPlayerTransientState(playerId);
        socket.emit("startSync", { history: await room.getHistory(playerId) });
        if (room.roomGameOptions.timersEnabled) {
          await room.setTimerState();

          if (room.gameTimer) {
            socket.emit(
              "currentTimers",
              room.gameTimer.getTimersWithLastMoveShift(),
            );
          }
        }
      }
      io.to(room.roomId).emit(
        "connectedPlayers",
        await gameRoomManager.getPublicPlayerList(roomId),
      );
    });

    socket.on(
      "requestChessMove",
      async ({ sanMove, roomId, playerId, secretId }) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to chess move ${sanMove} for ${roomId}`,
        );
        if (!room || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}`);
          return;
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return;
        }

        const streamOutputs = await room.validateAndEmitChessMove({
          sanMove,
          playerId,
        });

        if (!streamOutputs) {
          return;
        }
        const { whiteStreamOutput, blackStreamOutput, timers } = streamOutputs;

        if (whiteStreamOutput.length) {
          whiteStreamOutput.forEach((matchLog) => {
            if (room.whitePlayer?.playerId) {
              io.to(room.whitePlayer.playerId).emit(
                "gameOutput",
                matchLog,
                () => {},
              );
            }
            room.getSpectators()?.forEach((playerId) => {
              io.to(playerId).emit("gameOutput", matchLog, () => {});
            });
          });
        }
        if (blackStreamOutput.length) {
          blackStreamOutput.forEach((matchLog) => {
            if (room.blackPlayer?.playerId) {
              io.to(room.blackPlayer.playerId).emit(
                "gameOutput",
                matchLog,
                () => {},
              );
            }
          });
        }

        if (timers) {
          io.to(roomId).emit("currentTimers", timers);
        }
      },
    );

    socket.on(
      "requestPokemonMove",
      async ({ pokemonMove, roomId, playerId, secretId }, cb) => {
        cb();

        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to chess move ${pokemonMove} for ${roomId}`,
        );

        if (!room || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}`);
          return;
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return;
        }

        const streamOutputs = await room.validateAndEmitPokemonMove({
          pokemonMove,
          playerId,
        });

        if (!streamOutputs) {
          return;
        }
        const { whiteStreamOutput, blackStreamOutput, timers } = streamOutputs;

        if (whiteStreamOutput.length) {
          whiteStreamOutput.forEach((matchLog) => {
            if (room.whitePlayer?.playerId) {
              io.to(room.whitePlayer.playerId).emit(
                "gameOutput",
                matchLog,
                () => {},
              );
            }
            room.getSpectators()?.forEach((playerId) => {
              io.to(playerId).emit("gameOutput", matchLog, () => {});
            });
          });
        }
        if (blackStreamOutput.length) {
          blackStreamOutput.forEach((matchLog) => {
            if (room.blackPlayer?.playerId) {
              io.to(room.blackPlayer.playerId).emit(
                "gameOutput",
                matchLog,
                () => {},
              );
            }
          });
        }

        if (timers) {
          io.to(roomId).emit("currentTimers", timers);
        }
      },
    );

    socket.on(
      "requestDraftPokemon",
      async ({
        roomId,
        playerId,
        square,
        draftPokemonIndex,
        isBan,
        secretId,
      }) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to ${isBan ? "ban" : "draft"} pokemon ${draftPokemonIndex} at ${square} for ${roomId}`,
        );

        if (!room || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}`);
          return;
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return;
        }

        let matchOutput: MatchLog[] | undefined;
        let timer: Timer | undefined;
        if (isBan) {
          try {
            const output = await room.validateAndEmitPokemonBan({
              draftPokemonIndex,
              playerId,
            });
            matchOutput = output?.matchOutput;
            timer = output?.timer;
          } catch (err) {
            console.log(err);
          }
        } else {
          try {
            const output = await room.validateAndEmitPokemonDraft({
              square,
              draftPokemonIndex,
              playerId,
            });
            matchOutput = output?.matchOutput;
            timer = output?.timer;
          } catch (err) {
            console.log(err);
          }
        }

        if (matchOutput) {
          matchOutput.forEach((log) => {
            io.to(roomId).emit("gameOutput", log, () => {});
          });
        }

        if (timer) {
          io.to(roomId).emit("currentTimers", timer);
        }
      },
    );

    socket.on(
      "setViewingResults",
      async ({ roomId, playerId, viewingResults, secretId }) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        if (!room || !playerId) {
          console.log("Could not find player id or room");
          return socket.disconnect();
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          console.log("Unable to verify player connection.");
          return;
        }

        await setPlayerViewingResults(playerId, viewingResults);
        io.to(room.roomId).emit(
          "connectedPlayers",
          await gameRoomManager.getPublicPlayerList(roomId),
        );

        /**
         * If a new match has already started after the player has returned to the room, sync them up to the current turn
         */
        if (room.isOngoing && room.whitePlayer && room.blackPlayer) {
          io.to(playerId).emit("startSync", {
            history: await room.getHistory(playerId),
          });
          // if (room.roomGameOptions.timersEnabled && room.gameTimer) {
          //   socket.emit(
          //     "currentTimers",
          //     room.gameTimer.getTimersWithLastMoveShift(),
          //   );
          // }
          socket.emit(
            "startGame",
            room.buildStartGameArgs("w", room.whitePlayer, room.blackPlayer),
            true,
          );
        }
      },
    );

    socket.on(
      "sendChatMessage",
      async ({ roomId, playerId, message, secretId }) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        const user = await gameRoomManager.getUser(playerId);
        if (!room || !playerId || !user) {
          return socket.disconnect();
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return;
        }

        socket.broadcast.to(room.roomId).emit("chatMessage", {
          playerName: user.playerName,
          message: cleanString(message),
        });
      },
    );

    socket.on(
      "requestValidateTimers",
      async ({ roomId, playerId, secretId }) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        const user = await gameRoomManager.getUser(playerId);
        if (!room || !playerId || !user) {
          return socket.disconnect();
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          })) ||
          !room.isOngoing
        ) {
          return;
        }

        const output = await room.lockAndValidateTimer();

        if (output) {
          if (output.matchOutput) {
            output.matchOutput.forEach((log) => {
              io.to(roomId).emit("gameOutput", log, () => {});
            });
          }

          if (output.timer) {
            io.to(roomId).emit("currentTimers", output.timer);
          }
        }
      },
    );
  });
};
