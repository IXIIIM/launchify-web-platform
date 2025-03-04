import { API_BASE_URL } from '../constants';
import { getAuthToken } from '../utils/auth';

export type WebSocketEventType = 
  | 'message'
  | 'notification'
  | 'payment_update'
  | 'escrow_update'
  | 'milestone_update'
  | 'document_update'
  | 'user_status';

export interface WebSocketMessage {
  id: string;
  type: WebSocketEventType;
  data: any;
  timestamp: string;
}

export type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectInterval = 3000; // 3 seconds
  private messageHandlers: Map<WebSocketEventType, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();
  private isConnected = false;
  private pendingMessages: WebSocketMessage[] = [];

  constructor() {
    // Initialize message handler sets for each event type
    const eventTypes: WebSocketEventType[] = [
      'message', 
      'notification', 
      'payment_update', 
      'escrow_update', 
      'milestone_update', 
      'document_update', 
      'user_status'
    ];
    
    eventTypes.forEach(type => {
      this.messageHandlers.set(type, new Set());
    });
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket is already connected or connecting');
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Convert HTTP/HTTPS to WS/WSS
      const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws';
      this.socket = new WebSocket(`${wsUrl}?token=${token}`);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      this.notifyConnectionChange(false);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.notifyConnectionChange(false);
  }

  /**
   * Send a message through the WebSocket
   */
  sendMessage(type: WebSocketEventType, data: any): void {
    const message: WebSocketMessage = {
      id: this.generateId(),
      type,
      data,
      timestamp: new Date().toISOString()
    };

    if (this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      // Queue message to be sent when connection is established
      this.pendingMessages.push(message);
      
      // Try to connect if not already connecting
      if (!this.socket || this.socket.readyState !== WebSocket.CONNECTING) {
        this.connect();
      }
    }
  }

  /**
   * Subscribe to a specific message type
   */
  subscribe(type: WebSocketEventType, handler: MessageHandler): () => void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.add(handler);
    }

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    
    // Immediately notify of current status
    handler(this.isConnected);
    
    // Return unsubscribe function
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  /**
   * Check if the WebSocket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connection established');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.notifyConnectionChange(true);
    
    // Send any pending messages
    if (this.pendingMessages.length > 0) {
      this.pendingMessages.forEach(message => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify(message));
        }
      });
      this.pendingMessages = [];
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Dispatch to appropriate handlers
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error(`Error in message handler for type ${message.type}:`, error);
          }
        });
      }
      
      // Also dispatch to general message handlers
      const generalHandlers = this.messageHandlers.get('message');
      if (generalHandlers) {
        generalHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('Error in general message handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.isConnected = false;
    this.socket = null;
    this.notifyConnectionChange(false);
    
    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnected = false;
    this.notifyConnectionChange(false);
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
      
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimeout = setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    } else {
      console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
    }
  }

  /**
   * Notify all connection handlers of a status change
   */
  private notifyConnectionChange(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  /**
   * Generate a unique ID for messages
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
}

export default new WebSocketService(); 