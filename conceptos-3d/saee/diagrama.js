// El diagrama que explica cada modo, dibujado en un lienzo 2D: las 24 horas del día con lo que compra y vende la batería, lo que hace junto
// a la central, quién se queda con qué en el tolling, y de dónde sale la energía de la mina. No es a escala. Lee las mismas lecturas que
// el resto.
import { CENTRAL, MINA } from './modelo.js';

const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const AZUL = '#2f7fd1';
const VERDE = '#2fb36a';
const SOL = '#ff8a3c';
const GRIS = '#8a8f98';

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
    const caja = (x, y, w, h, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, Math.max(w, 0.5), Math.max(h, 0.5), r); ctx.fill(); };
    const trazo = (puntos, color, ancho = 1.5) => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.beginPath(); puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
    /** Una pila con su nivel. */
    function pila(x, y, w, h, nivel, c, etiqueta) {
        ctx.strokeStyle = c.tinta; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.stroke();
        caja(x + w * 0.35, y - 4, w * 0.3, 4, 1, c.tinta);
        const n = clamp(nivel, 0, 1);
        caja(x + 3, y + 3 + (h - 6) * (1 - n), w - 6, (h - 6) * n, 2, VERDE);
        texto(`${num(n * 100)} %`, x + w / 2, y + h + 12, c.tinta, 10.5, 750);
        if (etiqueta) texto(etiqueta, x + w / 2, y + h + 26, c.suave, 9.5, 650);
    }
    /** Las 24 horas: barras del precio, pintadas de azul si carga y de verde si descarga. */
    function horas(L, c, valores, carga, descarga, x0, x1, yBase, alto, maxV) {
        const w = (x1 - x0) / 24;
        for (let h = 0; h < 24; h++) {
            const v = Math.max(0, valores[h]);
            const hb = (alto * v) / Math.max(1, maxV);
            const col = carga[h] > 0.01 ? AZUL : descarga[h] > 0.01 ? VERDE : 'rgba(127,127,127,0.35)';
            caja(x0 + h * w + 1, yBase - hb, w - 2, hb, 2, col);
        }
        const xh = x0 + clamp(L.hora, 0, 24) * w;
        trazo([[xh, yBase - alto - 4], [xh, yBase + 4]], c.guinda, 2);
        for (const h of [0, 6, 12, 18, 24]) texto(`${h}`, x0 + h * w, yBase + 11, c.suave, 9.5, 650);
    }

    // Compra y venta: el precio de cada hora del día promedio y la pila.
    function mercado(L, c) {
        const x0 = 16;
        const x1 = Math.max(x0 + 120, W - 86);
        const yB = H - 30;
        const alto = Math.max(50, H - 74);
        horas(L, c, L.perfil, L.d.carga, L.d.descarga, x0, x1, yB, alto, Math.max(...L.perfil));
        pila(W - 62, 34, 40, Math.min(110, H - 90), L.socPct, c, `${num(L.socPct * L.E)} MWh`);
        const msg = L.carga > 0.5 ? `Compra a ${num(L.precio)} $/MWh` : L.descarga > 0.5 ? `Vende a ${num(L.precio)} $/MWh` : 'Espera';
        texto(cabe(`${msg} · día promedio de ${L.M.nombre}`, msg), W / 2, 14, c.tinta, 10.5, 700);
    }

    // Junto a la central: lo que da el sol, lo que cabe en el contrato y lo que hace la batería.
    function central(L, c) {
        const x0 = 16;
        const x1 = Math.max(x0 + 120, W - 86);
        const yB = H - 30;
        const alto = Math.max(50, H - 74);
        const maxV = CENTRAL.mwCA;
        const w = (x1 - x0) / 24;
        for (let h = 0; h < 24; h++) {
            const b = L.c.bruta[h];
            const hb = (alto * b) / maxV;
            caja(x0 + h * w + 1, yB - hb, w - 2, hb, 2, 'rgba(255,138,60,0.35)');
            const r = L.red[h];
            const hr = (alto * r) / maxV;
            caja(x0 + h * w + 1, yB - hr, w - 2, hr, 2, L.d.descarga[h] > 0.01 ? VERDE : SOL);
            if (L.d.carga[h] > 0.01) caja(x0 + h * w + 1, yB - hb, w - 2, (alto * L.d.carga[h]) / maxV, 2, AZUL);
        }
        const yC = yB - (alto * CENTRAL.contrato) / maxV;
        ctx.setLineDash([5, 4]); trazo([[x0, yC], [x1, yC]], c.tinta, 1.5); ctx.setLineDash([]);
        texto('contrato', x0 + 4, yC - 8, c.tinta, 9.5, 700, 'left');
        const xh = x0 + clamp(L.hora, 0, 24) * w;
        trazo([[xh, yB - alto - 4], [xh, yB + 4]], c.guinda, 2);
        for (const h of [0, 6, 12, 18, 24]) texto(`${h}`, x0 + h * w, yB + 11, c.suave, 9.5, 650);
        pila(W - 62, 34, 40, Math.min(110, H - 90), L.socPct, c, L.P > 0 ? `${num(L.P)} MW` : 'sin batería');
        const a = L.ahora;
        const msg = L.P <= 0 ? 'Sin batería' : a.carga > 0.5 ? `Guarda ${num(a.carga)} MW` : a.descarga > 0.5 ? `Entrega ${num(a.descarga)} MW` : 'La batería espera';
        texto(cabe(`${msg} · a la red ${num(a.red)} MW`, msg), W / 2, 14, c.tinta, 10.5, 700);
    }

    // El tolling: quién paga a quién y quién se queda con el mercado.
    function tolling(L, c) {
        const T = L.T;
        const cx = W / 2;
        const y1 = Math.max(66, H * 0.3);
        const y2 = Math.min(H - 40, y1 + Math.max(70, H * 0.42));
        const bw = Math.min(140, W * 0.36);
        const bloque = (x, y, titulo, cifra, col) => {
            caja(x - bw / 2, y - 20, bw, 40, 8, col);
            texto(titulo, x, y - 7, '#ffffff', 10, 750);
            texto(cifra, x, y + 9, '#ffffff', 10.5, 800);
        };
        const flecha = (xa, ya, xb, yb, col, rot) => {
            trazo([[xa, ya], [xb, yb]], col, 2.5);
            const a = Math.atan2(yb - ya, xb - xa);
            ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(xb, yb); ctx.lineTo(xb - 8 * Math.cos(a - 0.4), yb - 8 * Math.sin(a - 0.4)); ctx.lineTo(xb - 8 * Math.cos(a + 0.4), yb - 8 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
            if (rot) texto(rot, (xa + xb) / 2 + 6, (ya + yb) / 2 - 8, c.tinta, 9.5, 700, 'left');
        };
        const xi = Math.max(bw / 2 + 8, cx - bw * 0.85);
        const xd = Math.min(W - bw / 2 - 8, cx + bw * 0.85);
        bloque(cx, y1 - 10, 'Mercado', `${num(T.mercadoAnio / 1e6)} millones al año`, '#6c7178');
        bloque(xi, y2, 'CFE', `${T.cfeConParte >= 0 ? '' : '−'}${num(Math.abs(T.cfeConParte) / 1e6)} millones`, c.guinda);
        bloque(xd, y2, T.esquema === 'mixta' ? 'Socio privado' : 'Almacenadora', `${num(T.privadoConParte / 1e6)} millones`, AZUL);
        flecha(cx - 20, y1 + 12, xi, y2 - 22, c.guinda, W > 360 ? 'lo que gana' : '');
        flecha(xi + bw / 2, y2 + 4, xd - bw / 2, y2 + 4, AZUL);
        texto(`pago fijo: ${num(T.pago)} mil $ por MW al mes`, cx, y2 + 34, c.tinta, 10, 700);
        if (T.esquema === 'mixta') texto(cabe('a la CFE le regresa 54 % del pago, por ser dueña del proyecto', '54 % del pago regresa a la CFE', 9.5, 650), cx, y2 + 50, c.suave, 9.5, 650);
        texto(cabe(T.esquema === 'mixta' ? 'Inversión mixta: la CFE también tiene 54 % del proyecto' : 'Producción de largo plazo: el Estado no pone capital', T.esquema === 'mixta' ? 'CFE con 54 %' : 'Largo plazo'), W / 2, 14, c.tinta, 10.5, 700);
    }

    // Sin red: de dónde sale la energía de la mina, hora por hora.
    function aislado(L, c) {
        const x0 = 16;
        const x1 = Math.max(x0 + 120, W - 86);
        const yB = H - 30;
        const alto = Math.max(50, H - 74);
        const maxV = Math.max(MINA.dia, ...L.solar) * 1.05;
        const w = (x1 - x0) / 24;
        for (let h = 0; h < 24; h++) {
            let y = yB;
            for (const [v, col] of [[L.r.directo[h], SOL], [L.r.descarga[h], VERDE], [L.r.diesel[h], GRIS]]) {
                const hb = (alto * v) / maxV;
                if (hb > 0.2) caja(x0 + h * w + 1, y - hb, w - 2, hb, 2, col);
                y -= hb;
            }
            if (L.r.carga[h] > 0.01) caja(x0 + h * w + 1, y - (alto * L.r.carga[h]) / maxV, w - 2, (alto * L.r.carga[h]) / maxV, 2, AZUL);
        }
        const xh = x0 + clamp(L.hora, 0, 24) * w;
        trazo([[xh, yB - alto - 4], [xh, yB + 4]], c.guinda, 2);
        for (const h of [0, 6, 12, 18, 24]) texto(`${h}`, x0 + h * w, yB + 11, c.suave, 9.5, 650);
        pila(W - 62, 34, 40, Math.min(110, H - 90), L.socPct, c, L.E > 0 ? `${num(L.E)} MWh` : 'sin batería');
        texto(cabe(`Del sol ${num(L.deSol * 100)} % · diésel ${num(L.litros)} L al día`, `Diésel ${num(L.litros)} L`), W / 2, 14, c.tinta, 10.5, 700);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'central') central(L, c);
        else if (modo === 'tolling') tolling(L, c);
        else if (modo === 'aislado') aislado(L, c);
        else mercado(L, c);
    }
    return { dibujar };
}
