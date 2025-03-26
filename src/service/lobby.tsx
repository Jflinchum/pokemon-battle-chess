import { socket } from "../socket";
import { removeLastRoom } from "../utils";

export const createNewRoom = async (playerId: string, playerName: string) => {
  const response = await fetch('/api/createRoom', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerId,
      playerName
    })
  });

  const { data } = await response.json();

  return data.roomId;
};

export const leaveRoom = async (roomId: string, playerId: string) => {
  fetch('/api/leaveRoom', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roomId,
      playerId
    })
  });
  removeLastRoom();
  socket.disconnect();
};

export const joinRoom = async (roomId: string, playerId: string, playerName: string) => {
  const response = await fetch('/api/joinRoom', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roomId,
      playerId,
      playerName
    })
  });

  return response.json();
}

export const getAvailableRooms = async () => {
  const response = await fetch('/api/getRooms', {
    method: 'GET',
  });

  const roomResponse = await response.json();
  return roomResponse.rooms;
}