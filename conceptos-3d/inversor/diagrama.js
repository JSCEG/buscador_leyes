// El diagrama que explica cada modo, dibujado en un lienzo 2D: el camino de la energía del sol a la red, los pulsos contra la corriente
// que sale, el voltaje y la frecuencia con sus rangos, y a dónde va cada watt. No es a escala. Lee las mismas lecturas que el resto.
import { EJ, RED, TRIO, brazo, corrienteEn } from './modelo.js';

const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ORO = '#e0a03c';
const AZUL = '#2f7fd1';

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
        const l = 7;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - l * Math.cos(a - 0.4), y1 - l * Math.sin(a - 0.4)); ctx.lineTo(x1 - l * Math.cos(a + 0.4), y1 - l * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
    };

    // Un día: del sol a la red, con la potencia de cada paso.
    function dia(t, L, c) {
        const pasos = [['Sol', `${num(L.G)} W/m²`, ORO], ['Módulos', `${num(L.Pdc / 1000, 1)} kW CD`, ORO], ['Inversores', `${num(L.Pac / 1000, 1)} kW CA`, AZUL], ['Transformador', `${num(L.trafo / 1000, 1)} kW`, AZUL]];
        const n = pasos.length;
        const gap = W < 380 ? 10 : 18;
        const w = (W - 24 - gap * (n - 1)) / n;
        const y = Math.max(46, H * 0.4);
        const h = 46;
        pasos.forEach(([t1, t2, col], i) => {
            const x = 12 + i * (w + gap);
            caja(x, y, w, h, 8, 'rgba(127,127,127,0.10)');
            marco(x, y, w, h, 8, col);
            texto(t1, x + w / 2, y + 14, c.tinta, W < 380 ? 9.5 : 10.5, 750);
            texto(t2, x + w / 2, y + 32, c.suave, W < 380 ? 9 : 10, 650);
            if (i < n - 1) flecha(x + w + 1, y + h / 2, x + w + gap - 1, y + h / 2, i < 1 ? ORO : AZUL, 2);
        });
        const ch = L.inv[0].canales[0];
        const msg = !L.opera ? 'Sin sol suficiente, los inversores no arrancan' : `Un canal: ${num(ch.V)} V y ${num(ch.I, 1)} A · celda a ${num(L.Tc)} °C`;
        texto(cabe(msg, !L.opera ? 'Sin sol suficiente' : `${num(ch.V)} V · ${num(ch.I, 1)} A`), W / 2, 16, c.tinta, 10.5, 700);
        const v = ch.V;
        if (L.opera && W > 300) {
            // la ventana de voltaje del seguidor
            const x0 = 24;
            const x1 = W - 24;
            const yv = y + h + 34;
            const sx = V => x0 + ((x1 - x0) * clamp(V, 0, 1000)) / 1000;
            caja(x0, yv, x1 - x0, 8, 3, c.linea);
            caja(sx(TRIO.opera[0]), yv, sx(TRIO.opera[1]) - sx(TRIO.opera[0]), 8, 3, 'rgba(47,127,209,0.35)');
            caja(sx(TRIO.plena[0]), yv, sx(TRIO.plena[1]) - sx(TRIO.plena[0]), 8, 3, 'rgba(47,127,209,0.7)');
            trazo([[sx(v), yv - 6], [sx(v), yv + 14]], c.guinda, 2.5);
            texto(`${num(v)} V`, sx(v), yv - 12, c.guinda, 10, 750);
            if (Math.min(H - 10, yv + 24) > yv + 14) texto(cabe(`opera de ${TRIO.opera[0]} a ${TRIO.opera[1]} V · plena potencia de ${TRIO.plena[0]} a ${TRIO.plena[1]} V`, `plena potencia: ${TRIO.plena[0]}–${TRIO.plena[1]} V`, 9.5, 650), W / 2, Math.min(H - 10, yv + 24), c.suave, 9.5, 650);
        }
    }

    // La onda: los pulsos de un brazo (gris) y la corriente que sale a la red (azul), en un ciclo.
    function onda(t, L, c) {
        const x0 = 16;
        const x1 = W - 16;
        const y0 = Math.max(40, H * 0.5);
        const amp = Math.min(H * 0.28, 60);
        trazo([[x0, y0], [x1, y0]], c.linea, 1);
        const n = Math.min(3000, Math.max(300, L.N * 12));
        const pulsos = [];
        for (let i = 0; i <= n; i++) { const th = (2 * Math.PI * i) / n; pulsos.push([x0 + ((x1 - x0) * i) / n, y0 - amp * 0.9 * brazo(th, L.N)]); }
        trazo(pulsos, 'rgba(127,127,127,0.55)', 1);
        const corr = [];
        for (let i = 0; i <= 300; i++) { const th = (2 * Math.PI * i) / 300; corr.push([x0 + ((x1 - x0) * i) / 300, y0 - amp * clamp(corrienteEn(th, L), -1.4, 1.4)]); }
        trazo(corr, AZUL, 2.2);
        const msg = L.cumple ? `${num(L.N)} pulsos por ciclo: la corriente sale limpia (${num(L.tdd, 2)} %)` : `${num(L.N)} pulsos por ciclo: ${num(L.tdd, 1)} % de distorsión`;
        texto(cabe(msg, `${num(L.tdd, 1)} % de distorsión`), W / 2, 14, L.cumple ? c.tinta : c.guinda, 10.5, 700);
        texto('pulsos', x0 + 2, y0 - amp - 8, c.suave, 9.5, 650, 'left');
        texto('corriente a la red', x1 - 2, Math.min(H - 10, y0 + amp + 14), AZUL, 9.5, 700, 'right');
    }

    // Con la red: dos medidores con su rango, o el reloj de la isla.
    function red(t, L, c) {
        const x0 = 24;
        const x1 = W - 24;
        const medidor = (y, titulo, valor, min, max, ok0, ok1, txt, malo) => {
            const sx = v => x0 + ((x1 - x0) * clamp((v - min) / (max - min), 0, 1));
            texto(titulo, x0, y - 12, c.suave, 10, 650, 'left');
            caja(x0, y, x1 - x0, 10, 4, 'rgba(155,34,71,0.25)');
            caja(sx(ok0), y, sx(ok1) - sx(ok0), 10, 4, 'rgba(47,179,106,0.55)');
            trazo([[sx(valor), y - 6], [sx(valor), y + 16]], malo ? c.guinda : c.tinta, 2.5);
            texto(txt, clamp(sx(valor), x0 + 30, x1 - 30), y + 26, malo ? c.guinda : c.tinta, 10, 750);
        };
        const y1 = Math.max(56, H * 0.32);
        medidor(y1, 'Voltaje en el punto de interconexión', L.v, 30, 135, 88, 110, `${num(L.v)} %`, Number.isFinite(L.tv));
        medidor(y1 + Math.max(58, H * 0.3), 'Frecuencia', L.f, 55.5, 63.5, 58.8, 61.2, `${num(L.f, 1)} Hz`, Number.isFinite(L.tf));
        const msg = L.apagon ? (L.conectado ? `Se fue la luz: lo nota a ${num(EJ.detecta, 1)} s; debe salir antes de ${num(RED.isla, 1)} s` : 'Sin red: el inversor se desconectó') : !L.opera ? `Fuera de rango: sale en ${L.t < 1 ? num(L.t, 2) : num(L.t)} s` : L.conectado ? 'En rango: opera' : `Espera ${num(L.espera / 60, 1)} min para volver`;
        texto(cabe(msg, L.apagon ? 'Se fue la luz' : !L.opera ? 'Fuera de rango' : L.conectado ? 'Opera' : 'Esperando'), W / 2, 16, L.apagon || !L.opera ? c.guinda : c.tinta, 10.5, 700);
    }

    // El calor: lo que entra, lo que sale y lo que se pierde.
    function calor(t, L, c) {
        const x0 = 16;
        const x1 = W - 16;
        const y = Math.max(46, H * 0.36);
        const h = 26;
        const entra = L.Pac + L.perd;
        const sale = entra > 0 ? (x1 - x0) * (L.Pac / entra) : 0;
        caja(x0, y, Math.max(0.5, sale - 2), h, 4, AZUL);
        caja(x0 + sale, y, Math.max(0.5, x1 - x0 - sale), h, 4, '#ff8a3c');
        texto(`Sale a la red: ${num(L.ef * 100, 2)} de cada 100`, (x0 + x1) / 2, y - 14, c.tinta, 11, 750);
        texto(cabe(`Calor: ${num(L.perd)} W por las aletas · disipador a unos ${num(L.disipador)} °C`, `Calor: ${num(L.perd)} W`), (x0 + x1) / 2, y + h + 18, c.suave, 10, 650);
        const msg = L.recorta ? `Con el aire a ${num(L.ta)} °C solo da ${num(L.tope / 1000, 1)} kW` : `Aire a ${num(L.ta)} °C: puede dar hasta ${num(L.tope / 1000, 1)} kW`;
        texto(cabe(msg, msg), (x0 + x1) / 2, Math.min(H - 12, y + h + 40), L.recorta ? c.guinda : c.suave, 10.5, 700);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'onda') onda(t, L, c);
        else if (modo === 'red') red(t, L, c);
        else if (modo === 'calor') calor(t, L, c);
        else dia(t, L, c);
    }
    return { dibujar };
}
