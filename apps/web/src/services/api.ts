import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('petlife_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
