// src/components/layout/Layout.tsx

import React from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import Navbar from './Navbar';
import Footer from './Footer';
import { SkipLink } from '@/components/a11y/SkipLink';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      <SkipLink />
      <Navbar />
      <main 
        id="main-content"
        className="container mx-auto px-4 py-8"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;