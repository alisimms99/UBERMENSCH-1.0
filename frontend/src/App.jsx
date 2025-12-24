import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import EnhancedWorkoutSession from './components/EnhancedWorkoutSession'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

// Import components (we'll create these)
import Dashboard from './components/Dashboard'
import Onboarding from './components/Onboarding'
import WorkoutSession from './components/WorkoutSession'
import WorkoutDetail from './components/WorkoutDetail'
import Progress from './components/Progress'
import Profile from './components/Profile'
import Navigation from './components/Navigation'

// API service
import { apiService } from './lib/api'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

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
    // TEMPORARY: Skip API, use local user
    const offlineUser = {
      id: 1,
      username: 'Ali',
      email: 'ali@ubermensch.com',
      age: 55,
      weight: 225,
      height: 70.5,
      onboarding_completed: true
    }
    setUser(offlineUser)
    localStorage.setItem('user', JSON.stringify(offlineUser))
    setLoading(false)
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

  // If user hasn't completed onboarding, show onboarding flow
  if (user && !user.onboarding_completed) {
    return (
      <div className="min-h-screen bg-background">
        <Onboarding user={user} setUser={setUser} />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/workout/session/:templateId" element={<EnhancedWorkoutSession />} />
            <Route
              path="/dashboard"
              element={
                <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <Dashboard user={user} />
                </MainLayout>
              }
            />
            <Route
              path="/workout"
              element={<Navigate to="/" />}
            />
            {/* Sprint 2 Routes */}
            <Route
              path="/workout/template/:templateId"
              element={
                <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <WorkoutDetail user={user} />
                </MainLayout>
              }
            />
            <Route
              path="/workout/session/:templateId"
              element={
                <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <WorkoutSession user={user} />
                </MainLayout>
              }
            />
            <Route
              path="/progress"
              element={
                <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <Progress user={user} />
                </MainLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <Profile user={user} setUser={setUser} />
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
      <Navigation user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}

export default App
