import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── Backend URL ───────────────────────────────────────────────────────────────
// PRODUCTION  → your Railway URL (check Railway dashboard → your service → Settings → Domains)
// LOCAL DEV   → your machine's LAN IP  e.g. http://192.168.1.7:5000/api  (run `ipconfig` to find it)
export const BASE_URL = 'https://banyanvision-prod.up.railway.app/api';
// export const BASE_URL = 'http://192.168.1.7:5000/api'; // ← uncomment for local dev

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
client.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('bv_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Handle 401 globally — token expired
client.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('bv_token');
    }
    return Promise.reject(err);
  }
);

export default client;
