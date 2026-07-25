import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── Set your API base URL here ──────────────────────────────────────────────
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.104:3000/api/v1';
// ───────────────────────────────────────────────────────────────────────────
console.log('API_BASE_URL:', API_BASE_URL);
const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  console.log('→ requesting:', config.method?.toUpperCase(), config.baseURL + config.url);
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);

      if (!refreshToken) {
        await clearTokens();
        // Navigation handled by auth store listener
        return Promise.reject(err);
      }

      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
            .then(async (r) => {
              const { accessToken, refreshToken: newRefresh } = r.data.data as {
                accessToken: string;
                refreshToken: string;
              };
              await setTokens(accessToken, newRefresh);
              return accessToken;
            })
            .finally(() => { refreshing = null; });
        }

        const newToken = await refreshing;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        await clearTokens();
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  },
);

export async function setTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
