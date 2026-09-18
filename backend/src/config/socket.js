import { Server } from 'socket.io';
import { logger } from './logger.js';
import { env } from './env.js';

let io;

export const initSocket = (server) => {
  const allowedOrigins = env.CORS_ALLOWED_ORIGINS 
    ? env.CORS_ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    
    // Clients can join a room based on their businessId to receive specific leads
    socket.on('join_business_room', (businessId) => {
      socket.join(`business_${businessId}`);
      logger.info(`Socket ${socket.id} joined room business_${businessId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
