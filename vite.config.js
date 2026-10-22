import { defineConfig, loadEnv } from 'vite';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readerDevPlugin } from './server/reader-dev.js';

const execAsync = promisify(exec);
const WEBSTORAGE_OFF = process.allowedNodeEnvironmentFlags.has('--no-experimental-webstorage') ? ['--no-experimental-webstorage'] : [];

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

// The server pages (/ley/…, /aprende/…, sitemap.xml) read the acervo with the same public address and
// anon key the app already ships; Cloudflare Pages has no runtime variables, so the build leaves them here.
const seoConfigPlugin = () => ({
  name: 'seo-config',
  apply: 'build',
  generateBundle() {
    const env = loadEnv('production', process.cwd(), 'VITE_');
    const config = { url: process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '', key: process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '' };
    this.emitFile({ type: 'asset', fileName: 'seo-config.json', source: JSON.stringify(config) });
  },
});

export default defineConfig({
  plugins: [manifestPlugin(), readerDevPlugin(), seoConfigPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Node 25+ ships its own localStorage (empty without --localstorage-file) and it hides jsdom's.
    // Older Node (CI runs 18) rejects the flag, so pass it only where Node knows it.
    poolOptions: {
      threads: { execArgv: WEBSTORAGE_OFF },
      forks: { execArgv: WEBSTORAGE_OFF },
    },
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
    // HMR utiliza el puerto real de Vite, también al arrancar con --port 5317.
  }
});
