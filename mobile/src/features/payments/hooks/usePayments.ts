import { useState, useCallback } from 'react';
import { paymentRepository } from '@platform/container';
import { Payment } from '@domain/entities/Payment';
import { SettlementPreview } from '@domain/entities/Settlement';

export function usePayments() {
  const [payments, setPayments] = useState<readonly Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await paymentRepository.getMyPayments();
      setPayments(list);
      return list;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPayment = async (reservationId: string, amount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const payment = await paymentRepository.createPayment({ reservationId, amount });
      await fetchMyPayments();
      return payment;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create payment';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const payPayment = async (paymentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await paymentRepository.payPayment(paymentId);
      await fetchMyPayments();
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process payment';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getSettlementPreview = async (reservationId: string): Promise<SettlementPreview | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const preview = await paymentRepository.getSettlementPreview(reservationId);
      return preview;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch settlement preview';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    payments,
    isLoading,
    error,
    fetchMyPayments,
    createPayment,
    payPayment,
    getSettlementPreview,
  };
}
