const { Server } = require('socket.io');

// Event types for broadcasting
const SocketEventType = {
  SERVICE_STATUS_CHANGE: 'service:status:change',
  INCIDENT_CREATE: 'incident:create',
  INCIDENT_UPDATE: 'incident:update',
  MAINTENANCE_CREATE: 'maintenance:create',
  MAINTENANCE_UPDATE: 'maintenance:update',
  MAINTENANCE_STATUS_CHANGE: 'maintenance:status:change',
  COMMENT_CREATE: 'comment:create',
};

// Socket.io server instance
let io = null;

/**
 * Initialize the Socket.io server
 * @param {import('http').Server} httpServer HTTP server instance
 * @returns {import('socket.io').Server} Socket.io server instance
 */
function initSocketServer(httpServer) {
  if (io) return io;

  try {
    io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Connection handling
    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle joining organization room
      socket.on('join:organization', (organizationId) => {
        if (!organizationId) {
          console.warn('No organization ID provided for join:organization');
          return;
        }
        
        const roomName = `organization:${organizationId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room ${roomName}`);
      });

      // Handle leaving organization room
      socket.on('leave:organization', (organizationId) => {
        if (!organizationId) {
          console.warn('No organization ID provided for leave:organization');
          return;
        }
        
        const roomName = `organization:${organizationId}`;
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left room ${roomName}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });

    console.log('Socket.io server initialized successfully');
    return io;
  } catch (error) {
    console.error('Failed to initialize Socket.io server:', error);
    // Return a dummy socket server to prevent app crashes
    return {
      to: () => ({
        emit: () => {
          console.warn('Emitting to socket failed - socket server not properly initialized');
        }
      }),
      on: () => {}
    };
  }
}

/**
 * Emit event to an organization room
 * @param {string} organizationId Organization ID
 * @param {string} event Event type
 * @param {any} data Event data
 */
function emitToOrganization(organizationId, event, data) {
  if (!io) {
    console.warn('Socket.io server not initialized');
    return;
  }

  try {
    const roomName = `organization:${organizationId}`;
    io.to(roomName).emit(event, data);
    console.log(`Emitted ${event} to room ${roomName}`);
  } catch (error) {
    console.error('Error emitting socket event:', error);
  }
}

module.exports = {
  initSocketServer,
  emitToOrganization,
  SocketEventType
}; 