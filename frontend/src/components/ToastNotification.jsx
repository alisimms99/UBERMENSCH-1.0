import { useState, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  X 
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Toast types with configurations
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-600'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-600'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClassName: 'text-yellow-600'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-600'
  }
}

// Toast context for managing global toast state
const ToastContext = createContext()

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  // Add a new toast
  const addToast = (message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random()
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 5000,
      persistent: options.persistent || false,
      action: options.action || null,
      ...options
    }

    setToasts(prev => [...prev, toast])

    // Auto-remove toast after duration (unless persistent)
    if (!toast.persistent) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration)
    }

    return id
  }

  // Remove a toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Clear all toasts
  const clearToasts = () => {
    setToasts([])
  }

  // Convenience methods for different toast types
  const showSuccess = (message, options) => addToast(message, 'success', options)
  const showError = (message, options) => addToast(message, 'error', options)
  const showWarning = (message, options) => addToast(message, 'warning', options)
  const showInfo = (message, options) => addToast(message, 'info', options)

  const value = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Hook to use toast functionality
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Individual toast component
const Toast = ({ toast, onRemove }) => {
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ duration: 0.3 }}
      className={`
        relative flex items-start space-x-3 p-4 rounded-lg border shadow-lg max-w-sm w-full
        ${config.className}
      `}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconClassName}`} />
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">
          {toast.title && (
            <div className="font-semibold mb-1">{toast.title}</div>
          )}
          <div>{toast.message}</div>
        </div>
        
        {toast.action && (
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toast.action.onClick}
              className="text-xs"
            >
              {toast.action.label}
            </Button>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 h-auto hover:bg-black/10"
      >
        <X className="w-4 h-4" />
      </Button>
    </motion.div>
  )
}

// Toast container component
const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Progress toast component for long-running operations
export const ProgressToast = ({ 
  message, 
  progress, 
  onCancel,
  type = 'info' 
}) => {
  const config = TOAST_TYPES[type] || TOAST_TYPES.info
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`
        relative flex items-start space-x-3 p-4 rounded-lg border shadow-lg max-w-sm w-full
        ${config.className}
      `}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconClassName}`} />
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium mb-2">{message}</div>
        
        <div className="w-full bg-white/30 rounded-full h-2">
          <motion.div
            className="bg-current h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <div className="text-xs mt-1 opacity-75">
          {Math.round(progress)}% complete
        </div>
      </div>

      {onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="flex-shrink-0 p-1 h-auto hover:bg-black/10"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  )
}

// Hook for showing progress toasts
export const useProgressToast = () => {
  const [progressToasts, setProgressToasts] = useState([])

  const showProgress = (message, type = 'info') => {
    const id = Date.now() + Math.random()
    const toast = { id, message, type, progress: 0 }
    
    setProgressToasts(prev => [...prev, toast])
    
    return {
      id,
      updateProgress: (progress) => {
        setProgressToasts(prev => 
          prev.map(t => t.id === id ? { ...t, progress } : t)
        )
      },
      complete: () => {
        setProgressToasts(prev => prev.filter(t => t.id !== id))
      },
      cancel: () => {
        setProgressToasts(prev => prev.filter(t => t.id !== id))
      }
    }
  }

  const ProgressToastContainer = () => (
    <div className="fixed top-4 left-4 z-50 space-y-2">
      <AnimatePresence>
        {progressToasts.map(toast => (
          <ProgressToast
            key={toast.id}
            message={toast.message}
            progress={toast.progress}
            type={toast.type}
            onCancel={() => {
              setProgressToasts(prev => prev.filter(t => t.id !== toast.id))
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )

  return {
    showProgress,
    ProgressToastContainer
  }
}

// Predefined toast messages for common operations
export const toastMessages = {
  // Profile operations
  profileSaved: 'Profile updated successfully!',
  profileSaveError: 'Failed to save profile. Please try again.',
  profileValidationError: 'Please fix the validation errors before saving.',
  
  // Workout operations
  workoutCompleted: 'Workout completed! Great job!',
  workoutSaved: 'Workout progress saved successfully.',
  workoutError: 'Error saving workout. Your progress may be lost.',
  
  // Data operations
  dataExported: 'Data exported successfully!',
  dataImported: 'Data imported successfully!',
  dataExportError: 'Failed to export data. Please try again.',
  dataImportError: 'Failed to import data. Please check the file format.',
  
  // Target operations
  targetsUpdated: 'Exercise targets updated successfully!',
  targetsReset: 'Targets reset to baseline levels.',
  targetsError: 'Failed to update targets. Please try again.',
  
  // General operations
  operationSuccess: 'Operation completed successfully!',
  operationError: 'Operation failed. Please try again.',
  networkError: 'Network error. Please check your connection.',
  validationError: 'Please check your input and try again.',
  
  // Factory reset
  factoryResetComplete: 'Factory reset completed. All data has been cleared.',
  factoryResetError: 'Factory reset failed. Please try again.'
}

// Helper function to show validation errors as toasts
export const showValidationErrors = (errors, showError) => {
  Object.entries(errors).forEach(([field, message]) => {
    showError(`${field}: ${message}`, { duration: 7000 })
  })
}

export default ToastProvider

