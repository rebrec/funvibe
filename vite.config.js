import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Sur GitHub Pages (repo "funvibe"), la base doit être "/funvibe/".
  // En développement local, on laisse la base à "/".
  base: process.env.GITHUB_PAGES ? '/funvibe/' : '/',
  build: {
    rollupOptions: {
      input: {
        main:    resolve(__dirname, 'index.html'),
        editor:  resolve(__dirname, 'editor/index.html'),
        preview: resolve(__dirname, 'preview/index.html'),
      },
    },
  },
});
