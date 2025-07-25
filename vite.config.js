import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],  // <-- ECCO LA VIRGOLA CHE MANCAVA
  server: {
    host: true,
    allowedHosts: ['penguin.linux.test']
  }
});
