import { IPresencePublisher } from './IPresencePublisher';
import { ISocketClient } from '@platform/websocket';

export class PresencePublisher implements IPresencePublisher {
  constructor(private readonly socketClient: ISocketClient) {}

  public async publishHeartbeat(bikeId: string, status: string): Promise<void> {
    if (this.socketClient.isConnected()) {
      this.socketClient.emit('presence_heartbeat', {
        bikeId,
        status,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
