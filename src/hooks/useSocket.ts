import { useEffect, useRef, useState, useCallback } from 'react';

// Mock implementation for development
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    console.log('Socket connect called');
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    console.log('Socket disconnect called');
    setIsConnected(false);
  }, []);

  useEffect(() => {
    // Simulate connection
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    connect,
    disconnect
  };
};

export default useSocket; 