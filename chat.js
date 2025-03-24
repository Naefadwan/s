// chat.js
import { API_ENDPOINTS } from './config.js';

export async function sendMessage(message) {
  const response = await fetch(API_ENDPOINTS.PRESCRIPTION, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms: message })
  });
  return response.json();
}