/**
 * Centralized configuration for API URLs and environment settings
 * 
 * In production, VITE_API_URL must be set as an environment variable.
 * This ensures we don't accidentally use localhost in production.
 */

const getApiUrl = () => {
  // In production, VITE_API_URL must be explicitly set
  if (import.meta.env.PROD) {
    const prodUrl = import.meta.env.VITE_API_URL;
    if (!prodUrl) {
      throw new Error(
        'VITE_API_URL environment variable is required in production. ' +
        'Please set it in your build environment.'
      );
    }
    return prodUrl;
  }
  
  // In development, use VITE_API_URL if set, otherwise default to localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:5180';
};

export const API_CONFIG = {
  baseURL: getApiUrl(),
  apiPath: '/api',
  
  get fullURL() {
    return `${this.baseURL}${this.apiPath}`;
  },
  
  get videoStreamBase() {
    return `${this.baseURL}${this.apiPath}/videos/stream`;
  },
  
  get videoListBase() {
    return `${this.baseURL}${this.apiPath}/videos`;
  }
};

// Export for convenience
export default API_CONFIG;

