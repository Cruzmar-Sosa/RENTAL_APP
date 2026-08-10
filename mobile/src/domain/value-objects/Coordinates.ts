import { isValidCoordinates } from '@core/utils/validation.utils';

export class Coordinates {
  private constructor(
    public readonly latitude: number,
    public readonly longitude: number
  ) {
    if (!isValidCoordinates(latitude, longitude)) {
      throw new Error(`Invalid coordinates: lat=${latitude}, lng=${longitude}`);
    }
  }

  public static create(latitude: number, longitude: number): Coordinates {
    return new Coordinates(latitude, longitude);
  }
}
