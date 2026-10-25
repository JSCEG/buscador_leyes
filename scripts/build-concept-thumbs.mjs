/**
 * Thumbnails for the «¿Cómo funciona?» cards: each figure, light and dark, captured from the dev
 * server with headless Chrome (DevTools protocol, no extra packages) and saved as transparent WebP in
 * public/conceptos/miniaturas/. Needs `npm run dev` running.
 * Run: node scripts/build-concept-thumbs.mjs [--base http://localhost:5173] [--chrome "C:\\...\\chrome.exe"]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CONCEPTOS } from '../src/data/como-funciona.js';

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const BASE = arg('--base', 'http://localhost:5173');
const CHROME = arg('--chrome', process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome');
const OUT = new URL('../public/conceptos/miniaturas/', import.meta.url);
const PORT = 9333;
const WIDTH = 760;
const SETTLE_MS = 2600;
// Only the drawing: no buttons, chips or part names.
const CLEAN_CSS = '.cf-names-toggle,.cf-chips,[data-part="labels"],.iso-plate-corners{display:none!important}';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const profile = mkdtempSync(join(tmpdir(), 'thumbs-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });

let target;
for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch { /* not up yet */ }
}
if (!target) throw new Error('Chrome no respondió en el puerto de depuración.');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let nextId = 0;
const pending = new Map();
const waiters = [];
ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else if (msg.method) waiters.filter(w => w.method === msg.method).forEach(w => w.resolve(msg.params));
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, msg => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id, method, params }));
});
const once = method => new Promise(resolve => { const w = { method, resolve: p => { waiters.splice(waiters.indexOf(w), 1); resolve(p); } }; waiters.push(w); });

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

mkdirSync(OUT, { recursive: true });
const figures = [...new Set(CONCEPTOS.map(c => c.figura))];
let bytes = 0;
for (const figura of figures) {
    for (const theme of ['light', 'dark']) {
        const file = `${figura}${theme === 'light' ? '-light' : ''}`;
        const loaded = once('Page.loadEventFired');
        await send('Page.navigate', { url: `${BASE}/conceptos/${file}.html` });
        await loaded;
        await send('Runtime.evaluate', { expression: `document.head.insertAdjacentHTML('beforeend', '<style>${CLEAN_CSS}</style>')` });
        await sleep(SETTLE_MS);
        const { result } = await send('Runtime.evaluate', {
            // The anatomy figures draw in .iso-stage; the visual-explainer ones have their own markup: take the largest svg.
            expression: `JSON.stringify((() => { const b = [...document.querySelectorAll('.iso-stage svg, svg')].map(s => s.getBoundingClientRect()).sort((a, c) => c.width * c.height - a.width * a.height)[0]; return { x: b.x, y: b.y + scrollY, width: b.width, height: b.height }; })())`,
            returnByValue: true,
        });
        const clip = { ...JSON.parse(result.value), scale: 0.6 };
        const { data } = await send('Page.captureScreenshot', { format: 'webp', quality: 72, clip, captureBeyondViewport: true });
        const buffer = Buffer.from(data, 'base64');
        writeFileSync(new URL(`${file}.webp`, OUT), buffer);
        bytes += buffer.length;
        console.log('wrote', `${file}.webp`, Math.round(buffer.length / 1024), 'KB');
    }
}
console.log(`${figures.length * 2} miniaturas, ${Math.round(bytes / 1024)} KB en total`);
ws.close();
chrome.kill();
await sleep(500);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome may still hold the profile */ }
