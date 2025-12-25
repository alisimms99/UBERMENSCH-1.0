/**
 * Application configuration
 * Centralizes environment-dependent settings
 */

/**
 * Get the API base URL
 * In production, VITE_API_URL must be set - no fallback to localhost
 * In development, falls back to localhost for convenience
 */
export const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // In production mode, require VITE_API_URL to be set
  if (import.meta.env.PROD && !apiUrl) {
    throw new Error(
      'VITE_API_URL environment variable must be set in production. ' +
      'Please configure your environment variables before deploying.'
    );
  }
  
  // In development, fall back to localhost
  return apiUrl || 'http://localhost:5180';
};

// Export singleton API URL
export const API_URL = getApiUrl();
