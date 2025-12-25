// Simplified Mock API service for demo purposes
import API_CONFIG from './config.js'

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.fullURL
    this.mockUser = null
    this.mockData = {
      exercises: [],
      workouts: [],
      progress: [],
      achievements: []
    }
  }

  async request(endpoint, options = {}) {
    // Perform real API request
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController()
    const timeoutMs = options.timeoutMs ?? 10000
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    let response
    try {
      response = await fetch(url, {
        method: options.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  createMockUser() {
    this.mockUser = {
      id: 1,
      username: 'FitnessUser',
      email: 'user@example.com',
      age: 55,
      weight: 225,
      height: 70.5,
      target_pushups: 50,
      target_situps: 50,
      target_daily_steps: 10000,
      workouts_per_week: 3,
      current_pushup_target: 5,
      current_situp_target: 5,
      current_plank_target: 30,
      onboarding_completed: false,
      initial_max_pushups: 10,
      initial_max_situps: 8,
      initial_plank_duration: 45
    }
    return this.mockUser
  }

  async getUsers() {
    return this.request('/users', { method: 'GET' })
  }

  async createUser(userData) {
    const result = await this.request('/users', {
      method: 'POST',
      body: userData,
    })
    
    this.mockUser = { id: 1, ...userData, onboarding_completed: false }
    return this.mockUser
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`, { method: 'GET' })
  }

  async updateUser(userId, userData) {
    const result = await this.request(`/users/${userId}`, {
      method: 'PUT',
      body: userData,
    })
    
    this.mockUser = { ...this.mockUser, ...userData }
    return this.mockUser
  }

  async completeFitnessAssessment(userId, assessmentData) {
    const result = await this.request(`/users/${userId}/fitness-assessment`, {
      method: 'POST',
      body: assessmentData,
    })
    
    this.mockUser = {
      ...this.mockUser,
      ...assessmentData,
      current_pushup_target: Math.max(1, Math.floor(assessmentData.max_pushups * 0.4)),
      current_situp_target: Math.max(1, Math.floor(assessmentData.max_situps * 0.3)),
      current_plank_target: Math.max(15, Math.floor(assessmentData.plank_duration * 0.5)),
      onboarding_completed: true
    }
    return this.mockUser
  }

  async updateTargets(userId, targets) {
    const result = await this.request(`/users/${userId}/targets`, {
      method: 'PUT',
      body: targets,
    })
    
    this.mockUser = { ...this.mockUser, ...targets }
    return this.mockUser
  }

  async createWorkout(userId, workoutData) {
    const result = await this.request(`/users/${userId}/workouts`, {
      method: 'POST',
      body: workoutData,
    })
    
    return { id: Date.now(), user_id: userId, ...workoutData }
  }

  async completeWorkout(workoutId, data = {}) {
    const result = await this.request(`/workouts/${workoutId}/complete`, {
      method: 'POST',
      body: data,
    })
    
    return { id: workoutId, status: 'completed' }
  }

  async createProgressEntry(userId, progressData) {
    const result = await this.request(`/users/${userId}/progress`, {
      method: 'POST',
      body: progressData,
    })
    
    return { id: Date.now(), user_id: userId, ...progressData }
  }

  // Read-only methods
  async getTodayProgress(userId) {
    return {
      daily_steps: 3500,
      walking_loops: 1,
      qigong_streak: 5,
      workout_streak: 3,
      walking_streak: 7,
      current_level: 2,
      xp_earned: 150
    }
  }

  async getTodayWorkout(userId) {
    return null
  }

  async generateWorkout(userId, config) {
    return {
      id: 1,
      status: 'planned',
      exercises: [
        {
          id: 1,
          exercise: { name: 'Pushups', category: 'upper_body', description: 'Standard pushups' },
          target_reps: this.mockUser?.current_pushup_target || 5,
          target_sets: 1
        },
        {
          id: 2,
          exercise: { name: 'Situps', category: 'core_lower', description: 'Standard situps' },
          target_reps: this.mockUser?.current_situp_target || 5,
          target_sets: 1
        },
        {
          id: 3,
          exercise: { name: 'Plank', category: 'core_lower', description: 'Hold plank position' },
          target_duration: this.mockUser?.current_plank_target || 30,
          target_sets: 1
        }
      ]
    }
  }

  async getWorkoutStats(userId) {
    return {
      total_workouts: 15,
      completed_workouts: 12,
      current_streak: 3,
      completion_rate: 80
    }
  }

  async getUserAchievements(userId) {
    return [
      {
        id: 1,
        achievement: {
          name: 'First Steps',
          description: 'Completed your first workout',
          badge_icon: '🎯',
          xp_reward: 100
        },
        earned_at: new Date().toISOString()
      }
    ]
  }

  async seedExercises() { return true }
  async seedAchievements() { return true }

  async startWorkout(workoutId) {
    return {
      id: workoutId,
      status: 'in_progress',
      exercises: [
        {
          id: 1,
          exercise: { name: 'Pushups', category: 'upper_body', description: 'Standard pushups' },
          target_reps: this.mockUser?.current_pushup_target || 5,
          target_sets: 1
        }
      ]
    }
  }

  async updateWorkoutExercise(exerciseId, data) {
    return { id: exerciseId, ...data }
  }

  async getProgressAnalytics(userId, days) {
    return {
      period_days: days,
      total_entries: 10,
      analytics: {
        total_steps: 50000,
        total_walking_loops: 18,
        avg_daily_steps: 5000,
        step_goal_achievement_rate: 60,
        days_met_step_goal: 6,
        current_streaks: {
          qigong: 5,
          workout: 3,
          walking: 7
        },
        max_pushups_progression: [
          ['2024-01-01', 5],
          ['2024-01-15', 8],
          ['2024-01-30', 12]
        ],
        max_situps_progression: [
          ['2024-01-01', 3],
          ['2024-01-15', 6],
          ['2024-01-30', 10]
        ],
        plank_duration_progression: [
          ['2024-01-01', 30],
          ['2024-01-15', 45],
          ['2024-01-30', 60]
        ],
        daily_steps_data: Array.from({ length: 30 }, (_, i) => [
          new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          Math.floor(Math.random() * 8000) + 2000
        ])
      }
    }
  }

  // Other read-only methods
  async getUserWorkouts(userId, params = {}) { return [] }
  async getWorkout(workoutId) { return { id: workoutId, status: 'planned' } }
  async updateWorkout(workoutId, workoutData) { return { id: workoutId, ...workoutData } }
  async getExercises(category = null) { return [] }
  async getWorkoutTemplates() {
    // Attempt to fetch workout templates from the backend
    const result = await this.request('/templates', { method: 'GET' })
    // If backend returns data, use it; otherwise, provide demo templates
    return result && result.length
      ? result
      : [
        { id: 1, name: 'Full Body Blast', difficulty: 'Intermediate', duration_minutes: 45 },
        { id: 2, name: 'Cardio Burn', difficulty: 'Beginner', duration_minutes: 30 },
        { id: 3, name: 'Strength Builder', difficulty: 'Advanced', duration_minutes: 60 }
      ]
  }
  
  async getWorkoutSession(templateId) {
    // Fetch template details from backend
    const result = await this.request(`/templates/${templateId}`, { method: 'GET' })
    // Use backend data if available, otherwise return demo session
    if (result && result.id) {
      return result
    }
    // Demo session structure
    return {
      id: templateId,
      name: `Sample Template ${templateId}`,
      description: 'Demo workout session loaded locally.',
      phases: [
        {
          name: 'Warm-up',
          exercises: [
            { id: 1, name: 'Jumping Jacks', reps: 20, sets: 1, duration_seconds: null },
            { id: 2, name: 'Arm Circles', reps: 15, sets: 1, duration_seconds: null }
          ]
        },
        {
          name: 'Main Set',
          exercises: [
            { id: 3, name: 'Pushups', reps: 10, sets: 3, duration_seconds: null },
            { id: 4, name: 'Plank', reps: null, sets: 3, duration_seconds: 30 }
          ]
        }
      ]
    }
  }
  async getUserProgress(userId, params = {}) { return [] }
  async updateStreaks(userId, streakData) { return streakData }
  async getAchievements() { return [] }
  async checkAchievements(userId) { return [] }
}

export const apiService = new ApiService()

// Utility functions for offline support
export const offlineStorage = {
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },

  load(key) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return null
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
    }
  }
}

// Helper functions for calculations
export const fitnessCalculations = {
  calculateBMI(weight, height) {
    return (weight / (height * height)) * 703
  },

  calculateInitialTargets(maxPushups, maxSitups, plankDuration) {
    return {
      pushupTarget: Math.max(1, Math.floor(maxPushups * 0.4)),
      situpTarget: Math.max(1, Math.floor(maxSitups * 0.3)),
      plankTarget: Math.max(15, Math.floor(plankDuration * 0.5))
    }
  },

  calculateProgressionTargets(currentTargets, weeksCompleted) {
    const progressionWeeks = Math.floor(weeksCompleted / 2)
    return {
      pushupTarget: currentTargets.pushupTarget + (progressionWeeks * 2),
      situpTarget: currentTargets.situpTarget + (progressionWeeks * 3),
      plankTarget: currentTargets.plankTarget + (progressionWeeks * 10)
    }
  },

  calculateXP(activities) {
    let xp = 0
    if (activities.qigong) xp += 50
    if (activities.workout) xp += 100
    if (activities.walking) xp += 75
    return xp
  },

  calculateLevel(totalXP) {
    return Math.floor(totalXP / 1000) + 1
  },

  calculateStepsFromLoops(loops) {
    return loops * 2740
  },

  calculateLoopsFromSteps(steps) {
    return Math.floor(steps / 2740)
  }
}

