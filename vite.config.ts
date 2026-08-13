import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Two independent sites share this repo (and its data layer):
//   index.html       -> Gones Analytics
//   lugdunhome.html  -> Lugdun'Home
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lugdunhome: resolve(__dirname, 'lugdunhome.html'),
      },
    },
  },
})
