import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// GitHub Pages serves this project at https://<user>.github.io/eArrow-LMS_DEMO/, so production builds use that sub-path.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/eArrow-LMS_DEMO/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
}))
