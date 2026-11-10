// Gráficas en SVG de las plantas con física: una sola escala, cruz y punta al pasar, y tablas. Leen funciones del modelo de cada figura;
// aquí no hay ninguna cifra.
import { clamp, num } from './ayudas.js';

export const MARGEN = { i: 36, d: 12, a: 18, b: 36 };
export function medirGrafica(el) {
    const ancho = clamp(Math.round(el.clientWidth || 320), 280, 760);
    return [ancho, clamp(Math.round(ancho * 0.54), 176, 300)];
}
/**
 * cfg: titulo, xMin, xMax, yMin, yMax, ticksX, ticksY, etX, etY, fx, fy, punta(x), y una o varias de:
 * f (línea con área), lineas [{ clase, f }], quebradas [{ clase, puntos }], puntos [{ x, y, texto, izq }], refsX [{ x, texto }].
 */
export function pintarGrafica(el, cfg) {
    const [ANCHO, ALTO] = medirGrafica(el);
    const sx = x => MARGEN.i + ((x - cfg.xMin) / (cfg.xMax - cfg.xMin)) * (ANCHO - MARGEN.i - MARGEN.d);
    const sy = y => MARGEN.a + (1 - (y - cfg.yMin) / (cfg.yMax - cfg.yMin)) * (ALTO - MARGEN.a - MARGEN.b);
    const linea = (f, n = 70) => {
        let d = '';
        for (let k = 0; k <= n; k++) { const x = cfg.xMin + ((cfg.xMax - cfg.xMin) * k) / n; d += `${k ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(clamp(f(x), cfg.yMin, cfg.yMax)).toFixed(1)}`; }
        return d;
    };
    let marcas = '';
    if (cfg.f) {
        const d = linea(cfg.f);
        marcas += `<path class="h-g-area" d="${d}L${sx(cfg.xMax)} ${sy(cfg.yMin)}L${sx(cfg.xMin)} ${sy(cfg.yMin)}Z"/><path class="h-g-linea" d="${d}"/>`;
    }
    for (const l of cfg.lineas || []) marcas += `<path class="h-g-serie ${l.clase}" d="${linea(l.f, 96)}"/>`;
    for (const l of cfg.quebradas || []) marcas += `<path class="h-g-serie ${l.clase}" d="${l.puntos.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join('')}"/>`;
    el.innerHTML = `<svg viewBox="0 0 ${ANCHO} ${ALTO}" role="img" aria-label="${cfg.titulo}: ${cfg.etY} según ${cfg.etX}">
        ${cfg.ticksY.map(y => `<line class="h-g-rejilla" x1="${MARGEN.i}" x2="${ANCHO - MARGEN.d}" y1="${sy(y)}" y2="${sy(y)}"/><text class="h-g-t" x="${MARGEN.i - 5}" y="${sy(y) + 3.5}" text-anchor="end">${cfg.fy(y)}</text>`).join('')}
        ${cfg.ticksX.map(x => `<text class="h-g-t" x="${sx(x)}" y="${ALTO - MARGEN.b + 13}" text-anchor="middle">${cfg.fx(x)}</text>`).join('')}
        <text class="h-g-t" x="${(MARGEN.i + ANCHO - MARGEN.d) / 2}" y="${ALTO - 3}" text-anchor="middle">${cfg.etX}</text>
        <text class="h-g-t" x="${MARGEN.i}" y="${MARGEN.a - 3}" text-anchor="start">${cfg.etY}</text>
        ${marcas}
        ${(cfg.puntos || []).map(p => `<circle class="h-g-punto" cx="${sx(p.x)}" cy="${sy(p.y)}" r="5"/><text class="h-g-rt" x="${sx(p.x) + (p.izq ? -9 : 9)}" y="${sy(p.y) + 4}" text-anchor="${p.izq ? 'end' : 'start'}">${p.texto}</text>`).join('')}
        ${(cfg.refsX || []).map(r => `<line class="h-g-ref" x1="${sx(r.x)}" x2="${sx(r.x)}" y1="${MARGEN.a}" y2="${ALTO - MARGEN.b}"/><text class="h-g-rt" x="${sx(r.x) - 3}" y="${MARGEN.a + 10}" text-anchor="end">${r.texto}</text>`).join('')}
        <line class="h-g-ahora" y1="${MARGEN.a}" y2="${ALTO - MARGEN.b}" visibility="hidden"/>
        <line class="h-g-guia" y1="${MARGEN.a}" y2="${ALTO - MARGEN.b}" visibility="hidden"/>
        <circle class="h-g-marca" r="5" visibility="hidden"/>
    </svg><div class="h-g-punta" hidden></div>`;
    const svgEl = el.querySelector('svg');
    const guia = el.querySelector('.h-g-guia');
    const punta = el.querySelector('.h-g-punta');
    const ahora = el.querySelector('.h-g-ahora');
    const marca = el.querySelector('.h-g-marca');
    svgEl.addEventListener('pointermove', e => {
        const r = svgEl.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * ANCHO;
        const x = clamp(cfg.xMin + ((px - MARGEN.i) / (ANCHO - MARGEN.i - MARGEN.d)) * (cfg.xMax - cfg.xMin), cfg.xMin, cfg.xMax);
        guia.setAttribute('x1', sx(x));
        guia.setAttribute('x2', sx(x));
        guia.setAttribute('visibility', 'visible');
        punta.hidden = false;
        punta.textContent = cfg.punta(x);
        punta.style.left = `${clamp((sx(x) / ANCHO) * 100, 26, 74)}%`;
    });
    svgEl.addEventListener('pointerleave', () => { guia.setAttribute('visibility', 'hidden'); punta.hidden = true; });
    return {
        cfg,
        marcar(x, y) { marca.setAttribute('cx', sx(x)); marca.setAttribute('cy', sy(clamp(y, cfg.yMin, cfg.yMax))); marca.setAttribute('visibility', 'visible'); },
        ahora(x) { ahora.setAttribute('x1', sx(x)); ahora.setAttribute('x2', sx(x)); ahora.setAttribute('visibility', 'visible'); },
    };
}
export const leyenda = series => series.map(s => `<i class="${s.clase}"></i>${s.nombre}`).join('');
export const tablaHTML = (cab, filas) => `<thead><tr>${cab.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${filas.map(f => `<tr>${f.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
/** Barras de «a dónde va cada 100». filas: { t, v (0–1), activa, d, escala }. */
export const barrasHTML = filas => filas.map(f => `<div class="h-barra-f${f.activa ? ' es-activa' : ''}" title="${f.t}: ${num(f.v * 100, f.d ?? 0)} de cada 100"><span>${f.t}</span><i><u style="width:${clamp((f.v / (f.escala ?? 1)), 0, 1) * 100}%"></u></i><b>${num(f.v * 100, f.d ?? 0)}</b></div>`).join('');

// ------------------------------------------------------------------ las secciones del tablero que se repiten
export const seccionDiagrama = (titulo = 'Qué pasa adentro') => `<section class="g-curva h-media">
    <div class="g-curva-cab"><b data-c="aT">${titulo}</b></div>
    <canvas class="h-diagrama" id="h-diagrama" aria-hidden="true"></canvas>
    <p data-c="aPie"></p>
</section>`;
export const seccionGrafica = letra => `<section class="g-curva h-media">
    <div class="g-curva-cab"><b id="h-${letra}-t"></b><span class="h-leyenda" id="h-${letra}-ley"></span></div>
    <div class="h-grafica" id="h-${letra}-grafica"></div>
    <p id="h-${letra}-pie"></p>
    <details class="h-tabla"><summary>Ver estos datos como tabla</summary><table id="h-tabla-${letra}"></table></details>
</section>`;
export const seccionBarras = () => `<section class="g-curva h-media">
    <div class="g-curva-cab"><b id="h-d-t"></b></div>
    <div class="h-barras" id="h-barras"></div>
    <p id="h-d-pie"></p>
</section>`;
export const seccionTabla = (titulo, id, pie, clase = '') => `<section class="g-curva h-media">
    <div class="g-curva-cab"><b>${titulo}</b></div>
    <div class="h-tabla-suelta ${clase}"><table id="${id}"></table></div>
    <p>${pie}</p>
</section>`;
export const seccionColores = (fluidos, nota, titulo = 'Colores de los tubos') => `<section class="g-curva h-colores">
    <div class="g-curva-cab"><b>${titulo}</b></div>
    <ul class="h-tubos">${Object.values(fluidos).map(f => `<li><i style="background:${f.color}"></i>${f.nombre}</li>`).join('')}</ul>
    <p>${nota}</p>
</section>`;
export const seccionFuentes = (fuentes, leyes = []) => `<section class="g-curva h-fuentes" aria-labelledby="h-fuentes-t">
    <div class="g-curva-cab"><b id="h-fuentes-t">Fuentes</b></div>
    <ul>
        ${fuentes.map(f => `<li><span class="h-fuente-para">${f.para}</span><a href="${f.url}" target="_blank" rel="noopener">${f.titulo}</a><small>${f.autor}, ${f.fecha}${f.editorial ? `. ${f.editorial}` : ''}</small></li>`).join('')}
        ${leyes.map(l => `<li><span class="h-fuente-para">${l.para}</span><b>${l.titulo}</b><small>${l.nota}</small></li>`).join('')}
    </ul>
</section>`;
