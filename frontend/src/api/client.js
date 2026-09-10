import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Request interceptor to automatically attach active store ID
api.interceptors.request.use((config) => {
  const activeStoreId = localStorage.getItem('active_store_id');
  if (activeStoreId) {
    config.headers['X-Store-Id'] = activeStoreId;
  }
  return config;
});

// Response interceptor for easy error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
