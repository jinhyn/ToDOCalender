import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

const instance = axios.create({
  baseURL: API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use((config) => {
  const token = window.Kakao?.Auth?.getAccessToken?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
