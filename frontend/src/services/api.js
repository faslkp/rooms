import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('auth');
    if (raw) {
      const { access } = JSON.parse(raw);
      if (access) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${access}`;
      }
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const raw = localStorage.getItem('auth');
        
        if (!raw) {
          throw new Error('No auth data');
        }

        const { refresh } = JSON.parse(raw);
        if (!refresh) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
          refresh,
        });

        const { access } = response.data;

        const authData = JSON.parse(raw);
        authData.access = access;
        localStorage.setItem('auth', JSON.stringify(authData));

        window.dispatchEvent(new CustomEvent('auth-token-refreshed', { detail: { access } }));

        if (api.defaults.headers.common) {
          api.defaults.headers.common.Authorization = `Bearer ${access}`;
        }

        processQueue(null, access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('auth');
        if (api.defaults.headers.common) {
          delete api.defaults.headers.common.Authorization;
        }
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

