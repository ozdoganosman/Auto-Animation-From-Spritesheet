import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Use relative base so the site works under subpaths (e.g., GitHub Pages repo URL)
export default defineConfig({
  base: './',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          // Copy root assets folder into dist/assets
          src: 'assets',
          dest: ''
        }
      ]
    })
  ]
});
