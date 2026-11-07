#!/usr/bin/env node
/**
 * Arma las figuras 3D de Aprende (carpeta conceptos-3d/<figura>/) con el empaquetador de la skill teardown y las deja
 * como public/conceptos/<figura>.html (tema oscuro) y <figura>-light.html (tema claro), que es lo que carga Aprende.
 * Las páginas no traen nada de fuera salvo las letras del sitio (/fonts).
 *
 *   node scripts/build-conceptos-3d.mjs              todas
 *   node scripts/build-conceptos-3d.mjs generador    una
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
const FUENTES = path.join(ROOT, 'conceptos-3d');
const DESTINO = path.join(ROOT, 'public', 'conceptos');
const TITULOS = JSON.parse(fs.readFileSync(path.join(FUENTES, 'titulos.json'), 'utf8'));

const nombres = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(FUENTES).filter(d => fs.existsSync(path.join(FUENTES, d, 'main.js')));
const trabajo = fs.mkdtempSync(path.join(os.tmpdir(), 'conceptos-3d-'));

for (const figura of nombres) {
    const carpeta = path.join(FUENTES, figura);
    execFileSync(process.execPath, [path.join(SKILL, 'sims', 'build.mjs'), carpeta], { cwd: trabajo, stdio: 'inherit' });
    const html = fs.readFileSync(path.join(trabajo, 'teardown-out', 'dist', `${figura}.html`), 'utf8');
    const titulo = TITULOS[figura] || figura;
    for (const [tema, sufijo] of [['oscuro', ''], ['claro', '-light']]) {
        const pagina = html
            // la skill incrusta sus letras (JetBrains Mono, Inter); aquí se usan Fraunces y Manrope del sitio
            .replace(/@font-face\{font-family:'(?:JetBrains Mono|Inter)';[^}]*\}/g, '')
            .replace('<html lang="en">', `<html lang="es" data-tema="${tema}">`)
            .replace(`<title>${figura}</title>`, `<title>${titulo} · ¿Cómo funciona?</title>`);
        if (pagina === html) throw new Error(`No pude ajustar el HTML de ${figura}`);
        fs.writeFileSync(path.join(DESTINO, `${figura}${sufijo}.html`), pagina);
    }
    console.log(`${figura}: ${(html.length / 1024).toFixed(0)} KB → public/conceptos/${figura}.html y ${figura}-light.html`);
}
fs.rmSync(trabajo, { recursive: true, force: true });
