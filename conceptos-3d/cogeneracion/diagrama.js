// El diagrama que explica cada modo, dibujado en un lienzo 2D: el combustible de hacerlo juntos contra hacerlo por separado, la energía
// libre de combustible, la energía obligada y la despachable de cada hora, y lo que da el bagazo mes por mes. No es a escala. Lee las
// mismas lecturas que el resto.
import { PLANTA } from './datos.js';

const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ELEC = '#f2b233';
const VAPOR = '#d64545';
const GRIS = '#8a8f98';
const VERDE = '#2fb36a';
const BAGAZO = '#b9933c';

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
    /** Una columna apilada desde abajo, con su etiqueta adentro si cabe. */
    function columna(x, w, yB, escala, tramos) {
        let y = yB;
        for (const [v, color, etq] of tramos) {
            const h = Math.max(0, v * escala);
            if (h < 0.5) continue;
            caja(x, y - h, w, h - 1, 3, color);
            if (etq && h > 15 && ancho(etq, 9) < w - 4) texto(etq, x + w / 2, y - h / 2, '#ffffff', 9, 750);
            y -= h;
        }
        return y;
    }

    // Juntos o por separado: el combustible de la cogeneración contra el de una central y una caldera.
    function juntos(L, c) {
        const op = L.op;
        const k = L.k;
        const yB = H - 30;
        const alto = H - 70;
        const max = Math.max(op.F, k.EP) * 1.04;
        const esc = alto / max;
        const w = Math.min(110, W * 0.26);
        const x1 = W * 0.3 - w / 2;
        const x2 = W * 0.7 - w / 2;
        columna(x1, w, yB, esc, [[op.E, ELEC, `luz ${num(op.E)}`], [op.H, VAPOR, `vapor ${num(op.H)}`], [op.perdidas, GRIS, 'se pierde']]);
        columna(x2, w, yB, esc, [[k.separadoE, ELEC, `central ${num(k.separadoE)}`], [k.separadoH, VAPOR, `caldera ${num(k.separadoH)}`]]);
        texto(`Juntos: ${num(op.F)} MW`, x1 + w / 2, yB + 14, c.tinta, 10, 750);
        texto(`Por separado: ${num(k.EP)}`, x2 + w / 2, yB + 14, c.tinta, 10, 750);
        const yF = yB - op.F * esc;
        const yS = yB - k.EP * esc;
        raya([[x1, yF], [x2 + w, yF]], c.tinta, 1.2);
        const ahorra = k.AEP >= 0;
        texto(ahorra ? `ahorra ${num(k.AEP)} MW` : `gasta ${num(-k.AEP)} MW de más`, W / 2, Math.min(yF, yS) - 10, ahorra ? VERDE : '#d64545', 10, 750);
        texto(cabe(`Combustible, MW: la cogeneración contra una central de ${num(k.RefE * 100)} % y una caldera de 90 %`, `Combustible, MW (ref. ${num(k.RefE * 100)} %)`), W / 2, 14, c.tinta, 10.5, 700);
    }

    // Eficiente: la electricidad partida en lo que es libre de combustible y lo que no.
    function eficiente(L, c) {
        const k = L.k;
        const x0 = 18;
        const x1 = W - 18;
        const y = clamp(H * 0.32, 44, 80);
        const alto = clamp(H * 0.16, 18, 34);
        const pct = clamp(k.pctELC, -0.6, 1);
        const X = v => x0 + ((x1 - x0) * (v + 0.6)) / 1.6;
        caja(x0, y, x1 - x0, alto, 4, 'rgba(127,127,127,0.18)');
        const xc = X(0);
        if (pct >= 0) caja(xc, y, X(pct) - xc, alto, 4, VERDE);
        else caja(X(pct), y, xc - X(pct), alto, 4, '#d64545');
        trazo([[xc, y - 8], [xc, y + alto + 8]], c.tinta, 2);
        for (const v of [-0.5, 0, 0.5, 1]) texto(`${num(v * 100)} %`, X(v), y + alto + 18, c.suave, 9.5, 650);
        texto('energía libre de combustible, de cada 100 MWh', W / 2, y - 14, c.suave, 9.5, 650);
        texto(`${num(k.pctELC * 100, 1)} %`, X(pct) + (pct >= 0 ? 4 : -4), y + alto / 2, c.tinta, 10.5, 800, pct >= 0 ? 'left' : 'right');
        const ym = y + alto + 44;
        if (H - ym > 24) texto(cabe(k.eficiente ? `Es eficiente: recibe unos ${num(L.cel)} Certificados de Energías Limpias al año` : 'No ahorra combustible: no es eficiente ni recibe Certificados', k.eficiente ? `${num(L.cel)} CEL al año` : 'No es eficiente'), W / 2, ym, k.eficiente ? VERDE : '#d64545', 10.5, 750);
        texto(cabe(`Vapor que usa la fábrica: ${num(L.vapor)} t/h · deja de ahorrar con menos de ${num(L.minimo)}`, `${num(L.vapor)} t/h de vapor`), W / 2, 14, c.tinta, 10.5, 700);
    }

    // Despacho: el día de la planta, hora por hora.
    function despacho(L, c) {
        const x0 = 30;
        const x1 = W - 12;
        const yB = H - 28;
        const alto = H - 66;
        const max = PLANTA.mw * 1.05;
        const Y = v => yB - (alto * v) / max;
        const w = (x1 - x0) / 24;
        L.dia.forEach((d, h) => {
            const x = x0 + h * w + 1;
            caja(x, Y(d.propio), w - 2, yB - Y(d.propio), 2, GRIS);
            caja(x, Y(d.propio + d.minimoRed), w - 2, Y(d.propio) - Y(d.propio + d.minimoRed), 2, VAPOR);
            const extra = d.aRed - d.minimoRed;
            if (extra > 0.5) caja(x, Y(d.propio + d.aRed), w - 2, Y(d.propio + d.minimoRed) - Y(d.propio + d.aRed), 2, ELEC);
            else { ctx.strokeStyle = ELEC; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, Y(d.propio + d.maximoRed), w - 3, Y(d.propio + d.minimoRed) - Y(d.propio + d.maximoRed)); }
        });
        const xh = x0 + clamp(L.hora, 0, 24) * w;
        trazo([[xh, yB - alto - 4], [xh, yB + 4]], c.guinda, 2);
        raya([[x0, Y(PLANTA.mw)], [x1, Y(PLANTA.mw)]], c.tinta, 1.2);
        texto(`${num(PLANTA.mw)} MW`, x0 + 2, Y(PLANTA.mw) - 8, c.tinta, 9, 700, 'left');
        for (const h of [0, 6, 12, 18, 24]) texto(`${h}`, x0 + h * w, yB + 11, c.suave, 9.5, 650);
        texto(cabe('gris: la fábrica · rojo: obligada · amarillo: despachable', 'obligada y despachable'), W / 2, 14, c.tinta, 10, 700);
    }

    // El ingenio: la electricidad de cada mes y lo que da un día de zafra.
    function ingenio(L, c) {
        const x0 = 16;
        const x1 = W - 16;
        const yB = H - 28;
        const alto = Math.max(40, H * 0.42);
        const max = Math.max(...L.anio.map(m => m.generaMWh + m.vendeMWh), 1) * 1.08;
        const w = (x1 - x0) / 12;
        L.anio.forEach((m, i) => {
            const x = x0 + i * w + 2;
            const hg = (alto * m.generaMWh) / max;
            const hv = (alto * m.vendeMWh) / max;
            if (hg > 0.5) caja(x, yB - hg, w - 4, hg, 2, ELEC);
            if (hv > 0.5) caja(x, yB - hg - hv, w - 4, hv, 2, VERDE);
            if (i === L.mes) { ctx.strokeStyle = c.guinda; ctx.lineWidth = 2; ctx.strokeRect(x - 1, yB - alto - 4, w - 2, alto + 6); }
            texto(['e', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'][i], x + (w - 4) / 2, yB + 11, c.suave, 9, 650);
        });
        const y = 34;
        const pasos = L.zafra ? [[`${num(L.caniaDia)} t de caña`, '#7d8f4a'], [`${num(L.bagazoDia)} t de bagazo`, BAGAZO], [`${num(L.vaporTh)} t/h de vapor`, VAPOR], [`${num(L.generaMWh)} MWh`, ELEC]] : [['Fuera de zafra: no hay caña ni bagazo', GRIS]];
        const anchoP = (W - 32) / pasos.length;
        pasos.forEach(([t, col], i) => {
            const x = 16 + i * anchoP;
            caja(x + 2, y - 11, anchoP - 4, 22, 6, col);
            texto(cabe(t, t.split(' ').slice(0, 2).join(' '), 9.5, 750), x + anchoP / 2, y, '#ffffff', 9.5, 750);
        });
        texto(cabe('Al día, en un ingenio promedio · amarillo: lo que genera · verde: lo que vendería', 'genera y vendería, al día'), W / 2, 14, c.tinta, 10, 700);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'eficiente') eficiente(L, c);
        else if (modo === 'despacho') despacho(L, c);
        else if (modo === 'ingenio') ingenio(L, c);
        else juntos(L, c);
    }
    return { dibujar };
}
