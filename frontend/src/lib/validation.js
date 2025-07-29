// Data validation utilities for fitness tracker

export const ValidationError = class extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
};

// User profile validation
export const validateUserProfile = (profileData) => {
  const errors = {};

  // Age validation
  if (profileData.age !== undefined && profileData.age !== null && profileData.age !== '') {
    const age = Number(profileData.age);
    if (isNaN(age) || age < 13 || age > 120) {
      errors.age = 'Age must be between 13 and 120 years';
    }
  }

  // Weight validation
  if (profileData.weight !== undefined && profileData.weight !== null && profileData.weight !== '') {
    const weight = Number(profileData.weight);
    if (isNaN(weight) || weight < 30 || weight > 500) {
      errors.weight = 'Weight must be between 30 and 500 kg';
    }
  }

  // Height validation
  if (profileData.height !== undefined && profileData.height !== null && profileData.height !== '') {
    const height = Number(profileData.height);
    if (isNaN(height) || height < 100 || height > 250) {
      errors.height = 'Height must be between 100 and 250 cm';
    }
  }

  // Target validation
  if (profileData.target_pushups !== undefined && profileData.target_pushups !== null && profileData.target_pushups !== '') {
    const target = Number(profileData.target_pushups);
    if (isNaN(target) || target < 1 || target > 1000) {
      errors.target_pushups = 'Target pushups must be between 1 and 1000';
    }
  }

  if (profileData.target_situps !== undefined && profileData.target_situps !== null && profileData.target_situps !== '') {
    const target = Number(profileData.target_situps);
    if (isNaN(target) || target < 1 || target > 1000) {
      errors.target_situps = 'Target situps must be between 1 and 1000';
    }
  }

  // Daily steps validation
  if (profileData.daily_steps_goal !== undefined && profileData.daily_steps_goal !== null && profileData.daily_steps_goal !== '') {
    const steps = Number(profileData.daily_steps_goal);
    if (isNaN(steps) || steps < 1000 || steps > 50000) {
      errors.daily_steps_goal = 'Daily steps goal must be between 1,000 and 50,000';
    }
  }

  // Workouts per week validation
  if (profileData.workouts_per_week !== undefined && profileData.workouts_per_week !== null && profileData.workouts_per_week !== '') {
    const workouts = Number(profileData.workouts_per_week);
    if (isNaN(workouts) || workouts < 1 || workouts > 7) {
      errors.workouts_per_week = 'Workouts per week must be between 1 and 7';
    }
  }

  // Preferred duration validation
  if (profileData.preferred_duration !== undefined && profileData.preferred_duration !== null && profileData.preferred_duration !== '') {
    const duration = Number(profileData.preferred_duration);
    if (isNaN(duration) || duration < 10 || duration > 180) {
      errors.preferred_duration = 'Preferred duration must be between 10 and 180 minutes';
    }
  }

  // Fitness level validation
  if (profileData.fitness_level && !['beginner', 'intermediate', 'advanced'].includes(profileData.fitness_level)) {
    errors.fitness_level = 'Fitness level must be beginner, intermediate, or advanced';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Exercise performance validation
export const validateExercisePerformance = (exerciseData) => {
  const errors = {};

  // Reps validation
  if (exerciseData.actualReps !== undefined && exerciseData.actualReps !== null && exerciseData.actualReps !== '') {
    const reps = Number(exerciseData.actualReps);
    if (isNaN(reps) || reps < 0 || reps > 1000) {
      errors.actualReps = 'Reps must be between 0 and 1000';
    }
  }

  // Sets validation
  if (exerciseData.actualSets !== undefined && exerciseData.actualSets !== null && exerciseData.actualSets !== '') {
    const sets = Number(exerciseData.actualSets);
    if (isNaN(sets) || sets < 0 || sets > 20) {
      errors.actualSets = 'Sets must be between 0 and 20';
    }
  }

  // Duration validation (in seconds)
  if (exerciseData.actualDuration !== undefined && exerciseData.actualDuration !== null && exerciseData.actualDuration !== '') {
    const duration = Number(exerciseData.actualDuration);
    if (isNaN(duration) || duration < 0 || duration > 7200) { // Max 2 hours
      errors.actualDuration = 'Duration must be between 0 and 7200 seconds (2 hours)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Baseline assessment validation
export const validateBaselineAssessment = (baselineData) => {
  const errors = {};

  // Max pushups validation
  if (baselineData.max_pushups !== undefined && baselineData.max_pushups !== null && baselineData.max_pushups !== '') {
    const pushups = Number(baselineData.max_pushups);
    if (isNaN(pushups) || pushups < 0 || pushups > 200) {
      errors.max_pushups = 'Max pushups must be between 0 and 200';
    }
  }

  // Max situps validation
  if (baselineData.max_situps !== undefined && baselineData.max_situps !== null && baselineData.max_situps !== '') {
    const situps = Number(baselineData.max_situps);
    if (isNaN(situps) || situps < 0 || situps > 200) {
      errors.max_situps = 'Max situps must be between 0 and 200';
    }
  }

  // Max plank duration validation (in seconds)
  if (baselineData.max_plank_duration !== undefined && baselineData.max_plank_duration !== null && baselineData.max_plank_duration !== '') {
    const plank = Number(baselineData.max_plank_duration);
    if (isNaN(plank) || plank < 0 || plank > 1800) { // Max 30 minutes
      errors.max_plank_duration = 'Max plank duration must be between 0 and 1800 seconds (30 minutes)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Session feedback validation
export const validateSessionFeedback = (feedbackData) => {
  const errors = {};

  // Energy levels validation (1-5 scale)
  if (feedbackData.energyBefore !== undefined && feedbackData.energyBefore !== null) {
    const energy = Number(feedbackData.energyBefore);
    if (isNaN(energy) || energy < 1 || energy > 5) {
      errors.energyBefore = 'Energy level must be between 1 and 5';
    }
  }

  if (feedbackData.energyAfter !== undefined && feedbackData.energyAfter !== null) {
    const energy = Number(feedbackData.energyAfter);
    if (isNaN(energy) || energy < 1 || energy > 5) {
      errors.energyAfter = 'Energy level must be between 1 and 5';
    }
  }

  // Difficulty rating validation (1-5 scale)
  if (feedbackData.difficultyRating !== undefined && feedbackData.difficultyRating !== null) {
    const difficulty = Number(feedbackData.difficultyRating);
    if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
      errors.difficultyRating = 'Difficulty rating must be between 1 and 5';
    }
  }

  // Session notes validation (optional, but limit length)
  if (feedbackData.sessionNotes && feedbackData.sessionNotes.length > 1000) {
    errors.sessionNotes = 'Session notes must be less than 1000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Date validation
export const validateDate = (dateString) => {
  if (!dateString) return { isValid: false, error: 'Date is required' };
  
  const date = new Date(dateString);
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }
  
  if (date < oneYearAgo) {
    return { isValid: false, error: 'Date cannot be more than one year ago' };
  }
  
  if (date > oneYearFromNow) {
    return { isValid: false, error: 'Date cannot be more than one year in the future' };
  }
  
  return { isValid: true };
};

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Format error messages for display
export const formatValidationErrors = (errors) => {
  if (!errors || Object.keys(errors).length === 0) return null;
  
  return Object.entries(errors).map(([field, message]) => ({
    field,
    message
  }));
};

// Check if data has been modified
export const hasDataChanged = (original, current) => {
  if (!original || !current) return true;
  
  const originalKeys = Object.keys(original);
  const currentKeys = Object.keys(current);
  
  if (originalKeys.length !== currentKeys.length) return true;
  
  for (const key of originalKeys) {
    if (original[key] !== current[key]) return true;
  }
  
  return false;
};

export default {
  ValidationError,
  validateUserProfile,
  validateExercisePerformance,
  validateBaselineAssessment,
  validateSessionFeedback,
  validateDate,
  sanitizeInput,
  formatValidationErrors,
  hasDataChanged
};

