import { socket } from "../socket";

const TIMEOUT_TIME_MS = 5000;

export const createNewRoom = async (
  playerId: string,
  playerName: string,
  password: string,
  avatarId: string,
  secretId: string,
) => {
  const response = await fetch("/lobby-service/create-room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      playerId,
      playerName,
      password,
      avatarId,
      playerSecret: secretId,
    }),
    signal: AbortSignal.timeout(TIMEOUT_TIME_MS),
  });
  return response;
};

export const leaveRoom = async (roomId: string, playerId: string) => {
  fetch("/lobby-service/leave-room", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomId,
      playerId,
    }),
    signal: AbortSignal.timeout(TIMEOUT_TIME_MS),
  });
  socket.disconnect();
};

export const joinRoom = async (
  roomId: string,
  password: string,
  playerId: string,
  playerName: string,
  avatarId: string,
  secretId: string,
) => {
  const response = await fetch("/lobby-service/join-room", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomId,
      password,
      playerId,
      playerName,
      avatarId,
      playerSecret: secretId,
    }),
    signal: AbortSignal.timeout(TIMEOUT_TIME_MS),
  });

  return response;
};

export const getAvailableRooms = async (
  page = 1,
  limit = 10,
  searchTerm = "",
) => {
  const response = await fetch(
    `/lobby-service/get-rooms?page=${page}&limit=${limit}${searchTerm.length ? `&searchTerm=${searchTerm}` : ""}`,
    {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(TIMEOUT_TIME_MS),
    },
  );

  return response;
};

export const getRoom = async (
  { roomId }: { roomId: string },
  fetchOptions: RequestInit = {},
) => {
  const response = await fetch(`/lobby-service/get-room?roomId=${roomId}`, {
    method: "GET",
    headers: {
      "Cache-Control": "no-cache",
    },
    signal: AbortSignal.timeout(TIMEOUT_TIME_MS),
    ...fetchOptions,
  });

  return response;
};

export const logToService = async (
  log: string | { [key: string]: string },
  logPayload?: { [key: string]: string },
) => {
  let logBody: { [key: string]: string } = {};
  if (typeof log === "string") {
    logBody.textPayload = log;
  } else {
    logBody = log;
  }

  logBody = {
    ...logBody,
    ...logPayload,
  };

  return await fetch("/lobby-service/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(TIMEOUT_TIME_MS),
    body: JSON.stringify(logBody),
  });
};
