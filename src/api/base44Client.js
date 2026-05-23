import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl, serverUrl } = appParams;

if (!appId || appId === 'null') {
  console.error('[base44] app_id is not set. API requests will fail. Check URL params or VITE_BASE44_APP_ID env var.');
}

/**
 * Dev: same-origin (localhost:5173) so Vite proxies /api and /ws-user-apps to VITE_BASE44_APP_BASE_URL.
 * Prod/preview: configured server URL or Base44 default.
 */
const resolvedServerUrl = import.meta.env.DEV
  ? (typeof window !== 'undefined' ? window.location.origin : '')
  : (serverUrl || 'https://base44.app');

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: resolvedServerUrl,
  requiresAuth: false,
  appBaseUrl,
});