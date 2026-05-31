import { defineConfig } from 'vite';

// base '/super-pezz/' = il sito è servito dalla sottocartella del repo
// su GitHub Pages (https://pezzaliapp.github.io/super-pezz/).
export default defineConfig({
  base: '/super-pezz/',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
  server: {
    host: true, // espone il dev server in LAN: utile per provare su iPhone
    port: 5173,
  },
});
