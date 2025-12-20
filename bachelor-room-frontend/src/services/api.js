import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Use full URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't add XSRF token for API calls
    delete config.headers['X-XSRF-TOKEN'];
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
     
      toast.error('Session expired. Please login again.');
       window.location.href = '/login';
    } else if (error.response?.status === 419) {
      // CSRF token mismatch - clear tokens and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
     
      toast.error('Session expired. Please login again.');
    window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;