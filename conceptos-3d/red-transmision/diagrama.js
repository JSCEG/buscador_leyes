// El diagrama que explica cada modo, dibujado en un lienzo 2D: cuánto sale y cuánto llega, qué calienta y qué enfría al cable, cómo va el
// voltaje a lo largo de la línea, y qué le pasa a la torre con un rayo y a las dos líneas con un incendio. No es a escala. Lee las mismas
// lecturas que el resto.
import { AISLADOR, ANGULO, FLUIDOS, LINEA, PIE, TENSE } from './modelo.js';

const fract = x => x - Math.floor(x);
const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;

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
    const flecha = (x0, y0, x1, y1, color, ancho = 2.4) => {
        trazo([[x0, y0], [x1, y1]], color, ancho);
        const a = Math.atan2(y1 - y0, x1 - x0);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 8 * Math.cos(a - 0.45), y1 - 8 * Math.sin(a - 0.45));
        ctx.lineTo(x1 - 8 * Math.cos(a + 0.45), y1 - 8 * Math.sin(a + 0.45));
        ctx.fill();
    };
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
    const PARADAS = [[20, [120, 166, 222]], [75, [232, 168, 72]], [130, [200, 53, 47]]];
    const colorTemp = th => {
        const t = Math.min(PARADAS[2][0], Math.max(PARADAS[0][0], th));
        const i = t < PARADAS[1][0] ? 0 : 1;
        const [a, b] = [PARADAS[i], PARADAS[i + 1]];
        const k = (t - a[0]) / (b[0] - a[0]);
        return `rgb(${a[1].map((c, j) => Math.round(c + (b[1][j] - c) * k)).join(',')})`;
    };
    /** El haz: dos cables de una fase, vistos de frente. */
    const haz = (x, y, r, temp, c) => { for (const s of [-1, 1]) { punto(x + s * r * 1.5, y, r, colorTemp(temp)); ctx.strokeStyle = c.tinta; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + s * r * 1.5, y, r, 0, Math.PI * 2); ctx.stroke(); } };

    // Llevar la energía: sale, se pierde en calor por el camino, llega.
    function lejos(t, L, c) {
        const y = H * 0.44;
        const x0 = Math.max(16, W * 0.06);
        const x1 = W - x0;
        const wB = Math.min(118, W * 0.24);
        caja(x0, y - 22, wB, 44, 8, c.superficie);
        borde(x0, y - 22, wB, 44, 8, c.tinta, 1.2);
        texto(`${num(L.P)} MW`, x0 + wB / 2, y - 6, c.tinta, 14, 750);
        texto('salen', x0 + wB / 2, y + 11, c.suave, 10.5, 600);
        caja(x1 - wB, y - 22, wB, 44, 8, c.superficie);
        borde(x1 - wB, y - 22, wB, 44, 8, c.tinta, 1.2);
        texto(`${num(L.llega)} MW`, x1 - wB / 2, y - 6, c.tinta, 14, 750);
        texto('llegan', x1 - wB / 2, y + 11, c.suave, 10.5, 600);
        const a = x0 + wB + 8;
        const b = x1 - wB - 8;
        const grueso = 2 + 6 * clamp01(L.Ic / 1400);
        trazo([[a, y], [b, y]], colorTemp(L.Tc), grueso);
        puntos([[a, y], [b, y]], 12, t, 0.18, col('alta'), 2.4);
        // el calor que se va en el camino
        const olas = Math.round(2 + 10 * clamp01(L.pct * 4));
        for (let i = 0; i < olas; i++) {
            const x = a + ((i + 0.5) / olas) * (b - a);
            const u = fract(t * 0.6 + i * 0.37);
            const yy = y - 10 - u * 26;
            ctx.globalAlpha = 1 - u;
            trazo([[x - 3, yy + 6], [x + 3, yy], [x - 3, yy - 6]], '#d9663a', 1.6);
            ctx.globalAlpha = 1;
        }
        texto(`Se pierden ${num(L.perdida)} MW: ${num(L.pct * 100, 1)} de cada 100`, (a + b) / 2, y - 48, c.tinta, 12, 700);
        // el haz de una fase, con la corriente de cada cable
        const yb = Math.min(y + 52, H - 46);
        haz((a + b) / 2, yb, 9, L.Tc, c);
        texto(`${num(L.Ic)} A por cable, a ${num(L.Tc)} °C`, (a + b) / 2, yb + 21, L.cabe ? c.suave : c.guinda, 11, 650);
        // la segunda línea, solo si cabe
        if (yb + 38 <= H - 6) texto(`${num(L.kV)} kV · ${num(LINEA.km)} km · ${num(L.I)} A por fase en cada línea`, W / 2, yb + 38, c.suave, 10.5, 600);
    }

    // El cable al sol: lo que lo calienta y lo que lo enfría, y cuánto baja.
    function calor(t, L, c) {
        const r = Math.max(22, Math.min(34, H * 0.12));
        const ancho = W < 520;
        const cx = ancho ? W / 2 : Math.max(r + 110, W * 0.3);
        const cy = ancho && H < 250 ? H / 2 + 6 : Math.max(r + 64, Math.min(H * 0.34, r + 96));
        punto(cx, cy, r, colorTemp(L.Tc));
        ctx.strokeStyle = c.tinta;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        texto(`${num(L.Tc)} °C`, cx, cy, c.tinta, 13, 750);
        const total = Math.max(1, L.joule + L.solar);
        const largo = q => 14 + 34 * clamp01(q / total);
        const fl = [
            { q: L.joule, t: 'Su corriente', ang: Math.PI * 0.85, entra: true, color: '#d9663a' },
            { q: L.solar, t: 'El sol', ang: Math.PI * 0.5, entra: true, color: '#d6a21e' },
            { q: L.conveccion, t: 'El viento', ang: Math.PI * 0.15, entra: false, color: '#3f88c5' },
            { q: L.radiacion, t: 'Lo que irradia', ang: -Math.PI * 0.5, entra: false, color: '#7d5cff' },
        ];
        for (const f of fl) {
            if (f.q < 0.3 && f.t === 'El sol') { texto('De noche, sin sol', cx + Math.cos(f.ang) * (r + 30), cy - Math.sin(f.ang) * (r + 30), c.suave, 10, 600); continue; }
            const l = largo(f.q);
            const [dx, dy] = [Math.cos(f.ang), -Math.sin(f.ang)];
            const p0 = [cx + dx * (r + 4 + (f.entra ? l : 0)), cy + dy * (r + 4 + (f.entra ? l : 0))];
            const p1 = [cx + dx * (r + 4 + (f.entra ? 0 : l)), cy + dy * (r + 4 + (f.entra ? 0 : l))];
            flecha(...p0, ...p1, f.color, 2.6);
            const pt = [cx + dx * (r + l + 18), cy + dy * (r + l + 14)];
            texto(`${f.t}: ${num(f.q)} W/m`, pt[0], pt[1], c.tinta, 10, 650, dx > 0.3 ? 'left' : dx < -0.3 ? 'right' : 'center');
        }
        // el claro visto de lado: la flecha de ahora contra la del diseño (si cabe)
        if (ancho && H < 250) return;
        const y0 = ancho ? H - 22 : Math.min(H - 26, Math.max(cy + r + 70, H * 0.78));
        const xa = ancho ? 18 : Math.max(16, W * 0.55);
        const xb = W - 18;
        const alto = ancho ? Math.max(40, Math.min(110, H - (cy + r + 70))) : Math.max(50, Math.min(150, y0 - 40));
        const yT = y0 - alto * 0.55;
        const k = (alto * 0.62) / 26.2;
        trazo([[xa, y0], [xb, y0]], c.linea, 1.4);
        for (const x of [xa + 6, xb - 6]) trazo([[x, y0], [x, yT]], c.tinta, 2);
        const curva = (f, color, ancho, guiones) => { const p = []; for (let i = 0; i <= 24; i++) { const u = i / 24; p.push([lerp(xa + 6, xb - 6, u), yT + 4 * f * k * u * (1 - u)]); } trazo(p, color, ancho, guiones); };
        curva(L.diseno, c.suave, 1.4, [4, 3]);
        curva(L.flecha, colorTemp(L.Tc), 2.4);
        const xm = (xa + xb) / 2;
        const ym = yT + L.flecha * k;
        trazo([[xm, ym + 3], [xm, y0 - 2]], c.guinda, 1.4);
        texto(`${num(L.libre)} m al suelo`, xm + 6, (ym + y0) / 2, c.guinda, 10.5, 700, 'left');
        texto(`a ${TENSE.diseno} °C (diseño)`, xb - 8, yT - 9, c.suave, 9.5, 600, 'right');
    }

    // El voltaje a lo largo de la línea, de una punta a la otra.
    function limite(t, L, c) {
        const pts = L.perfil;
        if (!pts) return;
        const xa = Math.max(46, W * 0.1);
        const xb = W - 18;
        const ya = 26;
        const yb = H - 34;
        const [vMin, vMax] = [0.88, Math.max(1.1, Math.ceil(Math.max(...pts.map(p => p.v)) * 20) / 20)];
        const yv = v => yb - ((v - vMin) / (vMax - vMin)) * (yb - ya);
        const xk = km => xa + (km / L.km) * (xb - xa);
        caja(xa, yv(1.05), xb - xa, yv(0.95) - yv(1.05), 3, c.superficie);
        for (const v of [0.9, 0.95, 1, 1.05, 1.1].filter(v => v <= vMax)) { trazo([[xa, yv(v)], [xb, yv(v)]], c.linea, 1, v === 1 ? null : [3, 3]); texto(`${num(v * 100)} %`, xa - 6, yv(v), c.suave, 9.5, 600, 'right'); }
        const p = pts.map(q => [xk(q.km), yv(q.v)]);
        trazo(p, c.guinda, 2.6);
        puntos(p, 10, t, L.abierta ? 0.05 : 0.18, col('alta'), 2.2);
        texto(LINEA.desde, xa, H - 12, c.tinta, 10, 700, 'left');
        texto(L.abierta ? `${LINEA.hasta}: abierta` : LINEA.hasta, xb, H - 12, c.tinta, 10, 700, 'right');
        const fin = pts.at(-1).v;
        const yfin = yv(fin);
        texto(`${num(fin * 100, 1)} %`, xb - 4, yfin - 10, c.guinda, 11, 750, 'right');
        const mitad = pts[Math.floor(pts.length / 2)];
        const msg = L.abierta ? (L.reactor ? 'Energizada desde un lado: el reactor la detiene' : 'Energizada desde un lado: la punta sube') : mitad.v > 1.004 ? 'Con poca carga, la línea da reactiva y sube al centro' : mitad.v < 0.996 ? 'Con mucha carga, la línea pide reactiva y baja al centro' : 'Con su potencia natural: pareja de punta a punta';
        texto(msg, (xa + xb) / 2, 13, c.tinta, 11, 700);
        if (!L.abierta) texto(`Ángulo entre las puntas: ${num(L.delta, 1)}°${L.delta > ANGULO ? ' (pasa de 30°)' : ''}`, (xa + xb) / 2, yv(vMin) - 10, L.delta > ANGULO ? c.guinda : c.suave, 10, 650);
    }

    // Un rayo en la torre y un incendio bajo las dos líneas.
    function falla(t, L, c) {
        const wT = Math.min(W * 0.44, 230);
        const x0 = Math.max(14, W * 0.04);
        const ySuelo = H - 30;
        const yC = Math.max(52, ySuelo - Math.min(140, H * 0.62));
        const xc = x0 + wT / 2;
        // la torre de frente: cruceta, fases, picos y patas
        trazo([[xc - wT * 0.42, yC], [xc + wT * 0.42, yC]], c.tinta, 3);
        trazo([[xc - 14, ySuelo], [xc - 5, yC + (ySuelo - yC) * 0.45], [xc - wT * 0.22, yC]], c.tinta, 2);
        trazo([[xc + 14, ySuelo], [xc + 5, yC + (ySuelo - yC) * 0.45], [xc + wT * 0.22, yC]], c.tinta, 2);
        const yG = yC - 24;
        for (const s of [-1, 1]) { trazo([[xc + s * wT * 0.2, yC], [xc + s * wT * 0.17, yG]], c.tinta, 2); punto(xc + s * wT * 0.17, yG, 2.6, c.tinta); }
        const tr = L.tramoR;
        const V = L.S.V;
        const salta = L.S.salta;
        const golpe = tr && tr.estado === 'golpe';
        const arco = tr && tr.estado === 'arco';
        [-1, 0, 1].forEach((s, j) => {
            const x = xc + s * wT * 0.36;
            trazo([[x, yC], [x, yC + 22]], '#5f7068', 3);
            const abierta = j === 2 && tr && tr.estado === 'monopolar';
            haz(x, yC + 28, 3.4, 40, c);
            if (abierta) texto('abierta', x, yC + 44, c.guinda, 9.5, 700);
        });
        if (golpe) {
            const xg = xc + wT * 0.17;
            const p = [[xg - 30, 4], [xg - 12, yG * 0.4], [xg - 22, yG * 0.55], [xg, yG]];
            trazo(p, '#e0b400', 3);
        }
        if (arco) { const x = xc + wT * 0.36; trazo([[x + 6, yC + 2], [x + 12, yC + 8], [x + 5, yC + 14], [x + 11, yC + 20], [x + 4, yC + 26]], '#7d5cff', 2.4); }
        // la tierra al pie de la torre
        trazo([[xc - 30, ySuelo], [xc + 30, ySuelo]], c.linea, 1.4);
        const z = [];
        for (let i = 0; i <= 6; i++) z.push([xc + (i % 2 ? 5 : -5), ySuelo + 3 + i * 3]);
        trazo(z, '#c8743c', 1.6);
        texto(`${num(L.R, 1)} Ω`, xc + 10, ySuelo + 13, L.R > PIE.maximo ? c.guinda : c.suave, 10, 700, 'left');
        // el medidor de voltaje del aislador
        const xm = x0;
        const wm = wT;
        const ym = Math.max(12, yG - 54);
        caja(xm, ym, wm, 8, 4, c.superficie);
        const lleno = clamp01(V / (AISLADOR.aguanta * 1.6));
        caja(xm, ym, wm * lleno, 8, 4, salta ? c.guinda : '#5f7068');
        const xl = xm + wm / 1.6;
        trazo([[xl, ym - 3], [xl, ym + 11]], c.tinta, 1.6);
        texto(`${num(V)} kV en el aislador; aguanta ${num(AISLADOR.aguanta)}`, xm + wm / 2, ym + 22, salta ? c.guinda : c.tinta, 10, 700);
        // las dos líneas, a la derecha
        const xr = x0 + wT + 18;
        const wr = W - xr - 14;
        if (wr < 120) return;
        const tf = L.tramoF;
        const est = tf ? tf.estado : null;
        const lineaFila = (i, y) => {
            const abierta = tf ? tf.abiertas > i : false;
            const arcoAqui = (i === 0 && (est === 'arco1' || est === 'recierre1')) || (i === 1 && est === 'arco2');
            const mono = i === 0 && est === 'monopolar1';
            caja(xr, y - 13, wr, 26, 6, abierta ? c.fondoPanel : c.superficie);
            borde(xr, y - 13, wr, 26, 6, arcoAqui ? '#7d5cff' : c.linea, arcoAqui ? 2.2 : 1);
            texto(`Línea ${i + 1}`, xr + 8, y, c.tinta, 10.5, 750, 'left');
            const msg = abierta ? 'Fuera' : arcoAqui ? 'Arco por el humo' : mono ? 'Una fase abierta' : L.abiertas === 1 && i === 1 ? `Lleva todo: ${num(L.Ilinea)} A` : `${num(L.Ilinea || 0)} A`;
            texto(msg, xr + wr - 8, y, abierta || arcoAqui ? c.guinda : c.suave, 10, 650, 'right');
            if (!abierta) puntos([[xr + 62, y + 8], [xr + wr - 70, y + 8]], 6, t, 0.25, col('alta'), 1.8);
        };
        lineaFila(0, yC - 6);
        lineaFila(1, yC + 30);
        const reloj = L.tF === null ? null : L.tF;
        const leyenda = est === null ? `Con ${num(L.P)} MW entre las dos, como el 28 de diciembre de 2020` : est === 'fuego' ? 'El fuego crece bajo las dos líneas' : est === 'separadas' ? 'Las dos fuera: de un lado sobra energía y del otro falta' : est === 'una' ? `Una sola lleva los ${num(L.P)} MW, con ${num(L.enUna.delta)}° entre las puntas` : 'Las protecciones abren';
        texto(leyenda, xr + wr / 2, yC + 62, c.tinta, 10.5, 700);
        if (reloj !== null) texto(`Segundo ${num(Math.max(0, reloj - 5), 0)} desde la primera falla`, xr + wr / 2, yC + 80, c.suave, 10, 600);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'calor') calor(t, L, c);
        else if (modo === 'limite') limite(t, L, c);
        else if (modo === 'falla') falla(t, L, c);
        else lejos(t, L, c);
    }
    return { dibujar };
}
