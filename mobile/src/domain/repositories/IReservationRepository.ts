import { Reservation } from '../entities/Reservation';

export interface CreateReservationParams {
  bikeId: string;
  paymentOption?: 'DEPOSIT' | 'FULL' | 'LATER';
  startTime?: string;
  endTime?: string;
}

export interface IReservationRepository {
  createReservation(params: CreateReservationParams): Promise<Reservation>;
  getMyReservations(): Promise<readonly Reservation[]>;
  getReservationById(id: string): Promise<Reservation>;
  getPin(reservationId: string): Promise<{ pin: string }>;
  verifyPin(reservationId: string, pinInput: string): Promise<{ valid: boolean }>;
  startRide(reservationId: string): Promise<Reservation>;
  cancelReservation(reservationId: string): Promise<Reservation>;
  completeRide(reservationId: string, stationId: string): Promise<Reservation>;
}
