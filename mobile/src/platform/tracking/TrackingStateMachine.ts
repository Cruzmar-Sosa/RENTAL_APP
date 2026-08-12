import { ITrackingEngine, TrackingEngineState } from './ITrackingEngine';
import { ILocationProvider, LocationCoordinates } from './ILocationProvider';
import { ISocketClient } from '@platform/websocket';
import { IOfflineQueue, ITelemetryBuilder, ITransmissionManager, BuiltTelemetryFrame } from '@platform/telemetry';
import { IConnectivityManager } from '@platform/connectivity';
import { IDeviceManager } from '@platform/device';
import { APP_URLS } from '@core/config';

export class TrackingStateMachine implements ITrackingEngine {
  private state: TrackingEngineState = 'IDLE';
  private currentSession: { rideId: string; bikeId: string } | null = null;
  private removeLocationWatcher: (() => void | Promise<void>) | null = null;
  private removeReconnectListener: (() => void) | null = null;
  private isFlushing = false;

  constructor(
    private readonly locationProvider: ILocationProvider,
    private readonly socketClient: ISocketClient,
    private readonly telemetryBuilder: ITelemetryBuilder,
    private readonly transmissionManager: ITransmissionManager,
    private readonly telemetryQueue: IOfflineQueue<BuiltTelemetryFrame>,
    private readonly connectivityManager: IConnectivityManager,
    private readonly deviceManager: IDeviceManager
  ) {}

  public getState(): TrackingEngineState {
    return this.state;
  }

  public async start(session: { rideId: string; bikeId: string }): Promise<void> {
    // Idempotency: if already ACTIVE for this exact session, return cleanly
    if (this.state === 'ACTIVE' && this.currentSession?.rideId === session.rideId) {
      return;
    }

    // Stop existing session cleanly before starting a new one
    if (this.state !== 'IDLE' && this.state !== 'STOPPED') {
      await this.stop();
    }

    this.currentSession = session;
    this.state = 'ACTIVE';

    // Connect to tracking socket gateway (non-blocking — falls back to offline queue)
    try {
      await this.socketClient.connect(APP_URLS.tracking.websocketGateway);
    } catch {
      // Socket unavailable — offline queue handles buffering
    }

    // Subscribe to socket & network reconnect events to proactively flush the offline telemetry queue
    this.removeReconnectListener = this.socketClient.onReconnect(() => {
      this.flushOfflineQueue().catch(() => {});
    });

    const removeConn = this.connectivityManager.onReconnect(() => {
      this.flushOfflineQueue().catch(() => {});
    });
    const prevReconnect = this.removeReconnectListener;
    this.removeReconnectListener = () => {
      prevReconnect?.();
      removeConn();
    };

    // Start GPS position watching (foreground or background depending on permissions)
    try {
      this.removeLocationWatcher = await this.locationProvider.watchPosition(
        (coords) => this.handleLocationUpdate(coords),
        5000
      );
    } catch (err) {
      // Revert state if GPS watch fails to start
      this.removeReconnectListener?.();
      this.removeReconnectListener = null;
      this.state = 'IDLE';
      this.currentSession = null;
      throw err;
    }

    // Proactively flush any pending offline frames from a previous session
    this.flushOfflineQueue().catch(() => {});
  }

  private async handleLocationUpdate(coords: LocationCoordinates): Promise<void> {
    if (this.state !== 'ACTIVE' || !this.currentSession) {
      return;
    }

    // Read real device battery level (falls back to 100 if unavailable)
    const batteryLevel = await this.deviceManager.getBatteryLevel().catch(() => 100);

    const frame = this.telemetryBuilder.buildFrame({
      rideId: this.currentSession.rideId,
      bikeId: this.currentSession.bikeId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      speed: coords.speed,
      heading: coords.heading,
      batteryLevel,
    });

    const isOnline = await this.connectivityManager.isOnline();
    let transmitted = false;

    if (isOnline && this.socketClient.isConnected()) {
      transmitted = await this.transmissionManager.transmitFrame(frame);
    }

    // Buffer frame to SQLite if offline or transmission failed
    if (!transmitted) {
      await this.telemetryQueue.enqueue(frame);
    } else {
      // Opportunistically flush any backlogged frames on a successful transmit
      this.flushOfflineQueue().catch(() => {});
    }
  }

  private async flushOfflineQueue(): Promise<void> {
    const isOnline = await this.connectivityManager.isOnline();
    if (this.isFlushing || !this.socketClient.isConnected() || !isOnline) {
      return;
    }

    this.isFlushing = true;
    try {
      const batch = await this.telemetryQueue.dequeue(20);
      if (batch.length === 0) {
        this.isFlushing = false;
        return;
      }

      // Only acknowledge frames that were confirmed as transmitted
      const ackedIds = await this.transmissionManager.transmitBatch(batch);
      if (ackedIds.length > 0) {
        await this.telemetryQueue.acknowledge(ackedIds);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  public async pause(): Promise<void> {
    if (this.state === 'ACTIVE') {
      this.state = 'PAUSED';
    }
  }

  public async resume(): Promise<void> {
    if (this.state === 'PAUSED') {
      this.state = 'ACTIVE';
    }
  }

  public async stop(): Promise<void> {
    // Idempotency: clean no-op if already idle or stopped
    if (this.state === 'IDLE' || this.state === 'STOPPED') {
      return;
    }

    // Unsubscribe reconnect flush listener
    if (this.removeReconnectListener) {
      this.removeReconnectListener();
      this.removeReconnectListener = null;
    }

    // Stop GPS watcher (unregisters foreground watcher OR background task)
    if (this.removeLocationWatcher) {
      // The return from watchPosition may be async (background task teardown)
      const teardown = this.removeLocationWatcher();
      if (teardown instanceof Promise) {
        await teardown.catch(() => {});
      }
      this.removeLocationWatcher = null;
    }

    // Notify backend tracking gateway of session end
    if (this.currentSession && this.socketClient.isConnected()) {
      this.socketClient.emit('stop_tracking', { bikeId: this.currentSession.bikeId });
    }

    // Final flush attempt before disconnecting
    await this.flushOfflineQueue().catch(() => {});

    this.socketClient.disconnect();

    this.state = 'STOPPED';
    this.currentSession = null;
  }
}
