// El diagrama que explica cada modo, dibujado en un lienzo 2D: qué tan caliente va el transformador, cómo cae el voltaje a lo largo del
// circuito, qué hacen el relevador y el interruptor ante una falla, y por dónde pasa la corriente durante el mantenimiento. No es a escala.
// Lee las mismas lecturas que el resto.
import { CAMBIADOR, FLUIDOS, LIMITE, PASOS, RECIERRE, TC, TRAFO } from './modelo.js';

const fract = x => x - Math.floor(x);
const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp01 = x => Math.min(1, Math.max(0, x));

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
    const borde = (x, y, w, h, r, color, ancho = 1.5) => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke(); };
    const trazo = (puntos, color, ancho = 1.5, guiones = null) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = ancho;
        ctx.setLineDash(guiones ?? []);
        ctx.beginPath();
        puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        ctx.setLineDash([]);
    };
    const circulo = (x, y, r, color, ancho = 1.6) => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); };
    /** Interruptor: un cuadro lleno si está cerrado, hueco si está abierto. */
    const interruptor = (x, y, cerrado, c) => { caja(x - 6, y - 6, 12, 12, 2, cerrado ? c.tinta : c.fondoPanel); borde(x - 6, y - 6, 12, 12, 2, c.tinta, 1.6); };
    /** Cuchilla en una línea horizontal: una navaja que se levanta al abrir. */
    const cuchilla = (x, y, cerrada, c, largo = 14) => { trazo([[x - largo / 2, y], [x - largo / 2 + largo * Math.cos((1 - cerrada) * 0.9), y - largo * Math.sin((1 - cerrada) * 0.9)]], c.tinta, 2); punto(x - largo / 2, y, 2, c.tinta); punto(x + largo / 2, y, 2, c.tinta); };
    const puntos = (camino, n, t, vel, color, r = 2.1) => {
        let largo = 0;
        const tramos = [];
        for (let i = 1; i < camino.length; i++) { const l = Math.hypot(camino[i][0] - camino[i - 1][0], camino[i][1] - camino[i - 1][1]); tramos.push(l); largo += l; }
        for (let k = 0; k < n; k++) {
            let d = fract(k / n + t * vel) * largo;
            for (let i = 0; i < tramos.length; i++) {
                if (d <= tramos[i]) { const u = d / tramos[i]; punto(camino[i][0] + (camino[i + 1][0] - camino[i][0]) * u, camino[i][1] + (camino[i + 1][1] - camino[i][1]) * u, r, color); break; }
                d -= tramos[i];
            }
        }
    };
    const col = k => FLUIDOS[k].color;
    // de frío a caliente: azul, ámbar y rojo
    const PARADAS = [[30, [120, 166, 222]], [75, [232, 168, 72]], [120, [200, 53, 47]]];
    const colorTemp = th => {
        const t = Math.min(PARADAS[2][0], Math.max(PARADAS[0][0], th));
        const i = t < PARADAS[1][0] ? 0 : 1;
        const [a, b] = [PARADAS[i], PARADAS[i + 1]];
        const k = (t - a[0]) / (b[0] - a[0]);
        return `rgb(${a[1].map((c, j) => Math.round(c + (b[1][j] - c) * k)).join(',')})`;
    };

    // El transformador por dentro: el aceite sube caliente a los radiadores y regresa frío; los ventiladores ayudan.
    function carga(t, L, c) {
        const alto = Math.max(70, Math.min(170, H - 74));
        const y0 = Math.max(26, (H - alto - 34) / 2);
        const wT = Math.min(190, W * 0.36);
        const xT = Math.max(14, W * 0.08);
        // el tanque, con el aceite de abajo (más frío) al de arriba (más caliente)
        const g = ctx.createLinearGradient(0, y0 + alto, 0, y0);
        g.addColorStop(0, colorTemp(L.aire + (L.aceite - L.aire) * 0.5));
        g.addColorStop(1, colorTemp(L.aceite));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(xT, y0, wT, alto, 8);
        ctx.fill();
        borde(xT, y0, wT, alto, 8, c.tinta, 1.4);
        // núcleo y devanados
        const wb = wT * 0.18;
        for (let i = 0; i < 3; i++) { const x = xT + wT * (0.2 + i * 0.3) - wb / 2; caja(x, y0 + alto * 0.2, wb, alto * 0.6, 4, '#c8743c'); }
        const xh = xT + wT * 0.5;
        const yh = y0 + alto * 0.24;
        punto(xh, yh, 5, colorTemp(L.caliente));
        circulo(xh, yh, 6.5, c.tinta, 1.2);
        texto(`${num(L.caliente)} °C`, xh, y0 - 10, c.tinta, 11, 750);
        texto('punto más caliente', xh, y0 + alto + 12, c.suave, 10, 650);
        // radiador: el aceite sube, entra caliente arriba y baja frío
        const xR = xT + wT + 18;
        const wR = Math.min(46, W * 0.11);
        for (let i = 0; i < 4; i++) caja(xR + i * (wR / 4), y0 + 8, wR / 4 - 3, alto - 16, 2, c.superficie);
        const vueltas = [[xT + wT - 6, y0 + 14], [xR + wR / 2, y0 + 14], [xR + wR / 2, y0 + alto - 14], [xT + wT - 6, y0 + alto - 14]];
        puntos(vueltas, 10, t, 0.06 + 0.12 * clamp01(L.S / TRAFO.etapas[2]), c.guinda, 2.2);
        // ventiladores
        for (let i = 0; i < 2; i++) {
            const x = xR + wR / 2;
            const y = y0 + alto + 14 + i * 0;
            const on = L.etapa > i;
            const cx = x - 14 + i * 28;
            circulo(cx, y, 9, on ? c.tinta : c.suave, 1.4);
            const a = on ? t * 9 + i : 0.4;
            for (let k = 0; k < 3; k++) { const b = a + (k * 2 * Math.PI) / 3; trazo([[cx, y], [cx + Math.cos(b) * 8, y + Math.sin(b) * 8]], on ? c.tinta : c.suave, 2); }
        }
        texto(L.etapa ? `${L.etapa} ${L.etapa === 1 ? 'paso' : 'pasos'} de ventiladores` : 'Ventiladores apagados', xR + wR / 2, y0 - 10, c.tinta, 10.5, 700);
        // termómetros: aceite y punto caliente, contra sus límites
        const xB = Math.min(W - 70, xR + wR + 40);
        const hB = alto;
        const barra = (x, valor, limite, nombre) => {
            caja(x, y0, 14, hB, 7, c.superficie);
            const k = clamp01((valor - 10) / (130 - 10));
            caja(x, y0 + hB * (1 - k), 14, hB * k, 7, colorTemp(valor));
            const yl = y0 + hB * (1 - (limite - 10) / 120);
            trazo([[x - 4, yl], [x + 18, yl]], c.guinda, 1.6, [3, 2]);
            texto(nombre, x + 7, y0 + hB + 12, c.suave, 9.5, 650);
            texto(`${num(limite)}`, x + 24, yl, c.guinda, 9.5, 700, 'left');
        };
        barra(xB, L.aceite, LIMITE.aceite, 'Aceite');
        barra(xB + 44, L.caliente, LIMITE.caliente, 'Devanado');
        const h = Math.floor(L.hora);
        texto(`${String(h).padStart(2, '0')}:${String(Math.floor((L.hora - h) * 60)).padStart(2, '0')} h · ${num(L.S, 1)} MVA · aire a ${num(L.aire)} °C`, W / 2, H - 10, c.tinta, 11, 650);
    }

    // El voltaje a lo largo del camino: llega la red, el transformador lo baja, el cambiador lo corrige y el circuito lo va perdiendo.
    function voltaje(t, L, c) {
        const izq = W < 420 ? 34 : 44;
        const der = W - 18;
        const arriba = 30;
        const abajo = H - 34;
        const yv = p => abajo - ((p - 0.9) / 0.16) * (abajo - arriba);
        // la banda de lo aceptable: de 95 % a 105 %, y la consigna del cambiador
        caja(izq, yv(1.05), der - izq, yv(0.95) - yv(1.05), 4, c.superficie);
        for (const p of [0.95, 1, 1.05]) { trazo([[izq, yv(p)], [der, yv(p)]], c.linea, 1, p === 1 ? null : [3, 3]); texto(`${num(p * 100)} %`, izq - 4, yv(p), c.suave, 9.5, 650, 'right'); }
        const xs = [izq + 6, izq + (der - izq) * 0.24, izq + (der - izq) * 0.36, der - 6];
        const ys = [yv(1), yv(L.pb), yv(L.pb), yv(L.pf)];
        // sin cambiador, el voltaje sale de donde quedaría con la posición de en medio
        trazo([[xs[0], ys[0]], [xs[1], ys[1]]], c.suave, 1.4, [4, 3]);
        trazo([[xs[1], ys[1]], [xs[2], ys[2]], [xs[3], ys[3]]], col('media'), 3);
        trazo([[xs[0], ys[0]], [xs[1] - 30, ys[0]]], col('alta'), 3);
        punto(xs[0], ys[0], 4, col('alta'));
        punto(xs[1], ys[1], 5, col('media'));
        punto(xs[3], ys[3], 5, L.pf < 0.95 ? c.guinda : col('media'));
        texto('115 kV llega', xs[0] + 2, ys[0] - 12, c.tinta, 10.5, 700, 'left');
        texto(`Barras: ${num(L.Vb, 2)} kV`, xs[1] + 4, ys[1] - 13, c.tinta, 10.5, 750, 'left');
        texto(`Al final: ${num(L.Vf, 2)} kV`, xs[3], ys[3] + (ys[3] > abajo - 18 ? -14 : 14), L.pf < 0.95 ? c.guinda : c.tinta, 10.5, 750, 'right');
        // el cambiador
        const tap = L.tap;
        const xt = xs[1] - 4;
        const yt = arriba - 14;
        texto(`Cambiador: ${tap > 0 ? '+' : ''}${tap} de ±${CAMBIADOR.pasos}${L.espera > 0.2 && L.auto ? ' · esperando…' : ''}`, xt, yt, L.espera > 0.2 && L.auto ? c.guinda : c.tinta, 10.5, 700, 'left');
        texto(`${num(L.km)} km de circuito →`, (xs[2] + xs[3]) / 2, H - 10, c.suave, 10.5, 650);
    }

    // El circuito 1 con una rama encima: el relevador cuenta, el interruptor abre y luego vuelve a intentar.
    function falla(t, L, c) {
        const y = H * 0.48;
        const x0 = 18;
        const xB = Math.min(110, W * 0.26);
        const x1 = W - 16;
        trazo([[x0, y - 28], [x0, y + 28]], c.tinta, 4);
        texto('Barras', x0 + 2, y - 38, c.suave, 10, 650, 'left');
        const tramo = L.tramo;
        const estado = tramo ? tramo.estado : 'normal';
        const cerrado = estado === 'falla' || estado === 'normal';
        trazo([[x0, y], [xB - 7, y]], cerrado ? (estado === 'falla' ? col('falla') : col('media')) : c.suave, 2.4);
        interruptor(xB, y, cerrado, c);
        texto('Interruptor', xB, y - 18, c.tinta, 10, 700);
        const xF = xB + 24 + (x1 - xB - 40) * clamp01(L.d / 20);
        const vivo = estado === 'normal' || estado === 'falla';
        trazo([[xB + 7, y], [x1, y]], vivo ? (estado === 'falla' ? col('falla') : col('media')) : c.suave, 2.4);
        if (vivo) puntos(estado === 'falla' ? [[x0, y], [xF, y]] : [[x0, y], [x1, y]], estado === 'falla' ? 16 : 8, t, estado === 'falla' ? 0.9 : 0.12, estado === 'falla' ? col('falla') : col('media'));
        // la falla
        if (tramo && !(L.tipo === 'pasajera' && L.t > L.F.abre)) {
            const z = estado === 'falla' ? 1 : 0.55;
            trazo([[xF - 6, y - 22], [xF + 3, y - 9], [xF - 4, y - 9], [xF + 5, y + 4]], c.guinda, 2.4 * z);
        }
        texto(`Falla a ${num(L.d, 1)} km`, xF, y + 22, c.tinta, 10.5, 700);
        // el relevador y el recierre
        const linea2 = y + 44 > H - 14 ? H - 14 : y + 44;
        if (!tramo) texto(`Si cae aquí: ${num(L.F.I)} A · el relevador tarda ${num(L.F.abre - 0.06, 2)} s`, W / 2, linea2, c.tinta, 10.5, 650);
        else {
            const msg = { falla: `¡Falla! ${num(L.F.I)} A · el relevador cuenta: ${num(Math.min(L.t - tramo.t0, L.F.abre), 2)} s`, abierto: `Abierto: vuelve a cerrar en ${num(Math.max(0, tramo.t1 - L.t), 1)} s (intento ${tramo.intento + 1} de ${RECIERRE.esperas.length})`, normal: 'Recierre logrado: la luz volvió', bloqueado: 'Bloqueado: la falla sigue. Va una cuadrilla' }[estado];
            texto(msg, W / 2, linea2, estado === 'normal' ? c.tinta : c.guinda, 10.5, 700);
        }
        texto(`Normal: ${num(L.carga1)} A por el circuito 1`, W / 2, 14, c.suave, 10, 650);
    }

    // Los circuitos 1 y 2, la barra de interconexión y sus cuchillas de paso. Por dónde va la corriente en cada paso.
    function maniobra(t, L, c) {
        const a = L.anim;
        const xb = 22;
        const xi = W - 58;
        const y1 = H * 0.3;
        const y2 = H * 0.66;
        trazo([[xb, y1 - 22], [xb, y2 + 22]], c.tinta, 4);
        texto('Barras 13.8 kV', xb + 2, y2 + 34, c.suave, 9.5, 650, 'left');
        trazo([[xi, y1 - 22], [xi, y2 + 22]], c.tinta, 2.4);
        texto('Interconexión', xi, y2 + 34, c.suave, 9.5, 650);
        const cerr2 = 1 - clamp01(a - 2);
        const cuch2 = 1 - clamp01(a - 3);
        const tierra = clamp01(a - 4);
        const px = [xb + (xi - xb) * 0.22, xb + (xi - xb) * 0.45, xb + (xi - xb) * 0.68];
        const fila = (y, n, cerrado, cuch, ponTierra) => {
            trazo([[xb, y], [W - 8, y]], c.linea, 2);
            cuchilla(px[0], y, cuch, c);
            interruptor(px[1], y, cerrado > 0.5, c);
            cuchilla(px[2], y, cuch, c);
            if (ponTierra) {
                for (const x of [px[0] + 14, px[2] - 14]) {
                    trazo([[x, y + 2], [x, y + 2 + 10 * tierra]], c.tinta, 1.6);
                    trazo([[x - 5, y + 14], [x + 5, y + 14]], c.tinta, 1.4);
                    trazo([[x - 3, y + 17], [x + 3, y + 17]], c.tinta, 1.2);
                }
            }
            texto(`Circuito ${n}`, W - 8, y - 12, c.tinta, 10, 700, 'right');
        };
        fila(y1, 1, 1, 1, false);
        fila(y2, 2, cerr2, cuch2, true);
        // cuchillas de paso, de cada circuito a la barra de interconexión
        for (const [y, k] of [[y1, clamp01(a)], [y2, clamp01(a - 1)]]) {
            const xp = xi;
            trazo([[xp, y], [xp + 12 * Math.sin((1 - k) * 0.9), y - 12 * Math.cos((1 - k) * 0.9)]], c.guinda, 2);
        }
        // por dónde va la corriente
        const pasa = a >= 3;
        const med = col('media');
        puntos([[xb, y1], [W - 8, y1]], 9, t, 0.12, med);
        if (pasa) puntos([[xb, y1], [xi, y1], [xi, y2], [W - 8, y2]], 12, t, 0.1, med);
        else if (cerr2 > 0.5) puntos([[xb, y2], [W - 8, y2]], 9, t, 0.12, med);
        const p = Math.round(a);
        texto(PASOS[Math.min(PASOS.length - 1, Math.max(0, p))].texto, W / 2, 14, c.tinta, 10.5, 750);
        texto(`Interruptor 1: ${num(L.Ibr1)} A de ${TC}`, W / 2, H - 10, L.Ibr1 > TC ? c.guinda : c.tinta, 10.5, 700);
        if (L.arco > 0.05) texto('¡Arco! La cuchilla no puede cortar corriente', px[0], y2 - 22, c.guinda, 10.5, 800);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'voltaje') voltaje(t, L, c);
        else if (modo === 'falla') falla(t, L, c);
        else if (modo === 'maniobra') maniobra(t, L, c);
        else carga(t, L, c);
    }
    return { dibujar };
}
