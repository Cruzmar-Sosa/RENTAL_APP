'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { SettlementPreviewResponse } from '@/types';
import { toast } from 'sonner';

export function useSettlement(reservationId?: string) {
  const [preview, setPreview] = useState<SettlementPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<SettlementPreviewResponse>(`/reservations/${id}/settlement-preview`);
      setPreview(response.data);
      return response.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to fetch settlement preview';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const settleReservation = async (id: string, idempotencyKey?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(`/reservations/${id}/settle-v2`, { idempotencyKey });
      toast.success('Reservation settled successfully!');
      return response.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to settle reservation';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeAndSettle = async (id: string, idempotencyKey?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(`/reservations/${id}/complete-and-settle`, { idempotencyKey });
      toast.success('Ride completed and settled!');
      return response.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to complete and settle ride';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    preview,
    isLoading,
    error,
    fetchPreview,
    settleReservation,
    completeAndSettle,
  };
}
