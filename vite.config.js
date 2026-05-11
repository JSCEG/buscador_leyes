import { defineConfig } from 'vite';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const manifestPlugin = () => {
  return {
    name: 'manifest-generator',
    configureServer(server) {
      // isReady evita que los eventos 'add' del escaneo inicial de chokidar
      // (uno por cada JSON existente en public/data/) disparen regeneraciones
      // en cascada que causan full-reloads repetidos al arrancar.
      let isReady = false;
      let debounceTimer = null;

      const regenerateManifest = async (file) => {
        console.log(`[Manifest Plugin] File changed: ${file}. Regenerating manifest...`);
        try {
          await execAsync('node generate-manifest.js');
          console.log('[Manifest Plugin] Manifest regenerated.');
        } catch (error) {
          console.error('[Manifest Plugin] Error regenerating manifest:', error);
        }
      };

      const handleFileChange = (file) => {
        if (!isReady) return;
        if (file.includes('public') && file.includes('data') && file.endsWith('.json') && !file.endsWith('manifest.json')) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => regenerateManifest(file), 300);
        }
      };

      server.watcher.once('ready', () => { isReady = true; });
      server.watcher.on('add', handleFileChange);
      server.watcher.on('unlink', handleFileChange);
    }
  }
};

export default defineConfig({
  plugins: [manifestPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  // Reemplaza __BUILD_TIME__ en el bundle con el timestamp del build actual.
  // El Service Worker usa este valor como versión de caché, garantizando que
  // cada deploy limpie automáticamente el caché obsoleto del browser.
  define: {
    __BUILD_TIME__: JSON.stringify(Date.now().toString()),
  },
  build: {
    outDir: 'dist',
    // Limpia dist/ antes de cada build para evitar acumulación de assets viejos
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    hmr: {
      clientPort: 5173
    }
  }
});
