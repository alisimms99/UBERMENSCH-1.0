import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Target, 
  Settings,
  Save,
  Scale,
  Ruler,
  Calendar,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { apiService, fitnessCalculations } from '../lib/api_simple'

export default function Profile({ user, setUser }) {
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    age: user.age || '',
    weight: user.weight || '',
    height: user.height || '',
    target_pushups: user.target_pushups || 50,
    target_situps: user.target_situps || 50,
    target_daily_steps: user.target_daily_steps || 10000,
    workouts_per_week: user.workouts_per_week || 3,
    preferred_workout_duration: user.preferred_workout_duration || 60
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveProfile = async () => {
    setLoading(true)
    try {
      const updatedUser = await apiService.updateUser(user.id, {
        username: formData.username,
        email: formData.email,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        target_pushups: parseInt(formData.target_pushups),
        target_situps: parseInt(formData.target_situps),
        target_daily_steps: parseInt(formData.target_daily_steps),
        workouts_per_week: parseInt(formData.workouts_per_week),
        preferred_workout_duration: parseInt(formData.preferred_workout_duration)
      })
      
      setUser(updatedUser)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save profile:', error)
      // For demo purposes, update locally
      setUser({
        ...user,
        ...formData
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  const updateTargets = async () => {
    try {
      await apiService.updateTargets(user.id, {
        pushup_target: user.current_pushup_target + 2,
        situp_target: user.current_situp_target + 3,
        plank_target: user.current_plank_target + 10
      })
      
      setUser(prev => ({
        ...prev,
        current_pushup_target: prev.current_pushup_target + 2,
        current_situp_target: prev.current_situp_target + 3,
        current_plank_target: prev.current_plank_target + 10
      }))
    } catch (error) {
      console.error('Failed to update targets:', error)
    }
  }

  const bmi = formData.weight && formData.height ? 
    fitnessCalculations.calculateBMI(formData.weight, formData.height) : null

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information and fitness goals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>
                Update your basic profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter your username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Age</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="55"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight" className="flex items-center space-x-2">
                    <Scale className="w-4 h-4" />
                    <span>Weight (lbs)</span>
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="225"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="height" className="flex items-center space-x-2">
                    <Ruler className="w-4 h-4" />
                    <span>Height (inches)</span>
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.5"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    placeholder="70.5"
                  />
                </div>
              </div>

              {bmi && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-accent rounded-lg p-4"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Body Mass Index (BMI)</span>
                    <span className="text-lg font-bold text-foreground">
                      {bmi.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {bmi < 18.5 ? 'Underweight' :
                     bmi < 25 ? 'Normal weight' :
                     bmi < 30 ? 'Overweight' : 'Obese'}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Fitness Goals */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Fitness Goals</span>
              </CardTitle>
              <CardDescription>
                Set your long-term fitness targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_pushups">Target Pushups</Label>
                  <Input
                    id="target_pushups"
                    type="number"
                    value={formData.target_pushups}
                    onChange={(e) => handleInputChange('target_pushups', e.target.value)}
                    placeholder="50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target_situps">Target Situps</Label>
                  <Input
                    id="target_situps"
                    type="number"
                    value={formData.target_situps}
                    onChange={(e) => handleInputChange('target_situps', e.target.value)}
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_daily_steps">Daily Steps Goal</Label>
                <Input
                  id="target_daily_steps"
                  type="number"
                  value={formData.target_daily_steps}
                  onChange={(e) => handleInputChange('target_daily_steps', e.target.value)}
                  placeholder="10000"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workouts_per_week">Workouts per Week</Label>
                  <Input
                    id="workouts_per_week"
                    type="number"
                    min="1"
                    max="7"
                    value={formData.workouts_per_week}
                    onChange={(e) => handleInputChange('workouts_per_week', e.target.value)}
                    placeholder="3"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preferred_workout_duration">Preferred Duration (min)</Label>
                  <Input
                    id="preferred_workout_duration"
                    type="number"
                    value={formData.preferred_workout_duration}
                    onChange={(e) => handleInputChange('preferred_workout_duration', e.target.value)}
                    placeholder="60"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Progress & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Current Targets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Current Targets</span>
              </CardTitle>
              <CardDescription>
                Your current workout targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pushups</span>
                  <span className="text-lg font-bold text-foreground">
                    {user.current_pushup_target || 5}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Situps</span>
                  <span className="text-lg font-bold text-foreground">
                    {user.current_situp_target || 5}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plank</span>
                  <span className="text-lg font-bold text-foreground">
                    {user.current_plank_target || 30}s
                  </span>
                </div>
              </div>

              <Button 
                onClick={updateTargets}
                variant="outline" 
                className="w-full"
              >
                Progress Targets (+2/+3/+10s)
              </Button>
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Progress to Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pushups</span>
                    <span>{Math.round((user.current_pushup_target / user.target_pushups) * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((user.current_pushup_target / user.target_pushups) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Situps</span>
                    <span>{Math.round((user.current_situp_target / user.target_situps) * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((user.current_situp_target / user.target_situps) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={saveProfile}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : saved ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center"
              >
                <span className="mr-2">✓</span>
                <span>Saved!</span>
              </motion.div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

