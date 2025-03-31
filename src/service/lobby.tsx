import { socket } from "../socket";

export const createNewRoom = async (playerId: string, playerName: string, password: string, avatarId: string) => {
  const response = await fetch('/api/createRoom', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerId,
      playerName,
      password,
      avatarId,
    })
  });
  return response;
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
  socket.disconnect();
};

export const joinRoom = async (roomId: string, password: string, playerId: string, playerName: string, avatarId: string) => {
  const response = await fetch('/api/joinRoom', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roomId,
      password,
      playerId,
      playerName,
      avatarId,
    })
  });

  return response;
};

export const getAvailableRooms = async () => {
  const response = await fetch('/api/getRooms', {
    method: 'GET',
  });

  return response;
};