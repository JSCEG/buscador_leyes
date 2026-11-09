// El diagrama que explica cada modo, dibujado en un lienzo 2D: cómo se separa el crudo en la torre, qué sale de cada 100 barriles, a dónde va el azufre y cuánto
// octano trae cada corriente. No es a escala: muestra quién entra, quién sale y qué cifras tiene. Lee las mismas lecturas que el resto.
import { CALIDAD, NIVELES } from './modelo.js';

const fract = x => x - Math.floor(x);
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
    const banda = (x0, y0, x1, y1, grueso, color, t) => {
        if (grueso <= 0.2) return;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = grueso;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        const xm = (x0 + x1) / 2;
        ctx.bezierCurveTo(xm, y0, xm, y1, x1, y1);
        ctx.stroke();
        ctx.globalAlpha = 1;
        const n = Math.max(2, Math.round(grueso / 6));
        for (let i = 0; i < n; i++) {
            const u = fract(i / n + t * 0.3);
            const c0 = (1 - u) ** 3;
            const c1 = 3 * (1 - u) ** 2 * u;
            const c2 = 3 * (1 - u) * u * u;
            const c3 = u ** 3;
            punto(c0 * x0 + (c1 + c2) * xm + c3 * x1, (c0 + c1) * y0 + (c2 + c3) * y1 + (azar(i) - 0.5) * grueso * 0.6, 1.8, color);
        }
    };
    /** Bandas de una columna a la derecha, con sus letreros sin encimarse. filas: { t, v, color, tinta, peso }. */
    function reparto(t, filas, titulo, entra, c, pie) {
        const y0 = 8;
        const alto = H - 34;
        const col = 62;
        caja(6, y0, col - 10, alto, 7, c.fondoTinta);
        texto(titulo, 6 + (col - 10) / 2, y0 + alto / 2 - 8, c.claro, 10.5, 700);
        texto(entra, 6 + (col - 10) / 2, y0 + alto / 2 + 8, c.claro, 12.5, 750);
        filas = filas.filter(f => f.v > 0.01);
        const total = filas.reduce((s, f) => s + f.v, 0) || 1;
        const x1 = W * 0.54;
        let y = y0;
        const marcas = [];
        for (const f of filas) {
            const g = (f.v / total) * alto;
            const ym = y + g / 2;
            banda(col - 4, ym, x1, ym, Math.max(g, 1.2), f.color, t);
            marcas.push({ f, ym });
            y += g;
        }
        // los letreros, sin encimarse: primero hacia abajo y luego, si se salieron, de regreso hacia arriba
        let tope = -99;
        for (const m of marcas) { m.yT = Math.max(m.ym, tope + 14); tope = m.yT; }
        let piso = H - 26;
        for (let i = marcas.length - 1; i >= 0; i--) { marcas[i].yT = Math.min(marcas[i].yT, piso); piso = marcas[i].yT - 14; }
        for (const m of marcas) texto(m.f.t, x1 + 6, m.yT, m.f.tinta, 11, m.f.peso ?? 650, 'left');
        texto(pie, W / 2, H - 9, c.tinta, 11, 650);
    }

    // La torre por dentro: el vapor sube y se enfría; cada corte sale a su altura.
    function torre(t, L, c) {
        const To = L.To;
        const xT = W * 0.27;
        const ancho = Math.min(W * 0.16, 74);
        const y0 = 10;
        const y1 = H - 24;
        const altura = y1 - y0;
        // el cuerpo, con la temperatura: arriba frío, abajo caliente
        const g = ctx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, '#e7c04a');
        g.addColorStop(0.5, '#d9792c');
        g.addColorStop(1, '#8a2f1d');
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(xT - ancho / 2, y0, ancho, altura, 14);
        ctx.fill();
        ctx.globalAlpha = 1;
        for (let k = 1; k < 8; k++) trazo([[xT - ancho / 2 + 3, y0 + (altura * k) / 8], [xT + ancho / 2 - 3, y0 + (altura * k) / 8]], 'rgba(255,255,255,.5)', 1);
        // burbujas de vapor
        for (let k = 0; k < 16; k++) {
            const u = fract(azar(k + 2) + t * 0.2);
            if (u > To.vapor / 100 + 0.25) continue;
            punto(xT + (azar(k + 9) - 0.5) * (ancho - 14), y1 - 34 - u * (altura - 44), 1.8, '#ffffff');
        }
        const holgado = altura * 0.14 >= 30;
        const filas = [
            { n: 'Gas', v: To.cortes.gas, y: 0.03, T: 'menos de 30 °C' },
            { n: 'Nafta', v: To.cortes.nafta, y: 0.17, T: '30 a 177 °C' },
            { n: 'Queroseno', v: To.cortes.keroseno, y: 0.37, T: '177 a 274 °C' },
            { n: 'Gasóleo ligero', v: To.cortes.ligero, y: 0.57, T: '274 a 344 °C' },
            { n: 'Fondo, a vacío', v: To.fondo, y: 0.95, T: 'lo que no hirvió', fuerte: true },
        ];
        for (const f of filas) {
            const y = y0 + altura * f.y;
            const x = xT + ancho / 2 + 24;
            const cifra = `${f.n}: ${num(f.v, f.v > 0 && f.v < 1 ? 1 : 0)}`;
            trazo([[xT + ancho / 2, y], [xT + ancho / 2 + 18, y]], c.tinta, Math.max(1.2, Math.min(9, f.v / 7)));
            if (holgado) {
                texto(cifra, x, y - 6, c.tinta, 11.5, f.fuerte ? 750 : 680, 'left');
                texto(f.T, x, y + 7, c.suave, 10, 600, 'left');
            } else {
                // sin alto para dos renglones: la temperatura va al lado, si cabe
                texto(cifra, x, y, c.tinta, 11.5, f.fuerte ? 750 : 680, 'left');
                const w = ctx.measureText(cifra).width;
                ctx.font = '600 10px Manrope, system-ui, sans-serif';
                if (x + w + 8 + ctx.measureText(f.T).width < W - 4) texto(f.T, x + w + 8, y, c.suave, 10, 600, 'left');
            }
        }
        // la entrada del horno
        const yE = y0 + altura * 0.78;
        trazo([[8, yE], [xT - ancho / 2, yE]], c.guinda, 3);
        texto(`${num(L.T)} °C`, 10, yE - 10, c.tinta, 11.5, 750, 'left');
        texto(`${L.C.nombre}, de cada 100`, W / 2, H - 9, c.tinta, 11, 650);
    }
    function conversion(t, L, c) {
        const P = L.B.productos;
        const k = 100 / L.B.carga;
        const filas = [
            { t: `Gasolina: ${num(P.gasolina * k)}`, v: P.gasolina, color: c.nafta, tinta: c.tinta, peso: 720 },
            { t: `Diésel y queroseno: ${num(P.diesel * k)}`, v: P.diesel, color: c.medio, tinta: c.tinta, peso: 720 },
            { t: `Gas LP: ${num(P.glp * k)}`, v: P.glp, color: c.frio, tinta: c.suave },
            { t: `Combustóleo: ${num(P.combustoleo * k)}`, v: P.combustoleo, color: c.residuo, tinta: c.suave },
        ];
        if (L.B.coqueT > 1) filas.push({ t: `Coque: ${num(L.B.coqueT)} t al día`, v: L.B.coqueT / 150, color: c.coque, tinta: c.suave });
        reparto(t, filas, L.C.nombre, '100', c, `${NIVELES[L.nivel]}: ${num(L.B.ligeros * 100)} de cada 100 ya son combustibles ligeros`);
    }
    function azufre(t, L, c) {
        const S = L.S;
        const filas = [
            { t: `Azufre sólido: ${num(S.solido)} t`, v: S.solido, color: c.azufre, tinta: c.tinta, peso: 720 },
            { t: `En el coque: ${num(S.enCoque)} t`, v: S.enCoque, color: c.coque, tinta: c.suave },
            { t: `En el combustóleo: ${num(S.combustoleo)} t`, v: S.combustoleo, color: c.residuo, tinta: c.suave },
            { t: `Por la chimenea: ${num(S.chimenea)} t`, v: S.chimenea, color: c.guindaSuave, tinta: c.suave },
            { t: `En los productos: ${num(S.enProductos, 1)} t`, v: S.enProductos, color: c.medio, tinta: c.suave },
        ];
        reparto(t, filas, 'Azufre', `${num(S.entra)} t`, c, `Lo que entra con ${L.C.nombre} en un día`);
    }
    // Una barra por cada corriente de la gasolina, y las dos líneas que pide la norma.
    function octano(t, L, c) {
        const O = L.O;
        const x0 = 118;
        const x1 = W - 40;
        const esc = v => x0 + ((v - 50) / 50) * (x1 - x0);
        const paso = Math.min(40, (H - 58) / (O.filas.length + 1));
        O.filas.forEach((f, i) => {
            const y = 10 + i * paso;
            const idx = (f.ron + f.mon) / 2;
            texto(f.nombre, x0 - 8, y + 8, c.tinta, 11, 680, 'right');
            caja(x0, y + 1, x1 - x0, 14, 4, c.superficie);
            caja(x0, y + 1, Math.max(0, esc(idx) - x0), 14, 4, c.nafta);
            texto(num(idx), x1 + 5, y + 8, c.tinta, 11, 700, 'left');
        });
        const y = 10 + O.filas.length * paso;
        texto('La mezcla', x0 - 8, y + 8, c.tinta, 11.5, 780, 'right');
        caja(x0, y + 1, x1 - x0, 14, 4, c.superficie);
        caja(x0, y + 1, Math.max(0, esc(O.indice) - x0), 14, 4, c.guinda);
        texto(num(O.indice, 1), x1 + 5, y + 8, c.tinta, 11.5, 780, 'left');
        for (const [n, v] of [['Regular', CALIDAD.regular], ['Premium', CALIDAD.premium]]) {
            const x = esc(v);
            trazo([[x, 6], [x, y + 20]], c.tinta, 1.4);
            texto(`${n} ${v}`, x, y + 28, c.suave, 10, 650, v === CALIDAD.premium ? 'left' : 'right');
        }
        texto(`Índice de octano. La nafta tal cual del ${L.C.nombre}: RON ${num(L.C.ron, 1)}`, W / 2, H - 9, c.tinta, 11, 650);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'conversion') conversion(t, L, c);
        else if (modo === 'azufre') azufre(t, L, c);
        else if (modo === 'octano') octano(t, L, c);
        else torre(t, L, c);
    }
    return { dibujar };
}
