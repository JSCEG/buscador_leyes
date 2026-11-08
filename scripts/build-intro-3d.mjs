#!/usr/bin/env node
/**
 * Arma la entrada viva del búho (intro-3d/vivo/) con el empaquetador de la skill teardown y la deja como
 * public/intro/buho.html, que es lo que carga la intro del sitio (src/scripts/site-intro.js) con ?tema=claro|oscuro.
 * La página no trae nada de fuera salvo las letras del sitio (/fonts).
 *
 *   node scripts/build-intro-3d.mjs
 *
 * TEARDOWN_DIR cambia dónde está la skill (por omisión ~/.claude/skills/teardown).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = process.env.TEARDOWN_DIR || path.join(os.homedir(), '.claude', 'skills', 'teardown');
const FUENTE = path.join(ROOT, 'intro-3d', 'vivo');
const DESTINO = path.join(ROOT, 'public', 'intro');
const trabajo = fs.mkdtempSync(path.join(os.tmpdir(), 'intro-3d-'));

try {
    execFileSync(process.execPath, [path.join(SKILL, 'sims', 'build.mjs'), FUENTE], { cwd: trabajo, stdio: 'inherit' });
    const html = fs.readFileSync(path.join(trabajo, 'teardown-out', 'dist', 'vivo.html'), 'utf8');
    const pagina = html
        // la skill incrusta sus letras (JetBrains Mono, Inter); aquí se usan Fraunces y Manrope del sitio
        .replace(/@font-face\{font-family:'(?:JetBrains Mono|Inter)';[^}]*\}/g, '')
        .replace('<html lang="en">', '<html lang="es">')
        .replace('<title>vivo</title>', '<title>Buscador Jurídico · Entrada</title>');
    if (!pagina.includes('<html lang="es">') || !pagina.includes('Entrada</title>')) throw new Error('No pude ajustar el HTML de la entrada');
    fs.mkdirSync(DESTINO, { recursive: true });
    fs.writeFileSync(path.join(DESTINO, 'buho.html'), pagina);
    console.log(`entrada: ${(pagina.length / 1024).toFixed(0)} KB → public/intro/buho.html`);
} finally {
    fs.rmSync(trabajo, { recursive: true, force: true });
}
