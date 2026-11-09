// El diagrama que explica cada modo, dibujado en un lienzo 2D: cuántos días alcanza cada producto, cómo se mezclan dos tandas, qué le pasa al vapor con cada techo y hasta
// dónde sube un derrame en el dique. No es a escala: muestra quién entra, quién sale y qué cifras tiene. Lee las mismas lecturas que el resto.
import { FLUIDOS, ORDEN, POLITICA, PRODUCTOS, TANQUES } from './modelo.js';

const fract = x => x - Math.floor(x);
const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const azar = a => { const x = Math.sin(a * 127.1) * 43758.5453; return x - Math.floor(x); };

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
    const trazo = (puntos, color, ancho = 1.5, guiones = null) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = ancho;
        ctx.setLineDash(guiones ?? []);
        ctx.beginPath();
        puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        ctx.setLineDash([]);
    };
    const flecha = (x0, y, x1, color, ancho = 2.4) => {
        trazo([[x0, y], [x1, y]], color, ancho);
        const s = Math.sign(x1 - x0) || 1;
        trazo([[x1 - s * 6, y - 4], [x1, y], [x1 - s * 6, y + 4]], color, ancho);
    };
    const col = k => FLUIDOS[k]?.color ?? '#888';

    // Cuántos días de venta hay de cada producto, contra los 5 de la política.
    function reserva(t, L, c) {
        const izq = W < 420 ? 60 : 84;
        const der = W - 22;
        const y0 = 26;
        const fila = Math.min(30, (H - y0 - 40) / 3);
        const maxD = 8;
        const xd = d => izq + (Math.min(d, maxD) / maxD) * (der - izq);
        ORDEN.forEach((p, i) => {
            const y = y0 + i * fila;
            texto(PRODUCTOS[p].nombre, izq - 8, y + fila / 2 - 3, c.tinta, 11, 700, 'right');
            caja(izq, y + 3, der - izq, fila - 12, 5, c.superficie);
            caja(izq, y + 3, Math.max(0, xd(L.porProd[p]) - izq), fila - 12, 5, col(p));
            texto(`${num(L.porProd[p], 1)} días`, Math.min(xd(L.porProd[p]) + 6, der - 44), y + fila / 2 - 3, c.tinta, 10.5, 700, 'left');
        });
        const x5 = xd(POLITICA.gasolina);
        trazo([[x5, y0 - 4], [x5, y0 + 3 * fila - 4]], c.guinda, 1.6, [4, 3]);
        texto('5 días: lo que pide la política', Math.min(x5, der - 86), y0 - 12, c.guinda, 10, 700);
        texto(L.entra > 0 ? `Entran ${num(L.entra)} mil barriles al día · salen ${num(L.venta)} mil` : `Ducto cortado · salen ${num(L.venta)} mil barriles al día`, W / 2, H - 12, c.tinta, 11, 650);
    }

    // Dos tandas en el tubo: se mezclan solo donde se tocan.
    function tandas(t, L, c) {
        const alto = Math.min(42, H - 96);
        const y0 = Math.max(30, (H - alto - 40) / 2);
        const [x0, x1] = [16, W - 16];
        const ancho = x1 - x0;
        const frac = Math.min(0.62, 0.12 + (L.A.largo / 4000));
        const xm = x0 + ancho * 0.52;
        const med = (ancho * frac) / 2;
        const g = ctx.createLinearGradient(xm - med, 0, xm + med, 0);
        g.addColorStop(0, col('diesel'));
        g.addColorStop(1, col('regular'));
        caja(x0, y0, ancho, alto, 9, c.superficie);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x0, y0, ancho, alto, 9);
        ctx.clip();
        ctx.fillStyle = col('diesel');
        ctx.fillRect(x0, y0, xm - med - x0, alto);
        ctx.fillStyle = g;
        ctx.fillRect(xm - med, y0, 2 * med, alto);
        ctx.fillStyle = col('regular');
        ctx.fillRect(xm + med, y0, x1 - xm - med, alto);
        for (let k = 0; k < 18; k++) {
            const x = x0 + fract(k / 18 - t * 0.09) * ancho;
            punto(x, y0 + alto * (0.2 + 0.6 * azar(k)), 1.6, 'rgba(255,255,255,0.55)');
        }
        ctx.restore();
        texto('Diésel', x0 + 10, y0 + alto / 2, '#ffffff', 11, 750, 'left');
        texto('Regular', x1 - 10, y0 + alto / 2, '#ffffff', 11, 750, 'right');
        trazo([[xm - med, y0 - 5], [xm - med, y0 + alto + 5]], c.tinta, 1.2);
        trazo([[xm + med, y0 - 5], [xm + med, y0 + alto + 5]], c.tinta, 1.2);
        texto(`Mezcla: ${num(L.A.largo / 1000, 2)} km, ${num(L.A.barriles)} barriles`, xm, y0 - 14, c.tinta, 11, 750);
        flecha(x1 - 30, y0 + alto + 16, x1 - 90, c.suave);
        texto(`viaja a ${num(L.v, 1)} m/s`, x1 - 96, y0 + alto + 16, c.suave, 10.5, 650, 'right');
        const nom = { regular: 'Regular', premium: 'Premium', diesel: 'Diésel', mezcla: 'Tanque de mezcla' };
        texto(`Llega ${num(L.rho)} kg/m³ → ${nom[L.ruta]}`, W / 2, H - 12, c.tinta, 11, 700);
    }

    // Tres techos, con la misma gasolina. Lo que importa es el espacio que queda encima.
    function vapores(t, L, c) {
        const lista = [['fijo', 'Techo fijo', L.fijo], ['externo', 'Flotante', L.externo], ['membrana', 'Membrana', L.membrana]];
        const w = Math.min(96, (W - 60) / 3 - 10);
        const alto = Math.min(84, H - 74);
        const y1 = 18 + alto;
        const paso = (W - 3 * w) / 4;
        lista.forEach(([k, nombre, E], i) => {
            const x = paso + i * (w + paso);
            const nivel = y1 - alto * 0.55;
            caja(x, y1 - alto, w, alto, 4, c.superficie);
            caja(x, nivel, w, y1 - nivel, 3, col('regular'));
            if (k === 'fijo') {
                for (let n = 0; n < 16; n++) {
                    const u = fract(n / 16 + t * 0.14);
                    punto(x + 6 + azar(n) * (w - 12), nivel - 3 - u * (alto * 0.42), 1.7, c.suave);
                }
                trazo([[x - 3, y1 - alto], [x + w / 2, y1 - alto - 8], [x + w + 3, y1 - alto]], c.tinta, 1.8);
            } else {
                caja(x + 2, nivel - 4, w - 4, 4, 1, c.tinta);
                if (k === 'membrana') trazo([[x - 3, y1 - alto], [x + w / 2, y1 - alto - 8], [x + w + 3, y1 - alto]], c.tinta, 1.8);
            }
            trazo([[x, y1 - alto], [x, y1], [x + w, y1], [x + w, y1 - alto]], c.tinta, 1.8);
            const elegido = L.techo === k;
            texto(nombre, x + w / 2, y1 + 13, elegido ? c.guinda : c.tinta, 11, elegido ? 800 : 650);
            texto(`${num(E.total, E.total < 100 ? 1 : 0)} kg al día`, x + w / 2, y1 + 27, c.tinta, 11, 750);
        });
        texto(`La misma gasolina, en el tanque de ${TANQUES[0].mb} mil barriles, a ${num(L.T)} °C`, W / 2, H - 10, c.suave, 10.5, 600);
    }

    // De lado: el tanque, el agujero y el dique.
    function derrame(t, L, c) {
        const F = L.F;
        const y1 = H - 30;
        const alto = Math.min(100, H - 64);
        const px = alto / TANQUES[0].H;
        const [xT, wT] = [Math.max(30, W * 0.12), Math.min(112, W * 0.26)];
        const xD = xT + wT + Math.max(40, W * 0.34);
        const h = F ? F.h : L.niveles.t1 * TANQUES[0].H;
        const hd = F ? F.hd : 0;
        const pxd = Math.max(px, 14);
        // el piso del dique y el nivel que alcanza
        caja(12, y1 - hd * pxd, xD - 12, hd * pxd, 2, col('regular'));
        trazo([[12, y1], [W - 12, y1]], c.tinta, 2);
        caja(xD, y1 - L.muro * pxd, 7, L.muro * pxd, 1, c.tinta);
        caja(xT, y1 - alto, wT, alto, 3, c.superficie);
        caja(xT, y1 - h * px, wT, h * px, 2, col('regular'));
        trazo([[xT, y1 - alto], [xT, y1], [xT + wT, y1], [xT + wT, y1 - alto]], c.tinta, 2);
        if (F && F.h - F.hd > 0.05) {
            for (let n = 0; n < 7; n++) {
                const u = fract(n / 7 + t * 0.8);
                punto(xT + wT + 2 + u * 32, y1 - 6 + u * u * 4, 2, col('regular'));
            }
        }
        if (F && F.escapa > 1) {
            for (let n = 0; n < 6; n++) { const u = fract(n / 6 + t * 0.6); punto(xD + 10 + u * 40, y1 - 2 + u * 1, 2, c.guinda); }
            texto('¡Se sale!', xD + 40, y1 - 18, c.guinda, 11, 800);
        }
        texto(`${num(h, 1)} m`, xT + wT / 2, y1 - h * px - 10 < y1 - alto ? y1 - alto + 12 : y1 - h * px - 10, c.tinta, 11, 750);
        texto(`Dique: ${num(hd, 2)} m`, (xT + wT + xD) / 2, y1 - Math.max(hd * pxd, 0) - 14, c.tinta, 11, 750);
        texto(`Muro: ${num(L.muro, 1)} m`, Math.min(xD + 12, W - 60), y1 - L.muro * pxd - 10, c.suave, 10.5, 650, 'left');
        texto(F ? `Hora ${num(F.t, 1)}: han salido ${num(F.sale)} m³` : 'Todo en orden: el muro espera, y no se usa', W / 2, H - 12, c.tinta, 11, 650);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'tandas') tandas(t, L, c);
        else if (modo === 'vapores') vapores(t, L, c);
        else if (modo === 'derrame') derrame(t, L, c);
        else reserva(t, L, c);
    }
    return { dibujar };
}
