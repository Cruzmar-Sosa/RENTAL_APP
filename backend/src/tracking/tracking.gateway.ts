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

interface ActiveSession {
  socketId: string;
  connection: 'connected' | 'disconnected';
  lastUpdateAt: number;
  lastDbUpdateAt: number;
  timeoutRef?: NodeJS.Timeout;
}

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

  // Session Lock mechanism mapping bikeId -> ActiveSession
  private activeSessions = new Map<string, ActiveSession>();
  private socketToBike = new Map<string, string>();

  constructor(private readonly trackingService: TrackingService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const bikeId = this.socketToBike.get(client.id);
    if (bikeId) {
      this.clearSession(bikeId);
      this.socketToBike.delete(client.id);
    }
  }

  private clearSession(bikeId: string) {
    const session = this.activeSessions.get(bikeId);
    if (session && session.timeoutRef) {
      clearTimeout(session.timeoutRef);
    }
    this.activeSessions.delete(bikeId);
    
    // Notify dashboard that bike is completely disconnected / session ended
    this.server.to('fleet_dashboard').emit('location_updated', {
      bikeId,
      connection: 'disconnected',
      timestamp: new Date().toISOString(),
    });
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
    
    // 0. Bike Validation
    const bikeExists = await this.trackingService.checkBikeExists(data.bikeId);
    if (!bikeExists) {
      this.logger.warn(`Rejected location update for unknown bike: ${data.bikeId}`);
      client.emit('tracking_error', { message: '🚫 Bicicleta no encontrada en el sistema' });
      return { error: 'Bike not found' };
    }

    // 1. Session Lock Validation
    let session = this.activeSessions.get(data.bikeId);
    
    if (session && session.socketId !== client.id) {
       // Ocupada por otro
       client.emit('tracking_error', { message: "🚫 Tracking ya activo en otro dispositivo" });
       return { error: 'Bike in use' };
    }
    
    if (!session) {
       // 2. New Session
       session = {
          socketId: client.id,
          connection: 'connected',
          lastUpdateAt: now,
          lastDbUpdateAt: 0
       };
       this.activeSessions.set(data.bikeId, session);
       this.socketToBike.set(client.id, data.bikeId);
    } else {
       // 3. Update Existing Session
       session.connection = 'connected';
       session.lastUpdateAt = now;
       if (session.timeoutRef) clearTimeout(session.timeoutRef);
    }
    
    // 4. Setup timeout for 7 seconds grace period to switch to 'disconnected' 
    // State doesn't remove session, just indicates connectivity loss
    session.timeoutRef = setTimeout(() => {
       const s = this.activeSessions.get(data.bikeId);
       if (s) {
          s.connection = 'disconnected';
          this.server.to('fleet_dashboard').emit('location_updated', {
            bikeId: data.bikeId,
            connection: 'disconnected',
            timestamp: new Date().toISOString()
          });
       }
    }, 7000);

    // 5. Throttle DB updates to max once every 3 seconds per bike
    if (now - session.lastDbUpdateAt > 3000) {
      try {
        await this.trackingService.create({
          bikeId: data.bikeId,
          latitude: data.lat,
          longitude: data.lng,
          speed: data.speed || 0,
        });
        session.lastDbUpdateAt = now;
      } catch (error) {
        this.logger.error(`Failed to save location for bike ${data.bikeId}: ${error.message}`);
      }
    }

    // 6. Broadcast to dashboard instantly
    this.server.to('fleet_dashboard').emit('location_updated', {
      bikeId: data.bikeId,
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      connection: 'connected',
      timestamp: new Date().toISOString(),
    });

    return { received: true };
  } 

  @SubscribeMessage('stop_tracking')
  async handleStopTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bikeId: string }
  ) {
    this.logger.log(`🛑 Stop tracking received for bike ${data.bikeId}`);
    const session = this.activeSessions.get(data.bikeId);
    
    if (session && session.socketId === client.id) {
       this.clearSession(data.bikeId);
       this.socketToBike.delete(client.id);
    }
    return { status: 'stopped' };
  }
}
