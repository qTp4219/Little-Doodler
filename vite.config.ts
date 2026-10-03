import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Support flexible base path for GitHub Pages and static hosting:
  // 1. Explicit VITE_BASE_PATH (e.g. '/little-doodler/' or '/')
  // 2. Automated GitHub Actions repo detection: GITHUB_REPOSITORY (e.g. 'octocat/little-doodler' -> '/little-doodler/')
  // 3. Fallback to relative './' which works on any subpath or static folder
  let base = process.env.VITE_BASE_PATH;
  if (!base && process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    base = `/${repoName}/`;
  }
  if (!base) {
    base = './';
  }

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
