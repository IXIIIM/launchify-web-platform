// src/components/layout/ResponsiveLayout.tsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Navigation from '@/components/navigation/Navigation';
import { ArrowLeft, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface HeaderConfig {
  title: string;
  showBack?: boolean;
  showNotifications?: boolean;
  action?: React.ReactNode;
}

const ResponsiveLayout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null);
  const [showMobileHeader, setShowMobileHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Configure headers for different routes
  useEffect(() => {
    const configs: Record<string, HeaderConfig> = {
      '/': { title: 'Home', showNotifications: true },
      '/search': { title: 'Search' },
      '/messages': { title: 'Messages' },
      '/profile': { title: 'Profile' },
      '/settings': { title: 'Settings', showBack: true },
    };

    const matchingPath = Object.keys(configs).find(path => 
      location.pathname.startsWith(path)
    );

    setHeaderConfig(matchingPath ? configs[matchingPath] : null);
  }, [location]);

  // Handle mobile header scroll behavior
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowMobileHeader(currentScrollY <= lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, lastScrollY]);

  // Dynamic classes for page content
  const getContentClasses = () => {
    const baseClasses = 'min-h-screen bg-gray-50';
    
    if (isMobile) {
      return `${baseClasses} pb-16`; // Space for bottom navigation
    }
    
    return `${baseClasses} pl-20`; // Space for sidebar
  };

  const MobileHeader = () => (
    <motion.header
      initial={false}
      animate={{ y: showMobileHeader ? 0 : -100 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed top-0 left-0 right-0 bg-white border-b z-30"
    >
      <div className="flex items-center h-16 px-4">
        {headerConfig?.showBack && (
          <button
            onClick={() => window.history.back()}
            className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        
        <h1 className="text-lg font-semibold flex-1">
          {headerConfig?.title}
        </h1>

        {headerConfig?.showNotifications && (
          <button className="p-2 -mr-2 hover:bg-gray-100 rounded-full relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        )}

        {headerConfig?.action}
      </div>
    </motion.header>
  );

  // Safe area padding for mobile devices
  const getSafeAreaPadding = () => {
    if (!isMobile) return '';

    return `
      env(safe-area-inset-top)
      env(safe-area-inset-right)
      env(safe-area-inset-bottom)
      env(safe-area-inset-left)
    `;
  };

  return (
    <div 
      className="relative"
      style={{ padding: getSafeAreaPadding() }}
    >
      <Navigation />
      
      {isMobile && headerConfig && <MobileHeader />}

      <main className={getContentClasses()}>
        <div className={`
          max-w-7xl mx-auto px-4 
          ${isMobile && headerConfig ? 'pt-20' : 'pt-6'}
        `}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// HOC to wrap pages that need custom header configurations
export const withHeader = (
  WrappedComponent: React.ComponentType<any>,
  headerConfig: HeaderConfig
) => {
  return function WithHeaderComponent(props: any) {
    const [config, setConfig] = useState(headerConfig);

    // Allow pages to update their header config
    const updateHeader = (newConfig: Partial<HeaderConfig>) => {
      setConfig(prev => ({ ...prev, ...newConfig }));
    };

    return (
      <WrappedComponent {...props} headerConfig={config} updateHeader={updateHeader} />
    );
  };
};

export default ResponsiveLayout;