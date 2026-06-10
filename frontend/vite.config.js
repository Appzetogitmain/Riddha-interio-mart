import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['recharts', 'lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('lucide-react') || id.includes('react-icons')) return 'vendor-icons';
            // Let Vite handle React and other libraries automatically to prevent context errors
          }
        }
      }
    },
    chunkSizeWarningLimit: 800
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
});
