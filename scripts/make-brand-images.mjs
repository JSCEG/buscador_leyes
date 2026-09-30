/**
 * Renders the app icons (PWA / Apple) and the social share image from HTML with Playwright.
 * Run: node scripts/make-brand-images.mjs   (needs playwright-core and a local Chromium)
 */
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/img');
const exe = process.env.CHROME || 'C:/Users/User/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const logo = `data:image/png;base64,${fs.readFileSync(path.join(root, 'public/img/logo_sener.png')).toString('base64')}`;
const gob = `data:image/png;base64,${fs.readFileSync(path.join(root, 'public/img/logo_gob.png')).toString('base64')}`;

const band = 'radial-gradient(110% 90% at 100% 0%,#b8375f 0%,transparent 55%),radial-gradient(80% 90% at 0% 100%,#0000003a 0%,transparent 60%),linear-gradient(135deg,#7a1a38 0%,#9b2247 60%,#6d1631 100%)';
const dots = 'radial-gradient(circle at 20% 30%,#ffffff26 0 1.6px,transparent 2px),radial-gradient(circle at 70% 60%,#ffffff1f 0 1.2px,transparent 1.6px)';
// Book with a search lens: the acervo you can search.
const mark = (stroke = '#fff', accent = '#f2c97a') => `<svg viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 14c6-3 13-3 20 1v36c-7-4-14-4-20-1Z" stroke="${stroke}" stroke-width="3.2"/>
  <path d="M30 15c5-3 11-4 16-2v14" stroke="${stroke}" stroke-width="3.2"/>
  <path d="M15 24c3-1 7-1 10 1M15 32c3-1 7-1 10 1M15 40c3-1 7-1 10 1" stroke="${stroke}" stroke-width="2.4" opacity=".8"/>
  <circle cx="44" cy="40" r="9" stroke="${accent}" stroke-width="3.6"/><path d="m50.5 46.5 6 6" stroke="${accent}" stroke-width="3.8"/>
</svg>`;

const icon = (size, padding) => `<html><body style="margin:0"><div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${dots},${band};background-size:${size / 6}px ${size / 6}px,${size / 9}px ${size / 9}px,auto,auto,auto">
  <div style="width:${size * (1 - padding * 2)}px;height:${size * (1 - padding * 2)}px">${mark()}</div></div></body></html>`;

const og = `<html><head><style>
  body{margin:0;font-family:Georgia,serif}
  .c{width:1200px;height:630px;position:relative;overflow:hidden;color:#fff;background:${dots},${band};background-size:44px 44px,28px 28px,auto,auto,auto}
  .top{position:absolute;top:44px;left:64px;right:64px;display:flex;align-items:center;gap:22px;padding:14px 22px;background:#fff;border-radius:16px;width:max-content}
  .top img{height:54px}.sep{width:1px;height:44px;background:#e4ded5}
  .mark{position:absolute;right:70px;top:170px;width:300px;height:300px;opacity:.95}
  h1{position:absolute;left:64px;top:172px;margin:0;font-size:66px;line-height:1.05;letter-spacing:-1px;max-width:720px}
  h1 em{font-style:normal;color:#f6d9a8}
  p{position:absolute;left:64px;top:372px;margin:0;font:500 28px/1.4 Arial,sans-serif;color:#fde8ee;max-width:700px}
  .foot{position:absolute;left:64px;bottom:44px;font:700 20px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#f6d9a8}
</style></head><body><div class="c">
  <div class="top"><img src="${gob}"><span class="sep"></span><img src="${logo}"></div>
  <h1>Buscador Jurídico del <em>sector energético</em></h1>
  <p>Leyes, reglamentos, acuerdos y demás disposiciones en un solo lugar: busca, compara y consulta.</p>
  <div class="foot">Secretaría de Energía · Gobierno de México</div>
  <div class="mark">${mark()}</div>
</div></body></html>`;

const browser = await chromium.launch({ executablePath: exe });
const shot = async (html, w, h, file) => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(out, file), clip: { x: 0, y: 0, width: w, height: h } });
    await page.close();
    console.log('wrote', file);
};
await shot(icon(192, 0.18), 192, 192, 'icon-192.png');
await shot(icon(512, 0.18), 512, 512, 'icon-512.png');
await shot(icon(512, 0.26), 512, 512, 'icon-maskable-512.png');
await shot(icon(180, 0.16), 180, 180, 'apple-touch-icon.png');
await shot(icon(64, 0.12), 64, 64, 'favicon-64.png');
await shot(og, 1200, 630, 'og-image.png');
await browser.close();
