// El diagrama que explica cada modo, dibujado en un lienzo 2D: las dos ondas y el medidor del flujo, el devanado con su salida
// intermedia, el diagrama de flechas con carga, el flujo al energizar y el camino de una falla. No es a escala. Lee las mismas lecturas
// que el resto.
import { A, BANCO, DIF, EJ, NORMA, flujoEn } from './modelo.js';

const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ORO = '#e0a03c';
const MORADO = '#7e57c2';

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
    const texto = (t, x, y, color, tam = 11, peso = 650, alin = 'center') => { ctx.fillStyle = color; ctx.font = `${peso} ${tam}px Manrope, system-ui, sans-serif`; ctx.textAlign = alin; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y, W - 12); };
    const cabe = (largo, corto, tam = 10.5, peso = 700) => { ctx.font = `${peso} ${tam}px Manrope, system-ui, sans-serif`; return ctx.measureText(largo).width < W - 24 ? largo : corto; };
    const caja = (x, y, w, h, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, Math.max(h, 0.5), r); ctx.fill(); };
    const marco = (x, y, w, h, r, color, ancho = 1.5) => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke(); };
    const trazo = (puntos, color, ancho = 1.5, guiones = null) => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(guiones ?? []); ctx.beginPath(); puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.setLineDash([]); };
    const flecha = (x0, y0, x1, y1, color, ancho = 2.5) => {
        trazo([[x0, y0], [x1, y1]], color, ancho);
        const a = Math.atan2(y1 - y0, x1 - x0);
        const l = 8;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - l * Math.cos(a - 0.4), y1 - l * Math.sin(a - 0.4)); ctx.lineTo(x1 - l * Math.cos(a + 0.4), y1 - l * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
    };
    /** Una bobina vertical de (x, y0) a (x, y1): rizos hacia la derecha. */
    const bobina = (x, y0, y1, color, vueltas) => {
        const pts = [];
        for (let i = 0; i <= vueltas * 12; i++) { const u = i / (vueltas * 12); pts.push([x + 9 * Math.abs(Math.sin(Math.PI * vueltas * u)), y0 + (y1 - y0) * u]); }
        trazo(pts, color, 2.2);
    };

    // Cómo cambia el voltaje: dos ondas (400 y 230 kV) y el medidor del flujo con su codo.
    function relacion(t, L, c) {
        const x0 = 16;
        const x1 = W - 16;
        const mid = (x0 + x1) / 2;
        const yc = Math.max(80, H * 0.42);
        const amp = Math.min(H * 0.15, 40);
        const onda = (a, b, k, color) => {
            const pts = [];
            for (let i = 0; i <= 80; i++) { const u = i / 80; pts.push([a + u * (b - a), yc - amp * k * Math.sin(2 * Math.PI * (2 * (L.f / BANCO.f) * u - t * 0.5))]); }
            trazo(pts, color, 2);
        };
        trazo([[x0, yc], [mid - 22, yc]], c.linea, 1);
        trazo([[mid + 22, yc], [x1, yc]], c.linea, 1);
        onda(x0, mid - 22, clamp(L.v / 100, 0, 1.3) * 0.75, ORO);
        onda(mid + 22, x1, clamp(L.v / 100, 0, 1.3) * 0.75 / A, ORO);
        flecha(mid - 14, yc, mid + 14, yc, c.tinta, 2);
        texto(`${num(L.kVa)} kV`, (x0 + mid) / 2, yc - amp - 10, c.tinta, 11, 750);
        texto(`${num(L.kVb, 1)} kV`, (mid + x1) / 2, yc - amp - 10, c.tinta, 11, 750);
        texto(`÷ ${num(A, 2)}`, mid, yc + 16, c.suave, 10, 700);
        // el medidor del flujo: hasta 100 normal, luego el codo, luego saturado
        const gy = Math.min(H - 34, yc + amp + 34);
        const gx0 = x0 + 4;
        const gx1 = x1 - 4;
        const sx = v => gx0 + ((gx1 - gx0) * clamp(v, 0, 130)) / 130;
        caja(gx0, gy, sx(100) - gx0, 10, 3, c.linea);
        caja(sx(100), gy, sx(EJ.codo * 100 - 10) - sx(100), 10, 0, '#e0b43a');
        caja(sx(EJ.codo * 100 - 10), gy, gx1 - sx(EJ.codo * 100 - 10), 10, 3, c.guinda);
        const xv = sx(L.vhz);
        trazo([[xv, gy - 6], [xv, gy + 16]], c.tinta, 2.5);
        texto(cabe(`Flujo: ${num(L.vhz)} % del normal`, `Flujo ${num(L.vhz)} %`), mid, gy - 14, L.satura ? c.guinda : c.tinta, 10.5, 750);
        // cada nombre, solo si cabe en su tramo
        ctx.font = '650 9.5px Manrope, system-ui, sans-serif';
        for (const [n, a, b] of [['normal', gx0, sx(100)], ['codo', sx(100), sx(EJ.codo * 100 - 10)], ['se satura', sx(EJ.codo * 100 - 10), gx1]]) if (ctx.measureText(n).width + 6 < b - a) texto(n, (a + b) / 2, gy + 22, c.suave, 9.5, 650);
        texto(cabe(`Relación: 400 ÷ 230 = ${num(A, 2)} · ${num(L.f, 1)} Hz`, `${num(L.f, 1)} Hz`), mid, 14, c.tinta, 10.5, 700);
    }

    // Por qué es autotransformador: un devanado con salida intermedia, sus corrientes, y cómo se reparte la energía.
    function auto(t, L, c) {
        const xb = Math.max(86, W * 0.2);
        const yT = 40;
        const yB = H - 30;
        const yX = yB - (yB - yT) * (1 / A);
        bobina(xb, yT, yX, '#c8743c', 5);
        bobina(xb, yX, yB, '#b0602e', 6);
        // las terminales
        trazo([[xb - 34, yT], [xb, yT]], c.tinta, 2);
        trazo([[xb + 12, yX], [xb + 52, yX]], c.tinta, 2);
        trazo([[xb, yB], [xb, yB + 8]], c.tinta, 2);
        trazo([[xb - 8, yB + 8], [xb + 8, yB + 8]], c.tinta, 2);
        trazo([[xb - 5, yB + 12], [xb + 5, yB + 12]], c.tinta, 1.5);
        texto('400 kV', xb - 36, yT - 12, c.tinta, 10.5, 750, 'left');
        texto('230 kV', xb + 54, yX - 12, c.tinta, 10.5, 750, 'left');
        texto(`${num(L.Ia)} A`, xb - 36, yT + 12, ORO, 10.5, 750, 'left');
        texto(`${num(L.Ib)} A`, xb + 54, yX + 10, ORO, 10.5, 750, 'left');
        texto(`serie: ${num(L.serie)} A`, xb - 6, (yT + yX) / 2 + 6, c.suave, 9.5, 700, 'right');
        texto(`común: ${num(L.comun)} A`, xb - 6, (yX + yB) / 2, c.suave, 9.5, 700, 'right');
        // a la derecha, cómo pasa la energía
        const bx = Math.max(xb + 120, W * 0.55);
        if (W - bx > 90) {
            const bw = W - 16 - bx;
            const by = Math.max(50, H * 0.32);
            const k = 1 - L.parte;
            caja(bx, by, bw * k - 2, 22, 4, ORO);
            caja(bx + bw * k, by, bw * L.parte, 22, 4, MORADO);
            const largo = bw > 170;
            texto(`${num(k * 100, 1)} % ${largo ? 'directo por el cobre' : 'por el cobre'}`, bx, by - 12, c.tinta, 10, 700, 'left');
            texto(`${num(L.parte * 100, 1)} % por el núcleo`, bx, by + 38, c.tinta, 10, 700, 'left');
            texto(`${num(L.nucleo)} de ${num(L.S)} MVA`, bx, by + 54, c.suave, 9.5, 650, 'left');
        }
        texto(cabe('Un solo devanado por fase, con una salida intermedia', 'Un devanado con una salida intermedia'), W / 2, 14, c.tinta, 10.5, 700);
    }

    // Con carga: el voltaje de 230 kV más la caída en la impedancia da el de 400 kV, que la red mantiene fijo.
    function carga(t, L, c) {
        const esc = Math.min((W - 60) / 1.25, (H - 70) / 0.7, 260);
        const ox = Math.max(18, W * 0.08);
        const oy = Math.min(H - 60, Math.max(70, H * 0.6));
        const th = (L.ang * Math.PI) / 180;
        const v2 = [ox + esc * L.v, oy];
        // la caída: I × R en la dirección de la corriente, e I × X noventa grados adelante (agrandadas 2 veces para que se vean)
        const k = 2;
        const R = (EJ.pc / (BANCO.S * 1000)) * L.i * k;
        const X = Math.sqrt(BANCO.z ** 2 - (EJ.pc / (BANCO.S * 1000)) ** 2) * L.i * k;
        const p1 = [v2[0] + esc * R * Math.cos(-th), v2[1] - esc * R * Math.sin(-th)];
        const p2 = [p1[0] + esc * X * Math.cos(Math.PI / 2 - th), p1[1] - esc * X * Math.sin(Math.PI / 2 - th)];
        flecha(ox, oy, v2[0], v2[1], ORO);
        if (L.i > 0.02) {
            flecha(v2[0], v2[1], p1[0], p1[1], c.suave, 1.5);
            flecha(p1[0], p1[1], p2[0], p2[1], c.guinda, 2);
            flecha(ox, oy, p2[0], p2[1], c.tinta, 1.8);
            // la corriente, con su ángulo
            flecha(ox, oy, ox + esc * 0.3 * Math.cos(-th), oy - esc * 0.3 * Math.sin(-th), MORADO, 1.8);
            texto('I', ox + esc * 0.32 * Math.cos(-th) + 6, oy - esc * 0.32 * Math.sin(-th), MORADO, 10.5, 750, 'left');
        }
        texto(`230 kV: ${num(L.kV, 1)}`, ox + (v2[0] - ox) * 0.72, oy + 14, c.tinta, 10, 700);
        texto('I × X (agrandada)', (p1[0] + p2[0]) / 2 + 8, (p1[1] + p2[1]) / 2, c.guinda, 9.5, 700, 'left');
        texto('400 kV, fijo', p2[0] - 6, p2[1] - 10, c.tinta, 10, 700, 'right');
        const msg = L.caida >= 0 ? `El voltaje cae ${num(L.caida, 1)} %` : `El voltaje sube ${num(-L.caida, 1)} %`;
        texto(cabe(`${msg} · eficiencia ${num(L.eficiencia * 100, 2)} %`, msg), W / 2, 14, L.caida > 5 ? c.guinda : c.tinta, 10.5, 700);
    }

    // Al energizarlo: el flujo de los primeros ciclos, contra el codo del núcleo.
    function energizar(t, L, c) {
        const x0 = 32;
        const x1 = W - 12;
        const y0 = 34;
        const y1 = H - 24;
        const sy = f => (y0 + y1) / 2 - (f / 2.8) * ((y1 - y0) / 2);
        const sx = ms => x0 + ((x1 - x0) * ms) / 100;
        // la franja donde el núcleo se satura
        for (const s of [1, -1]) { const a = sy(s * EJ.codo); const b = sy(s * 2.8); caja(x0, Math.min(a, b), x1 - x0, Math.abs(b - a), 0, 'rgba(155,34,71,0.12)'); }
        trazo([[x0, sy(0)], [x1, sy(0)]], c.linea, 1);
        for (const s of [1, -1]) trazo([[x0, sy(s)], [x1, sy(s)]], c.linea, 1, [4, 4]);
        texto('codo', x0 + 2, sy(EJ.codo) - 8, c.guinda, 9.5, 700, 'left');
        texto('normal', x0 + 2, sy(1) + 9, c.suave, 9.5, 650, 'left');
        const pts = [];
        for (let i = 0; i <= 200; i++) { const ms = i / 2; pts.push([sx(ms), sy(clamp(flujoEn(ms / 1000, L.alfa, L.rem), -2.8, 2.8))]); }
        trazo(pts, MORADO, 2);
        if (L.cerrado && L.tc >= 0 && !L.disparo) { const x = sx(L.tc * 1000); trazo([[x, y0], [x, y1]], c.tinta, 1.5); }
        texto('Flujo del núcleo, 100 ms', x0, y1 + 12, c.suave, 9.5, 650, 'left');
        const estado = L.disparo ? 'La diferencial disparó' : L.opera ? (L.bloquea ? `Bloqueada: ${num(L.pct2)} % de 2.ª armónica` : 'Dispararía') : 'La diferencial no lo ve';
        texto(cabe(`Flujo hasta ${num(L.phiMax, 2)} veces · ${estado}`, estado), W / 2, 14, L.disparo || (L.opera && !L.bloquea) ? c.guinda : c.tinta, 10.5, 700);
    }

    // Una falla: la red, el banco y la barra de 230 kV, con la corriente que pasa.
    function falla(t, L, c) {
        const y = Math.max(70, H * 0.48);
        const x0 = 16;
        const x1 = W - 16;
        const w = (x1 - x0) / 3;
        const bloque = (i, titulo, sub, resalta) => {
            const x = x0 + i * w + 6;
            caja(x, y - 24, w - 12, 48, 8, resalta ? 'rgba(155,34,71,0.12)' : 'rgba(127,127,127,0.10)');
            marco(x, y - 24, w - 12, 48, 8, resalta ? c.guinda : c.linea);
            texto(titulo, x + (w - 12) / 2, y - 7, c.tinta, 10.5, 750);
            texto(sub, x + (w - 12) / 2, y + 10, c.suave, 9.5, 650);
        };
        bloque(0, 'Red de 400 kV', `${num(L.zs * 100, 1)} %`, false);
        bloque(1, 'Banco', `${num(BANCO.z * 100, 2)} %`, L.hay && L.dentro);
        bloque(2, 'Barra 230 kV', L.hay && !L.dentro ? 'falla' : 'sin falla', L.hay && !L.dentro);
        // el rayo de la falla
        const rayo = (x, yy) => { trazo([[x, yy - 14], [x - 6, yy], [x + 4, yy], [x - 2, yy + 14]], ORO, 3); };
        if (L.hay) rayo(L.dentro ? x0 + 1.5 * w : x0 + 2.5 * w, y + 38);
        if (L.hay) flecha(x0 + 0.5 * w, y + 34, L.dentro ? x0 + 1.3 * w : x0 + 2.3 * w, y + 34, ORO, 2.5);
        texto(L.hay ? `${num(L.kA, 1)} kA · primer pico ${num(L.pico, 1)} kA` : `Si cae: ${num(L.kA, 1)} kA en 230 kV`, W / 2, Math.min(H - 12, y + 58), c.tinta, 10.5, 700);
        const msg = !L.hay ? 'La corriente la limitan la red y la impedancia del banco' : L.dentro ? 'Adentro: la diferencial y el Buchholz disparan' : 'Afuera: la diferencial no dispara';
        texto(cabe(msg, L.dentro ? 'Adentro: dispara' : 'Afuera: no dispara'), W / 2, 14, L.hay && L.dentro ? c.guinda : c.tinta, 10.5, 700);
        if (W > 360) texto(`Debe aguantarla ${NORMA.falla.s} s · diferencial sin restricción: ${DIF.sinRestriccion} veces`, W / 2, 32, c.suave, 9.5, 650);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'auto') auto(t, L, c);
        else if (modo === 'carga') carga(t, L, c);
        else if (modo === 'energizar') energizar(t, L, c);
        else if (modo === 'falla') falla(t, L, c);
        else relacion(t, L, c);
    }
    return { dibujar };
}
