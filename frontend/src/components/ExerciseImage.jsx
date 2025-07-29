import React, { useState } from 'react';
import { 
  User, 
  ArrowUp, 
  RotateCcw, 
  Minus, 
  ArrowDown, 
  Zap, 
  MapPin, 
  Waves,
  Move,
  TrendingUp,
  RotateCw,
  Activity
} from 'lucide-react';
import ExerciseImagePlaceholder from './ExerciseImagePlaceholder';

const ExerciseImage = ({ 
  exercise, 
  className = '', 
  size = 'medium',
  showFallback = true 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Icon mapping for exercise types
  const getExerciseIcon = (exerciseName, iconName) => {
    // Use provided icon name first
    if (iconName) {
      const iconMap = {
        'User': User,
        'ArrowUp': ArrowUp,
        'RotateCcw': RotateCcw,
        'Minus': Minus,
        'ArrowDown': ArrowDown,
        'Zap': Zap,
        'MapPin': MapPin,
        'Waves': Waves,
        'Move': Move,
        'TrendingUp': TrendingUp,
        'RotateCw': RotateCw,
        'Activity': Activity
      };
      return iconMap[iconName] || Activity;
    }

    // Fallback based on exercise name
    const name = exerciseName.toLowerCase();
    if (name.includes('pushup')) return ArrowUp;
    if (name.includes('situp')) return RotateCcw;
    if (name.includes('plank')) return Minus;
    if (name.includes('squat')) return ArrowDown;
    if (name.includes('mountain')) return Zap;
    if (name.includes('walking') || name.includes('walk')) return MapPin;
    if (name.includes('qigong') || name.includes('brocade') || name.includes('zhan')) return Waves;
    if (name.includes('bird') || name.includes('dog')) return Move;
    if (name.includes('bridge') || name.includes('glute')) return TrendingUp;
    if (name.includes('dead') || name.includes('bug')) return RotateCw;
    if (name.includes('leg') || name.includes('raise')) return ArrowUp;
    
    return Activity; // Default icon
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-12 h-12';
      case 'medium':
        return 'w-16 h-16';
      case 'large':
        return 'w-24 h-24';
      case 'xl':
        return 'w-32 h-24'; // 4:3 aspect ratio for larger images
      default:
        return 'w-16 h-16';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'w-6 h-6';
      case 'medium':
        return 'w-8 h-8';
      case 'large':
        return 'w-12 h-12';
      case 'xl':
        return 'w-16 h-16';
      default:
        return 'w-8 h-8';
    }
  };

  const IconComponent = getExerciseIcon(exercise.name, exercise.icon_name);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // If we have an image URL and it hasn't failed to load
  if (exercise.image_url && !imageError) {
    return (
      <div className={`relative ${getSizeClasses()} ${className}`}>
        {imageLoading && showFallback && (
          <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg ${getSizeClasses()}`}>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={exercise.image_url}
          alt={exercise.name}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`${getSizeClasses()} object-cover rounded-lg border border-gray-200 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-200 ${className}`}
        />
      </div>
    );
  }

  // If no image URL available, show placeholder or icon fallback
  if (!exercise.image_url) {
    if (showFallback) {
      return (
        <ExerciseImagePlaceholder 
          exercise={exercise}
          size={size}
          className={className}
          showUploadHint={false}
        />
      );
    }
    return null;
  }

  // Fallback to icon when image fails to load
  if (showFallback) {
    return (
      <div className={`${getSizeClasses()} flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 ${className}`}>
        <IconComponent className={`${getIconSize()} text-gray-600`} />
      </div>
    );
  }

  // No fallback requested and no image available
  return null;
};

// Preset component for workout session use
export const WorkoutExerciseImage = ({ exercise, className = '' }) => (
  <ExerciseImage 
    exercise={exercise} 
    size="medium" 
    className={className}
    showFallback={true}
  />
);

// Preset component for template browsing
export const TemplateExerciseImage = ({ exercise, className = '' }) => (
  <ExerciseImage 
    exercise={exercise} 
    size="small" 
    className={className}
    showFallback={true}
  />
);

// Preset component for detailed exercise view
export const DetailedExerciseImage = ({ exercise, className = '' }) => (
  <ExerciseImage 
    exercise={exercise} 
    size="xl" 
    className={className}
    showFallback={true}
  />
);

export default ExerciseImage;

