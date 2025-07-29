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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { apiService } from '../lib/api_simple'

export default function Progress({ user }) {
  const [analytics, setAnalytics] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [timeRange, setTimeRange] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgressData()
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
      // Set demo data
      setAnalytics({
        period_days: timeRange,
        total_entries: 10,
        analytics: {
          total_steps: 50000,
          total_walking_loops: 18,
          avg_daily_steps: 5000,
          step_goal_achievement_rate: 60,
          days_met_step_goal: 6,
          current_streaks: {
            qigong: 5,
            workout: 3,
            walking: 7
          },
          max_pushups_progression: [
            ['2024-01-01', 5],
            ['2024-01-15', 8],
            ['2024-01-30', 12]
          ],
          max_situps_progression: [
            ['2024-01-01', 3],
            ['2024-01-15', 6],
            ['2024-01-30', 10]
          ],
          plank_duration_progression: [
            ['2024-01-01', 30],
            ['2024-01-15', 45],
            ['2024-01-30', 60]
          ],
          daily_steps_data: Array.from({ length: 30 }, (_, i) => [
            new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            Math.floor(Math.random() * 8000) + 2000
          ])
        }
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

  const stepsChartData = analytics?.analytics?.daily_steps_data?.map(([date, steps]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    steps
  })) || []

  const strengthProgressData = [
    {
      exercise: 'Pushups',
      data: analytics?.analytics?.max_pushups_progression?.map(([date, value]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value
      })) || []
    },
    {
      exercise: 'Situps',
      data: analytics?.analytics?.max_situps_progression?.map(([date, value]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value
      })) || []
    }
  ]

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
                  <MapPin className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Steps</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(analytics?.analytics?.total_steps || 0).toLocaleString()}
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
                  <p className="text-sm text-muted-foreground">Goal Achievement</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analytics?.analytics?.step_goal_achievement_rate || 0}%
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
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.max(
                      analytics?.analytics?.current_streaks?.qigong || 0,
                      analytics?.analytics?.current_streaks?.workout || 0,
                      analytics?.analytics?.current_streaks?.walking || 0
                    )} days
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
        {/* Daily Steps Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Daily Steps</span>
              </CardTitle>
              <CardDescription>Your walking activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stepsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="steps" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Strength Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Strength Progress</span>
              </CardTitle>
              <CardDescription>Your maximum reps over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    {strengthProgressData.map((series, index) => (
                      <Line
                        key={series.exercise}
                        type="monotone"
                        dataKey="value"
                        data={series.data}
                        stroke={index === 0 ? "hsl(var(--primary))" : "hsl(var(--secondary))"}
                        strokeWidth={2}
                        name={series.exercise}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground">Qigong</h3>
                <p className="text-2xl font-bold text-blue-500 mb-1">
                  {analytics?.analytics?.current_streaks?.qigong || 0}
                </p>
                <p className="text-sm text-muted-foreground">days in a row</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="font-semibold text-foreground">Workouts</h3>
                <p className="text-2xl font-bold text-orange-500 mb-1">
                  {analytics?.analytics?.current_streaks?.workout || 0}
                </p>
                <p className="text-sm text-muted-foreground">days in a row</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-semibold text-foreground">Walking</h3>
                <p className="text-2xl font-bold text-green-500 mb-1">
                  {analytics?.analytics?.current_streaks?.walking || 0}
                </p>
                <p className="text-sm text-muted-foreground">days in a row</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
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
                    transition={{ delay: 0.9 + index * 0.1 }}
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
                  Keep working out to unlock your first achievement!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

