/**
 * Regenerates the logos, app icons and share image in public/img from brandMarkSvg, with the local Chrome.
 * Run: node scripts/generate-brand-assets.mjs   (CHROME overrides the browser path)
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { brandMarkSvg } from '../src/lib/brand-mark.js';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = new URL('..', import.meta.url);
const INK = '#0a0707';
const RED = '#9b2247';
const PAPER = '#fafafa';
const NIGHT = '#080a19';
const WHITE = '#ffffff';
const PINK = '#e57a9a';

const inline = name => `url(data:font/woff2;base64,${readFileSync(new URL(`public/fonts/${name}`, ROOT)).toString('base64')})`;
const FONTS = readFileSync(new URL('src/styles/design/fonts.css', ROOT), 'utf8')
    .replace(/url\(["']?\/fonts\/([^"')]+)["']?\)/g, (_, name) => inline(name));
const page = (body, background = 'transparent') => `<!doctype html><meta charset="utf-8"><style>${FONTS}
html,body{margin:0;width:100%;height:100%;background:${background}}body{display:flex;align-items:center;justify-content:center}svg{display:block;width:100%;height:100%}</style>${body}`;
const mark = (height, color, lens) => `<div style="height:${height}px;aspect-ratio:379/448;flex:none">${brandMarkSvg({ color, lens })}</div>`;
const icon = (size, padding, color = INK, lens = RED, background = PAPER) => ({ width: size, height: size, html: page(mark(size * (1 - padding * 2), color, lens), background) });
const lockup = (color, lens) => ({
    width: 960, height: 240,
    html: page(`<div style="display:flex;align-items:center;gap:28px;height:100%">${mark(190, color, lens)}<div style="font:500 92px/1 Fraunces,serif;letter-spacing:-.02em;color:${color}">Buscador Jurídico</div></div>`),
});
const share = {
    width: 1200, height: 630,
    html: page(`<div style="display:flex;align-items:center;gap:64px;padding:0 90px;color:${WHITE}">${mark(350, WHITE, PINK)}<div>
        <div style="font:400 86px/1.02 Fraunces,serif;letter-spacing:-.02em">Buscador Jurídico</div>
        <div style="margin-top:24px;font:500 33px/1.32 Manrope,sans-serif;color:#ffffffcc">Toda la normativa del sector energético, en un solo lugar</div>
    </div></div>`, NIGHT),
};
const ASSETS = {
    'favicon-64.png': icon(64, 0.08),
    'apple-touch-icon.png': icon(180, 0.14),
    'icon-192.png': icon(192, 0.12),
    'icon-512.png': icon(512, 0.12),
    'icon-maskable-512.png': icon(512, 0.22),
    'logo-mark-blanco.png': icon(512, 0.04, WHITE, WHITE, 'transparent'),
    'logo-buscador.png': lockup(INK, RED),
    'logo-buscador-claro.png': lockup(WHITE, PINK),
    'og-buscador-buho.jpg': share,
};

for (const [name, color, lens] of [['logo-mark.svg', INK, RED], ['logo-mark-claro.svg', '#f1efea', PINK], ['hero-mark.svg', INK, RED]]) {
    writeFileSync(new URL(`public/img/${name}`, ROOT), `${brandMarkSvg({ color, lens })}\n`);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'brand-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 80 && !target; i++) {
    await sleep(250);
    target = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json()).then(list => list.find(t => t.type === 'page')).catch(() => null);
}
if (!target) throw new Error('Chrome did not open its debugging port');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => { ws.onopen = resolve; });
let nextId = 0;
const pending = new Map();
ws.onmessage = event => { const message = JSON.parse(event.data); pending.get(message.id)?.(message.result); pending.delete(message.id); };
const send = (method, params = {}) => new Promise(resolve => { const id = ++nextId; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });

await send('Page.enable');
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
const file = join(profile, 'asset.html');
for (const [name, asset] of Object.entries(ASSETS)) {
    writeFileSync(file, asset.html);
    await send('Emulation.setDeviceMetricsOverride', { width: asset.width, height: asset.height, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: pathToFileURL(file).href });
    await sleep(600);
    const shot = await send('Page.captureScreenshot', name.endsWith('.jpg') ? { format: 'jpeg', quality: 86 } : { format: 'png' });
    writeFileSync(new URL(`public/img/${name}`, ROOT), Buffer.from(shot.data, 'base64'));
    console.log('wrote', name);
}
ws.close();
chrome.kill();
process.exit(0);
