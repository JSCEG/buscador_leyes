#!/usr/bin/env node
// Arma el búho biomecánico con el kit de teardown:
//   node buho-bio/build.mjs [carpeta de salida, por omisión .local/buho-bio]
// Deja dist/buho-bio.html (la toma para calcar), dist/vivo.html (la página de prueba) y buho-bio.js, el paquete para el lienzo
// de diseño: un solo archivo que define window.BuhoBio, con three.js adentro y sin nada de fuera.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SKILL = process.env.TEARDOWN_DIR || path.join(os.homedir(), '.claude', 'skills', 'teardown');
const SALIDA = path.resolve(process.argv[2] || path.join(AQUI, '..', '.local', 'buho-bio'));
fs.mkdirSync(SALIDA, { recursive: true });

const env = { ...process.env, TEARDOWN_OUT: SALIDA };
for (const carpeta of [AQUI, path.join(AQUI, 'vivo')]) execFileSync(process.execPath, [path.join(SKILL, 'sims', 'build.mjs'), carpeta], { env, stdio: 'inherit' });

const esbuild = createRequire(path.join(SKILL, 'package.json'))('esbuild');
const r = await esbuild.build({
    entryPoints: [path.join(AQUI, 'lienzo.js')],
    outfile: path.join(SALIDA, 'buho-bio.js'),
    bundle: true,
    minify: true,
    format: 'iife',
    target: 'es2020',
    charset: 'utf8',
    nodePaths: [path.join(SKILL, 'node_modules')],
    metafile: true,
});
const kb = Object.values(r.metafile.outputs)[0].bytes / 1024;
console.log(`buho-bio.js  ${kb.toFixed(0)} KB`);
