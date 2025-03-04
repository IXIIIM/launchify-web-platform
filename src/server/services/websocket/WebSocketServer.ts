import WebSocket from 'ws';
import http from 'http';

export class WebSocketServer {
  private wss: WebSocket.Server;

  constructor(server: http.Server) {
    this.wss = new WebSocket.Server({ server });
    this.init();
  }

  private init() {
    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket) {
    ws.on('message', this.handleMessage.bind(this));
    ws.on('close', this.handleClose.bind(this));
  }

  private handleMessage(message: string) {
    // Handle incoming messages
  }

  private handleClose() {
    // Handle connection close
  }

  public async close() {
    return new Promise<void>((resolve) => {
      this.wss.close(() => resolve());
    });
  }
}