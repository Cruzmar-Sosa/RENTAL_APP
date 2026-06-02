'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, Check } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  reservationId: string;
  depositAmount?: number;
  isLoading?: boolean;
  onSubmit: (paymentDetails: PaymentDetails) => Promise<void>;
  onCancel?: () => void;
}

export interface PaymentDetails {
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  amount: number;
  reservationId: string;
}

/**
 * PaymentForm Component
 * Simulated Stripe payment form (in production, use @stripe/react-stripe-js)
 * For Phase 3 MVP, we show the payment UI without actual Stripe integration
 */
export function PaymentForm({
  amount,
  reservationId,
  depositAmount,
  isLoading = false,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Valid card number required (16 digits)';
    }

    if (!formData.cardHolder || formData.cardHolder.trim().length < 3) {
      newErrors.cardHolder = 'Card holder name required';
    }

    if (!formData.expiryMonth || parseInt(formData.expiryMonth) < 1 || parseInt(formData.expiryMonth) > 12) {
      newErrors.expiryMonth = 'Valid month required';
    }

    if (!formData.expiryYear || parseInt(formData.expiryYear) < new Date().getFullYear() % 100) {
      newErrors.expiryYear = 'Valid year required';
    }

    if (!formData.cvv || formData.cvv.replace(/\D/g, '').length < 3) {
      newErrors.cvv = 'Valid CVV required (3-4 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
    setFormData((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData((prev) => ({ ...prev, cvv: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitted(true);
    try {
      await onSubmit({
        ...formData,
        amount,
        reservationId,
      });
    } finally {
      setSubmitted(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-semibold">${(amount - (depositAmount || 0)).toFixed(2)}</span>
          </div>
          {depositAmount ? (
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Deposit:</span>
              <span className="font-semibold text-blue-600">${depositAmount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="border-t border-blue-200 pt-2 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-blue-600">${amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.cardNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.cardNumber && (
            <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.cardNumber}
            </div>
          )}
        </div>

        {/* Card Holder */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Card Holder Name</label>
          <input
            type="text"
            placeholder="John Doe"
            value={formData.cardHolder}
            onChange={(e) => setFormData((prev) => ({ ...prev, cardHolder: e.target.value }))}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.cardHolder ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.cardHolder && (
            <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.cardHolder}
            </div>
          )}
        </div>

        {/* Expiry & CVV */}
        <div className="grid grid-cols-3 gap-3">
          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={formData.expiryMonth}
              onChange={(e) => setFormData((prev) => ({ ...prev, expiryMonth: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.expiryMonth ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month.toString().padStart(2, '0')}>
                  {month.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={formData.expiryYear}
              onChange={(e) => setFormData((prev) => ({ ...prev, expiryYear: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.expiryYear ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">YY</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                <option key={year} value={(year % 100).toString().padStart(2, '0')}>
                  {(year % 100).toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          {/* CVV */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
            <input
              type="password"
              placeholder="123"
              value={formData.cvv}
              onChange={handleCVVChange}
              maxLength={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.cvv ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading || submitted}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || submitted}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitted ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Pay ${amount.toFixed(2)}
              </>
            )}
          </button>
        </div>

        {/* Security Note */}
        <p className="text-xs text-gray-500 text-center">
          🔒 Your payment information is encrypted and secure
        </p>
      </form>
    </motion.div>
  );
}
