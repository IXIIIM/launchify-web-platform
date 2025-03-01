import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Mobile-optimized wrapper component
const MobileOptimizedLayout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Handle scroll for bottom nav
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setIsBottomNavVisible(
            currentScrollY < lastScrollY || currentScrollY < 50
          );
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    if (isMobile) {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  if (!isMobile) {
    return children;
  }

  const navItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '🤝', label: 'Matches', path: '/matches' },
    { icon: '💬', label: 'Chat', path: '/chat' },
    { icon: '👤', label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="min-h-screen pb-16">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b z-50 flex items-center px-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold mx-auto">Launchify</h1>
      </header>

      {/* Main Content with Pull-to-Refresh */}
      <main className="mt-14">
        <PullToRefresh onRefresh={() => window.location.reload()}>
          {children}
        </PullToRefresh>
      </main>

      {/* Bottom Navigation */}
      <nav 
        className={`fixed bottom-0 left-0 right-0 bg-white border-t z-50 transition-transform duration-300 ${
          isBottomNavVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="h-16 flex justify-around items-center">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center p-2"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

// Pull-to-refresh implementation
const PullToRefresh = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const threshold = 80;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, threshold));
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (pulling && pullDistance >= threshold) {
      onRefresh();
    }
    setPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: pulling ? `translateY(${pullDistance}px)` : 'none',
        transition: pulling ? 'none' : 'transform 0.2s ease-out'
      }}
    >
      {pulling && pullDistance > 0 && (
        <div 
          className="fixed top-14 left-0 right-0 flex justify-center items-center h-8 text-gray-500"
          style={{
            opacity: Math.min(pullDistance / threshold, 1)
          }}
        >
          {pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}
      {children}
    </div>
  );
};

// Touch-optimized swipeable card component for matching
const SwipeableCard = ({ 
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 100 
}) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!swiping) return;
    setCurrentX(e.touches[0].clientX - startX);
  };

  const handleTouchEnd = () => {
    if (!swiping) return;
    
    if (Math.abs(currentX) >= threshold) {
      if (currentX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    
    setStartX(0);
    setCurrentX(0);
    setSwiping(false);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative touch-none"
      style={{
        transform: `translateX(${currentX}px) rotate(${currentX * 0.1}deg)`,
        transition: swiping ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {children}
      
      {swiping && (
        <div className="absolute inset-0 flex items-center justify-between px-8 pointer-events-none">
          <div 
            className="text-4xl"
            style={{ opacity: Math.min(-currentX / threshold, 1) }}
          >
            ✗
          </div>
          <div
            className="text-4xl"
            style={{ opacity: Math.min(currentX / threshold, 1) }}
          >
            ✓
          </div>
        </div>
      )}
    </div>
  );
};

// Mobile-optimized chat input
const MobileChatInput = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStart, setRecordingStart] = useState(0);
  
  const handleTouchStart = () => {
    setIsRecording(true);
    setRecordingStart(Date.now());
  };

  const handleTouchEnd = () => {
    const duration = Date.now() - recordingStart;
    if (duration < 500) {
      // Short press - open keyboard
      document.getElementById('messageInput')?.focus();
    } else {
      // Long press - finish voice recording
      // Voice recording implementation would go here
    }
    setIsRecording(false);
  };

  return (
    <div className="flex items-center p-2 bg-white border-t">
      <button className="p-2">
        📎
      </button>
      <div className="flex-1 mx-2 relative">
        <input
          id="messageInput"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          className="w-full p-2 rounded-full border"
        />
        <button
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
        >
          {isRecording ? '🎙️' : '🎤'}
        </button>
      </div>
      <button
        onClick={() => {
          if (message.trim()) {
            onSend(message);
            setMessage('');
          }
        }}
        className="p-2"
      >
        📤
      </button>
    </div>
  );
};

export { 
  MobileOptimizedLayout,
  PullToRefresh,
  SwipeableCard,
  MobileChatInput
};