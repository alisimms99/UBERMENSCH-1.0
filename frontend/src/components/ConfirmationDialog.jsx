import React from 'react';
import { AlertTriangle, CheckCircle, X, Trash2, Save, RotateCcw } from 'lucide-react';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  requiresTyping = false,
  requiredText = '',
  children
}) => {
  const [typedText, setTypedText] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      setTypedText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-red-600" />,
          headerBg: 'bg-red-50',
          headerBorder: 'border-red-200',
          iconBg: 'bg-red-100',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          titleColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
          headerBg: 'bg-yellow-50',
          headerBorder: 'border-yellow-200',
          iconBg: 'bg-yellow-100',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          titleColor: 'text-yellow-800'
        };
      case 'info':
        return {
          icon: <RotateCcw className="w-6 h-6 text-blue-600" />,
          headerBg: 'bg-blue-50',
          headerBorder: 'border-blue-200',
          iconBg: 'bg-blue-100',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          titleColor: 'text-blue-800'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          headerBg: 'bg-green-50',
          headerBorder: 'border-green-200',
          iconBg: 'bg-green-100',
          confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
          titleColor: 'text-green-800'
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-gray-600" />,
          headerBg: 'bg-gray-50',
          headerBorder: 'border-gray-200',
          iconBg: 'bg-gray-100',
          confirmButton: 'bg-gray-600 hover:bg-gray-700 text-white',
          titleColor: 'text-gray-800'
        };
    }
  };

  const styles = getTypeStyles();
  const canConfirm = !requiresTyping || typedText === requiredText;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && canConfirm) {
      handleConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className={`flex items-center gap-4 p-6 ${styles.headerBg} ${styles.headerBorder} border-b rounded-t-lg`}>
          <div className={`flex-shrink-0 w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center`}>
            {styles.icon}
          </div>
          <div className="flex-grow">
            <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {message}
          </p>

          {children && (
            <div className="mb-4">
              {children}
            </div>
          )}

          {requiresTyping && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "{requiredText}" to confirm:
              </label>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={requiredText}
                autoFocus
              />
              {typedText && typedText !== requiredText && (
                <p className="text-sm text-red-600 mt-1">
                  Text doesn't match. Please type exactly: "{requiredText}"
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmButton}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Preset confirmation dialogs for common actions
export const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, itemName = 'item' }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    type="danger"
    title="Delete Confirmation"
    message={`Are you sure you want to delete this ${itemName}? This action cannot be undone.`}
    confirmText="Delete"
    cancelText="Cancel"
  />
);

export const ClearDataConfirmationDialog = ({ isOpen, onClose, onConfirm }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    type="danger"
    title="Clear All Data"
    message="This will permanently delete all your fitness data including workout history, progress entries, and reset your profile to initial state. This action cannot be undone."
    confirmText="Clear All Data"
    cancelText="Cancel"
    requiresTyping={true}
    requiredText="CLEAR_ALL_DATA"
  />
);

export const ResetBaselinesConfirmationDialog = ({ isOpen, onClose, onConfirm }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    type="warning"
    title="Reset Fitness Baselines"
    message="This will reset your current targets based on new assessment results. Your progress history will be preserved, but your current targets will be recalculated."
    confirmText="Reset Baselines"
    cancelText="Cancel"
  />
);

export const SaveChangesConfirmationDialog = ({ isOpen, onClose, onConfirm, hasUnsavedChanges }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    type="warning"
    title="Unsaved Changes"
    message="You have unsaved changes. Are you sure you want to leave without saving?"
    confirmText="Leave Without Saving"
    cancelText="Stay and Save"
  />
);

export default ConfirmationDialog;

