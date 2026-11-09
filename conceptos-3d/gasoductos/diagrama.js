// El diagrama que explica cada modo, dibujado en un lienzo 2D: cómo se aprieta el gas a lo largo del tubo, qué le pasa dentro de una estación, cuánto guarda el tubo en el día
// y qué hace una fuga entre dos válvulas. No es a escala: muestra quién entra, quién sale y qué cifras tiene. Lee las mismas lecturas que el resto.
import { DUCTO, ESTACIONES, PMOP, VALVULAS_NOM, densidad, velocidad } from './modelo.js';

const azar = a => { const x = Math.sin(a * 127.1) * 43758.5453; return x - Math.floor(x); };
const fract = x => x - Math.floor(x);
const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

export function crearDiagrama(lienzo) {
    const ctx = lienzo.getContext('2d');
    let W = 0;
    let H = 0;
    function medir() {
        const r = lienzo.getBoundingClientRect();
        const dpr = Math.min(devicePixelRatio || 1, 2);
        if (Math.round(r.width * dpr) !== lienzo.width || Math.round(r.height * dpr) !== lienzo.height) {
            lienzo.width = Math.round(r.width * dpr);
            lienzo.height = Math.round(r.height * dpr);
        }
        W = r.width;
        H = r.height;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const punto = (x, y, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
    const texto = (t, x, y, color, tam = 11, peso = 650, alin = 'center') => {
        ctx.fillStyle = color;
        ctx.font = `${peso} ${tam}px Manrope, system-ui, sans-serif`;
        ctx.textAlign = alin;
        ctx.textBaseline = 'middle';
        ctx.fillText(t, x, y);
    };
    const caja = (x, y, w, h, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, Math.max(h, 0.5), r); ctx.fill(); };
    const trazo = (puntos, color, ancho = 1.5) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = ancho;
        ctx.beginPath();
        puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
    };
    const flecha = (x0, y, x1, color, ancho = 2.4) => {
        trazo([[x0, y], [x1, y]], color, ancho);
        const s = Math.sign(x1 - x0) || 1;
        trazo([[x1 - s * 6, y - 4], [x1, y], [x1 - s * 6, y + 4]], color, ancho);
    };

    // El tubo a lo largo: el gas va más junto donde hay más presión.
    function presion(t, L, c) {
        const P = L.P;
        const alto = Math.min(56, H - 94);
        const y0 = Math.max(34, (H - alto - 34) / 2);
        const [x0, x1] = [18, W - 18];
        const xk = km => x0 + (km / DUCTO.km) * (x1 - x0);
        caja(x0, y0, x1 - x0, alto, 9, c.superficie);
        // puntos: muchos donde hay presión. Se mueven con la velocidad del gas.
        const n = 22;
        for (let i = 0; i < n * 8; i++) {
            const km = (i / (n * 8)) * DUCTO.km;
            const p = P.pEn(km);
            const toca = azar(i * 1.7) < (densidad(p) / densidad(PMOP)) ** 2.4;
            if (!toca) continue;
            const v = velocidad(P.q, p);
            const x = x0 + 6 + fract(km / DUCTO.km + (t * v) / 300) * (x1 - x0 - 12);
            punto(x, y0 + 7 + azar(i * 3.1) * (alto - 14), 1.7, c.alta);
        }
        P.on.forEach((on, i) => {
            const x = xk(ESTACIONES[i].km);
            trazo([[x, y0 - 3], [x, y0 + alto + 3]], on ? c.guinda : c.suave, on ? 2.4 : 1.2);
            texto(on ? ESTACIONES[i].nombre : 'Apagada', x, y0 - 12, on ? c.tinta : c.suave, 10.5, on ? 700 : 600);
        });
        texto(`${num(PMOP)} bar`, x0, y0 + alto + 15, c.tinta, 12, 750, 'left');
        texto(`${num(L.vIni, 1)} m/s`, x0, y0 + alto + 30, c.suave, 10.5, 650, 'left');
        texto(`${num(P.fin)} bar`, x1, y0 + alto + 15, c.tinta, 12, 750, 'right');
        texto(`${num(L.vFin, 1)} m/s`, x1, y0 + alto + 30, c.suave, 10.5, 650, 'right');
        texto(`Tarda ${L.viaje > 99 ? 'más de 99' : num(L.viaje)} horas en cruzar los ${DUCTO.km} km`, W / 2, y0 + alto + 22, c.tinta, 11, 650);
    }
    // Lo que le pasa al gas al cruzar una estación.
    function estacion(t, L, c) {
        const C = L.C.find(Boolean);
        const [a, b] = [12, W - 12];
        const paso = (b - a) / 3;
        const y = H / 2 - 12;
        const nombres = ['Filtros', 'Compresor', 'Enfriador'];
        const P = L.P;
        const Ps = P.succion[0] ?? P.fin;
        const filas = C ? [[`${num(Ps)} bar`, `${num(C.entra)} °C`], [`${num(PMOP)} bar`, `${num(C.sale)} °C`], [`${num(PMOP)} bar`, 'unos 30 °C']] : [[`${num(Ps)} bar`, ''], [`${num(Ps)} bar`, ''], [`${num(Ps)} bar`, '']];
        for (let i = 0; i < 3; i++) {
            const x = a + i * paso + 6;
            const w = paso - 12;
            caja(x, y - 24, w, 48, 8, i === 1 && C ? c.guindaSuave : c.superficie);
            texto(nombres[i], x + w / 2, y - 9, c.tinta, 11.5, 720);
            texto(filas[i][0], x + w / 2, y + 7, c.tinta, 12, 750);
            if (filas[i][1]) texto(filas[i][1], x + w / 2, y + 36, c.suave, 11, 650);
            if (i < 2) flecha(x + w - 2, y, x + w + 12, c.tinta, 1.6);
        }
        texto(C ? `Una estación: ${num(C.MW, 1)} MW, y quema ${num(C.pct, 2)} % del gas que pasa` : 'Con las estaciones apagadas, el gas solo cruza', W / 2, H - 12, c.tinta, 11, 650);
        void t;
    }
    // El tubo como almacén: lo que entra, lo que sale y cuánto guarda.
    function empaque(t, L, c) {
        const w = Math.min(W * 0.42, 190);
        const [x, y] = [W / 2 - w / 2, 14];
        const h = H - 58;
        caja(x, y, w, h, 12, c.superficie);
        const nivel = L.pct;
        caja(x + 3, y + h - 3 - (h - 6) * nivel, w - 6, (h - 6) * nivel, 9, c.alta);
        for (let i = 0; i < 14; i++) punto(x + 8 + azar(i * 2) * (w - 16), y + h - 6 - fract(azar(i + 4) + t * 0.05) * (h - 12) * nivel, 1.5, c.claro);
        texto(`${num(L.guardado)}`, x + w / 2, y + h / 2 - 8, nivel > 0.45 ? c.claro : c.tinta, 16, 780);
        texto('guarda', x + w / 2, y + h / 2 + 9, nivel > 0.45 ? c.claro : c.tinta, 10.5, 650);
        texto('Entra', x / 2, y + h / 2 - 24, c.tinta, 11, 700);
        texto(num(L.entra), x / 2, y + h / 2 - 9, c.tinta, 13, 750);
        flecha(14, y + h / 2 + 8, x - 8, c.tinta, Math.max(1.2, Math.min(5, L.entra / 280)));
        texto('Sale', x + w + (W - x - w) / 2, y + h / 2 - 24, c.tinta, 11, 700);
        texto(num(L.sale), x + w + (W - x - w) / 2, y + h / 2 - 9, c.tinta, 13, 750);
        flecha(x + w + 8, y + h / 2 + 8, W - 14, c.tinta, Math.max(1.2, Math.min(5, L.sale / 280)));
        const hh = Math.floor(L.h);
        texto(`A las ${hh}:${String(Math.floor((L.h - hh) * 60)).padStart(2, '0')}. Millones de pies cúbicos`, W / 2, H - 12, c.tinta, 11, 650);
    }
    // Un tramo entre dos válvulas.
    function fuga(t, L, c) {
        const y = H / 2 - 12;
        const [x0, x1] = [16, W - 16];
        const [v0, v1] = [x0 + (x1 - x0) * 0.26, x0 + (x1 - x0) * 0.74];
        const R = L.R;
        const F = L.F;
        const tramo = (a, b, color) => caja(a, y - 13, b - a, 26, 6, color);
        tramo(x0, v0, c.alta);
        tramo(v1, x1, c.alta);
        const frac = F ? Math.max(0, F.P) / R.P0 : 1;
        ctx.globalAlpha = 0.18 + 0.82 * frac;
        tramo(v0, v1, c.alta);
        ctx.globalAlpha = 1;
        for (const v of [v0, v1]) {
            const cerrada = F?.cerrada;
            caja(v - 5, y - 19, 10, 38, 3, cerrada ? c.guinda : c.tinta);
            texto(cerrada ? 'Cerrada' : 'Abierta', v, y - 28, cerrada ? c.guinda : c.tinta, 10.5, 700);
        }
        if (F) {
            const xr = (v0 + v1) / 2;
            for (let k = 0; k < 16; k++) {
                const u = fract(k / 16 + t * 0.7);
                if (F.P < 3) break;
                punto(xr + (azar(k) - 0.5) * 40 * u, y - 13 - u * 26, 1.6 + u * 2, c.suave);
            }
            trazo([[xr - 5, y - 13], [xr + 5, y + 13]], c.guinda, 2.6);
        }
        texto(`${VALVULAS_NOM[L.clase].km} km entre válvulas`, (v0 + v1) / 2, y + 26, c.tinta, 11, 700);
        texto(F ? `Minuto ${num(F.t)}: ${num(F.P)} bar en el tramo, y ${num(F.perdido)} millones de pies cúbicos perdidos` : 'Todo en orden', W / 2, H - 12, c.tinta, 11, 650);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'estacion') estacion(t, L, c);
        else if (modo === 'empaque') empaque(t, L, c);
        else if (modo === 'fuga') fuga(t, L, c);
        else presion(t, L, c);
    }
    return { dibujar };
}

