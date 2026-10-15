import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base relativa: funciona en GitHub Pages (subcarpeta) y en cualquier hosting estático
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // PREVIEW=1 genera una vista previa sin service worker (p. ej. para incrustar en un solo archivo)
    !process.env.PREVIEW && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'ThyroidScore Pro · ATA 2025',
        short_name: 'ThyroidScore',
        description: 'Estratificación de riesgo en cáncer diferenciado de tiroides (ATA 2025, AJCC 8.ª, Tabla 9).',
        lang: 'es',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#f1f5f9',
        theme_color: '#0f172a',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
