import { io, Socket } from 'socket.io-client';
import { ISocketClient, SocketEventListener, ReconnectCallback } from './ISocketClient';

export class SocketClient implements ISocketClient {
  private socket: Socket | null = null;
  private reconnectListeners: Set<ReconnectCallback> = new Set();

  public async connect(url: string, token?: string): Promise<void> {
    if (this.socket && this.socket.connected) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    return new Promise((resolve) => {
      this.socket = io(url, {
        path: '/socket.io',
        ...(token ? { auth: { token: `Bearer ${token}` } } : {}),
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        resolve();
      });

      // Fire registered reconnect listeners on subsequent reconnects
      this.socket.on('reconnect', () => {
        this.reconnectListeners.forEach((cb) => cb());
      });

      this.socket.on('connect_error', () => {
        // Resolve anyway — offline fallback is handled by state machine
        resolve();
      });
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public emit(event: string, data: unknown): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  public on<T>(event: string, listener: SocketEventListener<T>): void {
    if (this.socket) {
      this.socket.on(event, listener as (data: unknown) => void);
    }
  }

  public off(event: string, listener?: SocketEventListener): void {
    if (this.socket) {
      if (listener) {
        this.socket.off(event, listener as (data: unknown) => void);
      } else {
        this.socket.off(event);
      }
    }
  }

  public isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }

  public onReconnect(callback: ReconnectCallback): () => void {
    this.reconnectListeners.add(callback);
    return () => {
      this.reconnectListeners.delete(callback);
    };
  }
}
