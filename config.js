// config.js
const API_URL = 'http://localhost:5000/api';
const LOGIN_URL = `${API_URL}/login`;
const REGISTER_URL = `${API_URL}/register`;
const PRESCRIPTION_URL = `${API_URL}/prescription`;

export const API_ENDPOINTS = {
    LOGIN: '/login',
    REGISTER: '/register',
    PRESCRIPTION: '/prescription'
  };
  
  export const ERROR_MESSAGES = {
    LOGIN_FAILED: 'Invalid username or password',
    PASSWORD_MISMATCH: 'Passwords do not match',
    GENERIC: 'Something went wrong. Please try again.'
  };