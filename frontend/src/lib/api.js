// Mock API service for demo purposes with offline support
// import { isOnline, queueOfflineRequest, offlineStorage } from './offline.js';

class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api'
    this.mockUser = null
    this.mockData = {
      exercises: [],
      workouts: [],
      progress: [],
      achievements: []
    }
  }

  async request(endpoint, options = {}) {
    // Check if online (temporarily disabled)
    // if (!isOnline() && (options.method === 'POST' || options.method === 'PUT')) {
    //   // Queue the request for offline sync
    //   const queueId = queueOfflineRequest({
    //     url: `${this.baseURL}${endpoint}`,
    //     method: options.method,
    //     headers: options.headers,
    //     body: options.body
    //   });
    //   
    //   // For demo purposes, still return mock data
    //   console.log(`Offline request queued: ${endpoint}`, { queueId });
    // }
    
    // For demo purposes, use mock data instead of real API calls
    console.log(`Mock API call: ${endpoint}`, options)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Handle different endpoints with mock responses
    if (endpoint === '/users' && options.method === 'GET') {
      return []
    }
    
    if (endpoint.startsWith('/users/') && options.method === 'GET') {
      return this.mockUser || this.createMockUser()
    }
    
    if (endpoint.startsWith('/users/') && options.method === 'PUT') {
      this.mockUser = { ...this.mockUser, ...options.body }
      return this.mockUser
    }
    
    // Return empty arrays for other endpoints
    return []
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
    
    // Save to offline storage if offline (temporarily disabled)
    // if (!isOnline()) {
    //   await offlineStorage.saveProgress({
    //     type: 'user_creation',
    //     data: userData
    //   });
    // }
    
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
    
    // Save to offline storage if offline (temporarily disabled)
    // if (!isOnline()) {
    //   await offlineStorage.saveProgress({
    //     type: 'user_update',
    //     userId,
    //     data: userData
    //   });
    // }
    
    this.mockUser = { ...this.mockUser, ...userData }
    return this.mockUser
  }

  async completeFitnessAssessment(userId, assessmentData) {
    const result = await this.request(`/users/${userId}/fitness-assessment`, {
      method: 'POST',
      body: assessmentData,
    })
    
    // Save to offline storage if offline
    if (!isOnline()) {
      await offlineStorage.saveProgress({
        type: 'fitness_assessment',
        userId,
        data: assessmentData
      });
    }
    
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
    
    // Save to offline storage if offline
    if (!isOnline()) {
      await offlineStorage.saveProgress({
        type: 'target_update',
        userId,
        data: targets
      });
    }
    
    this.mockUser = { ...this.mockUser, ...targets }
    return this.mockUser
  }

  async createWorkout(userId, workoutData) {
    const result = await this.request(`/users/${userId}/workouts`, {
      method: 'POST',
      body: workoutData,
    })
    
    // Save to offline storage if offline
    if (!isOnline()) {
      await offlineStorage.saveWorkout({
        userId,
        ...workoutData,
        status: 'planned'
      });
    }
    
    return { id: Date.now(), user_id: userId, ...workoutData }
  }

  async completeWorkout(workoutId, data = {}) {
    const result = await this.request(`/workouts/${workoutId}/complete`, {
      method: 'POST',
      body: data,
    })
    
    // Save to offline storage if offline
    if (!isOnline()) {
      await offlineStorage.saveWorkout({
        id: workoutId,
        ...data,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }
    
    return { id: workoutId, status: 'completed' }
  }

  async createProgressEntry(userId, progressData) {
    const result = await this.request(`/users/${userId}/progress`, {
      method: 'POST',
      body: progressData,
    })
    
    // Save to offline storage if offline
    if (!isOnline()) {
      await offlineStorage.saveProgress({
        userId,
        ...progressData,
        date: new Date().toISOString().split('T')[0]
      });
    }
    
    return { id: Date.now(), user_id: userId, ...progressData }
  }

  // Read-only methods (no offline storage needed)
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
    // Return null to simulate no workout for today
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

  async seedExercises() {
    // Mock seeding
    return true
  }

  async seedAchievements() {
    // Mock seeding
    return true
  }

  async startWorkout(workoutId) {
    const result = await this.request(`/workouts/${workoutId}/start`, {
      method: 'POST',
    })
    
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
    const result = await this.request(`/workout-exercises/${exerciseId}`, {
      method: 'PUT',
      body: data,
    })
    
    // Save to offline storage if offline
    if (!isOnline()) {
      await offlineStorage.saveWorkout({
        type: 'exercise_update',
        exerciseId,
        data
      });
    }
    
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

  // Other read-only methods remain the same
  async getUserWorkouts(userId, params = {}) { return [] }
  async getWorkout(workoutId) { return { id: workoutId, status: 'planned' } }
  async updateWorkout(workoutId, workoutData) { return { id: workoutId, ...workoutData } }
  async getExercises(category = null) { return [] }
  async getWorkoutTemplates() { return [] }
  async getUserProgress(userId, params = {}) { return [] }
  async updateStreaks(userId, streakData) { return streakData }
  async getAchievements() { return [] }
  async checkAchievements(userId) { return [] }
}

export const apiService = new ApiService()

// Utility functions for offline support (enhanced)
export const offlineStorageUtils = {
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
  },

  // Save workout data for offline use
  saveWorkoutOffline(workout) {
    const workouts = this.load('offline_workouts') || []
    workouts.push({
      ...workout,
      timestamp: new Date().toISOString(),
      synced: false
    })
    this.save('offline_workouts', workouts)
  },

  // Save progress data for offline use
  saveProgressOffline(progress) {
    const progressData = this.load('offline_progress') || []
    progressData.push({
      ...progress,
      timestamp: new Date().toISOString(),
      synced: false
    })
    this.save('offline_progress', progressData)
  },

  // Get unsynced data
  getUnsyncedData() {
    const workouts = this.load('offline_workouts') || []
    const progress = this.load('offline_progress') || []
    
    return {
      workouts: workouts.filter(item => !item.synced),
      progress: progress.filter(item => !item.synced)
    }
  },

  // Mark data as synced
  markAsSynced(type, timestamp) {
    const data = this.load(`offline_${type}`) || []
    const updated = data.map(item => 
      item.timestamp === timestamp ? { ...item, synced: true } : item
    )
    this.save(`offline_${type}`, updated)
  }
}

// Helper functions for calculations
export const fitnessCalculations = {
  calculateBMI(weight, height) {
    // weight in pounds, height in inches
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
    const progressionWeeks = Math.floor(weeksCompleted / 2) // Every 2 weeks
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
    return loops * 2740 // 1.37 miles = 2,740 steps per loop
  },

  calculateLoopsFromSteps(steps) {
    return Math.floor(steps / 2740)
  }
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
    return []
  }

  async createUser(userData) {
    this.mockUser = { id: 1, ...userData, onboarding_completed: false }
    return this.mockUser
  }

  async getUser(userId) {
    return this.mockUser || this.createMockUser()
  }

  async updateUser(userId, userData) {
    this.mockUser = { ...this.mockUser, ...userData }
    return this.mockUser
  }

  async completeFitnessAssessment(userId, assessmentData) {
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
    this.mockUser = { ...this.mockUser, ...targets }
    return this.mockUser
  }

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
    // Return null to simulate no workout for today
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

  async seedExercises() {
    // Mock seeding
    return true
  }

  async seedAchievements() {
    // Mock seeding
    return true
  }

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

  async completeWorkout(workoutId) {
    return { id: workoutId, status: 'completed' }
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

  async createProgressEntry(userId, data) {
    return { id: Date.now(), user_id: userId, ...data }
  }

  async getUserWorkouts(userId, params = {}) {
    return []
  }

  async createWorkout(userId, workoutData) {
    return { id: Date.now(), user_id: userId, ...workoutData }
  }

  async getWorkout(workoutId) {
    return { id: workoutId, status: 'planned' }
  }

  async updateWorkout(workoutId, workoutData) {
    return { id: workoutId, ...workoutData }
  }

  async getExercises(category = null) {
    return []
  }

  async getWorkoutTemplates() {
    return []
  }

  async getUserProgress(userId, params = {}) {
    return []
  }

  async updateStreaks(userId, streakData) {
    return streakData
  }

  async getAchievements() {
    return []
  }

  async checkAchievements(userId) {
    return []
  }
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
    // weight in pounds, height in inches
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
    const progressionWeeks = Math.floor(weeksCompleted / 2) // Every 2 weeks
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
    return loops * 2740 // 1.37 miles = 2,740 steps per loop
  },

  calculateLoopsFromSteps(steps) {
    return Math.floor(steps / 2740)
  }
}

