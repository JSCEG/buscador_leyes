// El diagrama que explica cada modo, dibujado en un lienzo 2D: a dónde se va la energía del combustible, cuánto tarda cada máquina
// en arrancar, qué sale más barato y la demanda del sistema aislado contra su reserva. No es a escala. Lee las mismas lecturas que
// el resto.
import { UNIDADES } from './datos.js';

const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ELEC = '#f2b233';
const MAR = '#2a9d8f';
const GASES = '#ff8a3c';
const GRIS = '#8a8f98';
const VERDE = '#2fb36a';
const ROJO = '#d64545';
const AZUL = '#2f7fd1';
const COLOR_TEC = { vapor: '#9b2247', turbogas: AZUL, motores: '#8a5a2b' };

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

    // La unidad de vapor: el combustible se reparte en electricidad, calor al mar y gases por la chimenea.
    function vapor(L, c) {
        const u = L.u;
        const x0 = 16;
        const x1 = W - 16;
        const y = clamp(H * 0.36, 40, 70);
        const alto = clamp(H * 0.22, 22, 40);
        const partes = [[u.mw / u.q, ELEC, 'electricidad'], [u.condensador / u.q, MAR, 'al mar'], [u.chimenea / u.q, GASES, 'chimenea']];
        let x = x0;
        for (const [f, color, etq] of partes) {
            const w = (x1 - x0) * f;
            caja(x, y, w - 2, alto, 4, color);
            const t = `${etq} ${num(f * 100)}`;
            if (ancho(t, 9.5) < w - 8) texto(t, x + w / 2, y + alto / 2, '#ffffff', 9.5, 750);
            else if (ancho(num(f * 100), 9.5) < w - 4) texto(num(f * 100), x + w / 2, y + alto / 2, '#ffffff', 9.5, 750);
            x += w;
        }
        texto('de cada 100 partes del combustible', W / 2, y - 14, c.suave, 9.5, 650);
        const ym = y + alto + 26;
        if (H - ym > 20) texto(cabe(`${num(u.co2mwh, 2)} t de CO2 por MWh · ${num(u.marM3s)} m³ de agua de mar por segundo`, `${num(u.co2mwh, 2)} t de CO2 por MWh`), W / 2, ym, c.tinta, 10, 700);
        if (H - ym > 44 && u.so2mwh > 0.01) texto(`${num(u.so2mwh, 1)} kg de dióxido de azufre por MWh`, W / 2, ym + 20, ROJO, 10, 700);
        texto(cabe(`Unidad de ${num(UNIDADES.vapor)} MW con ${u.comb === 'carbon' ? 'carbón' : u.comb === 'gas' ? 'gas natural' : 'combustóleo'}, a ${num(u.carga * 100)} %`, `${num(u.mw)} MW`), W / 2, 14, c.tinta, 10.5, 700);
    }

    // El arranque: cada máquina espera, se sincroniza y sube hasta plena carga.
    function arranque(L, c) {
        const x0 = 76;
        const x1 = W - 14;
        const tope = Math.max(L.plena.vapor * 1.05, 60);
        const X = t => x0 + ((x1 - x0) * clamp(t, 0, tope)) / tope;
        const filas = [['vapor', 'Vapor'], ['turbogas', 'Turbogás'], ['motores', 'Motores']];
        const alto = clamp((H - 64) / 3 - 8, 12, 26);
        filas.forEach(([id, nombre], i) => {
            const y = 34 + i * (alto + 10);
            texto(nombre, x0 - 8, y + alto / 2, c.tinta, 10, 700, 'right');
            caja(x0, y, x1 - x0, alto, 4, 'rgba(127,127,127,0.14)');
            const p = L.p[id];
            caja(x0, y, (X(L.minuto) - x0), alto, 4, p > 0 ? COLOR_TEC[id] : GRIS);
            texto(p > 0 ? `${num(p * 100)} %` : 'arrancando', Math.min(X(L.minuto) + 6, x1 - 50), y + alto / 2, c.tinta, 9.5, 700, 'left');
            trazo([[X(L.plena[id]), y - 2], [X(L.plena[id]), y + alto + 2]], c.tinta, 1.4);
        });
        const ys = 34 + 3 * (alto + 10);
        for (const m of [0, 60, 120, 240, 360, 480].filter(v => v <= tope)) texto(m < 60 ? '0' : `${num(m / 60)} h`, X(m), ys + 4, c.suave, 9, 650);
        trazo([[X(L.minuto), 26], [X(L.minuto), ys - 6]], c.guinda, 2);
        texto(cabe(`${L.frio ? 'Arranque en frío' : 'Arranque en caliente'}: ${num(L.minuto)} minutos después de la orden · la raya marca plena carga`, `${num(L.minuto)} min`), W / 2, 14, c.tinta, 10.5, 700);
    }

    // El costo: las opciones de la más barata a la más cara.
    function costo(L, c) {
        const x0 = clamp(W * 0.36, 110, 170);
        const x1 = W - 52;
        const max = Math.max(...L.orden.map(o => o.usd)) * 1.05;
        const alto = clamp((H - 50) / L.orden.length - 6, 10, 22);
        L.orden.forEach((o, i) => {
            const y = 30 + i * (alto + 6);
            const w = ((x1 - x0) * o.usd) / max;
            texto(o.nombre, x0 - 8, y + alto / 2, c.tinta, 9.5, i === 0 ? 800 : 650, 'right');
            caja(x0, y, w, alto, 3, COLOR_TEC[o.tec]);
            texto(`${num(o.usd)}`, x0 + w + 4, y + alto / 2, c.tinta, 9.5, 700, 'left');
        });
        texto(cabe(`Dólares de combustible por MWh, con el gas a ${num(L.gas, 2)} por millón de BTU`, 'USD por MWh'), W / 2, 14, c.tinta, 10.5, 700);
    }

    // El sistema aislado: la demanda de un día contra lo que hay que tener instalado.
    function aislado(L, c) {
        const x0 = 30;
        const x1 = W - 12;
        const yB = H - 26;
        const alto = H - 62;
        const max = L.instalada * 1.08;
        const Y = v => yB - (alto * v) / max;
        const w = (x1 - x0) / 24;
        L.dia.forEach((d, h) => caja(x0 + h * w + 1, Y(d), w - 2, yB - Y(d), 2, Math.floor(L.hora) === h ? c.guinda : ELEC));
        raya([[x0, Y(L.instalada)], [x1, Y(L.instalada)]], VERDE, 1.6);
        raya([[x0, Y(L.sinReserva)], [x1, Y(L.sinReserva)]], c.suave, 1.2);
        texto(`instalada con 35 %: ${num(L.instalada)} MW`, x0 + 2, Y(L.instalada) - 8, VERDE, 9, 750, 'left');
        for (const h of [0, 6, 12, 18, 24]) texto(`${h}`, x0 + h * w, yB + 11, c.suave, 9.5, 650);
        texto(cabe('Demanda de un día de verano (forma de ejemplo) contra la capacidad que pide la reserva', 'demanda y reserva'), W / 2, 14, c.tinta, 10, 700);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'arranque') arranque(L, c);
        else if (modo === 'costo') costo(L, c);
        else if (modo === 'aislado') aislado(L, c);
        else vapor(L, c);
    }
    return { dibujar };
}
