"use client";

import { BaseModal } from './BaseModal';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

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
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      showFooter={false}
      className="max-w-md"
    >
      <div className="flex flex-col items-center text-center space-y-6 py-6">
        {isDestructive && (
          <div className="bg-red-50 text-red-500 p-6 rounded-full shadow-inner">
            <AlertTriangle size={40} />
          </div>
        )}
        <div className="space-y-2">
           <h3 className="text-xl font-black text-gray-900">{title}</h3>
           <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-sm">{message}</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button 
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="h-14 rounded-2xl flex-1 border-2 font-bold"
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            "h-14 rounded-2xl flex-1 font-black text-white shadow-lg",
            isDestructive 
              ? "bg-red-600 hover:bg-red-700 shadow-red-100" 
              : "bg-black hover:bg-gray-800 shadow-gray-200"
          )}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : confirmText}
        </Button>
      </div>
    </BaseModal>
  );
}
