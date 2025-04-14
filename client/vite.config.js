import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import istanbul from 'vite-plugin-istanbul'

export default defineConfig({
  plugins: [
    react(),
    istanbul({
      include: 'src/**/*.{js,ts,jsx,tsx}', // Include all files recursively within the src folder
      exclude: ['node_modules', 'test/'], // Exclude test files and node_modules
      extension: ['.js', '.ts', '.jsx', '.tsx'], // Extensions to be included
      cypress: false, // If you are using Cypress, set this to true
      requireEnv: false // If true, require env variables for Istanbul
    })
  ],
})
