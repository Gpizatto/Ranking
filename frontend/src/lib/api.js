import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Base API sem slug — usado para rotas globais (federações, auth)
export const API_BASE = `${BACKEND_URL}/api`;

// Retorna a URL base da API para a federação atual
// Uso: getAPI(slug) → "https://backend.com/api/fsp"
export const getAPI = (slug) => `${BACKEND_URL}/api/${slug}`;

// Mantido para compatibilidade — usar getAPI(slug) nas páginas
export const API = API_BASE;

// ── Auth helpers ──

export const setAuthToken = (token, slug) => {
  const key = slug ? `token_${slug}` : 'token';
  if (token) {
    localStorage.setItem(key, token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(key);
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = (slug) => {
  const key = slug ? `token_${slug}` : 'token';
  const token = localStorage.getItem(key);
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return token;
};

export const isAuthenticated = (slug) => {
  return !!getAuthToken(slug);
};

export const logout = (slug) => {
  setAuthToken(null, slug);
};

// Initialize token on load (fallback sem slug)
getAuthToken();

export default axios;