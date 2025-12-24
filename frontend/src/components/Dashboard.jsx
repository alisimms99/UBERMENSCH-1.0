import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Play,
  TrendingUp,
  Target,
  Calendar,
  Award,
  Flame,
  Activity,
  MapPin,
  Clock,
  Plus,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { apiService } from '../lib/api'

// Sprint 1 Components
import SupplementTracker from './SupplementTracker'
import DailyMetrics from './DailyMetrics'
import DiaryEntry from './DiaryEntry'

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const handleStartWorkout = (templateId) => navigate(`/workout/session/${templateId}`)
  const [todayProgress, setTodayProgress] = useState(null)
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [workoutStats, setWorkoutStats] = useState(null)
  const [recentAchievements, setRecentAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [user])
  useEffect(() => {
    setTemplatesLoading(true)
    apiService.getWorkoutTemplates()
      .then(data => setTemplates(data))
      .catch(error => setTemplatesError(error.message || 'Failed to load templates'))
      .finally(() => setTemplatesLoading(false))
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load today's progress
      const progress = await apiService.getTodayProgress(user.id)
      setTodayProgress(progress)

      // Load today's workout
      try {
        const workout = await apiService.getTodayWorkout(user.id)
        setTodayWorkout(workout)
      } catch (error) {
        // No workout for today
        setTodayWorkout(null)
      }

      // Load workout stats
      const stats = await apiService.getWorkoutStats(user.id)
      setWorkoutStats(stats)

      // Load recent achievements
      const achievements = await apiService.getUserAchievements(user.id)
      setRecentAchievements(achievements.slice(-3)) // Last 3 achievements

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Set default values for demo
      setTodayProgress({
        daily_steps: 0,
        walking_loops: 0,
        qigong_streak: 0,
        workout_streak: 0,
        walking_streak: 0,
        current_level: 1,
        xp_earned: 0
      })
      setWorkoutStats({
        total_workouts: 0,
        completed_workouts: 0,
        current_streak: 0,
        completion_rate: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const generateTodayWorkout = async () => {
    try {
      const workout = await apiService.generateWorkout(user.id, {
        template: 'Building Strength',
        date: new Date().toISOString().split('T')[0]
      })
      setTodayWorkout(workout)
    } catch (error) {
      console.error('Failed to generate workout:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const stepProgress = todayProgress ? (todayProgress.daily_steps / user.target_daily_steps) * 100 : 0
  const loopsNeeded = Math.ceil((user.target_daily_steps - (todayProgress?.daily_steps || 0)) / 2740)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center md:text-left"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user.username}! 👋
        </h1>
        <p className="text-muted-foreground">
          "That which does not kill us makes us stronger."
        </p>
      </motion.div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* ... (Existing Stats Cards) ... */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Level</p>
                  <p className="text-2xl font-bold text-foreground">
                    {todayProgress?.current_level || 1}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qigong Streak</p>
                  <p className="text-2xl font-bold text-foreground">
                    {todayProgress?.qigong_streak || 0} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Steps Today</p>
                  <p className="text-2xl font-bold text-foreground">
                    {todayProgress?.daily_steps || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                  <p className="text-2xl font-bold text-foreground">
                    {recentAchievements.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sprint 1 Grid: Supplements & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <SupplementTracker user={user} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <DailyMetrics user={user} />
          <DiaryEntry user={user} />
        </motion.div>
      </div>

      {/* Workout Section (Existing but moved down) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Today's Workout</span>
              </CardTitle>
              <CardDescription>
                Make sure to align with your Qigong practice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayWorkout ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {todayWorkout.exercises?.length || 0} exercises planned
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Status: <Badge variant={
                          todayWorkout.status === 'completed' ? 'default' :
                            todayWorkout.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {todayWorkout.status.replace('_', ' ')}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  {todayWorkout.status === 'planned' && (
                    <Link to="/workout">
                      <Button className="w-full" size="lg">
                        <Play className="w-5 h-5 mr-2" />
                        Start Workout
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  {templatesLoading ? (
                    <p>Loading templates...</p>
                  ) : templatesError ? (
                    <p className="text-red-500">{templatesError}</p>
                  ) : (
                    templates.map(template => (
                      <div key={template.id} className="mb-4">
                        <h3 className="font-semibold text-foreground">{template.name}</h3>
                        <button
                          onClick={() => handleStartWorkout(template.id)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        >
                          Start Workout
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions (Condensed) */}
        <div className="space-y-4">
          <Link to="/progress">
            <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
              <TrendingUp className="w-6 h-6" />
              <span>Full Analytics</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full h-20 flex flex-col space-y-2"
            onClick={() => {
              const steps = prompt('How many steps did you walk?')
              if (steps) {
                apiService.createProgressEntry(user.id, {
                  daily_steps: parseInt(steps),
                  date: new Date().toISOString().split('T')[0]
                }).then(() => loadDashboardData())
              }
            }}
          >
            <MapPin className="w-6 h-6" />
            <span>Log Walking</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
