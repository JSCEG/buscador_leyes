// El diagrama que explica cada modo, dibujado en un lienzo 2D: a dónde va la energía del agua, cómo se reparte el agua en un día, cómo va el embalse en el año
// y qué pasa al cerrar. No es a escala: muestra quién entra, quién sale y qué cifras tiene. Lee las mismas lecturas que el resto.
import { MESES, NIVEL, UNIDAD } from './modelo.js';

const fract = x => x - Math.floor(x);
const clamp01 = x => Math.min(1, Math.max(0, x));
const azar = a => { const x = Math.sin(a * 127.1) * 43758.5453; return x - Math.floor(x); };
const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

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
    const trazo = (puntos, color, ancho = 1.5) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = ancho;
        ctx.beginPath();
        puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
    };
    const flecha = (x0, y0, x1, y1, color, ancho = 2) => {
        trazo([[x0, y0], [x1, y1]], color, ancho);
        const a = Math.atan2(y1 - y0, x1 - x0);
        const c = 7;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - c * Math.cos(a - 0.45), y1 - c * Math.sin(a - 0.45));
        ctx.lineTo(x1 - c * Math.cos(a + 0.45), y1 - c * Math.sin(a + 0.45));
        ctx.closePath();
        ctx.fill();
    };
    const banda = (x0, y0, x1, y1, grueso, color, t) => {
        if (grueso <= 0.2) return;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = grueso;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        const xm = (x0 + x1) / 2;
        ctx.bezierCurveTo(xm, y0, xm, y1, x1, y1);
        ctx.stroke();
        ctx.globalAlpha = 1;
        const n = Math.max(2, Math.round(grueso / 5));
        for (let i = 0; i < n; i++) {
            const u = fract(i / n + t * 0.35);
            const c0 = (1 - u) ** 3;
            const c1 = 3 * (1 - u) ** 2 * u;
            const c2 = 3 * (1 - u) * u * u;
            const c3 = u ** 3;
            punto(c0 * x0 + (c1 + c2) * xm + c3 * x1, (c0 + c1) * y0 + (c2 + c3) * y1 + (azar(i) - 0.5) * grueso * 0.6, 1.8, color);
        }
    };

    // De cada 100 de la energía del agua que cae, a dónde va.
    function reparto(t, L, c) {
        const R = L.reparto;
        if (!R.hay) {
            texto('El distribuidor está cerrado: el agua se queda en el embalse', W / 2, H / 2, c.suave, 12.5, 650);
            return;
        }
        const y0 = 8;
        const alto = H - 34;
        const col = 62;
        caja(6, y0, col - 10, alto, 7, c.fondoTinta);
        texto('Agua', 6 + (col - 10) / 2, y0 + alto / 2 - 7, c.claro, 10.5, 700);
        texto('100', 6 + (col - 10) / 2, y0 + alto / 2 + 8, c.claro, 13, 750);
        const esc = 1 / Math.max(0.01, R.red + R.transformador + R.generador + R.turbina + R.rozamiento);
        const fil = [
            { t: `A la red: ${num(R.red * 100)}`, v: R.red, color: c.elec, tinta: c.tinta, peso: 700 },
            { t: `Turbina: ${num(R.turbina * 100, 1)}`, v: R.turbina, color: c.guindaSuave, tinta: c.suave },
            { t: `Generador: ${num(R.generador * 100, 1)}`, v: R.generador, color: c.frio, tinta: c.suave },
            { t: `Tubería: ${num(R.rozamiento * 100, 1)}`, v: R.rozamiento, color: c.agua, tinta: c.suave },
            { t: `Transformador: ${num(R.transformador * 100, 1)}`, v: R.transformador, color: c.frio, tinta: c.suave },
        ];
        const x1 = W * 0.56;
        let y = y0;
        const marcas = [];
        for (const f of fil) {
            const g = f.v * esc * alto;
            const ym = y + g / 2;
            banda(col - 4, ym, x1, ym, Math.max(g, 1.5), f.color, t);
            marcas.push({ f, ym });
            y += g;
        }
        // los letreros se acomodan de abajo hacia arriba, para que no se encimen
        let tope = H - 26 + 14;
        for (let i = marcas.length - 1; i >= 0; i--) {
            const yT = Math.min(marcas[i].ym, tope - 14);
            texto(marcas[i].f.t, x1 + 6, yT, marcas[i].f.tinta, 11, marcas[i].f.peso ?? 650, 'left');
            tope = yT;
        }
        texto(`El agua sigue su camino: un m³ de este nivel deja ${num(L.kwh, 2)} kWh`, W / 2, H - 10, c.tinta, 11, 650);
    }

    // Un día: una barra por hora, y cómo sería si el agua corriera pareja.
    function dia(t, L, c) {
        const D = L.D;
        const x0 = 50;
        const x1 = W - 10;
        const y0 = 16;
        const y1 = H - 34;
        const esc = (y1 - y0) / Math.max(D.Ptot, 1);
        const paso = (x1 - x0) / 24;
        for (let h = 0; h < 24; h++) {
            const p = D.P(h + 0.5);
            const ahora = Math.floor(L.hora) === h;
            caja(x0 + h * paso + 1, y1 - p * esc, paso - 2, p * esc, 2, ahora ? c.guinda : c.elec);
            if (ahora && p < 1) trazo([[x0 + h * paso + 1, y1], [x0 + (h + 1) * paso - 1, y1]], c.guinda, 3);
        }
        const yP = y1 - D.parejo * esc;
        ctx.setLineDash([4, 4]);
        trazo([[x0, yP], [x1, yP]], c.agua, 1.8);
        ctx.setLineDash([]);
        texto(`Pareja todo el día: ${num(D.parejo)} MW`, x0 + 4, yP - 9, c.suave, 10.5, 650, 'left');
        trazo([[x0, y1], [x1, y1]], c.linea, 1);
        for (const h of [0, 6, 12, 18, 24]) texto(`${h} h`, x0 + h * paso, y1 + 11, c.suave, 10.5, 600);
        texto(`${num(D.Ptot)} MW`, x0 - 4, y0, c.suave, 10, 600, 'right');
        texto('0', x0 - 4, y1, c.suave, 10, 600, 'right');
        texto(`Con la misma agua, ${num(D.horasTope, 1)} horas a tope`, W / 2, H - 8, c.tinta, 11.5, 700);
    }

    // El embalse, de lado: niveles, lo que entra, lo que pasa por las turbinas y lo que se vierte.
    function embalse(t, L, c) {
        const M = L.M;
        const zy = z => {
            const k = (z - 500) / (580 - 500);
            return H - 30 - clamp01(k) * (H - 60);
        };
        const x0 = W * 0.16;
        const x1 = W * 0.78;
        const yBase = H - 30;
        const yN = zy(L.z);
        caja(x0, yN, x1 - x0, yBase - yN, 3, c.agua);
        ctx.globalAlpha = 1;
        // la cortina
        ctx.fillStyle = c.frio;
        ctx.beginPath();
        ctx.moveTo(x1, zy(579));
        ctx.lineTo(x1 + 18, zy(579));
        ctx.lineTo(x1 + 46, yBase);
        ctx.lineTo(x1 - 26, yBase);
        ctx.closePath();
        ctx.fill();
        for (const [nom, el] of [['NAMO', NIVEL.NAMO], ['NAMINO', NIVEL.NAMINO]]) {
            const y = zy(el);
            ctx.setLineDash([4, 3]);
            trazo([[x0 - 4, y], [x1, y]], c.guinda, 1.2);
            ctx.setLineDash([]);
            texto(`${nom} ${num(el)} m`, x0 + 6, y - 8, c.tinta, 10.5, 700, 'left');
        }
        texto(`${num(L.z)} m`, (x0 + x1) / 2, Math.min(yN + 12, yBase - 8), c.claro, 12.5, 750);
        const entra = M.entra;
        const gEntra = clamp01(entra / 900) * 12 + 1.5;
        flecha(6, yN + 16, x0 - 3, yN + 16, c.agua, gEntra * 0.6 + 1);
        texto(`Entran ${num(entra)}`, 5, yN + 3, c.suave, 10.5, 650, 'left');
        flecha(x1 + 34, yBase - 11, W - 6, yBase - 11, c.agua, clamp01(M.turbina / 700) * 7 + 1);
        texto(`Turbinas: ${num(M.turbina)}`, W - 4, yBase - 24, c.suave, 10.5, 650, 'right');
        if (M.vierte > 1) {
            flecha(x1 + 12, zy(576), W - 8, zy(555), c.guinda, 2);
            texto(`Vierte ${num(M.vierte)}`, W - 4, zy(576) - 7, c.tinta, 10.5, 700, 'right');
        }
        texto(`${MESES[M.mes - 1]}, en millones de m³`, W / 2, H - 9, c.tinta, 11.5, 700);
    }

    // Al cerrar: cuánto falta por cerrar, cómo va la presión y cómo va la velocidad, contra lo permitido.
    function cierre(t, L, c) {
        const R = L.R;
        const E = L.E;
        const en = Boolean(E);
        const y = en ? E.y : 1;
        const pres = en ? E.h / R.h0 - 1 : 0;
        const vel = en ? E.n - 1 : 0;
        const fila = (yy, nom, v, tope, valor, color) => {
            const x0 = 114;
            const x1 = W - 56;
            texto(nom, x0 - 8, yy + 7, c.tinta, 11, 700, 'right');
            caja(x0, yy, x1 - x0, 14, 4, c.superficie);
            caja(x0, yy, (x1 - x0) * clamp01(v / tope), 14, 4, color);
            texto(valor, x1 + 6, yy + 7, c.tinta, 11, 700, 'left');
        };
        const paso = (H - 42) / 3;
        fila(8, 'Distribuidor', y, 1, `${num(y * 100)} %`, c.frio);
        fila(8 + paso, 'Presión de más', Math.max(0, pres), 0.6, `+${num(Math.max(0, pres) * 100)} %`, c.agua);
        fila(8 + paso * 2, 'Velocidad de más', Math.max(0, vel), 0.8, `+${num(Math.max(0, vel) * 100)} %`, c.guinda);
        const xLim = (W - 56 - 114) * (UNIDAD.presionPermitida[1] / 0.6) + 114;
        trazo([[xLim, 4 + paso], [xLim, 26 + paso]], c.tinta, 1.6);
        const xV = (W - 56 - 114) * (UNIDAD.velPermitida / 0.8) + 114;
        trazo([[xV, 4 + paso * 2], [xV, 26 + paso * 2]], c.tinta, 1.6);
        texto(en ? `Pasaron ${num(E.t, 1)} segundos desde que se cayó la línea` : `Cerrando en ${num(R.tc, R.tc < 10 ? 1 : 0)} s: +${num(R.sobrePresion * 100)} % de presión y +${num(R.sobreVelocidad * 100)} % de velocidad. La rayita es lo permitido`, W / 2, H - 9, c.tinta, 11, 650);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'dia') dia(t, L, c);
        else if (modo === 'ano') embalse(t, L, c);
        else if (modo === 'cierre') cierre(t, L, c);
        else reparto(t, L, c);
    }
    return { dibujar };
}
