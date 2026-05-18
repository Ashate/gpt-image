import axios from 'axios';

// In Docker/production, VITE_API_BASE_URL is injected at build time.
// In dev, Vite proxy forwards /api → localhost:3001, so '' works fine.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 min for image generation
});

// Attach auth token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const imagesApi = {
  generate: (data) => api.post('/images/generate', data),
};

export const conversationsApi = {
  list: () => api.get('/conversations'),
  getMessages: (id) => api.get(`/conversations/${id}/messages`),
  delete: (id) => api.delete(`/conversations/${id}`),
  rename: (id, title) => api.patch(`/conversations/${id}`, { title }),
};

export default api;
