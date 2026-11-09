import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/marketing/',
  build: { outDir: 'dist', emptyOutDir: true, assetsDir: 'assets' },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.BOMACH_MARKETING_DEV_PORT || 5177),
    strictPort: true,
    ...(process.env.NODE_ENV !== 'production' ? { hmr: { clientPort: 5173 } } : {}),
  },
  preview: { port: 4177, strictPort: true },
  plugins: [
    TanStackRouterVite(),
    tailwindcss(),
    react(),
  ],
})
