import { Bike } from '../entities/Bike';
import { Nullable } from '@core/types';

export interface IBikeRepository {
  getBikeById(id: string): Promise<Nullable<Bike>>;
  getAvailableBikes(): Promise<readonly Bike[]>;
}
