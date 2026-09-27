import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base relative : le build (dist/) est un site statique déployable n'importe où.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
