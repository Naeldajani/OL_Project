import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Two independent sites share this repo (and its data layer):
//   index.html       -> Gones Analytics
//   lugdunhome.html  -> Lugdun'Home
//
// VITE_BASE lets the GitHub Pages workflow serve them from /<repo>/ while
// local dev and preview keep working at the root.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
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
