// auth.js
import { API_ENDPOINTS, ERROR_MESSAGES } from './config.js';

export async function login(username, password) {
  try {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || ERROR_MESSAGES.GENERIC);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Similar register function