import axios from 'axios';

// Determine API base URL:
// 1) Honor REACT_APP_API_BASE_URL if provided (explicit override).
// 2) If running the React dev server on localhost (non-standard port like 3000)
//    assume the PHP backend is served by Apache on the host at /ems/api and
//    use the absolute URL so requests go to the correct server.
// 3) Otherwise use a relative '/api' path (works when the client is served
//    by the same host as the API, e.g. production build served by Apache).
const baseURL = (function() {
  if (process.env.REACT_APP_API_BASE_URL) return process.env.REACT_APP_API_BASE_URL;
  try {
    const host = window.location.hostname;
    const port = window.location.port;
    // If we're on localhost with a dev server port (commonly 3000), point to
    // the Apache-hosted API which lives at /ems/api on the local webserver.
    if ((host === 'localhost' || host === '127.0.0.1') && port && port !== '80') {
      return 'http://127.0.0.1:8080/ems/api';
    }
  } catch (err) {
    // window may be undefined in some build-time environments; ignore and
    // fall back to the relative path.
  }
  return '/api';
})();
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to automatically add the Authorization header
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ems_token'); // Ensure this key matches your AuthContext
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    // Ensure that GET requests that expect a list always return an array
    // This prevents crashes on pages that try to .map() over non-array data.
    if (response.config.method === 'get' && !Array.isArray(response.data)) {
      // You might want to be more specific here based on endpoint, but this is a safe default.
      if (response.data && Object.keys(response.data).length === 0) {
         response.data = [];
      }
    }
    return response;
  },
  (error) => {
    // Global error handling
    if (error.response?.status === 401) {
      // Unauthorized: Token is invalid or expired.
      // Clear user data and redirect to login.
      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');
      window.location.href = '/login'; // Force a full page reload to clear all state
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

