import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger" 
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  const variants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }
  };

  const buttonVariants = {
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    warning: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    info: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
  };

  const iconStyles = {
    danger: { bg: 'bg-red-100', text: 'text-red-600' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    info: { bg: 'bg-blue-100', text: 'text-blue-600' }
  };

  const currentIconStyle = iconStyles[variant] || iconStyles.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0"
            aria-hidden="true"
          >
            <div 
              className="absolute inset-0 bg-gray-500 opacity-75" 
              onClick={onClose}
            ></div>
          </motion.div>

          <motion.div 
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative bg-white rounded-xl shadow-2xl overflow-hidden transform max-w-md w-full mx-4 sm:mx-0"
          >
            <div className="px-6 py-5">
              <div className="flex items-start">
                <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${currentIconStyle.bg} mr-4`}>
                  <svg className={`h-6 w-6 ${currentIconStyle.text}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{message}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse">
              <button
                type="button"
                className={`ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-sm font-medium text-white cursor-pointer ${buttonVariants[variant]} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm`}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmText}
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                onClick={onClose}
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}