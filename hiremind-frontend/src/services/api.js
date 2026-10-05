import axios from 'axios';
import { STORAGE_KEYS } from '../lib/constants';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

let authLogoutHandler = null;
export const setLogoutHandler = (handler) => {
  authLogoutHandler = handler;
};

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      } catch {
      }
      if (authLogoutHandler) {
        authLogoutHandler();
      }
    }
    return Promise.reject(error);
  }
);

export async function apiWrapper(fn, options = {}) {
  const { showLoading = false, defaultError = 'Something went wrong. Please try again.' } = options;
  try {
    if (showLoading) {
    }
    const result = await fn();
    return result;
  } catch (error) {
    const err = {
      message: error?.response?.data?.message || error?.message || defaultError,
      status: error?.response?.status,
      data: error?.response?.data,
      original: error,
    };
    throw err;
  } finally {
    if (showLoading) {
    }
  }
}

export function getErrorMessage(error, fallback = 'An unexpected error occurred') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error?.message || error?.data?.message || fallback;
}

export default api;
