// El diagrama que explica cada modo, dibujado en un lienzo 2D. En «Pasos», la línea del tiempo del trámite; en los demás, el diagrama
// unifilar de la central a la red: los inversores, los transformadores, las barras de 34.5 y 115 kV, la línea de enlace y el punto de
// interconexión, con los voltajes y lo que corre (flujo), la falla y los interruptores (falla) o quién paga cada obra (costos).
// No es a escala. Lee las mismas lecturas que el resto.
import { ETAPAS, TENSION, TOTAL_DIAS } from './modelo.js';

const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const ALTA = '#f2b233';
const MEDIA = '#ff8a3c';
const AZUL = '#2f7fd1';
const VERDE = '#2fb36a';
const ROJO = '#d64545';
const MORADO = '#7e57c2';
const COLOR_QUIEN = { cenace: MORADO, cfe: AZUL, central: '#9b2247' };

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
    const caja = (x, y, w, h, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, Math.max(w, 0.5), Math.max(h, 0.5), r); ctx.fill(); };
    const trazo = (puntos, color, a = 1.5) => { ctx.strokeStyle = color; ctx.lineWidth = a; ctx.beginPath(); puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
    const circulo = (x, y, r, color, lleno = false) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (lleno) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke(); } };

    // ------------------------------------------------------------------ la línea del tiempo del trámite
    function pasos(L, c) {
        const x0 = 12;
        const x1 = W - 12;
        const y = H * 0.42;
        const sx = d => x0 + ((x1 - x0) * d) / TOTAL_DIAS;
        ETAPAS.forEach(e => {
            const hecha = L.dia >= e.hasta;
            const actual = e === L.etapa && !L.comercial;
            const color = hecha || actual ? COLOR_QUIEN[e.quien] : c.linea;
            caja(sx(e.desde) + 0.5, y - 9, sx(e.hasta) - sx(e.desde) - 1, 18, 3, color);
            if (actual) caja(sx(e.desde) + 0.5, y - 9, (sx(e.hasta) - sx(e.desde) - 1) * L.avance, 18, 3, c.tinta);
        });
        // el día de hoy
        const xd = sx(L.dia);
        trazo([[xd, y - 16], [xd, y + 16]], c.tinta, 2);
        circulo(xd, y - 18, 3.5, c.tinta, true);
        // los nombres: el de la etapa actual arriba y los cortos abajo si caben
        const e = L.etapa;
        texto(L.comercial ? 'Operación comercial' : e.nombre, Math.min(Math.max(xd, 70), W - 70), y - 30, c.tinta, 12, 750);
        let ultimo = -Infinity;
        ETAPAS.forEach(et => {
            const xm = (sx(et.desde) + sx(et.hasta)) / 2;
            const w = ancho(et.corto, 9.5, 650);
            if (xm - w / 2 > ultimo + 4 && xm + w / 2 < W - 4) { texto(et.corto, xm, y + 22, c.suave, 9.5, 650); ultimo = xm + w / 2; }
        });
        // quién hace cada parte
        const ley = [['CENACE', MORADO], ['CFE', AZUL], ['La central', COLOR_QUIEN.central]];
        let xl = 12;
        const yl = H - 14;
        for (const [t, col] of ley) { caja(xl, yl - 5, 10, 10, 2, col); texto(t, xl + 14, yl, c.suave, 10, 650, 'left'); xl += 22 + ancho(t, 10, 650); }
        texto(`Día hábil ${num(L.dia)} de ${num(TOTAL_DIAS)}`, W - 12, yl, c.tinta, 10, 700, 'right');
    }

    // ------------------------------------------------------------------ el unifilar
    /** Las posiciones de cada cosa, de izquierda a derecha. */
    function lugares() {
        const y = H * 0.5;
        const xs = [0.07, 0.24, 0.42, 0.62, 0.86].map(k => 12 + (W - 24) * k);
        return { y, inv: xs[0], b34: xs[1], b115: xs[2], linea: xs[3], poi: xs[4] };
    }
    /** Un transformador: dos círculos que se tocan. */
    const trafo = (x, y, color) => { circulo(x - 5, y, 7, color); circulo(x + 5, y, 7, color); };
    /** Una barra: raya vertical gruesa. */
    const barra = (x, y, color, alto = 34) => trazo([[x, y - alto / 2], [x, y + alto / 2]], color, 3.5);
    function unifilar(c, { colores = {}, voltajes = null, banco = false, saee = false, falla = null }) {
        const P = lugares();
        const col = k => colores[k] ?? c.tinta;
        const { y } = P;
        // inversores: un cuadro con ~
        caja(P.inv - 14, y - 12, 28, 24, 4, col('central'));
        texto('~', P.inv, y, '#ffffff', 15, 800);
        trazo([[P.inv + 14, y], [P.b34 - 32, y]], col('central'), 2);
        trafo(P.b34 - 22, y, col('central'));
        trazo([[P.b34 - 10, y], [P.b34, y]], col('central'), 2);
        barra(P.b34, y, col('central'));
        trazo([[P.b34, y], [P.b115 - 22, y]], col('central'), 2);
        trafo(P.b115 - 14, y, col('central'));
        trazo([[P.b115 - 2, y], [P.b115, y]], col('central'), 2);
        barra(P.b115, y, col('central'));
        // la línea de enlace: del marco al punto de interconexión
        trazo([[P.b115, y], [P.poi, y]], col('linea'), 2.5);
        barra(P.poi, y, col('poi'), 46);
        // la red: dos líneas que salen del punto de interconexión
        const xr = Math.min(W - 6, P.poi + 26);
        trazo([[P.poi, y - 14], [xr, y - 14]], col('red'), 2);
        if (falla?.abierta || falla?.enFalla) { trazo([[P.poi, y + 14], [P.poi + 10, y + 14]], col('red'), 2); trazo([[P.poi + 10, y + 14], [P.poi + 18, y + 8]], ROJO, 2.5); }
        else trazo([[P.poi, y + 14], [xr, y + 14]], col('red'), 2);
        if (falla?.enFalla) { trazo([[xr - 4, y + 6], [xr - 9, y + 14], [xr - 3, y + 14], [xr - 8, y + 22]], ROJO, 2.5); }
        // el banco de capacitores y el almacenamiento, abajo de la barra de 34.5 kV
        if (banco !== null) {
            const yb = y + 26;
            trazo([[P.b34, y + 17], [P.b34, yb - 4]], banco ? AZUL : c.linea, 1.5);
            trazo([[P.b34 - 8, yb - 4], [P.b34 + 8, yb - 4]], banco ? AZUL : c.linea, 2);
            trazo([[P.b34 - 8, yb], [P.b34 + 8, yb]], banco ? AZUL : c.linea, 2);
        }
        if (saee) { trazo([[P.b34 + 4, y + 17], [P.b34 + 4, y + 22], [P.b34 + 26, y + 22]], VERDE, 1.5); caja(P.b34 + 26, y + 16, 22, 12, 2, VERDE); }
        // los nombres, arriba
        const nombres = [[P.inv, 'Inversores'], [P.b34, '34.5 kV'], [P.b115, '115 kV'], [(P.b115 + P.poi) / 2, 'Línea de enlace'], [P.poi, 'Punto de interconexión']];
        let ultimo = -Infinity;
        for (const [x, t] of nombres) {
            const corto = t === 'Punto de interconexión' && ancho(t, 9.5) > W - x + 30 ? 'Interconexión' : t;
            const w = ancho(corto, 9.5, 650);
            const xx = Math.min(x, W - 6 - w / 2);
            if (xx - w / 2 > ultimo + 3) { texto(corto, xx, y - 30, c.suave, 9.5, 650); ultimo = xx + w / 2; }
        }
        if (voltajes) {
            for (const [x, v] of voltajes) {
                const fuera = v > TENSION.max + 1e-9 || v < TENSION.min - 1e-9;
                texto(num(v, 3), x, y + 40, fuera ? ROJO : c.tinta, 10.5, 750);
            }
        }
        return P;
    }

    function linea(L, c) {
        const P = unifilar(c, { colores: { central: L.mw > 0.5 ? MEDIA : c.suave, linea: ALTA }, voltajes: null, banco: L.banco });
        const vs = [[P.inv, L.vInv], [P.b34, L.v34], [P.b115, L.v115], [P.poi, 1]];
        for (const [x, v] of vs) {
            const fuera = v > TENSION.max + 1e-9 || v < TENSION.min - 1e-9;
            texto(num(v, 3), x, P.y + 40, fuera ? ROJO : c.tinta, 10.5, 750);
        }
        // flechas de lo que entra a la red
        const xm = (P.b115 + P.poi) / 2;
        texto(`${num(L.mw)} MW`, xm, P.y - 12, c.tinta, 11, 750);
        texto(L.mvar === 0 ? 'sin reactivos' : `${L.mvar > 0 ? 'entrega' : 'absorbe'} ${num(Math.abs(L.mvar), 1)} MVAr`, xm, P.y + 12, L.mvar >= 0 ? c.suave : AZUL, 10, 650);
        texto('Voltaje en cada punto, por unidad (de 0.95 a 1.05 está bien)', W / 2, H - 10, c.suave, 9.5, 650);
    }
    function falla(L, c) {
        const P = unifilar(c, { colores: { central: L.conectada ? MEDIA : c.suave, linea: L.conectada ? ALTA : c.suave, red: ALTA }, banco: null, falla: { enFalla: L.enFalla, abierta: L.t >= L.tc } });
        texto(`${num(L.v, 2)}`, P.poi, P.y + 40, L.v < 0.9 ? ROJO : c.tinta, 11, 750);
        texto(L.conectada ? `${num(L.p * 90)} MW` : 'Desconectada', (P.inv + P.b34) / 2, P.y + 40, L.conectada ? c.tinta : ROJO, 10.5, 750);
        const t = L.t < 0 ? 'Antes de la falla' : L.enFalla ? `Falla: ${num(L.t * 1000)} ms de ${num(L.ms)}` : `Liberada; ${num(L.t, 2)} s desde la falla`;
        texto(t, W / 2, H - 10, L.enFalla ? ROJO : c.suave, 10, 700);
    }
    function paga(L, c) {
        const central = '#9b2247';
        const red = L.modalidad === 'individual' ? central : AZUL;
        const P = unifilar(c, { colores: { central, linea: central, poi: central, red }, banco: false, saee: L.saee });
        texto(`${num(L.linea, 1)} millones`, (P.b115 + P.poi) / 2, P.y - 12, c.tinta, 10.5, 750);
        texto('obra de interconexión', (P.b115 + P.poi) / 2, P.y + 14, c.suave, 9.5, 650);
        const ley = [['La central', central], [L.modalidad === 'individual' ? 'Refuerzos: la central' : 'Refuerzos: programa de la red', red]];
        let xl = 12;
        const yl = H - 12;
        for (const [t, col] of ley) { caja(xl, yl - 5, 10, 10, 2, col); texto(t, xl + 14, yl, c.suave, 10, 650, 'left'); xl += 24 + ancho(t, 10, 650); }
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'pasos') pasos(L, c);
        else if (modo === 'falla') falla(L, c);
        else if (modo === 'paga') paga(L, c);
        else linea(L, c);
    }
    return { dibujar };
}
