import { instrument } from "@socket.io/admin-ui";
import { Server } from "socket.io";

export const registerSocketIoAdmin = (io: Server) => {
  const {
    SOCKET_IO_ADMIN_USER: username,
    SOCKET_IO_ADMIN_PASS: password,
  } = process.env;

  if (process.env.NODE_ENV === 'production' && (!username || !password)) {
    throw new Error('Socket IO username and password environment variables missing');
  }

  instrument(io, {
    auth: username && password ? {
      type: 'basic',
      username,
      password
    } : false,
  });
}