import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import base44 from '@base44/vite-plugin'

/**
 * Local dev: browser calls http://localhost:5173/api/... and /ws-user-apps/...
 * Vite proxies those paths to VITE_BASE44_APP_BASE_URL (your *.base44.app host).
 * This matches production, where the app and API share the same origin.
 */
function base44DevProxy(env) {
  const target = env.VITE_BASE44_APP_BASE_URL?.trim()
  if (!target) {
    console.warn(
      '[vite] VITE_BASE44_APP_BASE_URL is not set — /api and WebSocket proxy disabled. Add it to .env.local',
    )
    return {}
  }

  const shared = {
    target,
    changeOrigin: true,
    secure: true,
  }

  return {
    '/api': shared,
    '/ws-user-apps': {
      ...shared,
      ws: true,
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = mode === 'development' ? base44DevProxy(env) : undefined

  if (mode === 'development' && env.VITE_BASE44_APP_BASE_URL) {
    console.log(`[vite] Base44 proxy → ${env.VITE_BASE44_APP_BASE_URL}`)
  }

  return {
    plugins: [react(), base44()],
    server: {
      host: true,
      port: 5173,
      proxy,
    },
  }
})
