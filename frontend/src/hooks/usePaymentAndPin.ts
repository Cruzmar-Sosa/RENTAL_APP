'use client';

import { useState } from 'react';
import { useModal } from '@/context/ModalProvider';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useToast } from '@/components/NotificationToast';
import { api } from '@/lib/api';

interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
}

interface SettlePaymentResponse {
  id: string;
  status: string;
  settledAmount: number;
  balanceRefund: number;
}

interface VerifyPinResponse {
  success: boolean;
  message: string;
  checkInVerifiedAt?: string;
}

/**
 * usePaymentFlow Hook
 * Handles complete payment flow: reserve -> settle -> refund
 */
export function usePaymentFlow() {
  const { openModal, closeModal } = useModal();
  const toast = useToast();
  const { addNotification } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reserve payment intent for deposit
   */
  const reservePaymentIntent = async (reservationId: string, amount: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<PaymentIntentResponse>('/payments/reserve-intent', {
        reservationId,
        amount,
      });

      toast.success('Payment reserved successfully!');
      addNotification({
        id: `notification-${Date.now()}`,
        userId: '',
        type: 'PAYMENT_SETTLED',
        title: 'Payment Reserved',
        message: 'Your deposit payment has been reserved',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return response.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reserve payment';
      setError(errorMsg);
      toast.error('Payment Reservation Failed', { description: errorMsg });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Settle payment post-ride
   */
  const settlePayment = async (
    reservationId: string,
    finalAmount: number,
    depositAmount: number
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<SettlePaymentResponse>(`/payments/settle/${reservationId}`, {
        finalAmount,
        depositAmount,
      });

      toast.success('Payment Settled Successfully!');
      addNotification({
        id: `notification-${Date.now()}`,
        userId: '',
        type: 'PAYMENT_SETTLED',
        title: 'Payment Completed',
        message: `Your ride charge of $${finalAmount.toFixed(2)} has been processed`,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return response.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to settle payment';
      setError(errorMsg);
      toast.error('Payment Settlement Failed', { description: errorMsg });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refund payment
   */
  const refundPayment = async (paymentId: string, reason: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post(`/payments/refund/${paymentId}`, { reason });

      toast.success('Refund Processed Successfully!');
      addNotification({
        id: `notification-${Date.now()}`,
        userId: '',
        type: 'REFUND_ISSUED',
        title: 'Refund Issued',
        message: `Refund has been processed: ${reason}`,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process refund';
      setError(errorMsg);
      toast.error('Refund Failed', { description: errorMsg });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Show checkout modal
   */
  const showCheckout = (bike: any, reservationDetails: any) => {
    openModal('CHECKOUT', {
      bike,
      reservationDetails,
      isLoading,
      error,
      onConfirm: async (paymentDetails: any) => {
        try {
          // Reserve payment intent
          const intentResponse = await reservePaymentIntent(
            reservationDetails.id,
            reservationDetails.estimatedCost
          );

          // In production, would charge the card here using Stripe Elements
          // For now, mock the payment success
          toast.success('Payment Completed!', {
            description: 'Your bike is now reserved and ready for check-in.',
          });

          closeModal();
        } catch (err) {
          // Error already handled in reservePaymentIntent
        }
      },
    });
  };

  return {
    reservePaymentIntent,
    settlePayment,
    refundPayment,
    showCheckout,
    isLoading,
    error,
  };
}

/**
 * usePinFlow Hook
 * Handles PIN generation, verification, and check-in
 */
export function usePinFlow() {
  const { openModal, closeModal } = useModal();
  const toast = useToast();
  const { addNotification } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const MAX_ATTEMPTS = 3;

  /**
   * Generate PIN for reservation
   */
  const generatePin = async (reservationId: string) => {
    setIsLoading(true);
    setError(null);
    setAttemptCount(0);

    try {
      await api.post(`/reservations/${reservationId}/generate-pin`);

      toast.success('PIN Generated', {
        description: 'Check your SMS for the 4-digit PIN code',
      });

      addNotification({
        id: `notification-${Date.now()}`,
        userId: '',
        type: 'CHECK_IN_READY',
        title: 'PIN Ready',
        message: 'Your check-in PIN has been sent via SMS',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate PIN';
      setError(errorMsg);
      toast.error('PIN Generation Failed', { description: errorMsg });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify PIN and unlock bike
   */
  const verifyPin = async (reservationId: string, pin: string) => {
    setIsLoading(true);
    setError(null);

    if (attemptCount >= MAX_ATTEMPTS) {
      setError(`Maximum attempts reached. Try again later.`);
      toast.error('Too Many Attempts', {
        description: `You have exceeded the maximum number of PIN verification attempts (${MAX_ATTEMPTS})`,
      });
      return false;
    }

    try {
      const response = await api.post<VerifyPinResponse>(
        `/reservations/${reservationId}/verify-pin`,
        { pin }
      );

      if (response.data.success) {
        toast.success('PIN Verified!', { description: '🔓 Bike unlocked successfully' });

        addNotification({
          id: `notification-${Date.now()}`,
          userId: '',
          type: 'CHECK_IN_SUCCESSFUL',
          title: 'Bike Unlocked',
          message: 'Your bike has been successfully unlocked',
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        closeModal();
        return true;
      } else {
        setAttemptCount((prev) => prev + 1);
        const remaining = MAX_ATTEMPTS - attemptCount - 1;
        setError(`Invalid PIN. ${remaining} attempts remaining.`);
        toast.error('Invalid PIN', {
          description: `${remaining} attempts remaining`,
        });
        return false;
      }
    } catch (err) {
      setAttemptCount((prev) => prev + 1);
      const remaining = MAX_ATTEMPTS - attemptCount - 1;
      
      if (remaining === 0) {
        setError('Maximum attempts reached');
        toast.error('Locked Out', {
          description: 'Too many failed attempts. Try again later.',
        });
      } else {
        const errorMsg = `${remaining} attempts remaining`;
        setError(errorMsg);
        toast.error('Invalid PIN', { description: errorMsg });
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Show PIN entry modal
   */
  const showPinEntry = (reservationId: string) => {
    setAttemptCount(0);
    setError(null);

    openModal('PIN_ENTRY', {
      reservationId,
      isLoading,
      error,
      onSubmit: async (pin: string) => {
        return verifyPin(reservationId, pin);
      },
      onResendPin: async () => {
        return generatePin(reservationId);
      },
    });
  };

  return {
    generatePin,
    verifyPin,
    showPinEntry,
    isLoading,
    error,
    attemptCount,
  };
}

/**
 * useCheckInFlow Hook
 * Orchestrates the complete check-in workflow
 */
export function useCheckInFlow() {
  const paymentFlow = usePaymentFlow();
  const pinFlow = usePinFlow();

  /**
   * Start complete check-in workflow:
   * 1. Generate PIN (sends SMS)
   * 2. Show PIN entry modal
   * 3. Verify PIN and unlock bike
   */
  const startCheckIn = async (reservationId: string) => {
    try {
      // Generate PIN (will send SMS to user)
      await pinFlow.generatePin(reservationId);

      // Show PIN entry modal
      pinFlow.showPinEntry(reservationId);
    } catch (err) {
      // Error already handled in generatePin
    }
  };

  return {
    startCheckIn,
    ...paymentFlow,
    ...pinFlow,
  };
}
