import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface CustomAlertProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({ 
  isOpen, 
  title, 
  message, 
  type = 'info', 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl max-w-sm w-[90%] p-6 shadow-2xl relative space-y-4 text-left">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-250 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 shrink-0">
            {type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            {type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
            {type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
            {type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-500" />}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white font-sans">{title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">{message}</p>
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2e2e2e] hover:bg-[#3e3e3e] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

interface CustomConfirmProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CustomConfirm: React.FC<CustomConfirmProps> = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl max-w-sm w-[90%] p-6 shadow-2xl space-y-4 text-left">
        <div className="flex items-start gap-3.5">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white font-sans">{title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">{message}</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 bg-transparent hover:bg-[#1f1f1f] text-gray-400 hover:text-white text-xs font-semibold rounded-lg border border-[#2e2e2e] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
