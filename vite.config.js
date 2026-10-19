import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Spotify's OAuth redirect URIs require the literal 127.0.0.1 loopback
  // address for local dev (it rejects the "localhost" hostname) — bind
  // there explicitly since Node otherwise prefers the IPv6 ::1 loopback.
  server: {
    host: '127.0.0.1',
  },
})
