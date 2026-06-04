import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'favicon-32.png', 'icons/*.png'],

      // ── Web App Manifest ───────────────────────────────────────────────────
      manifest: {
        name: 'App Cifra',
        short_name: 'Cifra',
        description: 'Seu caderno de cifras digital — acorde, letra e muito mais',
        theme_color: '#e55a4a',
        background_color: '#e55a4a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'pt-BR',
        categories: ['music', 'utilities'],
        icons: [
          { src: 'icons/icon-72.png',  sizes: '72x72',   type: 'image/png' },
          { src: 'icons/icon-96.png',  sizes: '96x96',   type: 'image/png' },
          { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icons/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          // Maskable (Android adaptive icon — usa safe zone central)
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      // ── Workbox (service worker / cache) ──────────────────────────────────
      workbox: {
        // Pré-cache de todos os assets do build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Estratégia de cache para o app (network-first para o HTML,
        // cache-first para assets imutáveis)
        runtimeCaching: [
          {
            // HTML principal — sempre tenta a rede, cai no cache se offline
            urlPattern: /^https?:\/\/.+\/$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'app-shell', networkTimeoutSeconds: 3 },
          },
        ],

        // Limpa caches antigos automaticamente
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
});
