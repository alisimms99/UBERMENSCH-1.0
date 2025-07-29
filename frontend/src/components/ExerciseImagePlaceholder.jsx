import React from 'react';
import { Camera, Image } from 'lucide-react';

const ExerciseImagePlaceholder = ({ 
  exercise, 
  className = '', 
  size = 'medium',
  showUploadHint = false,
  onImageUpload = null
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-12 h-12';
      case 'medium':
        return 'w-16 h-16';
      case 'large':
        return 'w-24 h-24';
      case 'xl':
        return 'w-32 h-24'; // 4:3 aspect ratio
      default:
        return 'w-16 h-16';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4';
      case 'medium':
        return 'w-6 h-6';
      case 'large':
        return 'w-8 h-8';
      case 'xl':
        return 'w-10 h-10';
      default:
        return 'w-6 h-6';
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && onImageUpload) {
      onImageUpload(file, exercise);
    }
  };

  return (
    <div className={`relative ${getSizeClasses()} ${className}`}>
      {/* Placeholder Background */}
      <div className={`${getSizeClasses()} flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors`}>
        <Image className={`${getIconSize()} text-gray-400 mb-1`} />
        {size === 'xl' && (
          <span className="text-xs text-gray-500 text-center px-1">
            {exercise.name}
          </span>
        )}
      </div>

      {/* Upload Hint */}
      {showUploadHint && onImageUpload && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg cursor-pointer">
          <div className="text-center">
            <Camera className="w-6 h-6 text-white mx-auto mb-1" />
            <span className="text-xs text-white">Add Photo</span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      )}

      {/* Future Enhancement Badge */}
      {size === 'xl' && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          Soon
        </div>
      )}
    </div>
  );
};

export default ExerciseImagePlaceholder;

