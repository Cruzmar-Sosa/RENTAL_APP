import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrackingService } from './tracking.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/tracking',
  path: '/socket.io',
  cors: {
    origin: '*', // For development, in prod restrict this
  },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  // Simple in-memory tracker to avoid spamming DB if not moved or too fast
  // In a real high-scale app, we would use Redis for this.
  private lastUpdate: Map<string, number> = new Map();

  constructor(private readonly trackingService: TrackingService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Dashboard users will join a special room to receive fleet updates
  @SubscribeMessage('join_dashboard')
  async handleJoinDashboard(@ConnectedSocket() client: Socket) {
    await client.join('fleet_dashboard');
    this.logger.log(`Client ${client.id} joined dashboard tracking`);
    return { status: 'ok', joined: true };
  }

  @SubscribeMessage('update_location')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bikeId: string; lat: number; lng: number; speed: number },
  )
  {
    this.logger.log(`📍 LOCATION RECEIVED: ${JSON.stringify(data)}`);
    const now = Date.now();
    const lastTime = this.lastUpdate.get(data.bikeId) || 0;

    // Throttle DB updates to max once every 3 seconds per bike
    if (now - lastTime > 3000) {
      try {
        await this.trackingService.create({
          bikeId: data.bikeId,
          latitude: data.lat,
          longitude: data.lng,
          speed: data.speed || 0,
        });
        this.lastUpdate.set(data.bikeId, now);
      } catch (error) {
        this.logger.error(`Failed to save location for bike ${data.bikeId}: ${error.message}`);
        // But we still broadcast the live position even if DB saving failed temporarily
      }
    }

    // Broadcast to dashboard instantly (regardless of DB throttle to keep map fluid)
    // Send to everyone in 'fleet_dashboard'
    this.server.to('fleet_dashboard').emit('location_updated', {
      bikeId: data.bikeId,
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      timestamp: new Date().toISOString(),
    });

    return { received: true };
    } 
}
