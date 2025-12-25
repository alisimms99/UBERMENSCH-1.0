/**
 * Centralized API configuration
 * 
 * This module provides a single source of truth for API URL configuration,
 * ensuring production deployments fail fast if VITE_API_URL is not properly configured.
 */

const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL
  
  // In production, require VITE_API_URL to be set
  if (import.meta.env.PROD && !apiUrl) {
    throw new Error(
      'VITE_API_URL environment variable is required in production. ' +
      'Please set it to your backend API URL (e.g., https://api.example.com)'
    )
  }
  
  // In development, fallback to localhost with a warning
  if (!apiUrl) {
    console.warn(
      'VITE_API_URL is not set. Defaulting to http://localhost:5180. ' +
      'Set VITE_API_URL in your .env file for production deployments.'
    )
    return 'http://localhost:5180'
  }
  
  return apiUrl
}

// Export the API URL as a constant
export const API_URL = getApiUrl()

// Export the base API URL with /api suffix for convenience
export const API_BASE_URL = `${API_URL}/api`
