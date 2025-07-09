import { io, Socket } from "socket.io-client";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../shared/types/Socket";

const url =
  process.env.NODE_ENV === "production" ? undefined : "https://localhost:8080";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  url,
  { autoConnect: false },
);
