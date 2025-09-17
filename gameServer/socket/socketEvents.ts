import { Server } from "socket.io";
import GameRoomManager from "../models/GameRoomManager.js";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/types/Socket.js";
import {
  cleanString,
  isStringProfane,
} from "../../shared/util/profanityFilter.js";
import User from "../../shared/models/User.js";
import {
  addPlayerIdToRoomPlayerSet,
  addPlayerToCache,
  setPlayerViewingResults,
} from "../cache/redis.js";
import { MatchLog, Timer } from "../../shared/types/Game.js";
import GameRoom from "../models/GameRoom.js";

export const registerSocketEvents = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  gameRoomManager: GameRoomManager,
) => {
  const resync = async (
    room: GameRoom,
    playerId?: string | null,
    depth?: number,
  ) => {
    if (!playerId) {
      return;
    }

    if ((depth || 0) >= 5) {
      return;
    }

    io.to(playerId)
      .timeout(5000)
      .emit(
        "startSync",
        {
          history: await room.getHistory(playerId),
        },
        (err) => {
          if (err) {
            resync(room, playerId, (depth || 0) + 1);
          }
        },
      );
  };

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
          player.playerId,
          room.roomId,
        );
        io.to(room.roomId).emit(
          "connectedPlayers",
          await gameRoomManager.getPublicPlayerList(room.roomId),
        );
      }

      if (player) {
        gameRoomManager.removePlayerFromQueue(player.playerId);
      }

      player = null;
    });

    socket.on(
      "matchSearch",
      async ({ playerName, playerId, secretId, avatarId, matchQueue }, cb) => {
        if (
          !playerId ||
          !secretId ||
          !playerName ||
          isStringProfane(playerName) ||
          !matchQueue
        ) {
          console.log("Incorrect parameters for quick play");
          return cb({ status: "err", message: "Invalid request" });
        }
        const user = new User(playerName, playerId, avatarId || "1", secretId);
        player = user;
        socket.join(playerId);

        await addPlayerToCache(user);

        const nextUserInQueue =
          await gameRoomManager.getPlayerFromQueue(matchQueue);

        if (!nextUserInQueue) {
          console.log("No players in queue. Adding player to queue.");
          gameRoomManager.addPlayerToQueue(user, matchQueue);
        } else if (nextUserInQueue !== playerId) {
          console.log("Found players in queue. Attempting to create room");

          const room = await gameRoomManager.createAndCacheNewRoom(
            playerId,
            "",
            matchQueue,
          );

          await Promise.all([
            gameRoomManager.removePlayerFromQueue(user.playerId, matchQueue),
            gameRoomManager.removePlayerFromQueue(nextUserInQueue, matchQueue),
            gameRoomManager.player1JoinRoom(room.roomId, user.playerId),
            gameRoomManager.player2JoinRoom(room.roomId, nextUserInQueue),
            addPlayerIdToRoomPlayerSet(room.roomId, user.playerId),
            addPlayerIdToRoomPlayerSet(room.roomId, nextUserInQueue),
          ]);

          io.to([user.playerId, nextUserInQueue]).emit("foundMatch", {
            roomId: room.roomId,
          });

          const cachedRoom = await gameRoomManager.getCachedRoom(room.roomId);

          if (!cachedRoom) {
            throw Error("Could not initiate match - Cached room not found.");
          }

          const { whiteStartGame, blackStartGame, timers } =
            await cachedRoom.initializeGame();

          io.to(whiteStartGame.whitePlayer.playerId).emit(
            "startGame",
            whiteStartGame,
          );
          io.to(blackStartGame.blackPlayer.playerId).emit(
            "startGame",
            blackStartGame,
          );
          io.to(room.roomId).emit(
            "connectedPlayers",
            await gameRoomManager.getPublicPlayerList(room.roomId),
          );

          if (timers) {
            io.to(room.roomId).emit("currentTimers", timers);
          }
        }

        return cb({ status: "ok" });
      },
    );

    socket.on(
      "joinRoom",
      async ({ roomId, playerId, roomCode, secretId }, cb) => {
        console.log(`${playerId} requested to join room ${roomId}`);
        if (
          !(await gameRoomManager.verifyPlayerConnection(
            { roomId, playerId, secretId },
            { roomCode },
          ))
        ) {
          socket.disconnect();
          return cb({ status: "err", message: "Could not verify player" });
        }
        const user = await gameRoomManager.getUser(playerId);
        const room = await gameRoomManager.getCachedRoom(roomId);
        if (!user || !room) {
          socket.disconnect();
          return cb({ status: "err", message: "Could not find room" });
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
          socket
            .timeout(5000)
            .emit(
              "startSync",
              { history: await room.getHistory(playerId) },
              (err) => {
                if (err) {
                  resync(room, playerId);
                }
              },
            );

          if (room.roomGameOptions.timersEnabled) {
            await room.setTimerState();

            if (room.gameTimer) {
              socket.emit(
                "currentTimers",
                room.gameTimer.getTimersWithLastMoveShift(),
              );
            }
          }
          socket.emit(
            "startGame",
            room.blackPlayer?.playerId === playerId
              ? room.buildStartGameArgs("b", room.whitePlayer, room.blackPlayer)
              : room.buildStartGameArgs(
                  "w",
                  room.whitePlayer,
                  room.blackPlayer,
                ),
            true,
          );
        }
        return cb({ status: "ok" });
      },
    );

    socket.on(
      "requestToggleSpectating",
      async ({ roomId, playerId, secretId }, cb) => {
        const roomExists = await gameRoomManager.cachedRoomExists(roomId);
        console.log(
          `${playerId} requested to change to spectator for ${roomId}`,
        );

        if (!roomExists || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return cb({ status: "err", message: "Could not find room" });
        }
        const user = await gameRoomManager.getUser(playerId);
        if (!user) {
          return cb({ status: "err", message: "Could not find player" });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: "Could not verify player" });
        }

        await gameRoomManager.togglePlayerSpectating({ roomId, playerId });
        const connectedPlayers =
          await gameRoomManager.getPublicPlayerList(roomId);
        io.to(roomId).emit("connectedPlayers", connectedPlayers);
        return cb({ status: "ok" });
      },
    );

    socket.on(
      "requestChangeGameOptions",
      async ({ roomId, playerId, options, secretId }, cb) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to change game options for ${roomId}`,
        );

        if (!room || room.hostPlayer?.playerId !== playerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return cb({ status: "err", message: "Could not find room" });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          console.log("Unable to verify player connection");
          return cb({ status: "err", message: "Could not verify player" });
        }

        await gameRoomManager.setRoomOptions(roomId, options);

        socket.broadcast.emit("changeGameOptions", options);
        return cb({ status: "ok" });
      },
    );

    socket.on(
      "requestStartGame",
      async ({ roomId, playerId, secretId }, cb) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(`${playerId} requested to start game for ${roomId}`);

        if (!room || room.hostPlayer?.playerId !== playerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return cb({ status: "err", message: "Could not find room" });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          console.log("Unable to verify player.");
          return cb({ status: "err", message: "Could not verify player" });
        }
        if (!room.player1 || !room.player2) {
          console.log("Player 1 and player 2 slots are not filled.");
          return cb({
            status: "err",
            message: "Could not find Player 1 or Player 2",
          });
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
          return cb({
            status: "err",
            message:
              "There was an issue starting the game. Try recreating the room.",
          });
        }
      },
    );

    socket.on(
      "requestEndGameAsHost",
      async ({ roomId, playerId, secretId }, cb) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(`${playerId} requested to end game for ${roomId}`);

        if (!room || room.hostPlayer?.playerId !== playerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return cb({ status: "err", message: "Could not find room" });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          console.log("Unable to verify player.");
          return cb({ status: "err", message: "Could not find player" });
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
        return cb({ status: "ok" });
      },
    );

    socket.on(
      "requestKickPlayer",
      async ({ roomId, playerId, kickedPlayerId, secretId }, cb) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to kick ${kickedPlayerId} for ${roomId}`,
        );

        if (!room || !kickedPlayerId || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return cb({ status: "err", message: "Could not find room" });
        }
        const kickedPlayer = await gameRoomManager.getUser(kickedPlayerId);
        const host = await gameRoomManager.getUser(playerId);
        if (!kickedPlayer || !host || room.hostPlayer?.playerId !== playerId) {
          return cb({
            status: "err",
            message: "Could not find player to kick",
          });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: "Could not verify player" });
        }

        io.to(kickedPlayer.playerId)
          .timeout(5000)
          .emit("kickedFromRoom", () => {
            io.in(kickedPlayer.playerId).disconnectSockets();
          });
        gameRoomManager.playerLeaveRoom(roomId, kickedPlayerId);
        return cb({ status: "ok" });
      },
    );

    socket.on(
      "requestMovePlayerToSpectator",
      async ({ roomId, playerId, spectatorPlayerId, secretId }, cb) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to change ${spectatorPlayerId} to spectator for ${roomId}`,
        );

        if (!room || !playerId || !spectatorPlayerId) {
          console.log(`${playerId} mismatch for ${roomId}.`);
          return cb({ status: "err", message: "Could not find room" });
        }
        const spectatorUser = await gameRoomManager.getUser(spectatorPlayerId);
        const host = await gameRoomManager.getUser(playerId);
        if (!spectatorUser || !host || room.hostPlayer?.playerId !== playerId) {
          return cb({
            status: "err",
            message: "Could not find player to move to spectator",
          });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: "Could not verify player" });
        }

        await gameRoomManager.togglePlayerSpectating({
          roomId,
          playerId: spectatorPlayerId,
        });
        io.to(room.roomId).emit(
          "connectedPlayers",
          await gameRoomManager.getPublicPlayerList(roomId),
        );
        return cb({ status: "ok" });
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
        socket
          .timeout(5000)
          .emit(
            "startSync",
            { history: await room.getHistory(playerId) },
            (err) => {
              if (err) {
                resync(room, playerId);
              }
            },
          );
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
      async ({ sanMove, roomId, playerId, secretId }, cb) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to chess move ${sanMove} for ${roomId}`,
        );
        if (!room || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}`);
          return cb({ status: "err", message: "Could not find room" });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: "Could not verify player" });
        }

        const streamOutputs = await room.validateAndEmitChessMove({
          sanMove,
          playerId,
        });

        if (!streamOutputs) {
          return cb({ status: "err", message: "Chess move not valid" });
        }
        const { whiteStreamOutput, blackStreamOutput, timers } = streamOutputs;

        if (whiteStreamOutput.length) {
          whiteStreamOutput.forEach((matchLog) => {
            if (room.whitePlayer?.playerId) {
              io.to(room.whitePlayer.playerId)
                .timeout(5000)
                .emit("gameOutput", matchLog, (err) => {
                  if (err) {
                    resync(room, room.whitePlayer?.playerId);
                  }
                });
            }
            room.getSpectators()?.forEach((playerId) => {
              io.to(playerId)
                .timeout(5000)
                .emit("gameOutput", matchLog, (err) => {
                  if (err) {
                    resync(room, room.whitePlayer?.playerId);
                  }
                });
            });
          });
        }
        if (blackStreamOutput.length) {
          blackStreamOutput.forEach((matchLog) => {
            if (room.blackPlayer?.playerId) {
              io.to(room.blackPlayer.playerId)
                .timeout(5000)
                .emit("gameOutput", matchLog, (err) => {
                  if (err) {
                    resync(room, room.whitePlayer?.playerId);
                  }
                });
            }
          });
        }

        if (timers) {
          io.to(roomId).emit("currentTimers", timers);
        }
        return cb({ status: "ok" });
      },
    );

    socket.on(
      "requestPokemonMove",
      async ({ pokemonMove, roomId, playerId, secretId }, cb) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to chess move ${pokemonMove} for ${roomId}`,
        );

        if (!room || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}`);
          return cb({ status: "err", message: "Could not find room" });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: "Could not verify player" });
        }

        const streamOutputs = await room.validateAndEmitPokemonMove({
          pokemonMove,
          playerId,
        });

        if (!streamOutputs) {
          return cb({ status: "err", message: "Could not validate move" });
        }
        const { whiteStreamOutput, blackStreamOutput, timers } = streamOutputs;

        if (whiteStreamOutput.length) {
          whiteStreamOutput.forEach((matchLog) => {
            if (room.whitePlayer?.playerId) {
              io.to(room.whitePlayer.playerId)
                .timeout(5000)
                .emit("gameOutput", matchLog, (err) => {
                  if (err) {
                    resync(room, room.whitePlayer?.playerId);
                  }
                });
            }
            room.getSpectators()?.forEach((playerId) => {
              io.to(playerId)
                .timeout(5000)
                .emit("gameOutput", matchLog, (err) => {
                  if (err) {
                    resync(room, room.whitePlayer?.playerId);
                  }
                });
            });
          });
        }
        if (blackStreamOutput.length) {
          blackStreamOutput.forEach((matchLog) => {
            if (room.blackPlayer?.playerId) {
              io.to(room.blackPlayer.playerId)
                .timeout(5000)
                .emit("gameOutput", matchLog, (err) => {
                  if (err) {
                    resync(room, room.whitePlayer?.playerId);
                  }
                });
            }
          });
        }

        if (timers) {
          io.to(roomId).emit("currentTimers", timers);
        }
        return cb({ status: "ok" });
      },
    );

    socket.on(
      "requestDraftPokemon",
      async (
        { roomId, playerId, square, draftPokemonIndex, isBan, secretId },
        cb,
      ) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        console.log(
          `${playerId} requested to ${isBan ? "ban" : "draft"} pokemon ${draftPokemonIndex} at ${square} for ${roomId}`,
        );

        if (!room || !playerId) {
          console.log(`${playerId} mismatch for ${roomId}`);
          return cb({ status: "err", message: "Could not find room" });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: "Could not verify player" });
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
            return cb({ status: "err", message: "Could not ban pokemon" });
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
            return cb({ status: "err", message: "Could not draft pokemon" });
          }
        }

        if (matchOutput) {
          matchOutput.forEach((log) => {
            io.to(roomId)
              .timeout(5000)
              .emit("gameOutput", log, (err) => {
                if (err) {
                  resync(room, room.whitePlayer?.playerId);
                }
              });
          });
        }

        if (timer) {
          io.to(roomId).emit("currentTimers", timer);
        }
        return cb({ status: "ok" });
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
          io.to(playerId)
            .timeout(5000)
            .emit(
              "startSync",
              {
                history: await room.getHistory(playerId),
              },
              (err) => {
                if (err) {
                  resync(room, playerId);
                }
              },
            );
          if (room.roomGameOptions.timersEnabled && room.gameTimer) {
            socket.emit(
              "currentTimers",
              room.gameTimer.getTimersWithLastMoveShift(),
            );
          }
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
              io.to(roomId)
                .timeout(5000)
                .emit("gameOutput", log, (err) => {
                  if (err) {
                    resync(room, room.whitePlayer?.playerId);
                  }
                });
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
