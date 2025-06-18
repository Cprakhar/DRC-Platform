import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function setIO(ioInstance: SocketIOServer) {
  io = ioInstance;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO instance not set');
  return io;
}
