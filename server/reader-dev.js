import { serveReaderPdf } from './reader-pdf.js';
import { serveCne } from './cne-proxy.js';
import { serveMapa } from './mapa-proxy.js';
import { servePermisos } from './permisos-proxy.js';
import { readFileSync } from 'node:fs';

/** The local app uses the same handler as Cloudflare Pages. */
export function readerDevPlugin() {
    const configure = server => {
        server.middlewares.use('/api/reader', async (req, res) => {
            try {
                const url = new URL(req.url, 'http://localhost');
                const sourceId = url.pathname.slice(1);
                const response = await serveReaderPdf(new Request(url, { method: req.method }), sourceId);
                res.writeHead(response.status, Object.fromEntries(response.headers));
                // Stream like the Worker does, so the reader sees real progress; a rejected stream
                // ends the connection early instead of completing the file.
                if (response.body) for await (const chunk of response.body) res.write(chunk);
                res.end();
            } catch {
                if (!res.headersSent) res.writeHead(502, { 'Cache-Control': 'no-store' });
                res.destroy();
            }
        });
        // CNE registry proxy (functions/api/cne/[endpoint].js), without the edge cache.
        server.middlewares.use('/api/cne', async (req, res) => {
            try {
                const url = new URL(req.url, 'http://localhost');
                const chunks = [];
                for await (const chunk of req) chunks.push(chunk);
                const body = chunks.length ? Buffer.concat(chunks).toString('utf8') : undefined;
                const request = new Request(url, { method: req.method, body: req.method === 'POST' ? body : undefined });
                const response = await serveCne(request, url.pathname.slice(1), { cache: null });
                res.writeHead(response.status, Object.fromEntries(response.headers));
                res.end(Buffer.from(await response.arrayBuffer()));
            } catch (error) {
                console.warn('[cne-proxy] dev', error?.message);
                res.writeHead(502, { 'Cache-Control': 'no-store' });
                res.end();
            }
        });
        // Permits map (functions/api/mapa/[endpoint].js), without the edge cache. DGMESNIE_URL in the
        // environment points it at a local DGMESNIE (e.g. http://localhost:5155) while developing.
        server.middlewares.use('/api/mapa', async (req, res) => {
            try {
                const url = new URL(req.url, 'http://localhost');
                const response = await serveMapa(new Request(url, { method: req.method }), url.pathname.slice(1), { cache: null, base: process.env.DGMESNIE_URL });
                res.writeHead(response.status, Object.fromEntries(response.headers));
                res.end(Buffer.from(await response.arrayBuffer()));
            } catch (error) {
                console.warn('[mapa-proxy] dev', error?.message);
                res.writeHead(502, { 'Cache-Control': 'no-store' });
                res.end();
            }
        });
        // CNE and SENER permits API (functions/api/permisos/[endpoint].js), without the edge cache. The key
        // comes from PERMISOS_API_KEY or from the private file Codex left for this client (never committed).
        const permisosKey = () => {
            if (process.env.PERMISOS_API_KEY) return process.env.PERMISOS_API_KEY.trim();
            try { return readFileSync(process.env.PERMISOS_API_KEY_FILE || 'services/permisos-api/.secrets/buscador.key', 'utf8').trim(); } catch { return ''; }
        };
        server.middlewares.use('/api/permisos', async (req, res) => {
            try {
                const url = new URL(req.url, 'http://localhost');
                const response = await servePermisos(new Request(url, { method: req.method }), url.pathname.slice(1), { cache: null, key: permisosKey(), base: process.env.PERMISOS_API_URL });
                res.writeHead(response.status, Object.fromEntries(response.headers));
                res.end(Buffer.from(await response.arrayBuffer()));
            } catch (error) {
                console.warn('[permisos-proxy] dev', error?.message);
                res.writeHead(502, { 'Cache-Control': 'no-store' });
                res.end();
            }
        });
    };
    return { name: 'reader-remote-pdf', configureServer: configure, configurePreviewServer: configure };
}
