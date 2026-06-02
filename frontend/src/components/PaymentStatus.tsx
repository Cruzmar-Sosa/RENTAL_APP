'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader, Copy, Download } from 'lucide-react';

export interface PaymentStatusProps {
  status: 'processing' | 'success' | 'error';
  transactionId?: string;
  amount?: number;
  receiptUrl?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export function PaymentStatus({
  status,
  transactionId,
  amount,
  receiptUrl,
  errorMessage,
  onRetry,
  onClose,
}: PaymentStatusProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (transactionId) {
      navigator.clipboard.writeText(transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        {/* Processing State */}
        {status === 'processing' && (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mx-auto mb-4"
            >
              <Loader className="w-12 h-12 text-blue-500" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-800">Processing Payment</h3>
            <p className="text-gray-500 text-sm mt-2">Please do not close this window</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-4"
            >
              <CheckCircle className="w-12 h-12 text-green-500" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-800">Payment Successful</h3>
            
            {amount && (
              <div className="mt-4 bg-green-50 p-3 rounded-lg">
                <p className="text-gray-600 text-sm">Amount Charged</p>
                <p className="text-2xl font-bold text-green-600">${amount.toFixed(2)}</p>
              </div>
            )}

            {transactionId && (
              <div className="mt-4">
                <p className="text-gray-600 text-sm mb-2">Transaction ID</p>
                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                  <code className="text-xs flex-1 truncate text-gray-800">{transactionId}</code>
                  <button
                    onClick={handleCopy}
                    className="text-gray-500 hover:text-gray-700"
                    title="Copy transaction ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied && <p className="text-xs text-green-600 mt-1">Copied!</p>}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              {receiptUrl && (
                <button
                  onClick={() => window.open(receiptUrl, '_blank')}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-4 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  Receipt
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-4"
            >
              <AlertCircle className="w-12 h-12 text-red-500" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-800">Payment Failed</h3>
            
            {errorMessage && (
              <div className="mt-4 bg-red-50 p-3 rounded-lg">
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Retry
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
