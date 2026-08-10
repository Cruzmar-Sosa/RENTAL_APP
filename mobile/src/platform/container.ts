import { HttpClient } from './api/HttpClient';
import { SecureStorageService } from './storage/SecureStorageService';
import { PermissionManager } from './permissions/PermissionManager';
import { ConnectivityManager } from './connectivity/ConnectivityManager';
import { LifecycleManager } from './lifecycle/LifecycleManager';
import { DeviceManager } from './device/DeviceManager';
import { SQLiteManager } from './sqlite/SQLiteManager';
import { SocketClient } from './websocket/SocketClient';
import { TelemetryBuilder } from './telemetry/TelemetryBuilder';
import { TelemetryQueue } from './telemetry/TelemetryQueue';
import { TransmissionManager } from './telemetry/TransmissionManager';
import { PresencePublisher } from './telemetry/PresencePublisher';
import { LocationProvider } from './tracking/LocationProvider';
import { TrackingStateMachine } from './tracking/TrackingStateMachine';
import { AuthRepository } from '@application/repositories/AuthRepository';
import { StationRepository } from '@application/repositories/StationRepository';
import { BikeRepository } from '@application/repositories/BikeRepository';
import { ReservationRepository } from '@application/repositories/ReservationRepository';
import { TrackingRepository } from '@application/repositories/TrackingRepository';

// Singletons
export const httpClient = new HttpClient();
export const secureStorage = new SecureStorageService();
export const permissionManager = new PermissionManager();
export const connectivityManager = new ConnectivityManager();
export const lifecycleManager = new LifecycleManager();
export const deviceManager = new DeviceManager();
export const sqliteManager = new SQLiteManager();
export const socketClient = new SocketClient();
export const telemetryBuilder = new TelemetryBuilder();
export const telemetryQueue = new TelemetryQueue(sqliteManager);
export const transmissionManager = new TransmissionManager(socketClient);
export const presencePublisher = new PresencePublisher(socketClient);
export const locationProvider = new LocationProvider();
export const trackingEngine = new TrackingStateMachine(
  locationProvider,
  socketClient,
  telemetryBuilder,
  transmissionManager,
  telemetryQueue,
  connectivityManager,
  deviceManager
);

// Repositories
export const authRepository = new AuthRepository(httpClient, secureStorage);
export const stationRepository = new StationRepository(httpClient);
export const bikeRepository = new BikeRepository(httpClient);
export const reservationRepository = new ReservationRepository(httpClient);
export const trackingRepository = new TrackingRepository(trackingEngine);
