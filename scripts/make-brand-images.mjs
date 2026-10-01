/**
 * Renders the app icons (PWA / Apple) and the social share image from HTML with Playwright.
 * Run: node scripts/make-brand-images.mjs   (needs playwright-core and a local Chromium)
 */
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { brandMarkSvg } from '../src/lib/brand-mark.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/img');
const exe = process.env.CHROME || 'C:/Users/User/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const logo = `data:image/png;base64,${fs.readFileSync(path.join(root, 'public/img/logo_sener.png')).toString('base64')}`;
const gob = `data:image/png;base64,${fs.readFileSync(path.join(root, 'public/img/logo_gob.png')).toString('base64')}`;

const band = 'radial-gradient(110% 90% at 100% 0%,#b8375f 0%,transparent 55%),radial-gradient(80% 90% at 0% 100%,#0000003a 0%,transparent 60%),linear-gradient(135deg,#7a1a38 0%,#9b2247 60%,#6d1631 100%)';
const dots = 'radial-gradient(circle at 20% 30%,#ffffff26 0 1.6px,transparent 2px),radial-gradient(circle at 70% 60%,#ffffff1f 0 1.2px,transparent 1.6px)';
// The "B" mark: a bar and a document page with a gold lens in its counter.
const CREAM = '#faf6f0';
const icon = (size, padding) => `<html><body style="margin:0"><div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:radial-gradient(90% 80% at 30% 20%,#fff 0%,${CREAM} 60%,#f1e8dc 100%)">
  <div style="width:${size * (1 - padding * 2)}px;height:${size * (1 - padding * 2)}px">${brandMarkSvg({ cut: CREAM, lens: '#b8892f' })}</div></div></body></html>`;

const og = `<html><head><style>
  body{margin:0;font-family:Georgia,serif}
  .c{width:1200px;height:630px;position:relative;overflow:hidden;color:#fff;background:${dots},${band};background-size:44px 44px,28px 28px,auto,auto,auto}
  .top{position:absolute;top:44px;left:64px;right:64px;display:flex;align-items:center;gap:22px;padding:14px 22px;background:#fff;border-radius:16px;width:max-content}
  .top img{height:54px}.sep{width:1px;height:44px;background:#e4ded5}
  .mark{position:absolute;right:90px;top:165px;width:270px;height:300px;filter:drop-shadow(0 18px 40px #0000004d)}
  h1{position:absolute;left:64px;top:172px;margin:0;font-size:66px;line-height:1.05;letter-spacing:-1px;max-width:720px}
  h1 em{font-style:normal;color:#f6d9a8}
  p{position:absolute;left:64px;top:372px;margin:0;font:500 28px/1.4 Arial,sans-serif;color:#fde8ee;max-width:700px}
  .foot{position:absolute;left:64px;bottom:44px;font:700 20px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#f6d9a8}
</style></head><body><div class="c">
  <div class="top"><img src="${gob}"><span class="sep"></span><img src="${logo}"></div>
  <h1>Buscador Jurídico del <em>sector energético</em></h1>
  <p>Leyes, reglamentos, acuerdos y demás disposiciones en un solo lugar: busca, compara y consulta.</p>
  <div class="foot">Secretaría de Energía · Gobierno de México</div>
  <div class="mark">${brandMarkSvg({ color: '#fff', cut: '#8f1f42', lens: '#f2c97a' })}</div>
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
