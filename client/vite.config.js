import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import istanbul from 'vite-plugin-istanbul'

export default defineConfig({
  plugins: [
    react(),
    istanbul({
      include: 'src/*.{js,ts,jsx,tsx}',
      exclude: ['node_modules', 'test/'],
      extension: [ '.js', '.ts', '.jsx', '.tsx' ],
      cypress: false,
      requireEnv: false
    })
  ],
})
