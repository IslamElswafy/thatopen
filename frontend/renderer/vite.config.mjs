import { defineConfig } from 'vite';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: '../../html/dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/index.ts'),
      output: {
        entryFileNames: 'assets/[name].js',     
        chunkFileNames: 'assets/[name].js',      
        assetFileNames: 'assets/[name].[ext]'    
      }
    },
    chunkSizeWarningLimit: 10000,
    sourcemap: true,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'dist/web-ifc.wasm', dest: '../wasm' }
      ]
    })
  ],
  server: {
    port: 3000,
    cors: true,
  },
});