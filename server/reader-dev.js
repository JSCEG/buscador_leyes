import { serveReaderPdf } from './reader-pdf.js';

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
    };
    return { name: 'reader-remote-pdf', configureServer: configure, configurePreviewServer: configure };
}
