import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_API_BASE_URL = 'https://bpm.dalasteppes.kz';
const STORAGE_KEY = 'bpm.api_base_url';

// In-memory cache so client.js can read the current URL synchronously on
// every request instead of hitting AsyncStorage each time. loadApiBaseUrl()
// must be awaited once at app boot, before any request fires, to populate it.
let currentBaseUrl = DEFAULT_API_BASE_URL;

export function getApiBaseUrl() {
  return currentBaseUrl;
}

export async function loadApiBaseUrl() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) currentBaseUrl = stored;
  } catch {
    // Ignore — fall back to the default already set above.
  }
  return currentBaseUrl;
}

export async function setApiBaseUrl(url) {
  const normalized = normalizeUrl(url);
  currentBaseUrl = normalized;
  await AsyncStorage.setItem(STORAGE_KEY, normalized);
  return normalized;
}

function normalizeUrl(url) {
  return url.trim().replace(/\/+$/, '');
}
