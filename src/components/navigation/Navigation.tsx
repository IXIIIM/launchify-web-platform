// src/components/navigation/Navigation.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  User, 
  Users, 
  MessageCircle, 
  CreditCard, 
  Settings,
  Menu,
  X,
  LogOut,
  Bell
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTheme } from '@/components/theme/ThemeProvider';
import { TouchButton } from '@/components/base/mobile';

interface NavLink {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  badge?: number;
}

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { theme, setTheme } = useTheme();

  // Navigation links configuration
  const navLinks: NavLink[] = [
    { path: '/', label: 'Home', icon: <Home />, requiresAuth: false },
    { path: '/dashboard', label: 'Dashboard', icon: <User />, requiresAuth: true },
    { path: '/matching', label: 'Matching', icon: <Users />, requiresAuth: true },
    { 
      path: '/chat', 
      label: 'Messages', 
      icon: <MessageCircle />, 
      requiresAuth: true,
      badge: unreadCount 
    },
    { path: '/subscription', label: 'Subscription', icon: <CreditCard />, requiresAuth: true },
    { path: '/settings', label: 'Settings', icon: <Settings />, requiresAuth: true }
  ];

  // Fetch unread counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const [messagesResponse, notificationsResponse] = await Promise.all([
          fetch('/api/messages/unread-count'),
          fetch('/api/notifications/unread-count')
        ]);

        if (messagesResponse.ok) {
          const { count } = await messagesResponse.json();
          setUnreadCount(count);
        }

        if (notificationsResponse.ok) {
          const { count } = await notificationsResponse.json();
          setNotificationCount(count);
        }
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    };

    fetchUnreadCounts();

    // WebSocket connection for real-time updates
    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:8080');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'UNREAD_COUNT_UPDATE') {
        setUnreadCount(data.messageCount);
        setNotificationCount(data.notificationCount);
      }
    };

    return () => ws.close();
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Desktop Navigation
  if (!isMobile) {
    return (
      <nav 
        className={`fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 shadow
          ${theme === 'dark' ? 'dark' : ''}`}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <button 
                  onClick={() => handleNavigation('/')}
                  className="text-2xl font-bold text-blue-600 dark:text-blue-400"
                  aria-label="Launchify home"
                >
                  Launchify
                </button>
              </div>
              
              {/* Navigation Links */}
              <div className="ml-6 flex space-x-8">
                {navLinks.filter(link => !link.requiresAuth || true).map((link) => (
                  <button
                    key={link.path}
                    onClick={() => handleNavigation(link.path)}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors
                      ${location.pathname === link.path 
                        ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    aria-current={location.pathname === link.path ? 'page' : undefined}
                  >
                    <span className="mr-2 relative">
                      {link.icon}
                      {link.badge && link.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                          {link.badge}
                        </span>
                      )}
                    </span>
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '🔆' : '🌙'}
              </button>
              
              <button 
                onClick={() => handleNavigation('/notifications')}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Mobile Navigation
  return (
    <>
      {/* Bottom Tab Bar */}
      <nav 
        className={`fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 h-16 
          ${theme === 'dark' ? 'dark' : ''}`}
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5 h-full">
          {navLinks.slice(0, 4).map((link) => (
            <button
              key={link.path}
              onClick={() => handleNavigation(link.path)}
              className={`flex flex-col items-center justify-center relative ${
                location.pathname === link.path
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              aria-current={location.pathname === link.path ? 'page' : undefined}
            >
              <span className="relative">
                {link.icon}
                {link.badge && link.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                    {link.badge}
                  </span>
                )}
              </span>
              <span className="mt-1 text-xs">{link.label}</span>
            </button>
          ))}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
            <span className="mt-1 text-xs">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-3/4 max-w-sm bg-white dark:bg-gray-800 z-50 flex flex-col"
              aria-label="Mobile menu"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold dark:text-white">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {navLinks.slice(4).map((link) => (
                  <button
                    key={link.path}
                    onClick={() => handleNavigation(link.path)}
                    className={`w-full flex items-center space-x-3 p-4 rounded-lg mb-2 ${
                      location.pathname === link.path
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                    }`}
                    aria-current={location.pathname === link.path ? 'page' : undefined}
                  >
                    <span className="relative">
                      {link.icon}
                      {link.badge && link.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                          {link.badge}
                        </span>
                      )}
                    </span>
                    <span>{link.label}</span>
                  </button>
                ))}
                
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center space-x-3 p-4 rounded-lg mb-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <span>{theme === 'dark' ? '🔆' : '🌙'}</span>
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <TouchButton
                  variant="ghost"
                  fullWidth
                  icon={<LogOut className="w-5 h-5" />}
                  onClick={() => {/* Handle logout */}}
                  className="text-red-600 dark:text-red-400"
                >
                  Logout
                </TouchButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;