import {
  deleteRoom,
  getDisconnectedUsers,
  getRoomsWithNoUsers,
  roomExists,
} from "./cache/redis.js";
import { InternalConfig } from "./config.js";

const DISCONNECTED_USER_INTERVAL = 1000 * 60 * 3;

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

      try {
        const roomsWithNoUsers = await getRoomsWithNoUsers();

        roomsWithNoUsers.forEach((roomId) => {
          deleteRoom(roomId);
        });
      } catch (err) {
        console.log("Could not clean up rooms with no users", err);
      }
    }, DISCONNECTED_USER_INTERVAL);
  };

  setUpDisconnectedUserCleanUpInterval();
};
