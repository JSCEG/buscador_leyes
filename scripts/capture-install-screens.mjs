/**
 * Captures the screens the browser shows in the install dialog (manifest.json `screenshots`), with the
 * local Chrome against the running dev server.
 * Run: node scripts/capture-install-screens.mjs [out dir] [base url]   (CHROME overrides the browser path)
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const OUT = resolve(process.argv[2] || 'public/img/capturas');
const BASE = process.argv[3] || 'http://localhost:5173';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const LSE = '8e404121-3502-4f47-937d-a43762c52da8';
const LSE_ART_3 = '5e2e5ec3-3842-4216-a0f3-c19d97bc1b36';
const PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const PHONE = { width: 412, height: 892, deviceScaleFactor: 2, mobile: true };
const DESK = { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false };
const SHOTS = [
    { name: 'celular-acervo.jpg', hash: '', ready: '.sh-cover', metrics: PHONE },
    { name: 'celular-libro.jpg', hash: `#ley-${LSE}?libro=1&art=${LSE_ART_3}`, ready: '.bk-escena:has([data-book-loading][hidden]) .bk-tx', metrics: PHONE },
    { name: 'escritorio-acervo.jpg', hash: '', ready: '.sh-cover', metrics: DESK },
];

const sleep = ms => new Promise(done => setTimeout(done, ms));
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'screens-'))}`, 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 80 && !target; i++) {
    await sleep(250);
    target = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json()).then(list => list.find(t => t.type === 'page')).catch(() => null);
}
if (!target) throw new Error('Chrome did not open its debugging port');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(done => { ws.onopen = done; });
let nextId = 0;
const pending = new Map();
ws.onmessage = event => { const message = JSON.parse(event.data); pending.get(message.id)?.(message.result); pending.delete(message.id); };
const send = (method, params = {}) => new Promise(done => { const id = ++nextId; pending.set(id, done); ws.send(JSON.stringify({ id, method, params })); });

await send('Page.enable');
await send('Runtime.enable');
// A returning reader: no intro film, welcome tour or install invitation over the page.
await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    localStorage.setItem('intro-dia', new Date().toISOString().slice(0, 10));
    localStorage.setItem('bienvenida-v1', '1');
    localStorage.setItem('instalar-pospuesto', String(Date.now()));
` });
mkdirSync(OUT, { recursive: true });
for (const shot of SHOTS) {
    await send('Emulation.setDeviceMetricsOverride', shot.metrics);
    await send('Emulation.setUserAgentOverride', { userAgent: shot.metrics.mobile ? PHONE_UA : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' });
    await send('Page.navigate', { url: 'about:blank' });
    await sleep(200);
    await send('Page.navigate', { url: `${BASE}/${shot.hash}` });
    let found = false;
    for (let i = 0; i < 150 && !found; i++) {
        await sleep(400);
        const check = await send('Runtime.evaluate', { expression: `!!document.querySelector(${JSON.stringify(shot.ready)})` });
        found = check?.result?.value === true;
    }
    if (!found) throw new Error(`${shot.name}: ${shot.ready} did not appear`);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
    await sleep(3500);
    const image = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    writeFileSync(join(OUT, shot.name), Buffer.from(image.data, 'base64'));
    console.log('wrote', shot.name);
}
ws.close();
chrome.kill();
process.exit(0);
