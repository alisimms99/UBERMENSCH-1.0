import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
import { apiService } from '../lib/api_simple'

export default function Dashboard({ user }) {
  const [todayProgress, setTodayProgress] = useState(null)
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [workoutStats, setWorkoutStats] = useState(null)
  const [recentAchievements, setRecentAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [user])

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
          Ready to continue your fitness journey? Let's make today count!
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <p className="text-sm text-muted-foreground">Workout Streak</p>
                  <p className="text-2xl font-bold text-foreground">
                    {todayProgress?.workout_streak || 0} days
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
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {workoutStats?.completion_rate || 0}%
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Today's Workout</span>
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
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
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Estimated time</p>
                      <p className="font-semibold">45-60 min</p>
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

                  {todayWorkout.status === 'in_progress' && (
                    <Link to="/workout">
                      <Button className="w-full" size="lg" variant="secondary">
                        <Clock className="w-5 h-5 mr-2" />
                        Continue Workout
                      </Button>
                    </Link>
                  )}

                  {todayWorkout.status === 'completed' && (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Award className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="font-semibold text-foreground">Workout Completed!</p>
                      <p className="text-sm text-muted-foreground">Great job today! 🎉</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">No workout planned</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Let's create a workout for today!
                  </p>
                  <Button onClick={generateTodayWorkout}>
                    Generate Today's Workout
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          {/* Daily Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Daily Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-foreground">
                    {(todayProgress?.daily_steps || 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {user.target_daily_steps.toLocaleString()}
                  </span>
                </div>
                <Progress value={stepProgress} className="h-2" />
                <div className="text-sm text-muted-foreground">
                  {loopsNeeded > 0 ? (
                    <p>{loopsNeeded} more loops needed (1.37 mi each)</p>
                  ) : (
                    <p>🎉 Daily goal achieved!</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Targets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Current Targets</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pushups</span>
                  <span className="font-semibold">{user.current_pushup_target || 5}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Situps</span>
                  <span className="font-semibold">{user.current_situp_target || 5}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plank</span>
                  <span className="font-semibold">{user.current_plank_target || 30}s</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streaks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flame className="w-5 h-5" />
                <span>Streaks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Qigong</span>
                  <Badge variant="outline">
                    {todayProgress?.qigong_streak || 0} days
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Workouts</span>
                  <Badge variant="outline">
                    {todayProgress?.workout_streak || 0} days
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Walking</span>
                  <Badge variant="outline">
                    {todayProgress?.walking_streak || 0} days
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump into your fitness activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link to="/workout">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Play className="w-6 h-6" />
                  <span>Start Workout</span>
                </Button>
              </Link>
              
              <Link to="/progress">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <TrendingUp className="w-6 h-6" />
                  <span>View Progress</span>
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full h-20 flex flex-col space-y-2"
                onClick={() => {
                  // Quick log walking
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
              
              <Link to="/profile">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Target className="w-6 h-6" />
                  <span>Update Goals</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Recent Achievements</span>
                </div>
                <Link to="/progress">
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-accent rounded-lg"
                  >
                    <div className="text-2xl">
                      {achievement.achievement?.badge_icon || '🏆'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {achievement.achievement?.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {achievement.achievement?.description}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      +{achievement.achievement?.xp_reward} XP
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

