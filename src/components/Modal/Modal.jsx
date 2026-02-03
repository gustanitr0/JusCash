import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ children, title, onClose, size = 'default' }) => {
  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-2xl',
    large: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  return (
    <div className="fixed inset-0 bg-black/80 background-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`card-dark bg-background-tertiary rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center p-6 border-b border-surface-dark sticky top-0 bg-background-tertiary">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white hover:bg-surface-dark p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;