#!/usr/bin/env node
/**
 * Dibuja el mapa de México (src/lib/mexico-map.js) como fondo sutil del sitio: solo el contorno de los estados, en un
 * SVG por tema, porque una imagen de fondo no puede tomar el color de las variables CSS.
 *
 *   node scripts/generate-mapa-fondo.mjs   → public/img/fondo-mexico-{claro,oscuro,sepia,contraste}.svg
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEXICO_VIEWBOX, MEXICO_STATES } from '../src/lib/mexico-map.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// trazo y opacidad por tema: apenas se nota, para no competir con el contenido
const TEMAS = {
    claro: ['#9b2247', 0.085],
    oscuro: ['#e57a9a', 0.1],
    sepia: ['#7a4a2a', 0.09],
    contraste: ['#000000', 0.06],
};
for (const [tema, [color, alfa]] of Object.entries(TEMAS)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MEXICO_VIEWBOX}"><g fill="none" stroke="${color}" stroke-opacity="${alfa}" stroke-width="1.1" stroke-linejoin="round">${MEXICO_STATES.map(s => `<path d="${s.d}"/>`).join('')}</g></svg>\n`;
    const salida = path.join(ROOT, 'public', 'img', `fondo-mexico-${tema}.svg`);
    fs.writeFileSync(salida, svg);
    console.log(`${tema}: ${(svg.length / 1024).toFixed(1)} KB → ${path.relative(ROOT, salida)}`);
}
