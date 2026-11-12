// El diagrama que explica cada modo, dibujado en un lienzo 2D: los kWh del mes repartidos en bloques con su precio, lo que cuesta cada
// eslabón contra lo que pagas, los doce meses de la casa contra el límite de la DAC, y el precio de cada kWh para una casa, una tienda y una
// fábrica. No es a escala. Lee las mismas lecturas que el resto.
import { COSTO } from './costos.js';

const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const COLOR_BLOQUE = { 'Básico': '#2fb36a', Intermedio: '#f2b233', 'Intermedio bajo': '#f2b233', 'Intermedio alto': '#ff8a3c', Excedente: '#d64545' };
const VERDE = '#2fb36a';
const ROSA = '#e57a9a';
const GRIS = '#8a8f98';
const ROJO = '#d64545';

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
    const fuente = (tam, peso) => `${peso} ${tam}px Manrope, system-ui, sans-serif`;
    const texto = (t, x, y, color, tam = 11, peso = 650, alin = 'center') => { ctx.fillStyle = color; ctx.font = fuente(tam, peso); ctx.textAlign = alin; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y, W - 12); };
    const ancho = (t, tam = 10, peso = 700) => { ctx.font = fuente(tam, peso); return ctx.measureText(t).width; };
    const cabe = (largo, corto, tam = 10.5, peso = 700) => (ancho(largo, tam, peso) < W - 24 ? largo : corto);
    const caja = (x, y, w, h, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, Math.max(w, 0.5), Math.max(h, 0.5), r); ctx.fill(); };
    const trazo = (puntos, color, a = 1.5) => { ctx.strokeStyle = color; ctx.lineWidth = a; ctx.beginPath(); puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
    const raya = (puntos, color, a = 1.5) => { ctx.setLineDash([5, 4]); trazo(puntos, color, a); ctx.setLineDash([]); };

    /** Dos barras que comparan lo que cuesta con lo que se paga, desde y. */
    function costoContraPago(k, pagado, y, alto, c) {
        const x0 = Math.min(84, W * 0.24);
        const x1 = W - 16;
        const max = Math.max(k.total, pagado) * 1.02;
        const X = v => x0 + ((x1 - x0) * v) / max;
        texto('Cuesta', x0 - 8, y + alto / 2, c.tinta, 10, 750, 'right');
        texto('Pagas', x0 - 8, y + alto * 1.5 + 6, c.tinta, 10, 750, 'right');
        let acc = 0;
        for (const p of k.partes) {
            caja(X(acc), y, X(acc + p.importe) - X(acc) - 1, alto, 3, p.color);
            acc += p.importe;
        }
        const tc = `${num(k.total)} $`;
        texto(tc, Math.min(X(k.total) + 4, x1 - ancho(tc, 9.5) - 2), y + alto / 2, c.tinta, 9.5, 750, 'left');
        const yp = y + alto + 6;
        caja(X(0), yp, X(Math.min(pagado, k.total)) - X(0) - 1, alto, 3, VERDE);
        if (pagado < k.total) caja(X(pagado), yp, X(k.total) - X(pagado) - 1, alto, 3, ROSA);
        else caja(X(k.total), yp, X(pagado) - X(k.total) - 1, alto, 3, ROJO);
        const tp = pagado < k.total ? `tú ${num(pagado)} $ · Gobierno ${num(k.total - pagado)} $` : `tú ${num(pagado)} $: ${num(pagado - k.total)} $ de más`;
        const tpc = pagado < k.total ? `tú ${num(pagado)} $` : `${num(pagado - k.total)} $ de más`;
        texto(cabe(tp, tpc, 9.5, 750), x0 + 6, yp + alto / 2, '#ffffff', 9.5, 750, 'left');
    }

    // El recibo: la regla de los kWh del mes partida en bloques con su precio, y abajo lo que cuesta contra lo que pagas.
    function recibo(L, c) {
        const r = L.r;
        const x0 = 16;
        const x1 = W - 16;
        const finitos = r.bloques.filter(b => Number.isFinite(b.hasta));
        const tope = Math.max(r.cobrar * 1.15, finitos.at(-1).hasta * 1.25, L.limiteDac * 1.08);
        const X = k => x0 + ((x1 - x0) * Math.min(k, tope)) / tope;
        const alto = clamp(H * 0.12, 18, 30);
        const y = clamp(H * 0.2, 40, 64);
        r.bloques.forEach((b, i) => {
            const xa = X(b.desde);
            const xb = X(Number.isFinite(b.hasta) ? b.hasta : tope);
            const col = COLOR_BLOQUE[b.nombre] ?? GRIS;
            caja(xa + 1, y, xb - xa - 2, alto, 4, `${col}40`);
            if (b.kwh > 0) caja(xa + 1, y, X(b.desde + b.kwh) - xa - 2, alto, 4, col);
            const w = xb - xa;
            const etq = `${num(b.precio, 3)} $`;
            if (w > ancho(etq, 9.5) + 6) texto(etq, (xa + xb) / 2, y + alto + 11, c.tinta, 9.5, 750);
            if (w > ancho(b.nombre, 9) + 6) texto(b.nombre, (xa + xb) / 2, y - 9, c.suave, 9, 650);
            else if (i === 0 && w > ancho('Bás.', 9) + 4) texto('Bás.', (xa + xb) / 2, y - 9, c.suave, 9, 650);
        });
        const xk = X(r.cobrar);
        trazo([[xk, y - 16], [xk, y + alto + 4]], c.guinda, 2.5);
        const xl = X(L.limiteDac);
        raya([[xl, y - 4], [xl, y + alto + 20]], c.tinta, 1.2);
        texto(`DAC: ${num(L.limiteDac)}`, clamp(xl, x0 + 30, x1 - 30), y + alto + 27, c.tinta, 9, 700);
        // lo que cuesta contra lo que pagas, sin IVA
        const yc = y + alto + 42;
        const altoC = clamp((H - yc - 30) / 2 - 4, 12, 24);
        if (H - yc > 50) costoContraPago(L.k, r.energia, yc, altoC, c);
        texto(cabe(`${num(r.cobrar)} kWh · ${num(r.energia)} $ + IVA ${num(r.iva)} $ = ${num(r.total)} $ al mes`, `${num(r.cobrar)} kWh · ${num(r.total)} $ al mes`), W / 2, H - 10, c.tinta, 10.5, 750);
        texto(cabe(`Tarifa ${r.tarifa}, ${r.verano ? 'verano' : 'fuera de verano'}: cada kWh paga el precio de su bloque`, `Tarifa ${r.tarifa}, ${r.verano ? 'verano' : 'fuera de verano'}`), W / 2, 14, c.tinta, 10.5, 700);
    }

    // Lo que cuesta: una barra con cada eslabón, otra con quién lo paga, y la lista de eslabones con su monto.
    function costo(L, c) {
        const k = L.k;
        const alto = clamp(H * 0.13, 16, 34);
        const y = clamp(H * 0.16, 30, 50);
        costoContraPago(k, L.r.energia, y, alto, c);
        const filas = k.partes;
        const cols = W > 560 ? 4 : W > 380 ? 3 : 2;
        const y0 = y + alto * 2 + 26;
        const paso = clamp((H - y0 - 24) / Math.ceil(filas.length / cols), 13, 20);
        const anchoCol = (W - 32) / cols;
        filas.forEach((p, i) => {
            const cx = 16 + (i % cols) * anchoCol;
            const cy = y0 + Math.floor(i / cols) * paso;
            caja(cx, cy - 4, 9, 9, 2, p.color);
            const t = `${p.corto ?? p.nombre} ${num(p.importe)} $`;
            texto(t, cx + 14, cy + 0.5, c.tinta, 9.5, 700, 'left');
        });
        texto(cabe(`${num(k.kwh)} kWh, sin IVA: cuesta ${num(k.porKwh, 2)} $ por kWh · costos de la CNE de ${COSTO.mes}`, `${num(k.kwh)} kWh · ${num(k.porKwh, 2)} $ por kWh`), W / 2, 14, c.tinta, 10.5, 700);
        texto(cabe(k.aportacion > 0 ? `Pagas ${num(k.pagaPct * 100)} de cada 100; el Gobierno pone el resto` : `Pagas ${num(k.razon * 100)} por cada 100 que cuesta`, k.aportacion > 0 ? `Pagas ${num(k.pagaPct * 100)} de cada 100` : 'Pagas de más'), W / 2, H - 10, c.tinta, 10.5, 750);
    }

    // La DAC: los doce meses de la casa, su promedio y el límite.
    function dac(L, c) {
        const a = L.a;
        const x0 = 34;
        const x1 = W - 12;
        const yB = H - 28;
        const alto = Math.max(50, H - 70);
        const max = Math.max(a.limite * 1.15, ...a.meses.map(m => m.total)) * 1.05;
        const Y = v => yB - (alto * v) / max;
        const w = (x1 - x0) / 12;
        a.meses.forEach((m, i) => {
            const x = x0 + i * w;
            caja(x + 2, Y(m.base), w - 4, yB - Y(m.base), 2, GRIS);
            if (m.clima > 0.5) caja(x + 2, Y(m.total), w - 4, Y(m.base) - Y(m.total), 2, '#2f7fd1');
            if (i === L.mes) { ctx.strokeStyle = c.guinda; ctx.lineWidth = 2; ctx.strokeRect(x + 1, Y(m.total) - 1, w - 2, yB - Y(m.total) + 2); }
            if (w > 16 || i % 2 === 0) texto(m.nombre.slice(0, w > 26 ? 3 : 1), x + w / 2, yB + 11, c.suave, 9, 650);
        });
        raya([[x0, Y(a.limite)], [x1, Y(a.limite)]], ROJO, 1.6);
        texto(`límite DAC ${num(a.limite)}`, x1, Y(a.limite) - 8, ROJO, 9.5, 750, 'right');
        trazo([[x0, Y(a.promedio)], [x1, Y(a.promedio)]], c.tinta, 1.8);
        texto(`promedio ${num(a.promedio)}`, x0 + 2, Y(a.promedio) - 8, c.tinta, 9.5, 750, 'left');
        texto('kWh', 4, Y(max * 0.95), c.suave, 9, 650, 'left');
        const msg = a.enDac ? `El promedio pasa el límite: tarifa DAC, sin aportación` : `Debajo del límite: tarifa ${a.tarifa} con aportación`;
        texto(cabe(msg, a.enDac ? 'Tarifa DAC' : `Tarifa ${a.tarifa}`), W / 2, 14, a.enDac ? ROJO : c.tinta, 10.5, 750);
    }

    // Negocios: lo que cuesta cada kWh a una casa, a una tienda y a una fábrica.
    function negocio(L, c) {
        const filas = [...L.barras, { t: 'Esta tienda', v: L.pdbt.medio, color: c.guinda }].sort((p, q) => p.v - q.v);
        const x0 = Math.min(150, W * 0.42);
        const x1 = W - 52;
        const max = Math.max(...filas.map(f => f.v)) * 1.08;
        const alto = Math.min(18, (H - 50) / filas.length - 6);
        const paso = alto + Math.min(10, (H - 50) / filas.length - alto);
        filas.forEach((f, i) => {
            const y = 30 + i * paso;
            texto(f.t, x0 - 8, y + alto / 2, c.tinta, 9.5, 700, 'right');
            caja(x0, y, ((x1 - x0) * f.v) / max, alto, 3, f.color);
            texto(`${num(f.v, 2)} $`, x0 + ((x1 - x0) * f.v) / max + 4, y + alto / 2, c.tinta, 9.5, 750, 'left');
        });
        texto(cabe('Pesos por kWh, sin IVA', 'Pesos por kWh'), W / 2, 14, c.tinta, 10.5, 700);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'costo') costo(L, c);
        else if (modo === 'dac') dac(L, c);
        else if (modo === 'negocio') negocio(L, c);
        else recibo(L, c);
    }
    return { dibujar };
}
