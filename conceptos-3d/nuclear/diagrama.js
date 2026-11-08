// El diagrama que explica cada modo, dibujado en un lienzo 2D: la reacción en cadena, a dónde va el calor al apagar, los dos circuitos
// del agua a presión y el viaje del combustible. No es a escala: muestra quién entra, quién sale y qué cifras tiene. Lee las mismas
// lecturas que el resto.
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
    const redondeado = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
    const flecha = (x0, y0, x1, y1, color, ancho = 2) => {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = ancho;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        const a = Math.atan2(y1 - y0, x1 - x0);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 7 * Math.cos(a - 0.45), y1 - 7 * Math.sin(a - 0.45));
        ctx.lineTo(x1 - 7 * Math.cos(a + 0.45), y1 - 7 * Math.sin(a + 0.45));
        ctx.closePath();
        ctx.fill();
    };
    const mezclar = (a, b, k) => a + (b - a) * k;

    // Un neutrón parte un átomo; salen más, uno sigue y los otros se pierden en el agua, el uranio-238 o las barras.
    function cadena(t, L, c) {
        const O = L.operar;
        const P = O.P;
        const pasos = 5;
        const cy = (H - 26) / 2 + 2;
        const x0 = 26;
        const dx = (W - 52) / (pasos - 1);
        const r = Math.min(19, dx * 0.28);
        const vel = 0.42;
        const u = (t * vel) % 1;
        const avance = u * pasos;
        // con la reacción apagada la cadena se muere en el segundo átomo
        const llega = P > 0.02 ? pasos : 1.4;
        ctx.strokeStyle = c.linea;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(x0, cy);
        ctx.lineTo(W - x0, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        for (let i = 0; i < pasos; i++) {
            const x = x0 + i * dx;
            const pasado = avance - i;
            const roto = pasado > 0 && i < llega;
            if (!roto) {
                punto(x, cy, r, c.vapor);
                texto(r > 16 ? 'U-235' : 'U', x, cy + 0.5, c.fondoPanel, r > 16 ? 9.5 : 10.5, 700);
                continue;
            }
            const k = clamp01(pasado * 1.8);
            // destello y dos pedazos
            ctx.globalAlpha = (1 - k) * 0.55;
            punto(x, cy, r + 13 * k, c.guinda);
            ctx.globalAlpha = 1;
            punto(x - 6 * k, cy - 16 * k, r * 0.62, c.vapor);
            punto(x + 6 * k, cy + 16 * k, r * 0.62, c.vapor);
            // neutrones que se pierden
            ctx.globalAlpha = 1 - k * 0.8;
            punto(x + 18 * k, cy - 36 * k, 2.8, c.tinta);
            punto(x - 14 * k, cy + 38 * k, 2.8, c.tinta);
            ctx.globalAlpha = 1;
        }
        // el neutrón que sigue
        if (avance < llega) {
            const xn = x0 + Math.min(pasos - 1, avance) * dx;
            punto(xn, cy, 3.4, c.tinta);
        }
        const k = O.k;
        const frase = P <= 0.005 ? 'La cadena se apaga: se pierden más neutrones de los que salen' : `Salen ${num(2.45, 2)} neutrones por fisión y sigue ${num(k, 3)}`;
        texto(frase, W / 2, H - 11, c.tinta, 11.5, 650);
    }

    // Lo que queda después de apagar: calor que hay que sacar, agua que entra y vapor que sale.
    function apagado(t, L, c) {
        const A = L.apagar;
        const cx = Math.min(W * 0.28, 84);
        const [x0, x1, y0, y1] = [cx - 34, cx + 34, 10, H - 10];
        redondeado(x0, y0, x1 - x0, y1 - y0, 20);
        ctx.fillStyle = c.superficie;
        ctx.fill();
        ctx.save();
        redondeado(x0, y0, x1 - x0, y1 - y0, 20);
        ctx.clip();
        const nivel = y0 + (y1 - y0) * 0.35;
        ctx.fillStyle = c.agua;
        ctx.globalAlpha = 0.28;
        ctx.fillRect(x0, nivel, x1 - x0, y1 - nivel);
        ctx.globalAlpha = 1;
        const fuerza = clamp01(Math.log10(A.pct / 0.001) / 1.8);
        for (let i = 0; i < 26; i++) {
            const h = azar(i);
            const u = fract(t * (0.15 + 0.5 * fuerza) + h);
            if (i / 26 > 0.25 + 0.75 * fuerza) continue;
            punto(mezclar(x0 + 8, x1 - 8, azar(i + 40)) + Math.sin(t * 2 + i) * 2, mezclar(y1 - 18, y0 + 6, u), 2.1, c.vapor);
        }
        ctx.restore();
        ctx.fillStyle = c.guinda;
        redondeado(cx - 18, y1 - 34, 36, 22, 4);
        ctx.fill();
        texto('calor', cx, y1 - 23, c.fondoPanel, 10.5, 700);
        ctx.strokeStyle = c.linea;
        redondeado(x0, y0, x1 - x0, y1 - y0, 20);
        ctx.stroke();
        const xf = x1 + 12;
        const xt = xf + 42;
        flecha(x1 - 4, y0 + 24, xt, y0 + 24, c.vapor, 1.5 + fuerza * 2.5);
        flecha(xt, y1 - 22, x1 - 4, y1 - 22, c.agua, 1.5 + fuerza * 2.5);
        texto(A.sinRed ? 'Vapor a la alberca de abajo' : 'Vapor al condensador', xt + 6, y0 + 18, c.tinta, 11.5, 700, 'left');
        texto(`${num(A.agua)} t/h de agua que hervir`, xt + 6, y0 + 34, c.suave, 11, 600, 'left');
        texto(A.sinRed ? 'Agua del tanque de emergencia' : 'Agua del condensador', xt + 6, y1 - 28, c.tinta, 11.5, 700, 'left');
        texto(A.sinRed ? 'La mueve una bomba con el propio vapor' : 'Sigue enfriando el agua de mar', xt + 6, y1 - 12, c.suave, 11, 600, 'left');
    }

    // Los dos circuitos del agua a presión: uno cerrado y apretado, otro que hierve. Se tocan por la pared de los tubos.
    function dosCircuitos(t, L, c) {
        const p = L.presion;
        const W2 = W / 2;
        const lazo = (x, y, w, h, color, n, fase) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            redondeado(x, y, w, h, 14);
            ctx.stroke();
            const per = 2 * (w + h);
            for (let i = 0; i < n; i++) {
                let d = fract(i / n + t * fase) * per;
                let [px, py] = [x, y];
                if (d < w) px = x + d;
                else if ((d -= w) < h) { px = x + w; py = y + d; } else if ((d -= h) < w) { px = x + w - d; py = y + h; } else { d -= w; py = y + h - d; }
                punto(px, py, 2.8, color);
            }
        };
        const y0 = 26;
        const h = Math.max(70, H - 62);
        const wL = Math.min(W2 - 20, 150);
        const xL = W2 - wL - 10;
        const xR = W2 + 10;
        lazo(xL, y0, wL, h, c.primario, 12, 0.14);
        lazo(xR, y0, wL, h, c.vapor, 10, 0.12);
        // núcleo
        ctx.fillStyle = c.guinda;
        redondeado(xL - 23, y0 + h * 0.3, 46, h * 0.4, 6);
        ctx.fill();
        texto('núcleo', xL, y0 + h * 0.5, c.fondoPanel, 9.5, 700);
        // generador de vapor, entre los dos
        ctx.fillStyle = c.superficie;
        redondeado(W2 - 22, y0 + h * 0.18, 44, h * 0.64, 10);
        ctx.fill();
        ctx.strokeStyle = c.tinta;
        ctx.lineWidth = 1;
        redondeado(W2 - 22, y0 + h * 0.18, 44, h * 0.64, 10);
        ctx.stroke();
        for (let i = 0; i < 4; i++) { const yy = y0 + h * (0.28 + i * 0.15); ctx.strokeStyle = c.primario; ctx.beginPath(); ctx.moveTo(W2 - 15, yy); ctx.lineTo(W2 + 15, yy); ctx.stroke(); }
        // turbina
        ctx.fillStyle = c.tinta;
        redondeado(xR + wL - 23, y0 + h * 0.3, 46, h * 0.4, 6);
        ctx.fill();
        texto('turbina', xR + wL, y0 + h * 0.5, c.fondoPanel, 8.5, 700);
        texto(p.hierve ? 'Hierve: presión muy baja' : `${num(p.pPrim)} bar, ${num(p.tSale)} °C, sin hervir`, xL + wL * 0.45, 12, c.tinta, 11, 700);
        texto(`${num(p.pSec)} bar, ${num(p.tSec)} °C, hierve`, xR + wL * 0.55, 12, c.tinta, 11, 700);
        texto(`El agua del reactor nunca llega a la turbina`, W2, H - 13, c.suave, 11.5, 600);
    }

    // El viaje del combustible.
    function viaje(t, L, c) {
        const C = L.ciclo;
        const etapas = [['Mina', '0.7 %'], ['Enriquecer', '4 %'], ['Pastilla', ''], ['Ensamble', ''], ['Reactor', `Mes ${num(C.mes)}`], ['Alberca', 'unos años'], ['En seco', 'después']];
        const activa = 4;
        const y = H * 0.46;
        const x0 = 22;
        const dx = (W - 44) / (etapas.length - 1);
        ctx.strokeStyle = c.linea;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(W - x0, y);
        ctx.stroke();
        etapas.forEach(([n, d], i) => {
            const x = x0 + i * dx;
            const es = i === activa;
            if (es) {
                ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 2);
                punto(x, y, 17, C.recarga ? c.vapor : c.guinda);
                ctx.globalAlpha = 1;
            }
            punto(x, y, es ? 9.5 : 7, es ? c.guinda : c.tinta);
            const arriba = i % 2 === 0;
            texto(n, x, arriba ? y - 24 : y + 24, c.tinta, 11, es ? 750 : 620);
            if (d) texto(d, x, arriba ? y - 38 : y + 38, c.suave, 10.5, 600);
        });
        // ensambles que entran y salen
        const u = fract(t * 0.18);
        punto(x0 + dx * (u * (etapas.length - 1)), y, 2.6, c.fondoPanel);
        texto(C.recarga ? 'Recarga: se cambian 132 de los 444 ensambles' : `Va en su ${C.ciclo}.º ciclo de 18 meses`, W / 2, H - 12, c.tinta, 11.5, 650);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'operar') cadena(t, L, c);
        else if (modo === 'apagar') apagado(t, L, c);
        else if (modo === 'presion') dosCircuitos(t, L, c);
        else viaje(t, L, c);
    }
    return { dibujar };
}
