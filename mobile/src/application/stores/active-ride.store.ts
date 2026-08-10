import { create } from 'zustand';
import { Nullable } from '@core/types';

export interface ActiveRideState {
  activeReservationId: Nullable<string>;
  activeBikeId: Nullable<string>;
  isTrackingActive: boolean;
  setActiveRide: (reservationId: string, bikeId: string) => void;
  clearActiveRide: () => void;
}

export const useActiveRideStore = create<ActiveRideState>((set) => ({
  activeReservationId: null,
  activeBikeId: null,
  isTrackingActive: false,
  setActiveRide: (reservationId, bikeId) =>
    set({ activeReservationId: reservationId, activeBikeId: bikeId, isTrackingActive: true }),
  clearActiveRide: () =>
    set({ activeReservationId: null, activeBikeId: null, isTrackingActive: false }),
}));
