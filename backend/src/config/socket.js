import { Server } from 'socket.io';
import { logger } from './logger.js';
import { isOriginAllowed } from './cors.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origin not allowed by CORS'));
        }
      },
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
