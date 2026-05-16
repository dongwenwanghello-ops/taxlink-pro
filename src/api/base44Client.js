import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl, serverUrl } = appParams;

if (!appId || appId === 'null') {
  console.error('[base44] app_id is not set. API requests will fail. Check URL params or VITE_BASE44_APP_ID env var.');
}

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: serverUrl || '',
  requiresAuth: false,
  appBaseUrl
});