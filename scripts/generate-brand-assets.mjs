/**
 * Regenerates the logos, app icons and share image in public/img from brandMarkSvg, with the local Chrome.
 * Run: node scripts/generate-brand-assets.mjs   (CHROME overrides the browser path)
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MARK_BODY, MARK_BROW, MARK_EYE, brandMarkSvg } from '../src/lib/brand-mark.js';
import { iconVersion, stampIconVersion } from './icon-version.mjs';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = new URL('..', import.meta.url);
const INK = '#0a0707';
const RED = '#9b2247';
const NIGHT = '#080a19';
const WHITE = '#ffffff';
const PINK = '#e57a9a';

const inline = name => `url(data:font/woff2;base64,${readFileSync(new URL(`public/fonts/${name}`, ROOT)).toString('base64')})`;
const FONTS = readFileSync(new URL('src/styles/design/fonts.css', ROOT), 'utf8')
    .replace(/url\(["']?\/fonts\/([^"')]+)["']?\)/g, (_, name) => inline(name));
const page = (body, background = 'transparent') => `<!doctype html><meta charset="utf-8"><style>${FONTS}
html,body{margin:0;width:100%;height:100%;background:${background}}body{display:flex;align-items:center;justify-content:center}svg{display:block;width:100%;height:100%}</style>${body}`;
const mark = (height, color, lens) => `<div style="height:${height}px;aspect-ratio:379/448;flex:none">${brandMarkSvg({ color, lens })}</div>`;
const icon = (size, padding, color, lens, background) => ({ width: size, height: size, html: page(mark(size * (1 - padding * 2), color, lens), background) });
// The app icon: paper lit from the top left, an ink mark with a soft shadow and a glowing eye.
// `share` is the height of the mark in the icon; `radius` 0 fills the square for systems that mask it.
const appIcon = (size, share, radius = 0) => {
    const scale = 512 * share / 448;
    const left = 256 - 379 * scale / 2;
    const top = 256 - 512 * share / 2;
    return {
        width: size, height: size,
        html: page(`<div style="width:100%;height:100%;overflow:hidden;border-radius:${radius * 100}%;background:radial-gradient(100% 90% at 26% 8%,#ffffff 0,#f6f2ec 52%,#e4dcd2 100%)"><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1414"/><stop offset="1" stop-color="${INK}"/></linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".32"/></filter>
    <filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="9"/></filter>
  </defs>
  <g transform="translate(${left} ${top}) scale(${scale}) translate(-33 -24)">
    <g filter="url(#shadow)"><path d="${MARK_BODY}" fill="url(#ink)"/><path d="${MARK_BROW}" fill="url(#ink)"/></g>
    <path d="${MARK_EYE}" fill="#d83a6b" opacity=".85" filter="url(#glow)"/>
    <path d="${MARK_EYE}" fill="#b3234f"/>
  </g>
</svg></div>`),
    };
};
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
    'favicon-64.png': appIcon(64, 0.8, 0.2),
    'apple-touch-icon.png': appIcon(180, 0.62),
    'icon-192.png': appIcon(192, 0.62, 0.225),
    'icon-512.png': appIcon(512, 0.62, 0.225),
    // Android cuts it to a circle or a drop: the mark stays inside the central safe zone.
    'icon-maskable-512.png': appIcon(512, 0.56),
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

// New icons, new links: this is how installed apps and browsers notice them.
const version = iconVersion(ROOT);
for (const name of ['public/manifest.json', 'index.html']) {
    const path = new URL(name, ROOT);
    writeFileSync(path, stampIconVersion(readFileSync(path, 'utf8'), version));
}
console.log('icon version', version);
process.exit(0);
