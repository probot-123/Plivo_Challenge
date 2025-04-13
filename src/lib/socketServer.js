const { Server } = require('socket.io');

// Event types for broadcasting
const EventTypes = {
  SERVICE_STATUS_UPDATED: 'service-status-updated',
  SERVICE_CREATED: 'service-created',
  SERVICE_UPDATED: 'service-updated',
  SERVICE_DELETED: 'service-deleted',
  MAINTENANCE_CREATED: 'maintenance-created',
  MAINTENANCE_UPDATED: 'maintenance-updated',
  MAINTENANCE_DELETED: 'maintenance-deleted',
  MAINTENANCE_STATUS_UPDATED: 'maintenance-status-updated'
};

/**
 * Initialize Socket.io server
 * @param {import('http').Server} httpServer - HTTP server instance
 */
function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Join organization room
    socket.on('join-organization', (organizationSlug) => {
      if (!organizationSlug) {
        return;
      }
      
      const roomName = `organization:${organizationSlug}`;
      
      // Leave any previous organization rooms
      const rooms = [...socket.rooms];
      rooms.forEach(room => {
        if (room !== socket.id && room.startsWith('organization:')) {
          socket.leave(room);
          console.log(`Socket ${socket.id} left room: ${room}`);
        }
      });
      
      // Join new organization room
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  /**
   * Emit event to organization room
   * @param {string} organizationSlug - Organization slug
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   */
  function emitToOrganization(organizationSlug, eventType, data) {
    const roomName = `organization:${organizationSlug}`;
    io.to(roomName).emit(eventType, data);
    console.log(`Emitted ${eventType} to ${roomName}`, data);
  }

  return {
    io,
    emitToOrganization,
    EventTypes
  };
}

module.exports = {
  initSocketServer,
  EventTypes
};
