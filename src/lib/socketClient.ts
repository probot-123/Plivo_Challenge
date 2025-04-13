import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Define event types matching the server
export enum SocketEventType {
  SERVICE_STATUS_CHANGE = 'service:status:change',
  INCIDENT_CREATE = 'incident:create',
  INCIDENT_UPDATE = 'incident:update',
  MAINTENANCE_CREATE = 'maintenance:create',
  MAINTENANCE_UPDATE = 'maintenance:update',
  MAINTENANCE_STATUS_CHANGE = 'maintenance:status:change',
  COMMENT_CREATE = 'comment:create',
}

// Socket instance singleton
let socket: Socket | null = null;

// Socket connection options
interface SocketOptions {
  token?: string;
  public?: boolean;
}

/**
 * Initialize and get the socket connection
 */
export function getSocket(options: SocketOptions = {}): Socket {
  if (socket) return socket;

  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  socket = io(url, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    auth: options.token ? { token: options.token } : undefined,
    query: options.public ? { public: 'true' } : undefined,
  });

  return socket;
}

/**
 * Disconnect and clear the socket connection
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * React hook for using socket connection
 */
export function useSocket(options: SocketOptions = {}): {
  socket: Socket | null;
  isConnected: boolean;
} {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket(options);
    setSocketInstance(socket);

    const onConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    const onError = (error: Error) => {
      console.error('Socket error:', error);
    };

    // Setup event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);

    // Check initial connection state
    setIsConnected(socket.connected);

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    // Cleanup on unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
    };
  }, [options.token, options.public]);

  return { socket: socketInstance, isConnected };
}

/**
 * Join an organization's real-time updates
 */
export function joinOrganization(organizationId: string): void {
  if (socket) {
    socket.emit('join:organization', organizationId);
  }
}

/**
 * Leave an organization's real-time updates
 */
export function leaveOrganization(organizationId: string): void {
  if (socket) {
    socket.emit('leave:organization', organizationId);
  }
} 