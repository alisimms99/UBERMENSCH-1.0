// Offline functionality utilities for PWA

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    this.syncInProgress = false;
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Initialize offline indicator
    this.createOfflineIndicator();
    
    // Register for background sync if available
    this.registerBackgroundSync();
  }

  createOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'offline-indicator';
    indicator.textContent = 'You are offline. Data will sync when connection is restored.';
    document.body.appendChild(indicator);
    
    this.offlineIndicator = indicator;
    this.updateOfflineIndicator();
  }

  updateOfflineIndicator() {
    if (this.offlineIndicator) {
      if (this.isOnline) {
        this.offlineIndicator.classList.remove('show');
      } else {
        this.offlineIndicator.classList.add('show');
      }
    }
  }

  handleOnline() {
    console.log('Connection restored');
    this.isOnline = true;
    this.updateOfflineIndicator();
    this.syncOfflineData();
  }

  handleOffline() {
    console.log('Connection lost');
    this.isOnline = false;
    this.updateOfflineIndicator();
  }

  // Queue API requests when offline
  queueRequest(request) {
    const queueItem = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      request: request,
      retries: 0
    };
    
    this.offlineQueue.push(queueItem);
    this.saveOfflineQueue();
    
    console.log('Request queued for offline sync:', queueItem);
    return queueItem.id;
  }

  // Save offline queue to localStorage
  saveOfflineQueue() {
    try {
      localStorage.setItem('fittracker_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  // Load offline queue from localStorage
  loadOfflineQueue() {
    try {
      const saved = localStorage.getItem('fittracker_offline_queue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  // Sync offline data when connection is restored
  async syncOfflineData() {
    if (this.syncInProgress || this.offlineQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting offline data sync...');

    const successfulSyncs = [];
    const failedSyncs = [];

    for (const queueItem of this.offlineQueue) {
      try {
        // Attempt to replay the request
        const response = await fetch(queueItem.request.url, {
          method: queueItem.request.method || 'GET',
          headers: queueItem.request.headers || {},
          body: queueItem.request.body
        });

        if (response.ok) {
          successfulSyncs.push(queueItem.id);
          console.log('Successfully synced:', queueItem.id);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to sync request:', queueItem.id, error);
        queueItem.retries = (queueItem.retries || 0) + 1;
        
        // Remove items that have failed too many times
        if (queueItem.retries >= 3) {
          failedSyncs.push(queueItem.id);
        }
      }
    }

    // Remove successfully synced and permanently failed items
    this.offlineQueue = this.offlineQueue.filter(item => 
      !successfulSyncs.includes(item.id) && !failedSyncs.includes(item.id)
    );

    this.saveOfflineQueue();
    this.syncInProgress = false;

    if (successfulSyncs.length > 0) {
      this.showSyncNotification(`${successfulSyncs.length} items synced successfully`);
    }

    console.log('Offline sync completed');
  }

  // Show sync notification
  showSyncNotification(message) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Register for background sync
  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
        console.log('Background sync registered');
      } catch (error) {
        console.log('Background sync registration failed:', error);
      }
    }
  }

  // Check if device is online
  isDeviceOnline() {
    return this.isOnline;
  }

  // Get offline queue status
  getOfflineQueueStatus() {
    return {
      count: this.offlineQueue.length,
      items: this.offlineQueue.map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        retries: item.retries || 0
      }))
    };
  }

  // Clear offline queue (for testing or manual reset)
  clearOfflineQueue() {
    this.offlineQueue = [];
    this.saveOfflineQueue();
    console.log('Offline queue cleared');
  }
}

// Offline storage utilities
export class OfflineStorage {
  constructor(dbName = 'fittracker_offline', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for different data types
        if (!db.objectStoreNames.contains('workouts')) {
          const workoutStore = db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
          workoutStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'id', autoIncrement: true });
          progressStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async saveWorkout(workout) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['workouts'], 'readwrite');
      const store = transaction.objectStore('workouts');
      const request = store.add({
        ...workout,
        timestamp: new Date().toISOString(),
        synced: false
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProgress(progress) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['progress'], 'readwrite');
      const store = transaction.objectStore('progress');
      const request = store.add({
        ...progress,
        timestamp: new Date().toISOString(),
        synced: false
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedData() {
    if (!this.db) await this.init();
    
    const workouts = await this.getUnsyncedWorkouts();
    const progress = await this.getUnsyncedProgress();
    
    return { workouts, progress };
  }

  async getUnsyncedWorkouts() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['workouts'], 'readonly');
      const store = transaction.objectStore('workouts');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const unsynced = request.result.filter(item => !item.synced);
        resolve(unsynced);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedProgress() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['progress'], 'readonly');
      const store = transaction.objectStore('progress');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const unsynced = request.result.filter(item => !item.synced);
        resolve(unsynced);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(); // Item not found, consider it synced
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}

// Create global offline manager instance
export const offlineManager = new OfflineManager();

// Initialize offline storage
export const offlineStorage = new OfflineStorage();

// Utility functions
export const isOnline = () => offlineManager.isDeviceOnline();
export const queueOfflineRequest = (request) => offlineManager.queueRequest(request);
export const getOfflineStatus = () => offlineManager.getOfflineQueueStatus();

