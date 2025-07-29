import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight, 
  ChevronLeft, 
  Target, 
  Activity, 
  Timer,
  CheckCircle,
  User,
  Scale,
  Ruler
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService, fitnessCalculations } from '../lib/api_simple'

export default function Onboarding({ user, setUser }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    age: user.age || 55,
    weight: user.weight || 225,
    height: user.height || 70.5,
    maxPushups: '',
    maxSitups: '',
    plankDuration: '',
    targetPushups: 50,
    targetSitups: 50,
    targetSteps: 10000,
    workoutsPerWeek: 3
  })
  const [loading, setLoading] = useState(false)

  const steps = [
    {
      title: 'Welcome to FitTracker!',
      description: 'Let\'s set up your personalized fitness journey',
      icon: User
    },
    {
      title: 'Personal Information',
      description: 'Tell us about yourself',
      icon: User
    },
    {
      title: 'Fitness Assessment',
      description: 'Let\'s test your current fitness level',
      icon: Activity
    },
    {
      title: 'Set Your Goals',
      description: 'What do you want to achieve?',
      icon: Target
    },
    {
      title: 'You\'re All Set!',
      description: 'Ready to start your fitness journey',
      icon: CheckCircle
    }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = async () => {
    setLoading(true)
    try {
      // Update user profile
      await apiService.updateUser(user.id, {
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        target_pushups: parseInt(formData.targetPushups),
        target_situps: parseInt(formData.targetSitups),
        target_daily_steps: parseInt(formData.targetSteps),
        workouts_per_week: parseInt(formData.workoutsPerWeek)
      })

      // Complete fitness assessment
      const assessmentData = {
        max_pushups: parseInt(formData.maxPushups),
        max_situps: parseInt(formData.maxSitups),
        plank_duration: parseInt(formData.plankDuration)
      }

      const updatedUser = await apiService.completeFitnessAssessment(user.id, assessmentData)
      
      // Seed exercises and achievements
      try {
        await apiService.seedExercises()
        await apiService.seedAchievements()
      } catch (error) {
        console.log('Exercises and achievements may already be seeded')
      }

      setUser(updatedUser)
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      // For demo purposes, update user locally
      setUser({
        ...user,
        ...formData,
        onboarding_completed: true,
        current_pushup_target: Math.max(1, Math.floor(formData.maxPushups * 0.4)),
        current_situp_target: Math.max(1, Math.floor(formData.maxSitups * 0.3)),
        current_plank_target: Math.max(15, Math.floor(formData.plankDuration * 0.5))
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto"
            >
              <Activity className="w-12 h-12 text-primary-foreground" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Welcome to Your Fitness Journey!
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                We'll help you build to 50 pushups, 50 situps, and walk 10,000 steps daily. 
                Let's start with a quick setup to personalize your experience.
              </p>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Personal Information</h2>
              <p className="text-muted-foreground">Help us customize your fitness plan</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Age</span>
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="55"
                  className="text-lg"
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
                  className="text-lg"
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
                  className="text-lg"
                />
              </div>
            </div>

            {formData.weight && formData.height && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-accent rounded-lg p-4 text-center"
              >
                <p className="text-sm text-muted-foreground">Your BMI</p>
                <p className="text-2xl font-bold text-foreground">
                  {fitnessCalculations.calculateBMI(formData.weight, formData.height).toFixed(1)}
                </p>
              </motion.div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Fitness Assessment</h2>
              <p className="text-muted-foreground">
                Let's test your current fitness level. Do your best and don't worry about the numbers!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Pushups</span>
                  </CardTitle>
                  <CardDescription>Maximum pushups in a row</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="number"
                    value={formData.maxPushups}
                    onChange={(e) => handleInputChange('maxPushups', e.target.value)}
                    placeholder="0"
                    className="text-center text-2xl h-16"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Situps</span>
                  </CardTitle>
                  <CardDescription>Maximum situps in a row</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="number"
                    value={formData.maxSitups}
                    onChange={(e) => handleInputChange('maxSitups', e.target.value)}
                    placeholder="0"
                    className="text-center text-2xl h-16"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center space-x-2">
                    <Timer className="w-5 h-5" />
                    <span>Plank</span>
                  </CardTitle>
                  <CardDescription>Maximum plank hold (seconds)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="number"
                    value={formData.plankDuration}
                    onChange={(e) => handleInputChange('plankDuration', e.target.value)}
                    placeholder="0"
                    className="text-center text-2xl h-16"
                  />
                </CardContent>
              </Card>
            </div>

            {formData.maxPushups && formData.maxSitups && formData.plankDuration && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4">Your Starting Targets</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {Math.max(1, Math.floor(formData.maxPushups * 0.4))}
                    </p>
                    <p className="text-sm text-muted-foreground">Pushups</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {Math.max(1, Math.floor(formData.maxSitups * 0.3))}
                    </p>
                    <p className="text-sm text-muted-foreground">Situps</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {Math.max(15, Math.floor(formData.plankDuration * 0.5))}s
                    </p>
                    <p className="text-sm text-muted-foreground">Plank</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Set Your Goals</h2>
              <p className="text-muted-foreground">
                These are your long-term targets. We'll help you get there step by step!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Strength Goals</CardTitle>
                  <CardDescription>Your target repetitions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetPushups">Target Pushups</Label>
                    <Input
                      id="targetPushups"
                      type="number"
                      value={formData.targetPushups}
                      onChange={(e) => handleInputChange('targetPushups', e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetSitups">Target Situps</Label>
                    <Input
                      id="targetSitups"
                      type="number"
                      value={formData.targetSitups}
                      onChange={(e) => handleInputChange('targetSitups', e.target.value)}
                      className="text-lg"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Goals</CardTitle>
                  <CardDescription>Your daily and weekly targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetSteps">Daily Steps</Label>
                    <Input
                      id="targetSteps"
                      type="number"
                      value={formData.targetSteps}
                      onChange={(e) => handleInputChange('targetSteps', e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workoutsPerWeek">Workouts per Week</Label>
                    <Input
                      id="workoutsPerWeek"
                      type="number"
                      min="1"
                      max="7"
                      value={formData.workoutsPerWeek}
                      onChange={(e) => handleInputChange('workoutsPerWeek', e.target.value)}
                      className="text-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                You're All Set!
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto mb-6">
                Your personalized fitness plan is ready. Let's start building those healthy habits!
              </p>
              
              <div className="bg-accent rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold text-foreground mb-4">Your Journey Starts With:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Starting Pushups:</span>
                    <span className="font-bold">{Math.max(1, Math.floor(formData.maxPushups * 0.4))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Starting Situps:</span>
                    <span className="font-bold">{Math.max(1, Math.floor(formData.maxSitups * 0.3))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Qigong:</span>
                    <span className="font-bold">5-10 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Walking Goal:</span>
                    <span className="font-bold">{formData.targetSteps.toLocaleString()} steps</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </h1>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className="min-h-[500px]">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={completeOnboarding}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{loading ? 'Setting up...' : 'Start My Journey'}</span>
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={
                (currentStep === 1 && (!formData.age || !formData.weight || !formData.height)) ||
                (currentStep === 2 && (!formData.maxPushups || !formData.maxSitups || !formData.plankDuration))
              }
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

