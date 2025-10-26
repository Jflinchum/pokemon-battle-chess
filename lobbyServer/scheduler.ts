import {
  deleteRoom,
  getDisconnectedUsers,
  getRoomsWithNoUsers,
  roomExists,
} from "./cache/redis.js";
import { InternalConfig } from "./config.js";

const SCHEDULER_INTERVAL = 1000 * 60 * 5;

export const registerScheduler = (config: InternalConfig) => {
  const setUpDisconnectedUserCleanUpInterval = () => {
    setInterval(async () => {
      console.log("Running clean up job.");
      const disconnectedUsers = await getDisconnectedUsers();

      disconnectedUsers.forEach(async (user) => {
        const doesRoomExist = await roomExists(user.roomId);
        if (doesRoomExist) {
          fetch(`${config.gameServiceUrl}/game-service/leave-room`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              roomId: user.roomId,
              playerId: user.playerId,
            }),
          });
        }
      });

      /**
       * The following is a hack that I would love to remove. Occasionally a transaction to the redis store will fail
       * in the middle of creating a room. This can cause a couple of issues:
       * - The room is half created, with no host
       * - The room is created, however the player is not stored in redis
       *
       * The user creating the room will see an error message in this scenario. Memory will still be taken up in redis
       */
      try {
        const roomsWithNoUsers = await getRoomsWithNoUsers();

        roomsWithNoUsers.forEach((roomId) => {
          deleteRoom(roomId);
        });
      } catch (err) {
        console.log("Could not clean up rooms with no users", err);
      }
    }, SCHEDULER_INTERVAL);
  };

  setUpDisconnectedUserCleanUpInterval();
};
