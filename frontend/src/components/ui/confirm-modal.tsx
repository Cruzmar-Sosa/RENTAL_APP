'use client';

import { Modal } from './modal';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  isDestructive = true
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        {isDestructive && (
          <div className="bg-red-50 text-red-500 p-4 rounded-full mb-2">
            <AlertTriangle size={32} />
          </div>
        )}
        <p className="text-gray-500 text-sm max-w-sm">{message}</p>
      </div>
      
      <div className="flex gap-3 mt-6">
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button 
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            "flex-1 py-3 rounded-xl font-bold text-white transition disabled:opacity-50",
            isDestructive ? "bg-red-500 hover:bg-red-600" : "bg-black hover:bg-gray-900"
          )}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
