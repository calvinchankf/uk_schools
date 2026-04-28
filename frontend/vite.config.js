import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/uk_schools/',
  build: {
    outDir: '../docs'
  },
  server: {
    port: 3000
  }
})
