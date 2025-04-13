import { useEffect, useState } from 'react';
import { useSocket, SocketEventType, joinOrganization, leaveOrganization } from '@/lib/socketClient';
import { useUser } from '@clerk/nextjs';
import { Bell, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RealtimeNotificationsProps {
  organizationId: string;
}

export default function RealtimeNotifications({ organizationId }: RealtimeNotificationsProps) {
  const { user, isLoaded } = useUser();
  const { socket, isConnected } = useSocket({ token: user?.id });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (socket && isConnected && isLoaded) {
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
          title: data.name,
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
          title: data.title,
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
          title: data.title,
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
          title: data.title,
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
          title: data.title,
          time: new Date(),
          id: data.maintenanceId
        });
      });

      socket.on(SocketEventType.COMMENT_CREATE, (data) => {
        const message = `New comment on ${data.entityType} "${data.entityTitle}"`;
        toast(message, {
          duration: 5000,
        });
        addNotification({
          type: 'comment',
          message,
          title: data.entityTitle,
          content: data.content,
          time: new Date(),
          entityId: data.entityId,
          entityType: data.entityType
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
        socket.off(SocketEventType.COMMENT_CREATE);
      };
    }
  }, [socket, isConnected, organizationId, isLoaded, user]);

  const addNotification = (notification: any) => {
    setNotifications(prev => [notification, ...prev].slice(0, 20));
    setUnreadCount(prev => prev + 1);
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

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  if (!isConnected || !isLoaded) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] min-h-[1.25rem] flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[500px] overflow-y-auto p-0">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-start">
                  <span className="mr-3 mt-0.5">
                    {notification.type === 'service' ? getStatusIcon(notification.status) :
                     notification.type === 'incident' ? <AlertCircle className="h-4 w-4 text-red-500" /> :
                     notification.type === 'maintenance' ? <Bell className="h-4 w-4 text-blue-500" /> :
                     <Bell className="h-4 w-4 text-gray-500" />
                    }
                  </span>
                  <div>
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-gray-500">{notification.message}</p>
                    {notification.content && (
                      <p className="text-xs mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {notification.content}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.time).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
} 