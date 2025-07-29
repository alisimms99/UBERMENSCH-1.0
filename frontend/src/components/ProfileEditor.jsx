import React, { useState } from 'react';
import { User, Save, RotateCcw, AlertTriangle } from 'lucide-react';

const ProfileEditor = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    age: user?.age || '',
    weight: user?.weight || '',
    height: user?.height || '',
    fitness_level: user?.fitness_level || 'beginner',
    target_pushups: user?.target_pushups || '',
    target_situps: user?.target_situps || '',
    daily_steps_goal: user?.daily_steps_goal || 10000,
    workouts_per_week: user?.workouts_per_week || 3,
    preferred_duration: user?.preferred_duration || 45
  });

  const [showResetBaselines, setShowResetBaselines] = useState(false);
  const [baselineData, setBaselineData] = useState({
    max_pushups: user?.max_pushups || '',
    max_situps: user?.max_situps || '',
    max_plank_duration: user?.max_plank_duration || ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBaselineChange = (field, value) => {
    setBaselineData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleResetBaselines = () => {
    onSave(formData, baselineData);
    setShowResetBaselines(false);
  };

  const calculateBMI = () => {
    if (formData.weight && formData.height) {
      const heightInMeters = formData.height / 100;
      const bmi = formData.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your age"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your weight"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => handleInputChange('height', parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your height"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fitness Level
            </label>
            <select
              value={formData.fitness_level}
              onChange={(e) => handleInputChange('fitness_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* BMI Display */}
        {bmi && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">BMI:</span>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-800">{bmi}</span>
                <span className={`ml-2 text-sm font-medium ${bmiInfo.color}`}>
                  ({bmiInfo.category})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Goals and Targets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Pushups (Weekly Goal)
            </label>
            <input
              type="number"
              value={formData.target_pushups}
              onChange={(e) => handleInputChange('target_pushups', parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Long-term pushup goal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Situps (Weekly Goal)
            </label>
            <input
              type="number"
              value={formData.target_situps}
              onChange={(e) => handleInputChange('target_situps', parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Long-term situp goal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Steps Goal
            </label>
            <input
              type="number"
              value={formData.daily_steps_goal}
              onChange={(e) => handleInputChange('daily_steps_goal', parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Daily step target"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workouts Per Week
            </label>
            <select
              value={formData.workouts_per_week}
              onChange={(e) => handleInputChange('workouts_per_week', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 workout/week</option>
              <option value={2}>2 workouts/week</option>
              <option value={3}>3 workouts/week</option>
              <option value={4}>4 workouts/week</option>
              <option value={5}>5 workouts/week</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Workout Duration (minutes)
            </label>
            <select
              value={formData.preferred_duration}
              onChange={(e) => handleInputChange('preferred_duration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>
        </div>

        {/* Reset Baselines Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Fitness Assessment</h3>
            <button
              onClick={() => setShowResetBaselines(!showResetBaselines)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Baselines
            </button>
          </div>

          {showResetBaselines && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Reset Fitness Baselines</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This will reset your current targets based on new assessment results. 
                    Enter your maximum performance for each exercise.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Pushups
                  </label>
                  <input
                    type="number"
                    value={baselineData.max_pushups}
                    onChange={(e) => handleBaselineChange('max_pushups', parseInt(e.target.value) || '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Maximum pushups"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Situps
                  </label>
                  <input
                    type="number"
                    value={baselineData.max_situps}
                    onChange={(e) => handleBaselineChange('max_situps', parseInt(e.target.value) || '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Maximum situps"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Plank (seconds)
                  </label>
                  <input
                    type="number"
                    value={baselineData.max_plank_duration}
                    onChange={(e) => handleBaselineChange('max_plank_duration', parseInt(e.target.value) || '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Maximum plank hold"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleResetBaselines}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Apply Reset
                </button>
                <button
                  onClick={() => setShowResetBaselines(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;

