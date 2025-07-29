import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, CheckCircle, Clock, Target, Video, BookOpen, AlertCircle } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

const VideoWorkoutSession = ({ 
  template, 
  onWorkoutComplete, 
  onExerciseComplete,
  userId = 1 
}) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [exerciseResults, setExerciseResults] = useState({});
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [phaseStartTime, setPhaseStartTime] = useState(null);
  const [showVideo, setShowVideo] = useState(true);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [exerciseVideos, setExerciseVideos] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [videoServerAvailable, setVideoServerAvailable] = useState(false);

  const phases = template?.phases ? JSON.parse(template.phases) : [];
  const currentPhase = phases[currentPhaseIndex];
  const currentExercise = currentPhase?.exercises?.[currentExerciseIndex];

  useEffect(() => {
    checkVideoServerStatus();
    if (template) {
      setWorkoutStartTime(new Date());
      setPhaseStartTime(new Date());
      loadExerciseVideos();
    }
  }, [template]);

  useEffect(() => {
    if (currentPhase) {
      setPhaseStartTime(new Date());
    }
  }, [currentPhaseIndex]);

  const checkVideoServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/videos/health');
      const data = await response.json();
      setVideoServerAvailable(data.status === 'healthy');
    } catch (error) {
      console.error('Video server not available:', error);
      setVideoServerAvailable(false);
    }
    setIsLoading(false);
  };

  const loadExerciseVideos = async () => {
    if (!videoServerAvailable) return;

    const videoMap = {};
    
    for (const phase of phases) {
      for (const exercise of phase.exercises || []) {
        if (exercise.primary_videos?.length > 0) {
          try {
            // In a real implementation, you'd search for videos by path
            // For now, we'll create mock video objects
            videoMap[exercise.exercise_id] = exercise.primary_videos.map((path, index) => ({
              id: `${exercise.exercise_id}_${index}`,
              title: `${exercise.name} - Tutorial ${index + 1}`,
              file_path: path,
              duration_formatted: '5:30',
              instructor: 'Master Instructor',
              streaming_url: `http://localhost:5001/api/videos/stream/${exercise.exercise_id}_${index}`
            }));
          } catch (error) {
            console.error(`Error loading videos for exercise ${exercise.exercise_id}:`, error);
          }
        }
      }
    }
    
    setExerciseVideos(videoMap);
  };

  const handleExerciseComplete = (exercise, result = {}) => {
    const exerciseKey = `${currentPhaseIndex}_${currentExerciseIndex}`;
    
    setCompletedExercises(prev => new Set([...prev, exerciseKey]));
    setExerciseResults(prev => ({
      ...prev,
      [exerciseKey]: {
        ...result,
        completedAt: new Date(),
        exercise: exercise
      }
    }));

    if (onExerciseComplete) {
      onExerciseComplete(exercise, result);
    }

    // Auto-advance to next exercise
    setTimeout(() => {
      handleNextExercise();
    }, 1000);
  };

  const handleNextExercise = () => {
    const nextExerciseIndex = currentExerciseIndex + 1;
    
    if (nextExerciseIndex < (currentPhase?.exercises?.length || 0)) {
      setCurrentExerciseIndex(nextExerciseIndex);
      setSelectedVideoIndex(0); // Reset video selection
    } else {
      handleNextPhase();
    }
  };

  const handleNextPhase = () => {
    const nextPhaseIndex = currentPhaseIndex + 1;
    
    if (nextPhaseIndex < phases.length) {
      setCurrentPhaseIndex(nextPhaseIndex);
      setCurrentExerciseIndex(0);
      setSelectedVideoIndex(0);
    } else {
      handleWorkoutComplete();
    }
  };

  const handleWorkoutComplete = () => {
    const workoutData = {
      template_id: template.id,
      user_id: userId,
      completed_at: new Date(),
      duration_minutes: Math.round((new Date() - workoutStartTime) / 60000),
      exercises_completed: completedExercises.size,
      total_exercises: phases.reduce((total, phase) => total + (phase.exercises?.length || 0), 0),
      results: exerciseResults
    };

    if (onWorkoutComplete) {
      onWorkoutComplete(workoutData);
    }
  };

  const getCurrentExerciseVideos = () => {
    return exerciseVideos[currentExercise?.exercise_id] || [];
  };

  const isExerciseCompleted = (phaseIndex, exerciseIndex) => {
    return completedExercises.has(`${phaseIndex}_${exerciseIndex}`);
  };

  const getWorkoutProgress = () => {
    const totalExercises = phases.reduce((total, phase) => total + (phase.exercises?.length || 0), 0);
    return totalExercises > 0 ? (completedExercises.size / totalExercises) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workout session...</p>
        </div>
      </div>
    );
  }

  if (!template || phases.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Workout Template</h2>
          <p className="text-gray-600">Please select a workout template to begin.</p>
        </div>
      </div>
    );
  }

  const currentVideos = getCurrentExerciseVideos();
  const selectedVideo = currentVideos[selectedVideoIndex];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Workout Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{template.name}</h1>
            <p className="text-gray-600">{template.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-2xl font-bold text-blue-600">{Math.round(getWorkoutProgress())}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getWorkoutProgress()}%` }}
          />
        </div>

        {/* Phase Navigation */}
        <div className="flex space-x-2 overflow-x-auto">
          {phases.map((phase, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentPhaseIndex(index);
                setCurrentExerciseIndex(0);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                index === currentPhaseIndex
                  ? 'bg-blue-600 text-white'
                  : index < currentPhaseIndex
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {phase.name} ({phase.duration_minutes}min)
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Player Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Video className="w-5 h-5 mr-2" />
              Exercise Video
            </h2>
            {!videoServerAvailable && (
              <div className="text-sm text-amber-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Video server offline
              </div>
            )}
          </div>

          {videoServerAvailable && selectedVideo ? (
            <div>
              <VideoPlayer
                video={selectedVideo}
                exerciseContext={currentExercise}
                onExerciseComplete={(exercise) => handleExerciseComplete(exercise)}
                className="h-64 mb-4"
                showControls={true}
              />

              {/* Video Selection */}
              {currentVideos.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternative Views:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {currentVideos.map((video, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedVideoIndex(index)}
                        className={`text-left p-3 rounded-lg border transition-colors ${
                          index === selectedVideoIndex
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{video.title}</div>
                        <div className="text-xs text-gray-500">{video.duration_formatted}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No video available</p>
                {!videoServerAvailable && (
                  <p className="text-sm">Video server is offline</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Exercise Tracking Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Current Exercise
          </h2>

          {currentExercise ? (
            <div>
              {/* Exercise Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {currentExercise.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {currentExercise.instructions}
                </p>

                {/* Exercise Targets */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {currentExercise.is_timed && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center text-blue-600 mb-1">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Duration</span>
                      </div>
                      <div className="text-lg font-bold text-blue-800">
                        {Math.floor(currentExercise.duration_minutes || 0)}:{
                          String(((currentExercise.duration_minutes || 0) % 1) * 60).padStart(2, '0')
                        }
                      </div>
                    </div>
                  )}

                  {currentExercise.target_reps && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center text-green-600 mb-1">
                        <Target className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Target Reps</span>
                      </div>
                      <div className="text-lg font-bold text-green-800">
                        {currentExercise.target_reps}
                        {currentExercise.sets && ` × ${currentExercise.sets} sets`}
                      </div>
                    </div>
                  )}

                  {currentExercise.target_percentage && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center text-purple-600 mb-1">
                        <Target className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Target</span>
                      </div>
                      <div className="text-lg font-bold text-purple-800">
                        {currentExercise.target_percentage}% of max
                      </div>
                    </div>
                  )}
                </div>

                {/* Exercise Completion */}
                <div className="space-y-3">
                  {!isExerciseCompleted(currentPhaseIndex, currentExerciseIndex) ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Record Your Performance:
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Reps completed"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleExerciseComplete(currentExercise, { reps: 10 })}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center text-green-800">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="font-medium">Exercise Completed!</span>
                      </div>
                    </div>
                  )}

                  {/* Skip Option */}
                  <button
                    onClick={() => handleExerciseComplete(currentExercise, { skipped: true })}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Skip Exercise (injury/modification)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>No current exercise</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={handleNextExercise}
              disabled={currentExerciseIndex >= (currentPhase?.exercises?.length || 0) - 1 && currentPhaseIndex >= phases.length - 1}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <SkipForward className="w-4 h-4 mr-1" />
              Next Exercise
            </button>

            {currentPhaseIndex === phases.length - 1 && 
             currentExerciseIndex === (currentPhase?.exercises?.length || 0) - 1 && (
              <button
                onClick={handleWorkoutComplete}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Complete Workout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          {currentPhase?.name} - Exercise List
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentPhase?.exercises?.map((exercise, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                index === currentExerciseIndex
                  ? 'border-blue-500 bg-blue-50'
                  : isExerciseCompleted(currentPhaseIndex, index)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setCurrentExerciseIndex(index)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">{exercise.name}</h4>
                {isExerciseCompleted(currentPhaseIndex, index) && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{exercise.instructions}</p>
              <div className="text-xs text-gray-500">
                {exercise.is_timed && `${exercise.duration_minutes} min`}
                {exercise.target_reps && `${exercise.target_reps} reps`}
                {exercise.sets && ` × ${exercise.sets} sets`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoWorkoutSession;

