import { RouteEntity } from '../entities/Route';

export interface IRouteRepository {
  findAll(): Promise<RouteEntity[]>;
  findById(id: string): Promise<RouteEntity>;
}
