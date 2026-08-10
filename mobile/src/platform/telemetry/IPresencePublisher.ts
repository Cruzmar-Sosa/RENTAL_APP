export interface IPresencePublisher {
  publishHeartbeat(bikeId: string, status: string): Promise<void>;
}
