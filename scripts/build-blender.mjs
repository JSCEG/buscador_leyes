#!/usr/bin/env node
/**
 * Arma en Blender, sin ventana, los equipos de una figura de Aprende: corre conceptos-3d/<figura>/blender/equipos.py con el kit
 * de conceptos-3d/planta-comun/blender/kit.py y deja conceptos-3d/<figura>/equipos.glb, que la figura importa y el armado
 * (scripts/build-conceptos-3d.mjs) incrusta en la página. El acomodo sale de lugar.js de la figura, el mismo que usa la página.
 *
 *   node scripts/build-blender.mjs termicas                     el .glb
 *   node scripts/build-blender.mjs termicas --laminas .local/x  además una imagen por punto clave, para revisar
 *
 * BLENDER cambia dónde está Blender (por omisión, el de Program Files o el que esté en el PATH).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [figura, ...resto] = process.argv.slice(2);
if (!figura) throw new Error('Uso: node scripts/build-blender.mjs <figura> [--laminas carpeta]');
const carpeta = path.join(ROOT, 'conceptos-3d', figura);
const modelo = path.join(carpeta, 'blender', 'equipos.py');
if (!fs.existsSync(modelo)) throw new Error(`No existe ${path.relative(ROOT, modelo)}`);

function blender() {
    if (process.env.BLENDER) return process.env.BLENDER;
    const base = 'C:/Program Files/Blender Foundation';
    if (fs.existsSync(base)) {
        const v = fs.readdirSync(base).filter(d => d.startsWith('Blender')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).at(-1);
        if (v && fs.existsSync(path.join(base, v, 'blender.exe'))) return path.join(base, v, 'blender.exe');
    }
    return 'blender';
}

// el acomodo de la figura, para que Blender y la página pongan cada equipo en el mismo lugar
const lugar = await import(pathToFileURL(path.join(carpeta, 'lugar.js')).href);
const json = JSON.stringify(lugar, (k, v) => (v === Infinity ? 1e9 : v instanceof Set ? [...v] : v));
const trabajo = fs.mkdtempSync(path.join(os.tmpdir(), 'blender-'));
const rutaLugar = path.join(trabajo, 'lugar.json');
fs.writeFileSync(rutaLugar, json);

const args = ['-b', '--factory-startup', '--python-exit-code', '1', '-P', modelo, '--', '--lugar', rutaLugar, '--salida', path.join(carpeta, 'equipos.glb'), '--kit', path.join(ROOT, 'conceptos-3d', 'planta-comun', 'blender')];
const i = resto.indexOf('--laminas');
if (i >= 0) args.push('--laminas', path.resolve(resto[i + 1]));
const salida = execFileSync(blender(), args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
for (const linea of salida.split(/\r?\n/)) if (/^(glb:|lámina|Error|Traceback|  File|\w+Error)/.test(linea)) console.log(linea);
fs.rmSync(trabajo, { recursive: true, force: true });
