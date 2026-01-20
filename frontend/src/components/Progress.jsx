import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Calendar, 
  Award,
  Target,
  Activity,
  MapPin,
  Flame,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { apiService } from '../lib/api_simple'

export default function Progress({ user }) {
  const [analytics, setAnalytics] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [timeRange, setTimeRange] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgressData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, timeRange])

  const loadProgressData = async () => {
    try {
      // Load analytics
      const analyticsData = await apiService.getProgressAnalytics(user.id, timeRange)
      setAnalytics(analyticsData)

      // Load achievements
      const achievementsData = await apiService.getUserAchievements(user.id)
      setAchievements(achievementsData)

    } catch (error) {
      console.error('Failed to load progress data:', error)
      // Set empty data on error
      setAnalytics({
        period_days: timeRange,
        total_sessions: 0,
        total_minutes: 0,
        avg_session_duration: 0,
        category_breakdown: {},
        current_streaks: { workout: 0, qigong: 0 },
        daily_workout_data: [],
        weekly_summary: []
      })
      setAchievements([])
    } finally {
      setLoading(false)
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

  // Prepare chart data
  const workoutChartData = analytics?.daily_workout_data?.map(([date, minutes]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    minutes
  })) || []

  // Prepare category breakdown for pie chart
  const categoryData = Object.entries(analytics?.category_breakdown || {}).map(([name, data]) => ({
    name,
    value: data.minutes,
    count: data.count
  }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Progress Analytics</h1>
          <p className="text-muted-foreground">Track your fitness journey and achievements</p>
        </div>
        
        <div className="flex space-x-2">
          {[7, 30, 90].map(days => (
            <Button
              key={days}
              variant={timeRange === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(days)}
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
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
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analytics?.total_sessions || 0}
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
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Minutes</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analytics?.total_minutes || 0}
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
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analytics?.current_streaks?.workout || 0} days
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
                    {achievements.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Workout Minutes Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Daily Workout Minutes</span>
              </CardTitle>
              <CardDescription>Your workout activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              {workoutChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workoutChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="minutes" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No workout data for this period
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Category Breakdown</span>
              </CardTitle>
              <CardDescription>Time spent per category</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {categoryData.map((cat, index) => (
                      <div key={cat.name} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{cat.name}</span>
                        </div>
                        <span className="text-muted-foreground">{cat.value} min ({cat.count} sessions)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No category data for this period
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Current Streaks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Flame className="w-5 h-5" />
              <span>Current Streaks</span>
            </CardTitle>
            <CardDescription>Keep the momentum going!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground">Qigong</h3>
                <p className="text-2xl font-bold text-blue-500 mb-1">
                  {analytics?.current_streaks?.qigong || 0}
                </p>
                <p className="text-sm text-muted-foreground">days in a row</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="font-semibold text-foreground">All Workouts</h3>
                <p className="text-2xl font-bold text-orange-500 mb-1">
                  {analytics?.current_streaks?.workout || 0}
                </p>
                <p className="text-sm text-muted-foreground">days in a row</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Summary */}
      {analytics?.weekly_summary && analytics.weekly_summary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Weekly Summary</span>
              </CardTitle>
              <CardDescription>Your weekly workout breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.weekly_summary.map((week, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">
                        Week of {new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        {week.sessions} sessions • {week.minutes} min
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {week.categories.map((cat, idx) => (
                        <Badge key={idx} variant="secondary">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Achievements</span>
            </CardTitle>
            <CardDescription>Your fitness milestones and accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0 + index * 0.1 }}
                    className="bg-accent rounded-lg p-4 text-center"
                  >
                    <div className="text-3xl mb-2">
                      {achievement.achievement?.badge_icon || '🏆'}
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {achievement.achievement?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.achievement?.description}
                    </p>
                    <Badge variant="secondary">
                      +{achievement.achievement?.xp_reward} XP
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No achievements yet</h3>
                <p className="text-sm text-muted-foreground">
                  Complete video workouts to unlock your first achievement!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
