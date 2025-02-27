// src/hooks/useWebSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketHookOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (data: any) => void;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
}

export function useWebSocket(token: string, options: WebSocketHookOptions = {}) {
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: true,
    error: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const {
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options;

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`
      );

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setState({
          connected: true,
          connecting: false,
          error: null
        });
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        setState(prev => ({
          ...prev,
          connected: false
        }));
        onClose?.();

        // Attempt reconnection if not closed cleanly
        if (event.code !== 1000 && event.code !== 1001) {
          handleReconnect();
        }
      };

      ws.onerror = (error) => {
        if (!mountedRef.current) return;
        setState(prev => ({
          ...prev,
          error: error as Error
        }));
        onError?.(error);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        error: error as Error,
        connecting: false
      }));
      handleReconnect();
    }
  }, [token]);

  const handleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    
    if (reconnectAttemptsRef.current >= reconnectAttempts) {
      setState(prev => ({
        ...prev,
        error: new Error('Max reconnection attempts reached'),
        connecting: false
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      connecting: true
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, reconnectInterval);
  }, [reconnectAttempts, reconnectInterval, connect]);

  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'new_notification':
      case 'notification_updated':
      case 'notification_dismissed':
      case 'pending_notifications':
        onMessage?.(data);
        break;

      case 'error':
        setState(prev => ({
          ...prev,
          error: new Error(data.message)
        }));
        break;

      default:
        console.warn('Unknown WebSocket message type:', data.type);
    }
  }, [onMessage]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnecting');
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [connect, disconnect]);

  // Utility functions for notification actions
  const markAsRead = useCallback((notificationId: string) => {
    send({
      type: 'read',
      notificationId
    });
  }, [send]);

  const dismiss = useCallback((notificationId: string) => {
    send({
      type: 'dismiss',
      notificationId
    });
  }, [send]);

  const subscribe = useCallback((topics: string[]) => {
    send({
      type: 'subscribe',
      topics
    });
  }, [send]);

  return {
    state,
    send,
    disconnect,
    markAsRead,
    dismiss,
    subscribe
  };
}