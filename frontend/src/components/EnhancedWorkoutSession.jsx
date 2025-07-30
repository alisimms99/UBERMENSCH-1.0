import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../lib/api_simple';
import VideoPlayer from './VideoPlayer';
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  Circle, 
  Clock, 
  SkipForward, 
  Plus, 
  Minus,
  Timer,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { WorkoutExerciseImage } from './ExerciseImage';

const EnhancedWorkoutSession = ({ template, user, onComplete, onCancel }) => {
  const { templateId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const [sessionPhaseIndex, setSessionPhaseIndex] = useState(0);
  const [sessionExerciseIndex, setSessionExerciseIndex] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [energyBefore, setEnergyBefore] = useState(3);
  const [energyAfter, setEnergyAfter] = useState(3);
  const [difficultyRating, setDifficultyRating] = useState(3);
  
  // Timer states
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTarget, setTimerTarget] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    initializeExercises();
    setSessionStartTime(new Date());
  }, [template, user]);
  
  useEffect(() => {
    setSessionLoading(true);
    apiService.getWorkoutSession(templateId)
      .then(data => setSessionData(data))
      .catch(err => setSessionError(err.message || 'Failed to load session'))
      .finally(() => setSessionLoading(false));
  }, [templateId]);

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      // Timer completed - could add sound notification here
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timerActive, timerSeconds]);

  const initializeExercises = () => {
    if (!template?.exercises) return;

    const initializedExercises = template.exercises.map((templateExercise, index) => {
      const targets = calculateTargets(templateExercise, user);
      
      return {
        id: index,
        name: templateExercise.exercise.name,
        icon: templateExercise.exercise.icon_name,
        category: templateExercise.exercise.category,
        instructions: templateExercise.exercise.instructions,
        notes: templateExercise.notes || '',
        
        // Target values
        targetSets: templateExercise.target_sets || 1,
        targetReps: targets.reps,
        targetDuration: targets.duration,
        restSeconds: templateExercise.rest_seconds || 60,
        
        // Actual performance tracking
        actualSets: 0,
        actualReps: targets.reps || 0,
        actualDuration: targets.duration || 0,
        completed: false,
        skipped: false,
        skipReason: '',
        exerciseNotes: '',
        
        // UI states
        isEditing: false,
        showDetails: false
      };
    });

    setExercises(initializedExercises);
  };

  const calculateTargets = (exercise, user) => {
    const intensity = exercise.intensity_modifier || 1.0;
    
    if (exercise.target_reps) {
      return { reps: exercise.target_reps };
    }
    
    if (exercise.target_duration) {
      return { duration: exercise.target_duration };
    }
    
    // Calculate based on user's current targets
    if (exercise.exercise.name === 'Pushups') {
      return { reps: Math.max(1, Math.round((user?.current_pushups || 1) * intensity)) };
    }
    
    if (exercise.exercise.name === 'Situps') {
      return { reps: Math.max(1, Math.round((user?.current_situps || 1) * intensity)) };
    }
    
    if (exercise.exercise.name === 'Plank') {
      return { duration: Math.max(10, Math.round((user?.current_plank_duration || 10) * intensity)) };
    }
    
    return { reps: exercise.target_reps || 10 };
  };

  const updateExercise = (exerciseId, updates) => {
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    ));
  };

  const toggleExerciseComplete = (exerciseId) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    updateExercise(exerciseId, {
      completed: !exercise.completed,
      skipped: false,
      skipReason: ''
    });
  };

  const skipExercise = (exerciseId, reason = '') => {
    updateExercise(exerciseId, {
      skipped: true,
      completed: false,
      skipReason: reason
    });
  };

  const startTimer = (seconds) => {
    setTimerSeconds(seconds);
    setTimerTarget(seconds);
    setTimerActive(true);
  };

  const pauseTimer = () => {
    setTimerActive(false);
  };

  const stopTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
    setTimerTarget(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCompletionPercentage = () => {
    const completedCount = exercises.filter(ex => ex.completed || ex.skipped).length;
    return exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;
  };

  const getTotalDuration = () => {
    if (!sessionStartTime) return 0;
    return Math.floor((new Date() - sessionStartTime) / 1000 / 60); // minutes
  };

  const handleCompleteWorkout = () => {
    const workoutData = {
      template_id: template.id,
      workout_date: new Date().toISOString().split('T')[0],
      planned_duration: template.duration_min,
      actual_duration: getTotalDuration(),
      completion_percentage: getCompletionPercentage(),
      notes: sessionNotes,
      difficulty_rating: difficultyRating,
      energy_level_before: energyBefore,
      energy_level_after: energyAfter,
      exercises: exercises.map(ex => ({
        exercise_id: ex.id,
        planned_sets: ex.targetSets,
        actual_sets: ex.actualSets,
        planned_reps: ex.targetReps,
        actual_reps: ex.actualReps,
        planned_duration: ex.targetDuration,
        actual_duration: ex.actualDuration,
        status: ex.completed ? 'completed' : ex.skipped ? 'skipped' : 'planned',
        notes: ex.exerciseNotes,
        skipped_reason: ex.skipReason
      }))
    };

    onComplete(workoutData);
  };

  const currentExercise = exercises[sessionExerciseIndex];
  // Determine active session exercise with session data
  const activeExercise = sessionData?.phases?.[sessionPhaseIndex]?.exercises?.[sessionExerciseIndex];
  const completionPercentage = getCompletionPercentage();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {sessionLoading ? (
        <p>Loading workout session...</p>
      ) : sessionError ? (
        <p className="text-red-500">{sessionError}</p>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-2">{sessionData?.name}</h1>
          <p className="text-sm text-muted-foreground mb-4">{sessionData?.description}</p>
          {activeExercise?.video_id && (
            <div className="mb-6">
              <VideoPlayer
                video={{ id: activeExercise.video_id }}
                exerciseContext={activeExercise}
                autoPlay={false}
                showControls={true}
                className="w-full h-auto"
              />
            </div>
          )}
          {sessionData?.phases?.map((phase, pIdx) => (
            <div key={pIdx} className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{phase.name}</h2>
              {phase.exercises.map(ex => (
                <div key={ex.id} className="flex items-start space-x-4 mb-4">
                  <WorkoutExerciseImage exercise={ex} className="w-16 h-16" />
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2 mb-1">
                      <input type="checkbox" />
                      <span className="font-medium">{ex.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ex.reps ? `${ex.reps} reps` : ''}{ex.duration_seconds ? ` ${ex.duration_seconds}s` : ''}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <button className="px-2 py-1 bg-gray-200 rounded">Skip</button>
                      <button className="px-2 py-1 bg-blue-200 rounded">Add Extra Set</button>
                    </div>
                    <textarea placeholder="Notes..." className="w-full mt-2 p-2 border rounded h-16" />
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setSessionExerciseIndex(i => Math.max(0, i - 1))}
              disabled={sessionExerciseIndex === 0}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous Exercise
            </button>
            <button
              onClick={() => setSessionExerciseIndex(i => Math.min(
                sessionData?.phases?.[sessionPhaseIndex]?.exercises?.length - 1 || 0, i + 1
              ))}
              disabled={sessionExerciseIndex >= sessionData?.phases?.[sessionPhaseIndex]?.exercises?.length - 1 || false}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next Exercise
            </button>
          </div>
        </>
      )}
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{sessionData?.name}</h2>
            <p className="text-gray-600">{sessionData?.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Duration</div>
            <div className="text-lg font-bold text-gray-800">{getTotalDuration()} min</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(completionPercentage)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Timer Display */}
        {(timerActive || timerSeconds > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Timer</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-blue-800">
                  {formatTime(timerSeconds)}
                </div>
                <div className="flex gap-2">
                  {timerActive ? (
                    <button
                      onClick={pauseTimer}
                      className="p-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setTimerActive(true)}
                      className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={stopTimer}
                    className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            {timerTarget > 0 && (
              <div className="mt-2">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((timerTarget - timerSeconds) / timerTarget) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exercise List */}
      <div className="space-y-4 mb-6">
        {exercises.map((exercise, index) => (
          <div 
            key={exercise.id} 
            className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${
              exercise.completed ? 'border-green-500 bg-green-50' :
              exercise.skipped ? 'border-yellow-500 bg-yellow-50' :
              index === sessionExerciseIndex ? 'border-blue-500' :
              'border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Exercise Image */}
              <div className="flex-shrink-0">
                <WorkoutExerciseImage 
                  exercise={exercise} 
                  className="border-2 border-gray-200"
                />
              </div>

              {/* Completion Checkbox */}
              <button
                onClick={() => toggleExerciseComplete(exercise.id)}
                className="mt-1 flex-shrink-0"
              >
                {exercise.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                )}
              </button>

              {/* Exercise Content */}
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{exercise.name}</h3>
                  <div className="flex items-center gap-2">
                    {exercise.targetDuration && (
                      <button
                        onClick={() => startTimer(exercise.targetDuration)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                      >
                        <Clock className="w-4 h-4" />
                        Start Timer
                      </button>
                    )}
                    <button
                      onClick={() => updateExercise(exercise.id, { showDetails: !exercise.showDetails })}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {exercise.showDetails ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Exercise Targets */}
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                  {exercise.targetSets > 1 && (
                    <span>{exercise.targetSets} sets</span>
                  )}
                  {exercise.targetReps && (
                    <span>{exercise.targetReps} reps</span>
                  )}
                  {exercise.targetDuration && (
                    <span>{formatTime(exercise.targetDuration)}</span>
                  )}
                  {exercise.restSeconds && exercise.targetSets > 1 && (
                    <span>{exercise.restSeconds}s rest</span>
                  )}
                </div>

                {/* Exercise Notes */}
                {exercise.notes && (
                  <p className="text-sm text-gray-600 italic mb-3">{exercise.notes}</p>
                )}

                {/* Expanded Details */}
                {exercise.showDetails && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    {/* Instructions */}
                    {exercise.instructions && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Instructions</h4>
                        <p className="text-sm text-gray-600">{exercise.instructions}</p>
                      </div>
                    )}

                    {/* Performance Tracking */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {exercise.targetSets > 1 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sets Completed
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateExercise(exercise.id, { 
                                actualSets: Math.max(0, exercise.actualSets - 1) 
                              })}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 bg-gray-100 rounded text-center min-w-[3rem]">
                              {exercise.actualSets}
                            </span>
                            <button
                              onClick={() => updateExercise(exercise.id, { 
                                actualSets: Math.min(exercise.targetSets + 2, exercise.actualSets + 1) 
                              })}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {exercise.targetReps && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reps Completed
                          </label>
                          <input
                            type="number"
                            value={exercise.actualReps}
                            onChange={(e) => updateExercise(exercise.id, { 
                              actualReps: Math.max(0, parseInt(e.target.value) || 0) 
                            })}
                            className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {exercise.targetDuration && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (seconds)
                          </label>
                          <input
                            type="number"
                            value={exercise.actualDuration}
                            onChange={(e) => updateExercise(exercise.id, { 
                              actualDuration: Math.max(0, parseInt(e.target.value) || 0) 
                            })}
                            className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Exercise Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={exercise.exerciseNotes}
                        onChange={(e) => updateExercise(exercise.id, { exerciseNotes: e.target.value })}
                        placeholder="Add notes about this exercise..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>

                    {/* Skip Options */}
                    {!exercise.completed && !exercise.skipped && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => skipExercise(exercise.id, 'injury')}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 text-sm"
                        >
                          Skip (Injury)
                        </button>
                        <button
                          onClick={() => skipExercise(exercise.id, 'fatigue')}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 text-sm"
                        >
                          Skip (Fatigue)
                        </button>
                        <button
                          onClick={() => skipExercise(exercise.id, 'time')}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 text-sm"
                        >
                          Skip (Time)
                        </button>
                      </div>
                    )}

                    {exercise.skipped && (
                      <div className="flex items-center gap-2 text-yellow-700">
                        <SkipForward className="w-4 h-4" />
                        <span className="text-sm">Skipped: {exercise.skipReason}</span>
                        <button
                          onClick={() => updateExercise(exercise.id, { skipped: false, skipReason: '' })}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Undo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session Feedback */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Session Feedback</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Energy Before (1-5)
            </label>
            <select
              value={energyBefore}
              onChange={(e) => setEnergyBefore(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Energy After (1-5)
            </label>
            <select
              value={energyAfter}
              onChange={(e) => setEnergyAfter(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty (1-5)
            </label>
            <select
              value={difficultyRating}
              onChange={(e) => setDifficultyRating(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Notes
          </label>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="How did the workout feel? Any observations or modifications?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCompleteWorkout}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          <CheckCircle className="w-4 h-4" />
          Complete Workout
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EnhancedWorkoutSession;

