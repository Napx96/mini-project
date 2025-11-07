import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost/ems/api',
});

// Add a request interceptor to automatically add the Authorization header
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // Or get from AuthContext
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Optional: Add a response interceptor for global error handling
api.interceptors.response.use(response => response, error => {
  console.error('API Error:', error.response);
  return Promise.reject(error);
});

export default api;