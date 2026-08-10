import { useState, useCallback } from 'react';
import { reservationRepository } from '@platform/container';
import { useReservationStore } from '@application/stores/reservation.store';
import { CreateReservationParams } from '@domain/repositories/IReservationRepository';

export function useReservation() {
  const { activeReservation, setActiveReservation, clearActiveReservation } = useReservationStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveReservation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await reservationRepository.getMyReservations();
      const active = list.find((r) => r.isActive()) || null;
      setActiveReservation(active);
      return active;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch active reservation';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setActiveReservation]);

  const createReservation = async (params: CreateReservationParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const reservation = await reservationRepository.createReservation(params);
      setActiveReservation(reservation);
      return reservation;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Reservation creation failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getPin = async (reservationId: string) => {
    setIsLoading(true);
    try {
      const result = await reservationRepository.getPin(reservationId);
      return result.pin;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get PIN';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPin = async (reservationId: string, pinInput: string) => {
    setIsLoading(true);
    try {
      const result = await reservationRepository.verifyPin(reservationId, pinInput);
      return result.valid;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to verify PIN';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const startRide = async (reservationId: string) => {
    setIsLoading(true);
    try {
      const updated = await reservationRepository.startRide(reservationId);
      setActiveReservation(updated);
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start ride';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelReservation = async (reservationId: string) => {
    setIsLoading(true);
    try {
      const updated = await reservationRepository.cancelReservation(reservationId);
      clearActiveReservation();
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel reservation';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeRide = async (reservationId: string, stationId: string) => {
    setIsLoading(true);
    try {
      const updated = await reservationRepository.completeRide(reservationId, stationId);
      clearActiveReservation();
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to complete ride';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activeReservation,
    isLoading,
    error,
    fetchActiveReservation,
    createReservation,
    getPin,
    verifyPin,
    startRide,
    cancelReservation,
    completeRide,
  };
}
