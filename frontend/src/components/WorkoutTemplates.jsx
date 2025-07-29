import React, { useState, useEffect } from 'react';
import { Play, Clock, Target, Users, Waves, ArrowRight, CheckCircle } from 'lucide-react';
import { TemplateExerciseImage } from './ExerciseImage';

const WorkoutTemplates = ({ user, onStartWorkout, onBack }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockTemplates = [
        {
          id: 1,
          name: 'Getting Back Into It',
          description: 'Gentle reintroduction to fitness with qigong, light calisthenics, and walking',
          duration_min: 37,
          difficulty_level: 'beginner',
          frequency_per_week: '2-3x',
          category: 'recovery',
          exercises: [
            { exercise: { name: '8 Brocades (Ba Duan Jin)', icon_name: 'Waves' }, target_duration: 600, notes: 'Focus on gentle movements and breathing' },
            { exercise: { name: 'Pushups', icon_name: 'ArrowUp' }, target_sets: 2, intensity_modifier: 0.5, notes: 'Use knee pushups if needed' },
            { exercise: { name: 'Situps', icon_name: 'RotateCcw' }, target_sets: 2, intensity_modifier: 0.5, notes: 'Focus on controlled movement' },
            { exercise: { name: 'Plank', icon_name: 'Minus' }, target_sets: 1, target_duration: 30, notes: 'Hold for 30 seconds or current ability' },
            { exercise: { name: 'Walking', icon_name: 'MapPin' }, target_sets: 1, target_duration: 1200, notes: '1-2 loops of the 1.37-mile route' }
          ]
        },
        {
          id: 2,
          name: 'Building Strength',
          description: 'Focused strength training with full targets and extended walking',
          duration_min: 52,
          difficulty_level: 'intermediate',
          frequency_per_week: '2x',
          category: 'strength',
          exercises: [
            { exercise: { name: '8 Brocades (Ba Duan Jin)', icon_name: 'Waves' }, target_duration: 600, notes: 'Full 8 Brocades sequence' },
            { exercise: { name: 'Zhan Zhuang (Standing Meditation)', icon_name: 'User' }, target_duration: 180, notes: '3-minute standing meditation' },
            { exercise: { name: 'Pushups', icon_name: 'ArrowUp' }, target_sets: 3, intensity_modifier: 1.0, notes: 'Full weekly target, 3 sets' },
            { exercise: { name: 'Situps', icon_name: 'RotateCcw' }, target_sets: 3, intensity_modifier: 1.0, notes: 'Full weekly target, 3 sets' },
            { exercise: { name: 'Plank', icon_name: 'Minus' }, target_sets: 1, intensity_modifier: 1.0, notes: 'Current target duration (20+ seconds)' },
            { exercise: { name: 'Squats', icon_name: 'ArrowDown' }, target_sets: 2, target_reps: 15, notes: '12-15 reps, 2 sets' },
            { exercise: { name: 'Mountain Climbers', icon_name: 'Zap' }, target_sets: 2, target_reps: 20, notes: '20 reps, 2 sets' },
            { exercise: { name: 'Walking', icon_name: 'MapPin' }, target_duration: 1200, notes: '2-3 loops of the route' }
          ]
        },
        {
          id: 3,
          name: 'Full Workout',
          description: 'Complete comprehensive workout with all exercise categories',
          duration_min: 60,
          difficulty_level: 'advanced',
          frequency_per_week: '1x',
          category: 'full',
          exercises: [
            { exercise: { name: '8 Brocades (Ba Duan Jin)', icon_name: 'Waves' }, target_duration: 600, notes: 'Complete 8 Brocades sequence' },
            { exercise: { name: 'Zhan Zhuang (Standing Meditation)', icon_name: 'User' }, target_duration: 300, notes: '5-minute standing meditation' },
            { exercise: { name: 'Pushups', icon_name: 'ArrowUp' }, target_sets: 3, intensity_modifier: 1.0, notes: 'Progressive sets toward weekly target' },
            { exercise: { name: 'Situps', icon_name: 'RotateCcw' }, target_sets: 3, intensity_modifier: 1.0, notes: 'Progressive sets toward weekly target' },
            { exercise: { name: 'Plank', icon_name: 'Minus' }, target_sets: 1, intensity_modifier: 1.2, notes: 'Maximum hold attempt' },
            { exercise: { name: 'Squats', icon_name: 'ArrowDown' }, target_sets: 3, target_reps: 20, notes: '15-20 reps, 3 sets' },
            { exercise: { name: 'Dead Bugs', icon_name: 'RotateCw' }, target_sets: 2, target_reps: 10, notes: '10 each side, 2 sets' },
            { exercise: { name: 'Bird Dogs', icon_name: 'Move' }, target_sets: 2, target_reps: 10, notes: '10 each side, 2 sets' },
            { exercise: { name: 'Glute Bridges', icon_name: 'TrendingUp' }, target_sets: 2, target_reps: 15, notes: '15 reps, 2 sets' },
            { exercise: { name: 'Mountain Climbers', icon_name: 'Zap' }, target_sets: 2, target_reps: 30, notes: '30 reps, 2 sets' },
            { exercise: { name: 'Leg Raises', icon_name: 'ArrowUp' }, target_sets: 2, target_reps: 10, notes: '10 reps, 2 sets' },
            { exercise: { name: 'Walking', icon_name: 'MapPin' }, target_duration: 900, notes: '2+ loops of the route' }
          ]
        },
        {
          id: 4,
          name: 'Qigong & Walk',
          description: 'Gentle recovery day with qigong and walking',
          duration_min: 25,
          difficulty_level: 'beginner',
          frequency_per_week: 'daily',
          category: 'recovery',
          exercises: [
            { exercise: { name: '8 Brocades (Ba Duan Jin)', icon_name: 'Waves' }, target_duration: 900, notes: '8 Brocades, standing meditation, gentle flows' },
            { exercise: { name: 'Walking', icon_name: 'MapPin' }, target_duration: 900, intensity_modifier: 0.8, notes: '1-2 loops, recovery pace' }
          ]
        }
      ];
      
      setTemplates(mockTemplates);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setLoading(false);
    }
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

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'recovery': return <Waves className="w-5 h-5" />;
      case 'strength': return <Target className="w-5 h-5" />;
      case 'full': return <Users className="w-5 h-5" />;
      default: return <Play className="w-5 h-5" />;
    }
  };

  const formatDuration = (seconds) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (selectedTemplate) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {getCategoryIcon(selectedTemplate.category)}
              <h2 className="text-2xl font-bold text-gray-800">{selectedTemplate.name}</h2>
            </div>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Templates
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-800">{selectedTemplate.duration_min} min</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className={`text-sm font-medium px-2 py-1 rounded-full ${getDifficultyColor(selectedTemplate.difficulty_level)}`}>
                {selectedTemplate.difficulty_level}
              </div>
              <div className="text-sm text-gray-600 mt-1">Difficulty</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-800">{selectedTemplate.frequency_per_week}</div>
              <div className="text-sm text-gray-600">Frequency</div>
            </div>
          </div>

          <p className="text-gray-600 mb-6">{selectedTemplate.description}</p>

          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Exercises ({selectedTemplate.exercises.length})</h3>
            {selectedTemplate.exercises.map((exercise, index) => {
              const targets = calculateTargets(exercise, user);
              return (
                <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <TemplateExerciseImage 
                    exercise={exercise.exercise} 
                    className="flex-shrink-0"
                  />
                  
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">{index + 1}</span>
                  </div>
                  
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-800">{exercise.exercise.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      {exercise.target_sets && (
                        <span>{exercise.target_sets} sets</span>
                      )}
                      {targets.reps && (
                        <span>{targets.reps} reps</span>
                      )}
                      {targets.duration && (
                        <span>{formatDuration(targets.duration)}</span>
                      )}
                      {exercise.rest_seconds && (
                        <span>{exercise.rest_seconds}s rest</span>
                      )}
                    </div>
                    {exercise.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">{exercise.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onStartWorkout(selectedTemplate)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              <Play className="w-4 h-4" />
              Start Workout
            </button>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Back to Templates
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Workout Templates</h2>
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getCategoryIcon(template.category)}
                <h3 className="text-xl font-bold text-gray-800">{template.name}</h3>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(template.difficulty_level)}`}>
                {template.difficulty_level}
              </span>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-2">{template.description}</p>

            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div className="text-center">
                <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <div className="font-medium text-gray-800">{template.duration_min}m</div>
                <div className="text-gray-500">Duration</div>
              </div>
              <div className="text-center">
                <Target className="w-4 h-4 text-green-600 mx-auto mb-1" />
                <div className="font-medium text-gray-800">{template.exercises.length}</div>
                <div className="text-gray-500">Exercises</div>
              </div>
              <div className="text-center">
                <Users className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <div className="font-medium text-gray-800">{template.frequency_per_week}</div>
                <div className="text-gray-500">Frequency</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTemplate(template)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium flex-grow justify-center"
              >
                View Details
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStartWorkout(template)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutTemplates;

