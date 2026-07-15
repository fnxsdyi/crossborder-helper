import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { compression } from 'vite-plugin-compression2'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    compression({ algorithms: ['gzip'] }),
    compression({ algorithms: ['brotliCompress'] }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase'
          }
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/pdf-lib')) {
            return 'vendor-pdf'
          }
          if (id.includes('node_modules/zustand') || id.includes('node_modules/lucide-react')) {
            return 'vendor-utils'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
