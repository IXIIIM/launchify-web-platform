import React, { useState, useEffect } from 'react';
import { 
  Bell,
  MessageSquare,
  UserCheck,
  DollarSign,
  CheckCircle,
  X,
  ChevronDown,
  MoreVertical,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: 'match' | 'message' | 'payment' | 'verification' | 'system';
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  timestamp: string;
  actions?: {
    label: string;
    action: string;
  }[];
  data?: Record<string, any>;
}

const NOTIFICATION_ICONS = {
  match: UserCheck,
  message: MessageSquare,
  payment: DollarSign,
  verification: CheckCircle,
  system: Bell
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-red-100 text-red-800'
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Update unread count whenever notifications change
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAction = async (notificationId: string, action: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!response.ok) throw new Error('Failed to process action');

      const result = await response.json();
      
      // Handle action result (e.g., navigation, state updates)
      if (result.redirect) {
        window.location.href = result.redirect;
      } else if (result.refresh) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const clearAll = async () => {
    try {
      const response = await fetch('/api/notifications/clear', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to clear notifications');

      setNotifications([]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getFilteredNotifications = () => {
    return notifications.filter(n => 
      !selectedType || n.type === selectedType
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-full hover:bg-gray-100"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs 
                           rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-50">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {/* Type Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center text-sm text-gray-600">
                      {selectedType || 'All Types'}
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedType(null)}>
                        All Types
                      </DropdownMenuItem>
                      {Object.keys(NOTIFICATION_ICONS).map(type => (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => setSelectedType(type)}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Clear All */}
                  <button
                    onClick={clearAll}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : getFilteredNotifications().length > 0 ? (
                getFilteredNotifications().map(notification => {
                  const Icon = NOTIFICATION_ICONS[notification.type];
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${
                          PRIORITY_COLORS[notification.priority]
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{notification.title}</h4>
                              <p className="text-sm text-gray-600">{notification.body}</p>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <MoreVertical className="h-4 w-4 text-gray-400" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                    Mark as {notification.read ? 'unread' : 'read'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction(notification.id, 'dismiss')}>
                                    Dismiss
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {notification.actions && (
                            <div className="mt-2 space-x-2">
                              {notification.actions.map((action, index) => (
                                <button
                                  key={index}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(notification.id, action.action);
                                  }}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-full
                                           hover:bg-blue-700"
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No notifications to display
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent>
          {selectedNotification && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedNotification.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-gray-600">{selectedNotification.body}</p>

                {selectedNotification.data && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm">
                      {JSON.stringify(selectedNotification.data, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(selectedNotification.timestamp).toLocaleString()}
                  </div>
                  <Badge variant={selectedNotification.priority as any}>
                    {selectedNotification.priority}
                  </Badge>
                </div>

                {selectedNotification.actions && (
                  <div className="flex justify-end space-x-4">
                    {selectedNotification.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleAction(selectedNotification.id, action.action)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}