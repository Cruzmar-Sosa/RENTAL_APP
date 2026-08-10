export type SocketEventListener<T = unknown> = (data: T) => void;
export type ReconnectCallback = () => void;

export interface ISocketClient {
  connect(url: string, token?: string): Promise<void>;
  disconnect(): void;
  emit(event: string, data: unknown): void;
  on<T>(event: string, listener: SocketEventListener<T>): void;
  off(event: string, listener?: SocketEventListener): void;
  isConnected(): boolean;
  /** Subscribe to a successful reconnect event. Returns an unsubscribe function. */
  onReconnect(callback: ReconnectCallback): () => void;
}
