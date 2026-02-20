import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || 'unknown-url';
    const status = error?.response?.status || 'unknown-status';
    const message = error?.message || 'unknown-error';
    const isInitialAuthCheck = status === 401 && String(url).includes('/api/auth/me');
    const isLoginFailure = status === 401 && String(url).includes('/api/auth/login');
    if (!isInitialAuthCheck && !isLoginFailure) {
      console.error(`[api] ${url} ${status} ${message}`);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
