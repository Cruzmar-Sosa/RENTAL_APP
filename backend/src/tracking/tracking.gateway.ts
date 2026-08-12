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
import { RedisService } from './redis.service';
import { Logger } from '@nestjs/common';

interface IncomingLocationPayload {
  bikeId: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  frameId?: string;
  rideId?: string;
  deviceId?: string;
  timestamp?: string;
}

@WebSocketGateway({
  namespace: '/tracking',
  path: '/socket.io',
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private lastDbUpdateAtMap = new Map<string, number>();
  private disconnectTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly trackingService: TrackingService,
    private readonly redisService: RedisService
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`[Socket] Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`[Socket] Client disconnected: ${client.id}`);
    const bikeId = await this.redisService.getBikeBySocket(client.id);
    if (bikeId) {
      // 5-second grace period before clearing session lock
      if (this.disconnectTimers.has(bikeId)) {
        clearTimeout(this.disconnectTimers.get(bikeId));
      }
      const timer = setTimeout(() => {
        this.clearSession(bikeId).catch(() => {});
        this.disconnectTimers.delete(bikeId);
      }, 5000);
      this.disconnectTimers.set(bikeId, timer);
    }
  }

  private async clearSession(bikeId: string) {
    this.logger.log(`[Session] Clearing tracking session for bikeId=${bikeId}`);
    await this.redisService.clearSession(bikeId);
    this.lastDbUpdateAtMap.delete(bikeId);

    // Notify fleet dashboard of bike disconnect
    if (this.server) {
      this.server.to('fleet_dashboard').emit('location_updated', {
        bikeId,
        connection: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('join_dashboard')
  async handleJoinDashboard(@ConnectedSocket() client: Socket) {
    await client.join('fleet_dashboard');
    this.logger.log(`[Dashboard] Client ${client.id} joined fleet_dashboard tracking`);
    return { status: 'ok', joined: true };
  }

  @SubscribeMessage('update_location')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: IncomingLocationPayload
  ) {
    // 0. Payload Normalization (Supports legacy {lat, lng} & canonical {latitude, longitude})
    const lat = payload.latitude ?? payload.lat;
    const lng = payload.longitude ?? payload.lng;
    const bikeId = payload.bikeId;

    if (!bikeId || lat === undefined || lng === undefined) {
      this.logger.warn(`[Telemetry] Rejected invalid payload structure from socket ${client.id}`);
      client.emit('tracking_error', { message: '🚫 Formato de datos de telemetría inválido' });
      return { error: 'Invalid payload' };
    }

    // Cancel any pending disconnect grace period for this bike
    if (this.disconnectTimers.has(bikeId)) {
      clearTimeout(this.disconnectTimers.get(bikeId));
      this.disconnectTimers.delete(bikeId);
    }

    // Bounds check
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      this.logger.warn(`[Telemetry] Rejected out-of-bounds coords (lat=${lat}, lng=${lng}) for bikeId=${bikeId}`);
      client.emit('tracking_error', { message: '🚫 Coordenadas fuera de rango' });
      return { error: 'Coordinates out of bounds' };
    }

    // 1. Deduplication Guard
    if (payload.frameId) {
      const isDup = await this.redisService.isDuplicateFrame(payload.frameId);
      if (isDup) {
        this.logger.debug(`[Telemetry] Suppressed duplicate frameId=${payload.frameId} for bikeId=${bikeId}`);
        return { received: true, duplicate: true };
      }
    }

    // 2. Bike Validation
    const bikeExists = await this.trackingService.checkBikeExists(bikeId);
    if (!bikeExists) {
      this.logger.warn(`[Telemetry] Rejected location update for unknown bikeId=${bikeId}`);
      client.emit('tracking_error', { message: '🚫 Bicicleta no encontrada en el sistema' });
      return { error: 'Bike not found' };
    }

    // 3. Session Lock Validation
    const activeSession = await this.redisService.getSession(bikeId);
    if (activeSession && activeSession.socketId !== client.id) {
      this.logger.warn(`[Session Lock] Lock collision for bikeId=${bikeId} from socket ${client.id}`);
      client.emit('tracking_error', { message: '🚫 Tracking ya activo en otro dispositivo' });
      return { error: 'Bike in use' };
    }

    const now = Date.now();
    const nowIso = new Date().toISOString();

    // 4. Update Presence & Session Lock
    if (!activeSession) {
      this.logger.log(`[Session] Created active tracking lock for bikeId=${bikeId} rideId=${payload.rideId || 'N/A'}`);
      await this.redisService.setSession(bikeId, {
        rideId: payload.rideId,
        bikeId,
        socketId: client.id,
        startedAt: nowIso,
        lastSeenAt: nowIso,
      });
    }

    await this.redisService.setPresence(bikeId, {
      socketId: client.id,
      bikeId,
      status: 'connected',
      lastSeenAt: nowIso,
      latitude: lat,
      longitude: lng,
    });

    // 5. Throttled DB Persistence (max once every 3 seconds per bike)
    const lastDbUpdate = this.lastDbUpdateAtMap.get(bikeId) || 0;
    if (now - lastDbUpdate > 3000) {
      try {
        await this.trackingService.create({
          frameId: payload.frameId,
          rideId: payload.rideId,
          deviceId: payload.deviceId,
          bikeId,
          latitude: lat,
          longitude: lng,
          speed: payload.speed || 0,
          heading: payload.heading,
          batteryLevel: payload.batteryLevel,
          timestamp: payload.timestamp,
        });
        this.lastDbUpdateAtMap.set(bikeId, now);
        this.logger.debug(`[Telemetry DB] Persisted frame for bikeId=${bikeId} (speed=${payload.speed || 0}, batt=${payload.batteryLevel ?? 100}%)`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`[Telemetry DB] Failed to save location for bikeId=${bikeId}: ${message}`);
      }
    }

    // 6. Real-time Dashboard Broadcast
    if (this.server) {
      this.server.to('fleet_dashboard').emit('location_updated', {
        bikeId,
        lat,
        lng,
        speed: payload.speed || 0,
        heading: payload.heading,
        batteryLevel: payload.batteryLevel,
        connection: 'connected',
        timestamp: nowIso,
      });
    }

    return { received: true };
  }

  @SubscribeMessage('stop_tracking')
  async handleStopTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bikeId: string }
  ) {
    this.logger.log(`[Session] Stop tracking requested for bikeId=${data.bikeId}`);
    const session = await this.redisService.getSession(data.bikeId);

    if (session && session.socketId === client.id) {
      await this.clearSession(data.bikeId);
    }
    return { status: 'stopped' };
  }
}
