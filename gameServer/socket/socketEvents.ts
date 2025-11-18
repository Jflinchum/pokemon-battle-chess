import { Server } from "socket.io";
import User from "../../shared/models/User.js";
import { MatchLog, Timer } from "../../shared/types/Game.js";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/types/Socket.js";
import {
  cleanString,
  isStringProfane,
} from "../../shared/util/profanityFilter.js";
import {
  addPlayerIdToRoomPlayerSet,
  addPlayerToCache,
  setPlayerViewingResults,
} from "../cache/redis.js";
import {
  COULD_NOT_FIND_ALL_PLAYERS,
  COULD_NOT_JOIN_MATCH_QUEUE,
  COULD_NOT_START_GAME_ERROR,
  FAILED_TO_CREATE_ROOM_ERROR,
  INVALID_CHESS_MOVE,
  INVALID_PLAYER_ERROR,
  NAME_PROFANITY_ERROR,
  POKEMON_ENGINE_ERROR,
  UNABLE_TO_BAN_POKEMON,
  UNABLE_TO_DRAFT_POKEMON,
  UNABLE_TO_FIND_PLAYER_ERROR,
  UNABLE_TO_FIND_ROOM_ERROR,
} from "../constants/errorMessages.js";
import logger from "../logger.js";
import GameRoom from "../models/GameRoom.js";
import GameRoomManager from "../models/GameRoomManager.js";

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
    logger.info("New User Connection");
    let player: User | null = null;

    socket.on("disconnect", async () => {
      logger.info("User Disconnected");

      const room = await gameRoomManager.getCachedRoom(
        player?.connectedRoom ?? undefined,
      );

      if (room && player) {
        logger.info({
          name: "socketDisconnect",
          body: {
            textPayload: "Preparing player for disconnect",
            playerName: player.playerName,
            playerId: player.playerId,
            roomId: room.roomId,
          },
        });
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
        if (!playerId || !secretId || !playerName || !matchQueue) {
          logger.warn({
            body: {
              textPayload: "Invalid parameters for quick play",
              playerName,
              playerId,
              avatarId,
              matchQueue,
            },
          });
          return cb({ status: "err", message: COULD_NOT_JOIN_MATCH_QUEUE });
        }
        if (isStringProfane(playerName)) {
          return cb({ status: "err", message: NAME_PROFANITY_ERROR });
        }
        const user = new User(playerName, playerId, avatarId || "1", secretId);
        player = user;
        socket.join(playerId);

        await addPlayerToCache(user);
        logger.info({
          body: {
            name: "matchSearch",
            textPayload: "Player has joined the matchmaking queue",
            playerName,
            playerId,
            avatarId,
            matchQueue,
          },
        });

        const nextUserInQueue =
          await gameRoomManager.getPlayerFromQueue(matchQueue);

        if (!nextUserInQueue) {
          gameRoomManager.addPlayerToQueue(user, matchQueue);
        } else if (nextUserInQueue !== playerId) {
          logger.info({
            body: {
              name: "matchSearch",
              textPayload: "Creating quickplay match",
              playerName,
              playerId,
              avatarId,
              matchQueue,
              nextUserInQueuePlayerId: nextUserInQueue,
            },
          });
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
            logger.error({
              body: {
                name: "matchSearch",
                textPayload: "Unable to create a room for matchmaking",
                playerName,
                playerId,
                avatarId,
                matchQueue,
                nextUserInQueuePlayerId: nextUserInQueue,
                roomId: room.roomId,
              },
            });
            return cb({ status: "err", message: FAILED_TO_CREATE_ROOM_ERROR });
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
        logger.info({
          body: {
            name: "socketJoinRoom",
            textPayload: "Player requested to join room",
            playerId,
            roomId,
          },
        });
        if (
          !(await gameRoomManager.verifyPlayerConnection(
            { roomId, playerId, secretId },
            { roomCode },
          ))
        ) {
          socket.disconnect();
          return cb({ status: "err", message: INVALID_PLAYER_ERROR });
        }
        const user = await gameRoomManager.getUser(playerId);
        const room = await gameRoomManager.getCachedRoom(roomId);
        if (!user || !room) {
          socket.disconnect();
          return cb({ status: "err", message: UNABLE_TO_FIND_ROOM_ERROR });
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
        logger.info({
          body: {
            name: "socketJoinRoom",
            textPayload: "Player joined the room",
            playerName: user.playerName,
            playerId,
            roomId,
          },
        });

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
        logger.info({
          body: {
            name: "socketRequestToggleSpectating",
            textPayload: "Player requested to change to spectator",
            playerId,
            roomId,
          },
        });

        if (!roomExists || !playerId) {
          logger.warn({
            body: {
              name: "socketRequestToggleSpectating",
              textPayload: "Invalid parameters",
              playerId,
              roomExists,
              roomId,
            },
          });
          return cb({ status: "err", message: UNABLE_TO_FIND_ROOM_ERROR });
        }
        const user = await gameRoomManager.getUser(playerId);
        if (!user) {
          return cb({ status: "err", message: UNABLE_TO_FIND_PLAYER_ERROR });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: INVALID_PLAYER_ERROR });
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
        logger.info({
          body: {
            name: "socketRequestChangeGameOptions",
            textPayload: "Player requested to change game options",
            playerId,
            roomId,
          },
        });

        if (!room || room.hostPlayer?.playerId !== playerId) {
          logger.warn({
            body: {
              name: "socketRequestChangeGameOptions",
              textPayload: "Invalid parameters",
              roomId: room?.roomId,
              playerId,
              hostId: room?.hostPlayer?.playerId,
            },
          });
          return cb({ status: "err", message: UNABLE_TO_FIND_ROOM_ERROR });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: INVALID_PLAYER_ERROR });
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
        logger.info({
          body: {
            name: "socketRequestStartGame",
            textPayload: "Player requested to start the game",
            playerId,
            roomId,
          },
        });

        if (!room || room.hostPlayer?.playerId !== playerId) {
          logger.warn({
            body: {
              name: "socketRequestStartGame",
              textPayload: "Invalid parameters",
              playerId,
              roomId: room?.roomId,
              hostId: room?.hostPlayer?.playerId,
            },
          });
          return cb({ status: "err", message: UNABLE_TO_FIND_ROOM_ERROR });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: INVALID_PLAYER_ERROR });
        }
        if (!room.player1 || !room.player2) {
          logger.warn({
            body: {
              name: "socketRequestStartGame",
              textPayload: "Player 1 and Player 2 slots are not filled",
              playerId,
              roomId,
              player1Id: room.player1?.playerId,
              player2Id: room.player2?.playerId,
            },
          });
          return cb({
            status: "err",
            message: COULD_NOT_FIND_ALL_PLAYERS,
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
        } catch (err) {
          logger.warn({
            body: {
              name: "socketRequestStartGame",
              textPayload: "Failed to start game",
              playerId,
              roomId,
              err,
            },
          });
          return cb({
            status: "err",
            message: COULD_NOT_START_GAME_ERROR,
          });
        }
        return cb({
          status: "ok",
        });
      },
    );

    socket.on(
      "requestEndGameAsHost",
      async ({ roomId, playerId, secretId }, cb) => {
        const room = await gameRoomManager.getCachedRoom(roomId);
        logger.info({
          body: {
            name: "socketRequestEndGameAsHost",
            textPayload: "Player requested to end the game",
            playerId,
            roomId,
          },
        });

        if (!room || room.hostPlayer?.playerId !== playerId) {
          logger.warn({
            body: {
              name: "socketRequestEndGameAsHost",
              textPayload: "Invalid parameters",
              playerId,
              roomId: room?.roomId,
              hostId: room?.hostPlayer?.playerId,
            },
          });
          return cb({ status: "err", message: UNABLE_TO_FIND_ROOM_ERROR });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: INVALID_PLAYER_ERROR });
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
        logger.info({
          body: {
            name: "socketRequestKickPlayer",
            textPayload: "Player requested to kick another player",
            playerId,
            kickedPlayerId,
            roomId,
          },
        });

        if (!room || !kickedPlayerId || !playerId) {
          logger.warn({
            body: {
              name: "socketRequestKickPlayer",
              textPayload: "Invalid parameters",
              playerId,
              kickedPlayerId,
              roomId: room?.roomId,
            },
          });
          return cb({ status: "err", message: UNABLE_TO_FIND_ROOM_ERROR });
        }
        const kickedPlayer = await gameRoomManager.getUser(kickedPlayerId);
        const host = await gameRoomManager.getUser(playerId);
        if (!kickedPlayer || !host || room.hostPlayer?.playerId !== playerId) {
          return cb({
            status: "err",
            message: UNABLE_TO_FIND_PLAYER_ERROR,
          });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: INVALID_PLAYER_ERROR });
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
        logger.info({
          body: {
            name: "socketRequestMovePlayerToSpectator",
            textPayload: "Player requested to another player to spectator",
            playerId,
            spectatorPlayerId,
            roomId,
          },
        });

        if (!room || !playerId || !spectatorPlayerId) {
          logger.warn({
            body: {
              name: "socketRequestMovePlayerToSpectator",
              textPayload: "Invalid parameters",
              playerId,
              spectatorPlayerId,
              roomId: room?.roomId,
            },
          });
          return cb({ status: "err", message: UNABLE_TO_FIND_ROOM_ERROR });
        }
        const spectatorUser = await gameRoomManager.getUser(spectatorPlayerId);
        const host = await gameRoomManager.getUser(playerId);
        if (!spectatorUser || !host || room.hostPlayer?.playerId !== playerId) {
          return cb({
            status: "err",
            message: UNABLE_TO_FIND_PLAYER_ERROR,
          });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: INVALID_PLAYER_ERROR });
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
      logger.info({
        body: {
          name: "socketRequestSync",
          textPayload: "Player requested sync game state",
          playerId,
          roomId,
        },
      });
      const room = await gameRoomManager.getCachedRoom(roomId);
      if (!room) {
        logger.warn({
          body: {
            name: "socketRequestSync",
            textPayload: "Room not found",
            playerId,
            roomId,
          },
        });
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
        logger.info({
          body: {
            name: "socketRequestChessMove",
            textPayload: "Player requested for a chess move",
            playerId,
            roomId,
            sanMove,
          },
        });
        const room = await gameRoomManager.getCachedRoom(roomId);
        if (!room || !playerId) {
          logger.warn({
            body: {
              name: "socketRequestChessMove",
              textPayload: "Invalid parameters",
              playerId,
              roomId: room?.roomId,
            },
          });
          return cb({ status: "err", message: UNABLE_TO_FIND_ROOM_ERROR });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: INVALID_PLAYER_ERROR });
        }

        const streamOutputs = await room.validateAndEmitChessMove({
          sanMove,
          playerId,
        });

        if (!streamOutputs) {
          return cb({ status: "err", message: INVALID_CHESS_MOVE });
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
        logger.info({
          body: {
            name: "socketRequestPokemonMove",
            textPayload: "Player requested for a pokemon move",
            playerId,
            roomId,
            pokemonMove,
          },
        });

        if (!room || !playerId) {
          logger.warn({
            body: {
              name: "socketRequestPokemonMove",
              textPayload: "Invalid parameters",
              playerId,
              roomId: room?.roomId,
            },
          });
          return cb({ status: "err", message: UNABLE_TO_FIND_ROOM_ERROR });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: INVALID_PLAYER_ERROR });
        }

        const streamOutputs = await room.validateAndEmitPokemonMove({
          pokemonMove,
          playerId,
        });

        if (!streamOutputs) {
          return cb({ status: "err", message: POKEMON_ENGINE_ERROR });
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
        logger.info({
          body: {
            name: "socketRequestDraftPokemon",
            textPayload: "Player requested to draft/ban a pokemon",
            isBan,
            playerId,
            roomId,
            square,
            draftPokemonIndex,
          },
        });

        if (!room || !playerId) {
          logger.warn({
            body: {
              name: "socketRequestDraftPokemon",
              textPayload: "Invalid parameters",
              isBan,
              playerId,
              roomId: room?.roomId,
              square,
              draftPokemonIndex,
            },
          });
          return cb({ status: "err", message: UNABLE_TO_FIND_ROOM_ERROR });
        }
        if (
          !(await gameRoomManager.verifyPlayerConnection({
            roomId,
            playerId,
            secretId,
          }))
        ) {
          return cb({ status: "err", message: INVALID_PLAYER_ERROR });
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
            logger.error({
              body: {
                name: "socketRequestDraftPokemon",
                textPayload: "Unable to validate or parse pokemon ban",
                err,
                isBan,
                playerId,
                roomId: room?.roomId,
                square,
                draftPokemonIndex,
              },
            });
            return cb({ status: "err", message: UNABLE_TO_BAN_POKEMON });
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
            logger.error({
              body: {
                name: "socketRequestDraftPokemon",
                textPayload: "Unable to validate or parse pokemon draft",
                err,
                isBan,
                playerId,
                roomId,
                square,
                draftPokemonIndex,
              },
            });
            return cb({ status: "err", message: UNABLE_TO_DRAFT_POKEMON });
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
          logger.warn({
            body: {
              name: "socketSetViewingResults",
              textPayload: "Invalid parameters",
              playerId,
              roomId: room?.roomId,
            },
          });
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
