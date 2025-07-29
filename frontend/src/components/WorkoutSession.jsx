import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle,
  Timer,
  RotateCcw,
  Plus,
  Minus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { apiService } from '../lib/api_simple'

export default function WorkoutSession({ user }) {
  const [workout, setWorkout] = useState(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTodayWorkout()
  }, [user])

  useEffect(() => {
    let interval = null
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1)
      }, 1000)
    } else if (!isTimerRunning && timer !== 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timer])

  const loadTodayWorkout = async () => {
    try {
      const todayWorkout = await apiService.getTodayWorkout(user.id)
      setWorkout(todayWorkout)
    } catch (error) {
      // No workout for today, generate one
      try {
        const newWorkout = await apiService.generateWorkout(user.id, {
          template: 'Building Strength',
          date: new Date().toISOString().split('T')[0]
        })
        setWorkout(newWorkout)
      } catch (genError) {
        console.error('Failed to generate workout:', genError)
      }
    } finally {
      setLoading(false)
    }
  }

  const startWorkout = async () => {
    if (workout && workout.status === 'planned') {
      try {
        const updatedWorkout = await apiService.startWorkout(workout.id)
        setWorkout(updatedWorkout)
        setIsTimerRunning(true)
      } catch (error) {
        console.error('Failed to start workout:', error)
      }
    }
  }

  const completeExercise = async (exerciseId, reps, duration) => {
    try {
      await apiService.updateWorkoutExercise(exerciseId, {
        completed_reps: reps,
        completed_duration: duration,
        completed_sets: 1
      })
      
      // Move to next exercise or rest
      if (currentExerciseIndex < workout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1)
        setIsResting(true)
        setTimer(0)
        setIsTimerRunning(true)
      } else {
        // Workout complete
        await apiService.completeWorkout(workout.id)
        setWorkout(prev => ({ ...prev, status: 'completed' }))
        setIsTimerRunning(false)
      }
    } catch (error) {
      console.error('Failed to complete exercise:', error)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your workout...</p>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">No Workout Available</h2>
        <p className="text-muted-foreground mb-6">
          Let's create a workout for today!
        </p>
        <Button onClick={loadTodayWorkout}>
          Generate Workout
        </Button>
      </div>
    )
  }

  if (workout.status === 'completed') {
    return (
      <div className="p-6 text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Workout Completed! 🎉
        </h2>
        <p className="text-lg text-muted-foreground mb-6">
          Great job! You've completed today's workout.
        </p>
        <div className="bg-accent rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">Workout Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Exercises</p>
              <p className="font-bold">{workout.exercises?.length || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-bold">{workout.duration_minutes || 0} min</p>
            </div>
          </div>
        </div>
        <Button onClick={() => window.location.href = '/dashboard'}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const currentExercise = workout.exercises?.[currentExerciseIndex]
  const progress = ((currentExerciseIndex + 1) / (workout.exercises?.length || 1)) * 100

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Workout Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-foreground">Today's Workout</h1>
          <Badge variant={workout.status === 'in_progress' ? 'default' : 'outline'}>
            {workout.status.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Exercise {currentExerciseIndex + 1} of {workout.exercises?.length || 0}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {workout.status === 'planned' && (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Ready to start your workout?
            </h2>
            <p className="text-muted-foreground mb-6">
              You have {workout.exercises?.length || 0} exercises planned for today.
            </p>
            <Button onClick={startWorkout} size="lg">
              <Play className="w-5 h-5 mr-2" />
              Start Workout
            </Button>
          </CardContent>
        </Card>
      )}

      {workout.status === 'in_progress' && currentExercise && (
        <div className="space-y-6">
          {/* Timer */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-foreground mb-2">
                {formatTime(timer)}
              </div>
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTimer(0)
                    setIsTimerRunning(false)
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Exercise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>{currentExercise.exercise?.name || 'Exercise'}</span>
                <Badge variant="outline">
                  {currentExercise.exercise?.category?.replace('_', ' ')}
                </Badge>
              </CardTitle>
              <CardDescription>
                {currentExercise.exercise?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Exercise Instructions */}
                {currentExercise.exercise?.instructions && (
                  <div className="bg-accent rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Instructions</h4>
                    <p className="text-sm text-muted-foreground">
                      {currentExercise.exercise.instructions}
                    </p>
                  </div>
                )}

                {/* Exercise Targets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentExercise.target_reps && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Target Reps</p>
                      <p className="text-2xl font-bold text-foreground">
                        {currentExercise.target_reps}
                      </p>
                    </div>
                  )}
                  
                  {currentExercise.target_duration && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Target Duration</p>
                      <p className="text-2xl font-bold text-foreground">
                        {currentExercise.target_duration}s
                      </p>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Sets</p>
                    <p className="text-2xl font-bold text-foreground">
                      {currentExercise.target_sets || 1}
                    </p>
                  </div>
                </div>

                {/* Quick Complete Buttons */}
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => completeExercise(
                      currentExercise.id,
                      currentExercise.target_reps,
                      currentExercise.target_duration
                    )}
                    size="lg"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Complete Exercise
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentExerciseIndex < workout.exercises.length - 1) {
                        setCurrentExerciseIndex(currentExerciseIndex + 1)
                      }
                    }}
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Skip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exercise List */}
          <Card>
            <CardHeader>
              <CardTitle>Exercise List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workout.exercises?.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      index === currentExerciseIndex
                        ? 'bg-primary text-primary-foreground'
                        : index < currentExerciseIndex
                        ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === currentExerciseIndex
                          ? 'bg-primary-foreground text-primary'
                          : index < currentExerciseIndex
                          ? 'bg-green-500 text-white'
                          : 'bg-background text-foreground'
                      }`}>
                        {index < currentExerciseIndex ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="font-medium">
                        {exercise.exercise?.name || 'Exercise'}
                      </span>
                    </div>
                    <div className="text-sm">
                      {exercise.target_reps && `${exercise.target_reps} reps`}
                      {exercise.target_duration && `${exercise.target_duration}s`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

