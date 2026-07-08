import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const isDashboard = process.env.BUILD_TARGET === 'dashboard'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    emptyOutDir: !isDashboard,
    rollupOptions: {
      input: isDashboard
        ? { dashboard: path.resolve(__dirname, 'dashboard.html') }
        : { sidepanel: path.resolve(__dirname, 'sidepanel.html') },
      output: {
        format: 'iife',
        entryFileNames: '[name].js',
        assetFileNames: '[name].css',
        inlineDynamicImports: true,
      }
    }
  }
})
