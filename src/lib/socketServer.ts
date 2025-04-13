import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { auth } from '@clerk/nextjs/server';

// Event types for broadcasting
export enum SocketEventType {
  SERVICE_STATUS_CHANGE = 'service:status:change',
  INCIDENT_CREATE = 'incident:create',
  INCIDENT_UPDATE = 'incident:update',
  MAINTENANCE_CREATE = 'maintenance:create',
  MAINTENANCE_UPDATE = 'maintenance:update',
  MAINTENANCE_STATUS_CHANGE = 'maintenance:status:change',
  COMMENT_CREATE = 'comment:create',
}

// Socket.io server instance
let io: SocketIOServer | null = null;

// Map to store organization rooms subscriptions
const organizationRooms = new Map<string, Set<string>>();

/**
 * Initialize the Socket.io server
 * @param httpServer HTTP server instance
 * @returns Socket.io server instance
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      // For public access (no authentication required)
      if (socket.handshake.query.public === 'true') {
        socket.data.isPublic = true;
        return next();
      }

      // For authenticated access
      const sessionToken = socket.handshake.auth.token as string;
      if (!sessionToken) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Set authenticated user data
      socket.data.isPublic = false;
      socket.data.authenticated = true;
      return next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      return next(new Error('Authentication error'));
    }
  });

  // Connection handling
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle joining organization room
    socket.on('join:organization', (organizationId: string) => {
      const roomName = `organization:${organizationId}`;
      socket.join(roomName);
      
      // Keep track of subscriptions
      if (!organizationRooms.has(organizationId)) {
        organizationRooms.set(organizationId, new Set());
      }
      organizationRooms.get(organizationId)?.add(socket.id);

      console.log(`Socket ${socket.id} joined room ${roomName}`);
    });

    // Handle leaving organization room
    socket.on('leave:organization', (organizationId: string) => {
      const roomName = `organization:${organizationId}`;
      socket.leave(roomName);
      
      // Remove from subscriptions
      organizationRooms.get(organizationId)?.delete(socket.id);
      if (organizationRooms.get(organizationId)?.size === 0) {
        organizationRooms.delete(organizationId);
      }

      console.log(`Socket ${socket.id} left room ${roomName}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Clean up subscriptions
      for (const [organizationId, socketIds] of organizationRooms.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) {
            organizationRooms.delete(organizationId);
          }
        }
      }
    });
  });

  console.log('Socket.io server initialized');
  return io;
}

/**
 * Get the Socket.io server instance
 * @returns Socket.io server instance or null if not initialized
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Emit event to an organization room
 * @param organizationId Organization ID
 * @param event Event type
 * @param data Event data
 */
export function emitToOrganization(
  organizationId: string, 
  event: SocketEventType, 
  data: any
): void {
  if (!io) {
    console.warn('Socket.io server not initialized');
    return;
  }

  const roomName = `organization:${organizationId}`;
  io.to(roomName).emit(event, data);
  console.log(`Emitted ${event} to room ${roomName}`);
} 