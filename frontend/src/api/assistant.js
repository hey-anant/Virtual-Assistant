import axios from 'axios';

const serverUrl = import.meta.env.VITE_SERVER_URL !== undefined
    ? import.meta.env.VITE_SERVER_URL
    : (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000');

const api = axios.create({
    baseURL: serverUrl,
    withCredentials: true,
});

export const fetchCurrentUser = () => api.get('/api/user/current');
export const loginUser = (email, password) => api.post('/api/auth/login', { email, password });
export const signupUser = (name, email, password) => api.post('/api/auth/signup', { name, email, password });
export const logoutUser = () => api.get('/api/auth/logout');
export const askAssistant = (command) => api.post('/api/user/askAssistant', { command });
export const updateAssistant = (formData) => api.post('/api/user/update', formData);

export { serverUrl };
export default api;
