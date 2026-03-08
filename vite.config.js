import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const projectRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Load .env so proxy has VITE_ANTHROPIC_API_KEY (dev server runs in Node)
  const env = loadEnv(mode, projectRoot, '')
  const apiKey = env.VITE_ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY || ''

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
      proxy: {
        '/api/messages': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => '/v1/messages',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
        },
        // Default backend proxy for all application API routes.
        '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
