import axios from "axios";
import * as SecureStore from "expo-secure-store";

const _rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? "http://localhost:3000" : "https://api.kaytipic.com");

// Ensure the base URL always ends with /api regardless of how the env var is set
const API_BASE = _rawApiUrl.replace(/\/api\/?$/, "") + "/api";

// ── snake_case → camelCase transform for Prisma responses ──
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function transformKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item));
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.entries(obj as Record<string, unknown>).reduce(
      (acc, [key, value]) => {
        acc[snakeToCamel(key)] = transformKeys(value);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }
  return obj;
}

// Named exports: `apiClient` for stores, `api` for service modules
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Retry on network errors (not 4xx/5xx) ──
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

apiClient.interceptors.response.use(
  // Transform snake_case API responses to camelCase
  (response) => {
    if (response.data) {
      response.data = transformKeys(response.data);
    }
    return response;
  },
  async (error) => {
    const config = error.config;

    // Handle 401: clear token
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("accessToken");
      return Promise.reject(error);
    }

    // Only retry on network errors (no response) — not on 4xx/5xx
    if (error.response || !config) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount ?? 0;
    if (config.__retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    config.__retryCount += 1;
    const delay = RETRY_DELAY_MS * Math.pow(2, config.__retryCount - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));

    return apiClient(config);
  },
);

export const api = apiClient;
