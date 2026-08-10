export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export type LocationCallback = (location: LocationCoordinates) => void;

export interface ILocationProvider {
  getCurrentPosition(): Promise<LocationCoordinates>;
  /**
   * Watches position in foreground.
   * Returns an unsubscribe function that stops the watcher.
   */
  watchPosition(callback: LocationCallback, intervalMs: number): Promise<() => void | Promise<void>>;
  /**
   * Requests background location permission.
   * Returns true if granted. Call after foreground permission is already granted.
   */
  requestBackgroundPermission(): Promise<boolean>;
  /**
   * Returns whether background location permission is currently granted.
   */
  hasBackgroundPermission(): Promise<boolean>;
}
