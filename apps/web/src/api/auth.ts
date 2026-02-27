import axios from 'axios';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('covercraft-auth');
    const token = stored ? JSON.parse(stored)?.state?.token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

export const registerUser = (data: any) => API.post('/auth/register', data);

export const loginUser = (data: any) => API.post('/auth/login', data);

export const googleAuth = (data: any) => API.post('/auth/google', data);

export const getMe = () => API.get('/auth/me');

export const getUniversities = () => API.get('/universities');
export const getProfile = () => API.get('/profile');
export const upsertProfile = (data: any) => API.put('/profile', data);

export const getTemplates = () => API.get('/templates');
export const getCovers = () => API.get('/covers');
export const createCover = (data: any) => API.post('/covers', data);
export const generateCover = (data: any) => API.post('/covers/generate', data);
export const deleteCover = (id: string) => API.delete(`/covers/${id}`);

export default API;
