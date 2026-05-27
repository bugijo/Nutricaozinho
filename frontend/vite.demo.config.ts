import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build de DEMONSTRAÇÃO: gera um único index.html com tudo embutido (JS, CSS e imagens),
// que abre direto no navegador (file://) sem servidor nem backend (usa o mock).
// Uso: VITE_USE_MOCK=true vite build --config vite.demo.config.ts
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist-demo',
    assetsInlineLimit: 100_000_000, // inclui a logo como data URI
    chunkSizeWarningLimit: 100_000,
  },
});
