import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Clock, 
  Zap, 
  Target,
  Play,
  RotateCcw,
  Save,
  CheckCircle,
  AlertCircle,
  Video
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiService } from '../lib/api_simple'

export default function AITrainer({ user }) {
  const [generating, setGenerating] = useState(false)
  const [workout, setWorkout] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [error, setError] = useState(null)
  const [aiAvailable, setAiAvailable] = useState(true)
  
  // Form state
  const [timeAvailable, setTimeAvailable] = useState(30)
  const [energyLevel, setEnergyLevel] = useState(3)
  const [focus, setFocus] = useState('')

  useEffect(() => {
    checkAIAvailability()
  }, [])

  const checkAIAvailability = async () => {
    try {
      const response = await apiService.request('/trainer/check-availability', { method: 'GET' })
      setAiAvailable(response.available)
    } catch (error) {
      console.error('Failed to check AI availability:', error)
      setAiAvailable(false)
    }
  }

  const generateWorkout = async () => {
    setGenerating(true)
    setError(null)
    
    try {
      const response = await apiService.request('/trainer/generate-workout', {
        method: 'POST',
        body: {
          user_id: user.id,
          time_available: timeAvailable,
          energy_level: energyLevel,
          focus: focus || null
        }
      })
      
      if (response.success) {
        setWorkout(response.workout)
        setSessionId(response.session_id)
      } else {
        setError(response.error || 'Failed to generate workout')
      }
    } catch (error) {
      console.error('Failed to generate workout:', error)
      setError('Failed to generate workout. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const regenerateWorkout = () => {
    setWorkout(null)
    setSessionId(null)
    generateWorkout()
  }

  if (!aiAvailable) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <span>AI Trainer Unavailable</span>
            </CardTitle>
            <CardDescription>
              The AI trainer requires an OpenAI API key to function.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please configure the OPENAI_API_KEY environment variable to use the AI trainer feature.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/workouts'}>
              Create Manual Workout
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <span>AI Workout Generator</span>
        </h1>
        <p className="text-muted-foreground">
          Get a personalized workout tailored to your equipment, energy level, and goals
        </p>
      </div>

      {/* Generation Form */}
      {!workout && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Generate Your Workout</CardTitle>
              <CardDescription>
                Tell us about your current state and we'll create the perfect workout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Time Available */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Time Available</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map(time => (
                    <Button
                      key={time}
                      variant={timeAvailable === time ? 'default' : 'outline'}
                      onClick={() => setTimeAvailable(time)}
                    >
                      {time} min
                    </Button>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Energy Level: {energyLevel}/5</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <Button
                      key={level}
                      variant={energyLevel === level ? 'default' : 'outline'}
                      onClick={() => setEnergyLevel(level)}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  1 = Low energy, 5 = High energy
                </p>
              </div>

              {/* Focus */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Focus (Optional)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {['', 'cardio', 'strength', 'flexibility', 'recovery'].map(f => (
                    <Button
                      key={f}
                      variant={focus === f ? 'default' : 'outline'}
                      onClick={() => setFocus(f)}
                    >
                      {f || 'Surprise Me'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={generateWorkout}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Generating Your Workout...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Workout
                  </>
                )}
              </Button>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Generated Workout Display */}
      {workout && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Workout Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{workout.name}</CardTitle>
                  <CardDescription className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {workout.estimated_duration} min
                    </span>
                    <Badge variant="secondary">{focus || 'Balanced'}</Badge>
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={regenerateWorkout}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                  <Button variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Warmup */}
          {workout.warmup && workout.warmup.length > 0 && (
            <WorkoutSection title="Warmup" exercises={workout.warmup} />
          )}

          {/* Main Workout */}
          {workout.main && workout.main.length > 0 && (
            <WorkoutSection title="Main Workout" exercises={workout.main} />
          )}

          {/* Cooldown */}
          {workout.cooldown && workout.cooldown.length > 0 && (
            <WorkoutSection title="Cooldown" exercises={workout.cooldown} />
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button size="lg" className="flex-1">
              <Play className="mr-2 h-5 w-5" />
              Start Workout
            </Button>
            <Button variant="outline" onClick={() => setWorkout(null)}>
              Generate New
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function WorkoutSection({ title, exercises }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {exercises.map((exercise, index) => (
          <ExerciseCard key={index} exercise={exercise} index={index} />
        ))}
      </CardContent>
    </Card>
  )
}

function ExerciseCard({ exercise, index }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-lg">
            {index + 1}. {exercise.name}
          </h4>
          
          {/* Sets/Reps or Duration */}
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
            {exercise.sets && (
              <span className="flex items-center">
                <strong className="mr-1">Sets:</strong> {exercise.sets}
              </span>
            )}
            {exercise.reps && (
              <span className="flex items-center">
                <strong className="mr-1">Reps:</strong> {exercise.reps}
              </span>
            )}
            {exercise.duration_seconds && (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {Math.floor(exercise.duration_seconds / 60)}:{String(exercise.duration_seconds % 60).padStart(2, '0')}
              </span>
            )}
            {exercise.rest_seconds && (
              <span className="flex items-center">
                <strong className="mr-1">Rest:</strong> {exercise.rest_seconds}s
              </span>
            )}
          </div>

          {/* Notes */}
          {exercise.notes && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              {exercise.notes}
            </p>
          )}
        </div>
      </div>

      {/* Linked Videos */}
      {exercise.videos && exercise.videos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Instructional Videos:</p>
          <div className="grid grid-cols-1 gap-2">
            {exercise.videos.map((video, vidIndex) => (
              <button
                key={vidIndex}
                className="flex items-center space-x-2 p-2 rounded border hover:bg-accent transition-colors text-left"
                onClick={() => {
                  // TODO: Open video player
                  // Video playback integration pending
                }}
              >
                <Video className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{video.filename}</p>
                  <p className="text-xs text-muted-foreground">{video.category}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(video.match_score * 100)}%
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
