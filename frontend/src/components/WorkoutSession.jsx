import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Input from '@/components/ui/input'
import { Play, Pause, SkipForward, CheckCircle, Clock, ArrowLeft, X, LogOut } from 'lucide-react'
import { apiService } from '../lib/api'
import VideoPlayer from './VideoPlayer'

export default function WorkoutSession({ user }) {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [prepCountdown, setPrepCountdown] = useState(null) // null = not started, number = countdown value
  const [showManualTimeInput, setShowManualTimeInput] = useState(false)
  const [manualTimeSeconds, setManualTimeSeconds] = useState('')
  const [currentVideo, setCurrentVideo] = useState(null)
  const [exerciseVideos, setExerciseVideos] = useState({}) // Cache videos by exercise_id
  const [showEndWorkoutConfirm, setShowEndWorkoutConfirm] = useState(false)

  useEffect(() => {
    loadTemplate()
  }, [templateId])

  // Timer countdown effect
  useEffect(() => {
    let interval = null
    
    // Prep countdown
    if (prepCountdown !== null && prepCountdown > 0) {
      interval = setInterval(() => {
        setPrepCountdown((prev) => {
          if (prev <= 1) {
            // Prep done, start main timer
            setTimerRunning(true)
            setIsActive(true)
            return null
          }
          return prev - 1
        })
      }, 1000)
    }
    // Main timer
    else if (timerRunning && isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((timer) => {
          if (timer <= 1) {
            setTimerRunning(false)
            setIsActive(false)
            // Play completion sound/notification
            return 0
          }
          return timer - 1
        })
      }, 1000)
    } else if (timer === 0 && isActive && timerRunning) {
      setTimerRunning(false)
      setIsActive(false)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timer, timerRunning, prepCountdown])

  // Load video for current exercise
  useEffect(() => {
    if (template && currentIndex < template.exercises.length) {
      const exercise = template.exercises[currentIndex]
      loadExerciseVideo(exercise.exercise?.id)
    }
  }, [template, currentIndex])

  const loadTemplate = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Loading template with ID:', templateId)
      const data = await apiService.getWorkoutTemplate(templateId)
      console.log('Template loaded:', data)
      
      if (!data) {
        throw new Error('Template data is empty')
      }
      
      if (!data.exercises || !Array.isArray(data.exercises) || data.exercises.length === 0) {
        throw new Error('Template has no exercises')
      }
      
      setTemplate(data)
      // Initialize timer for first exercise if timed
      if (data.exercises[0]?.exercise?.is_timed) {
        setTimer(data.exercises[0].target_duration_seconds || 0)
      }
    } catch (error) {
      console.error("Failed to load session:", error)
      setError(error.message || 'Failed to load workout template')
    } finally {
      setLoading(false)
    }
  }

  const loadExerciseVideo = async (exerciseId) => {
    if (!exerciseId) {
      setCurrentVideo(null)
      return
    }

    // Check cache first
    if (exerciseVideos[exerciseId]) {
      setCurrentVideo(exerciseVideos[exerciseId])
      return
    }

    try {
      const response = await fetch(`http://localhost:5180/api/videos/exercise/${exerciseId}/videos`)
      if (response.ok) {
        const data = await response.json()
        // Get primary video or first video
        const primaryVideo = data.videos?.find(v => v.is_primary) || data.videos?.[0]
        if (primaryVideo?.video) {
          setCurrentVideo(primaryVideo.video)
          setExerciseVideos(prev => ({ ...prev, [exerciseId]: primaryVideo.video }))
        } else {
          setCurrentVideo(null)
        }
      } else {
        setCurrentVideo(null)
      }
    } catch (error) {
      console.error('Failed to load exercise video:', error)
      setCurrentVideo(null)
    }
  }

  const handleNext = () => {
    if (currentIndex < template.exercises.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      const nextEx = template.exercises[nextIndex]

      // Reset timer states
      setIsActive(false)
      setTimerRunning(false)
      setPrepCountdown(null)
      setShowManualTimeInput(false)
      
      if (nextEx.exercise?.is_timed) {
        setTimer(nextEx.target_duration_seconds || 0)
      } else {
        setTimer(0)
      }
    } else {
      // Complete workout
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      const prevEx = template.exercises[prevIndex]

      // Reset timer states
      setIsActive(false)
      setTimerRunning(false)
      setPrepCountdown(null)
      setShowManualTimeInput(false)
      
      if (prevEx.exercise?.is_timed) {
        setTimer(prevEx.target_duration_seconds || 0)
      } else {
        setTimer(0)
      }
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  const handleStartTimer = () => {
    if (prepCountdown === null) {
      // Start prep countdown
      setPrepCountdown(5)
    } else {
      // Skip prep, start immediately
      setPrepCountdown(null)
      setTimerRunning(true)
      setIsActive(true)
    }
  }

  const handlePauseTimer = () => {
    setIsActive(false)
    setTimerRunning(false)
  }

  const handleResumeTimer = () => {
    setIsActive(true)
    setTimerRunning(true)
  }

  const handleLogManualTime = () => {
    const seconds = parseInt(manualTimeSeconds)
    if (!isNaN(seconds) && seconds > 0) {
      setTimer(seconds)
      setShowManualTimeInput(false)
      setManualTimeSeconds('')
    }
  }

  const handleEndWorkout = () => {
    setShowEndWorkoutConfirm(true)
  }

  const confirmEndWorkout = () => {
    // Save partial progress here if needed
    navigate('/dashboard')
  }

  const handleComplete = async () => {
    // Log completion logic here
    alert("Workout Completed!")
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground">Loading workout session...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Workout</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/workout')}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Templates
          </button>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No template data available</p>
        <button
          onClick={() => navigate('/workout')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Templates
        </button>
      </div>
    )
  }

  const currentItem = template.exercises[currentIndex]
  const progress = ((currentIndex + 1) / template.exercises.length) * 100
  
  // Get current phase
  const getCurrentPhase = () => {
    if (!currentItem?.phase) return null
    const phase = currentItem.phase.toLowerCase()
    if (phase.includes('warm')) return 'Warmup'
    if (phase.includes('cool')) return 'Cooldown'
    return 'Main'
  }

  const currentPhase = getCurrentPhase()

  if (!currentItem) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Exercise not found</p>
        <button
          onClick={() => navigate('/workout')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Templates
        </button>
      </div>
    )
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      {/* Header with Navigation */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{template.name}</h2>
          <div className="flex items-center gap-3 mt-1">
            {currentPhase && (
              <Badge className="bg-blue-100 text-blue-800">
                {currentPhase}
              </Badge>
            )}
            <span className="text-muted-foreground text-sm">
              Exercise {currentIndex + 1} of {template.exercises.length}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEndWorkout}
            className="text-red-600 hover:text-red-700"
          >
            <LogOut className="w-4 h-4 mr-1" />
            End Workout
          </Button>
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">Progress</span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full h-3" />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>{currentIndex + 1} / {template.exercises.length} exercises</span>
          <span>{template.exercises.length - currentIndex - 1} remaining</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Video / Instruction */}
        <Card className="flex flex-col overflow-hidden">
          {/* Video Player */}
          {currentVideo ? (
            <VideoPlayer
              video={currentVideo}
              autoPlay={false}
              showControls={true}
              exerciseContext={currentItem.exercise}
              className="w-full"
            />
          ) : (
            <div className="aspect-video bg-black flex flex-col items-center justify-center text-white">
              <Play className="w-12 h-12 opacity-50 mb-2" />
              <p className="text-sm opacity-75">No video available</p>
            </div>
          )}
          <CardContent className="p-6 flex-grow">
            <h1 className="text-3xl font-bold mb-2">{currentItem.exercise?.name || 'Exercise'}</h1>
            {currentItem.exercise?.instructions && (
              <p className="text-lg text-muted-foreground mb-4">{currentItem.exercise.instructions}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Target</div>
                <div className="text-2xl font-bold">
                  {currentItem.exercise?.is_timed
                    ? `${formatTime(currentItem.target_duration_seconds || 0)}`
                    : `${currentItem.target_reps || 0} reps`}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Sets</div>
                <div className="text-2xl font-bold">{currentItem.target_sets}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Controls & Timer */}
        <Card className="flex flex-col justify-center p-8 text-center space-y-6">
          {currentItem.exercise?.is_timed ? (
            <div className="space-y-6">
              {/* Prep Countdown */}
              {prepCountdown !== null && prepCountdown > 0 ? (
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-blue-600">Get Ready!</div>
                  <div className="text-9xl font-mono font-bold tabular-nums text-blue-600 animate-pulse">
                    {prepCountdown}
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setPrepCountdown(null)
                      setTimerRunning(true)
                      setIsActive(true)
                    }}
                  >
                    Skip Prep
                  </Button>
                </div>
              ) : timer === 0 && timerRunning === false && prepCountdown === null ? (
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-green-600">Complete!</div>
                  <div className="text-2xl text-muted-foreground">Great job!</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-8xl font-mono font-bold tabular-nums">
                    {formatTime(timer)}
                  </div>
                  <div className="flex gap-3 justify-center">
                    {!isActive ? (
                      <Button
                        size="xl"
                        className="w-48 h-16 text-xl rounded-full"
                        onClick={handleStartTimer}
                      >
                        <Play className="mr-2" /> Start
                      </Button>
                    ) : (
                      <Button
                        size="xl"
                        className="w-48 h-16 text-xl rounded-full"
                        onClick={handlePauseTimer}
                      >
                        <Pause className="mr-2" /> Pause
                      </Button>
                    )}
                  </div>
                  
                  {/* Manual Time Entry */}
                  {showManualTimeInput ? (
                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                      <label className="text-sm font-medium">Enter time (seconds)</label>
                      <Input
                        type="number"
                        value={manualTimeSeconds}
                        onChange={(e) => setManualTimeSeconds(e.target.value)}
                        placeholder="e.g., 30"
                        className="text-center text-xl"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleLogManualTime}
                          className="flex-1"
                        >
                          Log Time
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowManualTimeInput(false)
                            setManualTimeSeconds('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManualTimeInput(true)}
                      className="text-sm"
                    >
                      Log Manual Time
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xl text-muted-foreground">
                Complete {currentItem.target_sets} sets of {currentItem.target_reps} reps
              </div>
              <Button
                size="xl"
                className="w-48 h-16 text-xl rounded-full"
                onClick={handleNext}
              >
                <CheckCircle className="mr-2" /> Done
              </Button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleSkip}
              disabled={currentIndex >= template.exercises.length - 1}
              className="flex-1"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleNext}
              className="flex-1"
            >
              {currentIndex >= template.exercises.length - 1 ? (
                <>
                  Complete Workout
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* End Workout Confirmation Modal */}
      {showEndWorkoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4">End Workout?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to end this workout? Your progress will be saved.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEndWorkoutConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmEndWorkout}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                End Workout
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
