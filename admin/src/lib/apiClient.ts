import axios from 'axios';

const tokenStorageKey = 'admin_access_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(tokenStorageKey);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(tokenStorageKey, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(tokenStorageKey);
}

const baseURL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || 'unknown-url';
    const status = error?.response?.status || 'unknown-status';
    const message = error?.message || 'unknown-error';
    console.error(`[api] ${url} ${status} ${message}`);
    return Promise.reject(error);
  }
);

export default apiClient;
