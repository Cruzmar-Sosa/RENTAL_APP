import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { ILocationProvider, LocationCallback, LocationCoordinates } from './ILocationProvider';
import { AppError, ErrorCode } from '@core/errors';

/**
 * The registered background task name for GPS tracking.
 * Using a constant avoids duplicate task registrations.
 */
export const BACKGROUND_LOCATION_TASK = 'RENT_APP_BACKGROUND_LOCATION';

/**
 * Module-level callback store so the TaskManager-defined task
 * (which runs at module scope) can reach the current active callback.
 * Only one active tracking session can exist at a time (enforced by
 * TrackingStateMachine), so a single callback reference is safe.
 */
let activeBackgroundCallback: LocationCallback | null = null;

// ─────────────────────────────────────────────
// Background Task Definition (must be at module scope, outside the class)
// ─────────────────────────────────────────────
// TaskManager requires the task to be defined before any component mounts.
// This definition is safe to call multiple times — expo-task-manager is
// idempotent on re-registration of the same task name.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    // Background task errors are non-fatal — they will resolve on next update
    return;
  }

  const typedData = data as {
    locations?: Location.LocationObject[];
  } | null;

  if (!typedData?.locations || typedData.locations.length === 0) {
    return;
  }

  const loc = typedData.locations[typedData.locations.length - 1];
  if (!loc) return;

  if (activeBackgroundCallback) {
    activeBackgroundCallback({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      altitude: loc.coords.altitude,
      accuracy: loc.coords.accuracy,
      speed: loc.coords.speed,
      heading: loc.coords.heading,
      timestamp: loc.timestamp,
    });
  }
});

export class LocationProvider implements ILocationProvider {
  public async requestBackgroundPermission(): Promise<boolean> {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  }

  public async hasBackgroundPermission(): Promise<boolean> {
    const { status } = await Location.getBackgroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  }

  public async getCurrentPosition(): Promise<LocationCoordinates> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      throw new AppError(
        'Location permission not granted',
        ErrorCode.LOCATION_PERMISSION_DENIED,
        403
      );
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude,
        accuracy: loc.coords.accuracy,
        speed: loc.coords.speed,
        heading: loc.coords.heading,
        timestamp: loc.timestamp,
      };
    } catch (err) {
      throw new AppError(
        'Failed to get current location',
        ErrorCode.LOCATION_SERVICE_DISABLED,
        500,
        { originalError: err }
      );
    }
  }

  public async watchPosition(
    callback: LocationCallback,
    intervalMs: number
  ): Promise<() => void> {
    // Step 1: Request foreground permission (required on all platforms)
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== Location.PermissionStatus.GRANTED) {
      throw new AppError(
        'Location permission not granted',
        ErrorCode.LOCATION_PERMISSION_DENIED,
        403
      );
    }

    // Step 2: Check background permission availability
    const hasBg = await this.hasBackgroundPermission();

    if (hasBg) {
      // ── Background path (app can be suspended) ──
      return this.startBackgroundTracking(callback, intervalMs);
    } else {
      // ── Foreground path fallback ──
      // Background permission not yet granted — use foreground watcher.
      // This is fully functional when the app is in foreground.
      return this.startForegroundTracking(callback, intervalMs);
    }
  }

  private async startForegroundTracking(
    callback: LocationCallback,
    intervalMs: number
  ): Promise<() => void> {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: intervalMs,
        distanceInterval: 5,
      },
      (loc) => {
        callback({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          altitude: loc.coords.altitude,
          accuracy: loc.coords.accuracy,
          speed: loc.coords.speed,
          heading: loc.coords.heading,
          timestamp: loc.timestamp,
        });
      }
    );

    return () => {
      subscription.remove();
    };
  }

  private async startBackgroundTracking(
    callback: LocationCallback,
    intervalMs: number
  ): Promise<() => void> {
    // Guard: stop any previously running background task before registering a new one
    const isAlreadyRegistered = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    ).catch(() => false);

    if (isAlreadyRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
    }

    // Register callback in module scope so the task definition can reach it
    activeBackgroundCallback = callback;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: intervalMs,
      distanceInterval: 5,
      showsBackgroundLocationIndicator: true, // iOS: shows blue bar
      foregroundService: {
        // Android: required foreground service notification
        notificationTitle: 'Rent App — Tracking Active',
        notificationBody: 'Your ride is being tracked.',
      },
    });

    return async () => {
      activeBackgroundCallback = null;
      const running = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK
      ).catch(() => false);
      if (running) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
      }
    };
  }
}
