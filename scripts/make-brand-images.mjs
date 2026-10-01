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
const patria = `data:font/otf;base64,${fs.readFileSync(path.join(root, 'public/tipografias/Patria_Bold.otf')).toString('base64')}`;

// Lockup: the B mark beside the name. `dark` is for dark backgrounds (light text).
const lockup = (dark = false) => `<html><head><style>
  @font-face{font-family:Patria;src:url(${patria})}
  html,body{margin:0;background:transparent}
  .l{display:inline-flex;align-items:center;gap:22px;padding:6px 10px}
  .l svg{width:92px;height:auto}
  .n{font:700 64px/1 Patria,Georgia,serif;letter-spacing:-.5px;color:${dark ? '#ffffff' : '#2b2326'}}
  .s{margin-top:8px;font:700 19px/1 Arial,sans-serif;letter-spacing:5px;text-transform:uppercase;color:${dark ? '#f2c97a' : '#9b2247'}}
</style></head><body><div class="l" id="l">${brandMarkSvg({ cut: dark ? '#7a1a38' : '#ffffff', color: dark ? '#ffffff' : '#9b2247', lens: dark ? '#f2c97a' : '#c9a04a' })}<div><div class="n">Buscador Jurídico</div><div class="s">Sector energético</div></div></div></body></html>`;

const band = 'radial-gradient(110% 90% at 100% 0%,#b8375f 0%,transparent 55%),radial-gradient(80% 90% at 0% 100%,#0000003a 0%,transparent 60%),linear-gradient(135deg,#7a1a38 0%,#9b2247 60%,#6d1631 100%)';
const dots = 'radial-gradient(circle at 20% 30%,#ffffff26 0 1.6px,transparent 2px),radial-gradient(circle at 70% 60%,#ffffff1f 0 1.2px,transparent 1.6px)';
// The "B" mark: a bar and a document page with a gold lens in its counter.
const CREAM = '#faf6f0';
const icon = (size, padding) => `<html><body style="margin:0"><div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:radial-gradient(90% 80% at 30% 20%,#fff 0%,${CREAM} 60%,#f1e8dc 100%)">
  <div style="width:${size * (1 - padding * 2)}px;height:${size * (1 - padding * 2)}px">${brandMarkSvg({ cut: CREAM, lens: '#b8892f' })}</div></div></body></html>`;

// Share image (WhatsApp, Teams, LinkedIn…). Kept as a light JPEG: WhatsApp drops previews over ~300 KB.
// Counts are the acervo at generation time; update ACERVO and rerun when it grows a lot.
const ACERVO = { instrumentos: '87', articulos: '4,781' };
const og = `<html><head><style>
  @font-face{font-family:Patria;src:url(${patria})}
  body{margin:0}
  .c{width:1200px;height:630px;position:relative;overflow:hidden;color:#fff;font-family:Arial,sans-serif;background:radial-gradient(circle,#ffffff1a 1.3px,transparent 1.7px),radial-gradient(70% 90% at 100% 0%,#c2426b 0%,transparent 55%),radial-gradient(60% 80% at 0% 100%,#1e5b4f80 0%,transparent 60%),linear-gradient(135deg,#5e1530 0%,#8a1d40 55%,#6d1631 100%);background-size:34px 34px,auto,auto,auto}
  .brand{position:absolute;top:52px;left:64px;display:flex;align-items:center;gap:14px}
  .brand svg{width:44px;height:auto}
  .brand b{font:700 30px/1 Patria,Georgia,serif;letter-spacing:-.3px}
  .brand span{display:block;margin-top:6px;font:700 13px/1 Arial,sans-serif;letter-spacing:.24em;color:#f2c97a}
  h1{position:absolute;left:64px;top:158px;margin:0;font:700 60px/1.06 Patria,Georgia,serif;letter-spacing:-1px;max-width:690px}
  h1 em{font-style:normal;color:#f6d9a8}
  .sub{position:absolute;left:64px;top:375px;margin:0;font:500 25px/1.4 Arial,sans-serif;color:#fde8ee;max-width:640px}
  .stats{position:absolute;left:64px;bottom:58px;display:flex;gap:14px}
  .stats div{padding:12px 18px;border-radius:14px;background:#ffffff1f;border:1px solid #ffffff38}
  .stats strong{display:block;font:700 30px/1 Patria,Georgia,serif;color:#fff}
  .stats small{display:block;margin-top:6px;font:700 13px/1 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#f6d9a8}
  .mark{position:absolute;right:86px;top:120px;width:300px;filter:drop-shadow(0 22px 44px #00000059)}
  .url{position:absolute;right:70px;bottom:60px;font:700 22px/1 Arial,sans-serif;color:#f6d9a8}
  .bar{position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,#9b2247 0 40%,#1e5b4f 40% 70%,#a57f2c 70%)}
</style></head><body><div class="c">
  <div class="brand">${brandMarkSvg({ color: '#fff', cut: '#8a1d40', lens: '#f2c97a' })}<div><b>Buscador Jurídico</b><span>SECTOR ENERGÉTICO</span></div></div>
  <h1>Toda la normativa del <em>sector energético</em>, en un solo lugar</h1>
  <p class="sub">Leyes, reglamentos, acuerdos, DACG y convocatorias: busca un término y llega al artículo.</p>
  <div class="stats"><div><strong>${ACERVO.instrumentos}</strong><small>Instrumentos</small></div><div><strong>${ACERVO.articulos}</strong><small>Artículos</small></div><div><strong>Gratis</strong><small>Consulta abierta</small></div></div>
  <div class="mark">${brandMarkSvg({ color: '#fff', cut: '#8a1d40', lens: '#f2c97a' })}</div>
  <div class="url">buscador-juridico.com</div>
  <div class="bar"></div>
</div></body></html>`;

const browser = await chromium.launch({ executablePath: exe });
const shot = async (html, w, h, file) => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const jpeg = file.endsWith('.jpg');
    await page.screenshot({ path: path.join(out, file), clip: { x: 0, y: 0, width: w, height: h }, ...(jpeg ? { type: 'jpeg', quality: 86 } : {}) });
    await page.close();
    console.log('wrote', file);
};
await shot(icon(192, 0.18), 192, 192, 'icon-192.png');
await shot(icon(512, 0.18), 512, 512, 'icon-512.png');
await shot(icon(512, 0.26), 512, 512, 'icon-maskable-512.png');
await shot(icon(180, 0.16), 180, 180, 'apple-touch-icon.png');
await shot(icon(64, 0.12), 64, 64, 'favicon-64.png');
await shot(og, 1200, 630, 'og-buscador-juridico.jpg');
// Mark for the web (white cuts read on any background) and lockups for email, PPTX and slides.
fs.writeFileSync(path.join(out, 'b-mark.svg'), brandMarkSvg({ cut: '#ffffff', title: 'Buscador Jurídico' }));
console.log('wrote b-mark.svg');
{
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:transparent"><div id="m" style="width:540px">${brandMarkSvg({ color: '#ffffff', cut: '#8a1d40', lens: '#f2c97a' })}</div></body></html>`);
    await page.locator('#m').screenshot({ path: path.join(out, 'b-mark-blanco.png'), omitBackground: true });
    await page.close();
    console.log('wrote b-mark-blanco.png');
}
for (const [dark, file] of [[false, 'logo-buscador.png'], [true, 'logo-buscador-claro.png']]) {
    const page = await browser.newPage({ deviceScaleFactor: 2 });
    await page.setContent(lockup(dark), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#l').screenshot({ path: path.join(out, file), omitBackground: true });
    await page.close();
    console.log('wrote', file);
}
await browser.close();
