import { useEffect, useState } from 'react';
import { useSocket, SocketEventType, joinOrganization, leaveOrganization } from '@/lib/socketClient';
import { Bell, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface RealtimeStatusUpdatesProps {
  organizationId: string;
  slug: string;
}

export default function RealtimeStatusUpdates({ organizationId, slug }: RealtimeStatusUpdatesProps) {
  const { socket, isConnected } = useSocket({ public: true });
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (socket && isConnected) {
      // Join the organization room
      joinOrganization(organizationId);

      // Set up event listeners
      socket.on(SocketEventType.SERVICE_STATUS_CHANGE, (data) => {
        const statusText = getStatusText(data.status);
        const message = `${data.name} is now ${statusText}`;
        toast(message, {
          icon: getStatusIcon(data.status),
          duration: 5000,
        });
        addNotification({
          type: 'service',
          message,
          time: new Date(),
          status: data.status
        });
      });

      socket.on(SocketEventType.INCIDENT_CREATE, (data) => {
        const message = `New incident: ${data.title}`;
        toast(message, {
          icon: <AlertCircle className="text-red-500" />,
          duration: 5000,
        });
        addNotification({
          type: 'incident',
          message,
          time: new Date(),
          id: data.incidentId
        });
      });

      socket.on(SocketEventType.INCIDENT_UPDATE, (data) => {
        const message = `Incident updated: ${data.title}`;
        toast(message, {
          icon: <AlertCircle className="text-yellow-500" />,
          duration: 5000,
        });
        addNotification({
          type: 'incident',
          message,
          time: new Date(),
          id: data.incidentId
        });
      });

      socket.on(SocketEventType.MAINTENANCE_CREATE, (data) => {
        const message = `New maintenance scheduled: ${data.title}`;
        toast(message, {
          icon: <Bell className="text-blue-500" />,
          duration: 5000,
        });
        addNotification({
          type: 'maintenance',
          message,
          time: new Date(),
          id: data.maintenanceId
        });
      });

      socket.on(SocketEventType.MAINTENANCE_UPDATE, (data) => {
        const message = `Maintenance updated: ${data.title}`;
        toast(message, {
          icon: <Bell className="text-blue-500" />,
          duration: 5000,
        });
        addNotification({
          type: 'maintenance',
          message,
          time: new Date(),
          id: data.maintenanceId
        });
      });

      // Clean up on unmount
      return () => {
        leaveOrganization(organizationId);
        socket.off(SocketEventType.SERVICE_STATUS_CHANGE);
        socket.off(SocketEventType.INCIDENT_CREATE);
        socket.off(SocketEventType.INCIDENT_UPDATE);
        socket.off(SocketEventType.MAINTENANCE_CREATE);
        socket.off(SocketEventType.MAINTENANCE_UPDATE);
      };
    }
  }, [socket, isConnected, organizationId]);

  const addNotification = (notification: any) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10));
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded_performance':
        return 'Experiencing Degraded Performance';
      case 'partial_outage':
        return 'Experiencing Partial Outage';
      case 'major_outage':
        return 'Experiencing Major Outage';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="text-green-500" />;
      case 'degraded_performance':
        return <AlertTriangle className="text-yellow-500" />;
      case 'partial_outage':
        return <AlertCircle className="text-orange-500" />;
      case 'major_outage':
        return <AlertCircle className="text-red-500" />;
      default:
        return <Bell />;
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Recent Updates</h3>
            <button
              onClick={() => setNotifications([])}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {notifications.map((notification, index) => (
              <div key={index} className="text-xs border-b border-gray-100 dark:border-gray-700 pb-2">
                <div className="flex items-start">
                  <span className="mr-2 mt-0.5">
                    {notification.type === 'service' ? getStatusIcon(notification.status) :
                     notification.type === 'incident' ? <AlertCircle className="h-3 w-3 text-red-500" /> :
                     <Bell className="h-3 w-3 text-blue-500" />
                    }
                  </span>
                  <div>
                    <p>{notification.message}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-[10px]">
                      {new Date(notification.time).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 