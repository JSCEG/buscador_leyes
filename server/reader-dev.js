import { serveReaderPdf } from './reader-pdf.js';
import { serveCne } from './cne-proxy.js';

/** The local app uses the same handler as Cloudflare Pages. */
export function readerDevPlugin() {
    const configure = server => {
        server.middlewares.use('/api/reader', async (req, res) => {
            try {
                const url = new URL(req.url, 'http://localhost');
                const sourceId = url.pathname.slice(1);
                const response = await serveReaderPdf(new Request(url, { method: req.method }), sourceId);
                res.writeHead(response.status, Object.fromEntries(response.headers));
                res.end(Buffer.from(await response.arrayBuffer()));
            } catch {
                res.writeHead(502, { 'Cache-Control': 'no-store' });
                res.end();
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
    };
    return { name: 'reader-remote-pdf', configureServer: configure, configurePreviewServer: configure };
}
