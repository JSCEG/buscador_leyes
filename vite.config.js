import { defineConfig } from 'vite';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const manifestPlugin = () => {
  return {
    name: 'manifest-generator',
    configureServer(server) {
      const handleFileChange = async (file) => {
        if (file.includes('public') && file.includes('data') && file.endsWith('.json') && !file.endsWith('manifest.json')) {
          console.log(`[Manifest Plugin] File changed: ${file}. Regenerating manifest...`);
          try {
            await execAsync('node generate-manifest.js');
            console.log('[Manifest Plugin] Manifest regenerated.');
          } catch (error) {
            console.error('[Manifest Plugin] Error regenerating manifest:', error);
          }
        }
      };

      server.watcher.on('add', handleFileChange);
      server.watcher.on('unlink', handleFileChange);
      // We don't need to watch 'change' for manifest generation unless filenames change, but 'add'/'unlink' cover new/deleted files.
      // If content changes, manifest doesn't change, but search index might need reload (which Vite HMR might not handle for raw JSON fetch).
      // But for manifest, add/unlink is key.
    }
  }
};

export default defineConfig({
  plugins: [manifestPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  build: {
    outDir: 'dist',
  },
});
