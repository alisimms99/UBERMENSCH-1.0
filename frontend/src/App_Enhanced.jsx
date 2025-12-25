import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

// Import components
import Dashboard from './components/Dashboard'
import WorkoutSession from './components/WorkoutSession'
import Progress from './components/Progress'
import Profile from './components/Profile'
import Navigation from './components/Navigation'

// Import enhanced components
import ProfileEditor from './components/ProfileEditor'
import DataManagement from './components/DataManagement'

// Import error handling and notifications
import ErrorBoundary, { 
  WorkoutErrorBoundary, 
  ProfileErrorBoundary, 
  DataErrorBoundary 
} from './components/ErrorBoundary'
import { ToastProvider, useToast, toastMessages } from './components/ToastNotification'

// API service
import { apiService } from './lib/api'

function AppContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [error, setError] = useState(null)
  
  const { showSuccess, showError, showWarning } = useToast()

  useEffect(() => {
    // Check for existing user or create demo user
    initializeUser()
    
    // Check for dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const initializeUser = async () => {
    try {
      setError(null)
      
      // For demo purposes, we'll create a default user
      // In a real app, this would check authentication
      const users = await apiService.getUsers()
      
      if (users.length === 0) {
        // Create demo user
        const demoUser = await apiService.createUser({
          username: 'fitness_user',
          email: 'user@fittracker.com',
          age: 55,
          weight: 225,
          height: 70.5
        })
        setUser(demoUser)
        showSuccess('Welcome to FitTracker! Your account has been created.')
      } else {
        setUser(users[0])
        showSuccess(`Welcome back, ${users[0].username}!`)
      }
    } catch (error) {
      console.error('Failed to initialize user:', error)
      setError(error)
      
      // Create offline demo user
      const offlineUser = {
        id: 1,
        username: 'Demo User',
        email: 'demo@fittracker.com',
        age: 55,
        weight: 225,
        height: 70.5,
        onboarding_completed: false,
        current_pushup_target: 5,
        current_situp_target: 5,
        current_plank_target: 30,
        target_pushups: 50,
        target_situps: 50,
        target_daily_steps: 10000,
        workouts_per_week: 3,
        preferred_workout_duration: 60
      }
      
      setUser(offlineUser)
      showWarning('Running in offline mode. Some features may be limited.')
    } finally {
      setLoading(false)
    }
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    showSuccess(`${newDarkMode ? 'Dark' : 'Light'} mode enabled`)
  }

  // Enhanced user update function with error handling
  const updateUser = async (userData) => {
    try {
      const updatedUser = await apiService.updateUser(user.id, userData)
      setUser(updatedUser)
      showSuccess(toastMessages.profileSaved)
      return updatedUser
    } catch (error) {
      console.error('Failed to update user:', error)
      showError(toastMessages.profileSaveError)
      
      // Fallback to local update in offline mode
      setUser(prev => ({ ...prev, ...userData }))
      showWarning('Changes saved locally. Will sync when online.')
      return { ...user, ...userData }
    }
  }

  // Error retry function
  const retryInitialization = () => {
    setLoading(true)
    setError(null)
    initializeUser()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-foreground">Loading FitTracker...</h2>
          <p className="text-muted-foreground">Preparing your fitness journey</p>
        </motion.div>
      </div>
    )
  }

  // If there's a critical error during initialization
  if (error && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Unable to Load App</h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading FitTracker. Please check your connection and try again.
          </p>
          <button
            onClick={retryInitialization}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <ErrorBoundary>
                    <Dashboard user={user} />
                  </ErrorBoundary>
                </MainLayout>
              } 
            />
            
            {/* Workout Session */}
            <Route 
              path="/workout" 
              element={
                <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <WorkoutErrorBoundary>
                    <WorkoutSession user={user} />
                  </WorkoutErrorBoundary>
                </MainLayout>
              } 
            />
            
            {/* Progress */}
            <Route 
              path="/progress" 
              element={
                <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <ErrorBoundary>
                    <Progress user={user} />
                  </ErrorBoundary>
                </MainLayout>
              } 
            />
            
            {/* Original Profile */}
            <Route 
              path="/profile" 
              element={
                <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <ProfileErrorBoundary>
                    <Profile user={user} setUser={updateUser} />
                  </ProfileErrorBoundary>
                </MainLayout>
              } 
            />
            
            {/* Enhanced Profile Editor */}
            <Route 
              path="/profile/edit" 
              element={
                <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <ProfileErrorBoundary>
                    <ProfileEditor user={user} setUser={updateUser} />
                  </ProfileErrorBoundary>
                </MainLayout>
              } 
            />
            
            {/* Data Management */}
            <Route 
              path="/data" 
              element={
                <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <DataErrorBoundary>
                    <DataManagement user={user} setUser={updateUser} />
                  </DataErrorBoundary>
                </MainLayout>
              } 
            />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  )
}

// Main layout component with navigation
function MainLayout({ children, user, darkMode, toggleDarkMode }) {
  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>
        <Navigation user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      </ErrorBoundary>
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}

// Main App component with providers
function App() {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App

