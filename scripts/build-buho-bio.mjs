#!/usr/bin/env node
/**
 * Arma la guía del búho biomecánico (buho-bio/vivo/) con el empaquetador de la skill teardown y la deja como
 * public/intro/buho-bio.html, que es lo que cargan la guía (src/scripts/site-intro.js) y la portada
 * (src/scripts/landing-owl.js). La página no trae nada de fuera salvo las letras del sitio (/fonts).
 *
 *   node scripts/build-buho-bio.mjs
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
const FUENTE = path.join(ROOT, 'buho-bio', 'vivo');
const DESTINO = path.join(ROOT, 'public', 'intro');
const trabajo = fs.mkdtempSync(path.join(os.tmpdir(), 'buho-bio-'));

try {
    execFileSync(process.execPath, [path.join(SKILL, 'sims', 'build.mjs'), FUENTE], { cwd: trabajo, stdio: 'inherit' });
    const html = fs.readFileSync(path.join(trabajo, 'teardown-out', 'dist', 'vivo.html'), 'utf8');
    const pagina = html
        // la skill incrusta sus letras (JetBrains Mono, Inter); aquí se usan Fraunces y Manrope del sitio
        .replace(/@font-face\{font-family:'(?:JetBrains Mono|Inter)';[^}]*\}/g, '')
        .replace('<html lang="en">', '<html lang="es-MX">')
        .replace('<title>vivo</title>', '<title>Buscador Jurídico · Guía del búho</title>');
    if (!pagina.includes('<html lang="es-MX">') || !pagina.includes('Guía del búho</title>')) throw new Error('No pude ajustar el HTML de la guía');
    fs.mkdirSync(DESTINO, { recursive: true });
    fs.writeFileSync(path.join(DESTINO, 'buho-bio.html'), pagina);
    console.log(`guía: ${(pagina.length / 1024).toFixed(0)} KB → public/intro/buho-bio.html`);
} finally {
    fs.rmSync(trabajo, { recursive: true, force: true });
}
