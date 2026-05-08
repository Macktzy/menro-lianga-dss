import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
  registerType: 'autoUpdate',
  devOptions: {
    enabled: true // This keeps the PWA active while we are coding
  },
  // We removed the files you don't have yet from here
  includeAssets: ['logo-192.png', 'logo-512.png'],
  manifest: {
    name: 'Lianga Municipal Environment and Natural Resources Office - Lianga DSS',
    short_name: 'MENRO Lianga',
    description: 'Waste Management portal for LGU Lianga Decision Support System',
    theme_color: '#ffffff',
    background_color: '#f4f7f6',
    display: 'standalone',
    icons: [
      {
        src: '/logo-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/logo-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
})
  ],
})