import { ErrorStats } from '@/types/error';

type ErrorUpdateCallback = (stats: ErrorStats) => void;
type ErrorAlertCallback = (alert: any) => void;

export class ErrorRealtimeService {
  private static instance: ErrorRealtimeService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private updateCallbacks: Set<ErrorUpdateCallback> = new Set();
  private alertCallbacks: Set<ErrorAlertCallback> = new Set();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): ErrorRealtimeService {
    if (!ErrorRealtimeService.instance) {
      ErrorRealtimeService.instance = new ErrorRealtimeService();
    }
    return ErrorRealtimeService.instance;
  }

  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${process.env.REACT_APP_WS_URL}/errors?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  onUpdate(callback: ErrorUpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  onAlert(callback: ErrorAlertCallback): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  private handleOpen(): void {
    console.log('Error monitoring WebSocket connected');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'ERROR_STATS_UPDATE':
          this.updateCallbacks.forEach(callback => callback(data.stats));
          break;

        case 'ERROR_ALERT':
          this.alertCallbacks.forEach(callback => callback(data.alert));
          break;

        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('Error monitoring WebSocket closed:', event.code, event.reason);
    
    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('Error monitoring WebSocket error:', event);
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Scheduling reconnect in ${delay}ms...`);

    setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.reconnectAttempts++;
        this.connect(this.getStoredToken());
      }
    }, delay);
  }

  private getStoredToken(): string {
    // Get authentication token from storage
    return localStorage.getItem('authToken') || '';
  }

  // Request immediate stats update
  requestStatsUpdate(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'REQUEST_STATS_UPDATE'
      }));
    }
  }

  // Subscribe to specific error types or components
  subscribeToComponent(component: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SUBSCRIBE_COMPONENT',
        component
      }));
    }
  }

  unsubscribeFromComponent(component: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'UNSUBSCRIBE_COMPONENT',
        component
      }));
    }
  }

  subscribeToSeverity(severity: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SUBSCRIBE_SEVERITY',
        severity
      }));
    }
  }

  unsubscribeFromSeverity(severity: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'UNSUBSCRIBE_SEVERITY',
        severity
      }));
    }
  }
}