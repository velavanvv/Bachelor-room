import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bachelor-room.onrender.com/api';
export const CHAT_ROOM_WS_URL =
  import.meta.env.VITE_CHAT_ROOM_WS_URL || 'wss://bachelor-room-1.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const skipAuthRedirect = error.config?.skipAuthRedirect === true;
    const isLoginRequest = requestUrl.includes('/login');

    if (error.response?.status === 401 && !skipAuthRedirect && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 419 && !skipAuthRedirect) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // Auth
  login: (email, password) => api.post('/login', { email, password }, { skipAuthRedirect: true }),
  logout: () => api.post('/logout'),
  forgotPassword: (email) =>
    api.post('/forgot-password', { email }, { skipAuthRedirect: true }),
  resetPassword: (payload) =>
    api.post('/reset-password', payload, { skipAuthRedirect: true }),
  
  // Users
  getUsers: () => api.get('/users'),
  getAllUsers: () => api.get('/admin/users'),
  createUser: (userData) => api.post('/admin/create-member', userData),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Contributions
  payContribution: (data) => api.post('/contributions/pay', data),
  getContributionsByMonth: (month) => api.get(`/contributions/month/${month}`),
  
  // Expenses
  getExpenses: () => api.get('/expenses'),
  getRecentExpenses: () => api.get('/expenses/recent'),
  getExpensesByMonth: (month) => api.get(`/expenses/month/${month}`),
  createExpense: (data) => api.post('/expenses', data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  
  // Wallet
  getWalletByMonth: (month) => api.get(`/wallet/${month}`),
  getCurrentWallet: () => api.get('/wallet/current'),
  
  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats'),
  getRecentActivities: () => api.get('/dashboard/activities'),

  // Chatbot
  sendChatMessage: (payload) => api.post('/chatbot/message', payload),

  // Live chat room
  getChatRoomMessages: (room = 'main-room', limit = 50) =>
    api.get('/chat-room/messages', { params: { room, limit } }),
  createChatRoomMessage: (payload) => api.post('/chat-room/messages', payload),
};

export default api;
