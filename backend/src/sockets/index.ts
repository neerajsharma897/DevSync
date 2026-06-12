import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { users } from '../db/schema/auth.js';
import { eq } from 'drizzle-orm';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    },
  });

  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
      
      const [user] = await db
        .select({ userId: users.userId, deletedAt: users.deletedAt })
        .from(users)
        .where(eq(users.userId, decoded.userId))
        .limit(1);

      if (!user || user.deletedAt) {
        return next(new Error('Authentication error: User not found or deactivated'));
      }

      // Attach user ID to socket
      socket.data.userId = user.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`🔌 User connected: ${userId} (Socket: ${socket.id})`);

    // Join personal user room (for direct notifications)
    socket.join(`user:${userId}`);

    // Join workspace/project/channel rooms
    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${userId} (Socket: ${socket.id})`);
    });
  });

  return io;
};

// Helper function to get the io instance from anywhere in the backend
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};
