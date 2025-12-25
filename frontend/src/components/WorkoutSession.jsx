import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, SkipForward, CheckCircle, Clock } from 'lucide-react'
import { apiService } from '../lib/api'

export default function WorkoutSession({ user }) {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [timer, setTimer] = useState(0)
  // Video player state
  const videoRef = useRef(null)

  useEffect(() => {
    loadTemplate()
  }, [templateId])

  useEffect(() => {
    let interval = null
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((timer) => timer - 1)
      }, 1000)
    } else if (timer === 0 && isActive) {
      setIsActive(false)
      // Play sound?
    }
    return () => clearInterval(interval)
  }, [isActive, timer])

  const loadTemplate = async () => {
    try {
      const data = await apiService.getWorkoutTemplate(templateId)
      setTemplate(data)
      // Initialize timer for first exercise if timed
      if (data.exercises[0]?.exercise?.is_timed) {
        setTimer(data.exercises[0].target_duration_seconds)
      }
    } catch (error) {
      console.error("Failed to load session:", error)
    }
  }

  const handleNext = () => {
    if (currentIndex < template.exercises.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      const nextEx = template.exercises[nextIndex]

      setIsActive(false)
      if (nextEx.exercise.is_timed) {
        setTimer(nextEx.target_duration_seconds)
      } else {
        setTimer(0)
      }
    } else {
      // Complete workout
      handleComplete()
    }
  }

  const handleComplete = async () => {
    // Log completion logic here
    alert("Workout Completed!")
    navigate('/dashboard')
  }

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  if (!template) return <div className="p-6">Loading session...</div>

  const currentItem = template.exercises[currentIndex]
  const progress = ((currentIndex) / template.exercises.length) * 100

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{template.name}</h2>
          <div className="text-muted-foreground capitalize">{currentItem.phase} Loop</div>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {currentIndex + 1} / {template.exercises.length}
        </Badge>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="w-full h-2 mb-6" />

      {/* Main Content */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Video / Instruction */}
        <Card className="flex flex-col overflow-hidden">
          {/* Placeholder for video player - Sprint 2 integration */}
          <div className="aspect-video bg-black flex items-center justify-center text-white">
            <Play className="w-12 h-12 opacity-50" />
            {/* <video ref={videoRef} src={`/api/videos/stream/...`} controls className="w-full h-full" /> */}
          </div>
          <CardContent className="p-6 flex-grow">
            <h1 className="text-3xl font-bold mb-2">{currentItem.exercise.name}</h1>
            <p className="text-lg text-muted-foreground mb-4">{currentItem.exercise.instructions}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Target</div>
                <div className="text-2xl font-bold">
                  {currentItem.exercise.is_timed
                    ? `${currentItem.target_duration_seconds}s`
                    : `${currentItem.target_reps} reps`}
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
        <Card className="flex flex-col justify-center p-8 text-center space-y-8">
          {currentItem.exercise.is_timed ? (
            <div className="space-y-4">
              <div className="text-8xl font-mono font-bold tabular-nums">
                {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
              </div>
              <Button size="xl" className="w-48 h-16 text-xl rounded-full" onClick={toggleTimer}>
                {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                {isActive ? "Pause" : "Start"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xl text-muted-foreground">Complete {currentItem.target_sets} sets of {currentItem.target_reps} reps</div>
              <Button size="xl" className="w-48 h-16 text-xl rounded-full" onClick={handleNext}>
                <CheckCircle className="mr-2" /> Done
              </Button>
            </div>
          )}

          {currentItem.exercise.is_timed && (
            <Button variant="ghost" size="lg" onClick={handleNext} className="w-full">
              <SkipForward className="mr-2" /> Skip Exercise
            </Button>
          )}
        </Card>
      </div>
    </div>
  )
}
