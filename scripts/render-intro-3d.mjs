#!/usr/bin/env node
/**
 * Graba la entrada del sitio (intro-3d/: el búho mecánico en 3D) con la skill teardown y la deja en public/video.
 *
 *   node scripts/render-intro-3d.mjs            arma, graba los dos videos y dice dónde queda el ojo
 *   node scripts/render-intro-3d.mjs hojas      solo hojas de revisión (una imagen por momento) en .local/intro-3d
 *   node scripts/render-intro-3d.mjs cuadro 4.2 un cuadro suelto de cada formato
 *
 * Videos: 1920×1080 (horizontal) y 720×1280 (vertical), grabados a 60 cuadros por segundo (en .local/intro-3d) y copiados
 * al sitio a 30, H.264 yuv420p con faststart, sin sonido (el sitio los reproduce en silencio). TEARDOWN_DIR cambia dónde está la skill (por omisión ~/.claude/skills/teardown).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { DURACION, FPS, MOMENTOS } from '../intro-3d/modelo.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = process.env.TEARDOWN_DIR || path.join(os.homedir(), '.claude', 'skills', 'teardown');
const OUT = path.join(ROOT, '.local', 'intro-3d');
const NOMBRE = 'intro-3d';
const HTML = path.join(OUT, 'dist', `${NOMBRE}.html`);
const TIMELINE = path.join(ROOT, 'intro-3d', 'timeline.json');
const FORMATOS = [
    { id: 'horizontal', size: '1600x900', dpr: '1.2', destino: 'intro-landscape.mp4' },
    { id: 'vertical', size: '540x960', dpr: '1.3333334', destino: 'intro-portrait.mp4' },
];
// Si falta el navegador sin ventana de playwright, sirve el Chromium completo de la misma versión.
const CHROMIUM = process.env.CHROMIUM || [1208, 1223, 1234]
    .map(v => path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright', `chromium-${v}`, 'chrome-win64', 'chrome.exe'))
    .find(f => fs.existsSync(f));
const env = { ...process.env, TEARDOWN_OUT: OUT, ...(CHROMIUM ? { CHROMIUM } : {}) };
const node = (args) => execFileSync(process.execPath, args, { cwd: ROOT, env, stdio: 'inherit' });
const capturar = (args) => node([path.join(SKILL, 'sims', 'capture.mjs'), HTML.replace(/\.html$/, '').replace(/.*[\\/]/, ''), ...args]);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(TIMELINE, JSON.stringify({ duration: DURACION, fps: FPS, ...MOMENTOS }, null, 2) + '\n');
node([path.join(SKILL, 'sims', 'build.mjs'), path.join(ROOT, 'intro-3d')]);

const [modo = 'video', valor] = process.argv.slice(2);

if (modo === 'hojas') {
    for (const f of FORMATOS) {
        capturar(['--size', f.size, '--dpr', f.dpr, '--stills', 'beats', '--timeline', TIMELINE, '--cols', f.id === 'vertical' ? '6' : '4', '--out', path.join(OUT, `hoja-${f.id}.png`)]);
    }
    process.exit(0);
}
if (modo === 'fidelidad') {
    // Ciclo de fidelidad (intro-3d/PROMPT.md, paso 1): el búho desde el mismo ángulo que cada referencia de
    // intro-3d/ref/, lado a lado, para listar las diferencias. `valor` numera la ronda.
    const TOMAS = [
        { id: 'cara', ref: 'emblema-claro.png', w: 880, h: 880, pose: { alas: 0, desarme: 0, camara: { mira: [0, 1.02, 0.2], az: 0, el: 0, d: 5.2 } } },
        { id: 'cuerpo', ref: 'cuerpo.png', w: 1448, h: 1086, pose: { alas: 1, desarme: 0.05, camara: { mira: [0, 0.75, 0], az: 20, el: 6, d: 12 } } },
        // la cabeza desde arriba, para revisar la coronilla (se compara con el emblema solo como guía)
        { id: 'arriba', ref: 'emblema-claro.png', w: 880, h: 880, pose: { alas: 0, desarme: 0, camara: { mira: [0, 1.2, 0.05], az: 30, el: 38, d: 5.4 } } },
        // la forma de la segunda referencia (sus ojos azules y el dorado no se usan: el acento es guinda)
        { id: 'vuelo', ref: 'vuelo.png', w: 850, h: 1000, pose: { alas: 1, desarme: 0, camara: { mira: [0, 0.6, 0], az: -28, el: 8, d: 13 } } },
    ];
    const { chromium } = createRequire(path.join(SKILL, 'node_modules', 'x.js'))('playwright');
    const navegador = await chromium.launch({ executablePath: CHROMIUM, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'] });
    const ronda = valor || '0';
    for (const toma of TOMAS) {
        const pagina = await navegador.newPage({ viewport: { width: toma.w, height: toma.h }, deviceScaleFactor: 1 });
        await pagina.addInitScript(() => { window.__CAPTURE = true; });
        await pagina.goto(pathToFileURL(HTML).href);
        await pagina.waitForFunction(() => window.SIM && window.SIM.ready && window.__POSE);
        await pagina.evaluate(p => window.__POSE(p), toma.pose);
        const salida = path.join(OUT, `fidelidad-${ronda}-${toma.id}-render.png`);
        await pagina.screenshot({ path: salida });
        await pagina.close();
        // referencia | render, a la misma altura
        execFileSync(process.env.PYTHON || 'python', ['-I', '-c', `
import sys
from PIL import Image
a, b, out = sys.argv[1:4]
A = Image.open(a).convert('RGB'); B = Image.open(b).convert('RGB')
h = 760
A = A.resize((round(A.width * h / A.height), h)); B = B.resize((round(B.width * h / B.height), h))
C = Image.new('RGB', (A.width + B.width + 12, h), (60, 60, 60)); C.paste(A, (0, 0)); C.paste(B, (A.width + 12, 0)); C.save(out)
`, path.join(ROOT, 'intro-3d', 'ref', toma.ref), salida, path.join(OUT, `fidelidad-${ronda}-${toma.id}.png`)], { stdio: 'inherit' });
        console.log(`.local/intro-3d/fidelidad-${ronda}-${toma.id}.png`);
    }
    await navegador.close();
    process.exit(0);
}
if (modo === 'cuadro') {
    for (const f of FORMATOS) capturar(['--size', f.size, '--dpr', f.dpr, '--still', String(valor), '--out', path.join(OUT, `cuadro-${f.id}-${valor}.png`)]);
    process.exit(0);
}

// Video de cada formato.
for (const f of FORMATOS) {
    const mp4 = path.join(OUT, `${f.id}.mp4`);
    capturar(['--size', f.size, '--dpr', f.dpr, '--crf', '20', '--out', mp4]);
    // El original queda a 60 cuadros en .local; el sitio lleva una copia a 30 que pesa cerca de 1 MB, porque la entrada
    // solo espera 0.9 s a que el video arranque (src/scripts/site-intro.js).
    const web = path.join(ROOT, 'public', 'video', f.destino);
    execFileSync(process.env.FFMPEG || 'ffmpeg', ['-v', 'error', '-y', '-i', mp4, '-vf', 'fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '29', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', web], { stdio: 'inherit' });
    console.log(`public/video/${f.destino}  ${(fs.statSync(web).size / 1024).toFixed(0)} KB`);
}

// Dónde queda el ojo en el último cuadro, como fracción del video: es lo que pide FILMS en src/scripts/site-intro.js.
const { chromium } = createRequire(path.join(SKILL, 'node_modules', 'x.js'))('playwright');
const navegador = await chromium.launch({ executablePath: CHROMIUM, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'] });
for (const f of FORMATOS) {
    const [w, h] = f.size.split('x').map(Number);
    const pagina = await navegador.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(f.dpr) });
    await pagina.addInitScript(() => { window.__CAPTURE = true; });
    await pagina.goto(pathToFileURL(HTML).href);
    await pagina.waitForFunction(() => window.SIM && window.SIM.ready);
    const ojo = await pagina.evaluate(t => { window.SIM.render(t); return window.__OJO(); }, DURACION - 1 / FPS);
    console.log(`${f.id}: eye: [${ojo.map(n => n.toFixed(4)).join(', ')}]`);
}
await navegador.close();
