// El diagrama que explica cada modo, dibujado en un lienzo 2D: qué le saca el rotor al viento, por qué gira un aspa, cuánto viento hay según la altura y
// cómo se abre la estela. No es a escala: muestra quién entra, quién sale y qué cifras tiene. Lee las mismas lecturas que el resto.
const fract = x => x - Math.floor(x);
const clamp01 = x => Math.min(1, Math.max(0, x));
const azar = a => { const x = Math.sin(a * 127.1) * 43758.5453; return x - Math.floor(x); };
const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

// La torcedura del aspa a la mitad de su largo, en grados, y su corte: la cara que no da al viento lleva la panza.
const TORCEDURA = 5.5;
const CORTE = (() => {
    const grueso = u => 1.05 * 0.21 * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u ** 2 + 0.2843 * u ** 3 - 0.1036 * u ** 4);
    const curva = u => (u < 0.4 ? 0.25 * (0.8 * u - u * u) : 0.111 * (0.2 + 0.8 * u - u * u));
    const encima = [];
    const debajo = [];
    for (let i = 0; i <= 26; i++) {
        const u = (i / 26) ** 1.8;
        encima.push([2 * u - 1, 2 * (curva(u) * 0.16 + grueso(u) * 5)]);
        debajo.push([2 * u - 1, 2 * (curva(u) * 0.16 - grueso(u) * 5)]);
    }
    return [...encima, ...debajo.reverse()];
})();

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
    const caja = (x, y, w, h, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
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

    // De cada 100 del viento que cruza el rotor, a dónde va.
    function reparto(t, L, c) {
        const R = L.reparto;
        if (!R.hay) {
            texto(L.parado ? 'Mucho viento: las aspas de canto y el freno puesto' : 'Muy poco viento: la máquina no arranca', W / 2, H / 2, c.suave, 12.5, 650);
            return;
        }
        const y0 = 8;
        const alto = H - 34;
        const col = 62;
        caja(6, y0, col - 10, alto, 7, c.fondoTinta);
        texto('Viento', 6 + (col - 10) / 2, y0 + alto / 2 - 7, c.claro, 10.5, 700);
        texto('100', 6 + (col - 10) / 2, y0 + alto / 2 + 8, c.claro, 13, 750);
        const fil = [
            { t: `A la red: ${num(R.red * 100)}`, v: R.red, color: c.elec, tinta: c.tinta, peso: 700 },
            { t: `Lo suelta el paso: ${num(R.suelta * 100)}`, v: R.suelta, color: c.guindaSuave, tinta: c.suave },
            { t: `Máquina: ${num(R.maquina * 100)}`, v: R.maquina, color: c.frio, tinta: c.suave },
            { t: `Aspas: ${num(R.aspas * 100)}`, v: R.aspas, color: c.frio, tinta: c.suave },
            { t: 'Sigue de largo: 41', v: R.sigue, color: c.aire, tinta: c.suave },
        ];
        const x1 = W * 0.56;
        let y = y0;
        let ultimo = -99;
        for (const f of fil) {
            const g = f.v * alto;
            if (g < 0.3) continue;
            const ym = y + g / 2;
            banda(col - 4, ym, x1, ym, g, f.color, t);
            const yT = Math.max(ym, ultimo + 14);
            texto(f.t, x1 + 6, Math.min(yT, H - 30), f.tinta, 11, f.peso ?? 650, 'left');
            ultimo = yT;
            y += g;
        }
        texto(`El límite de Betz: nadie puede tomar más de 59 de cada 100`, W / 2, H - 10, c.tinta, 11, 650);
    }

    // Un corte a media aspa, visto desde la punta: el viento baja y el aspa avanza a la derecha. Las dos velocidades, a escala entre sí, hacen el viento
    // que el aspa siente; la fuerza útil la empuja hacia donde avanza.
    function perfil(t, L, c) {
        const a = L.a;
        const paso = L.beta ?? 0;
        const cx = W * 0.36;
        const cy = H * 0.5 + 2;
        const esc = Math.min(W * 0.19, 66);
        const th = (paso + TORCEDURA) * (Math.PI / 180);
        const cosT = Math.cos(th);
        const sinT = Math.sin(th);
        // x: -1 el borde de adelante, 1 el de atrás; y > 0: la cara de abajo, la que no da al viento
        const pt = (x, y) => [cx - x * cosT * esc + y * sinT * esc, cy + x * sinT * esc + y * cosT * esc];
        ctx.fillStyle = c.panel;
        ctx.beginPath();
        CORTE.forEach(([x, y], i) => { const [X, Y] = pt(x, y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
        ctx.closePath();
        ctx.fill();
        const [bx, by] = pt(-1, 0);
        const vf = Math.max(L.v * Math.cos((L.desvio ?? 0) * (Math.PI / 180)), 0.01);
        const rot = (L.rpm * 2 * Math.PI) / 60 * 34;
        const k = Math.min(3.2, (W - bx - 14) / Math.max(rot, 20), (by - 22) / Math.max(vf, 1));
        const ax = bx + rot * k;
        const ay = by - vf * k;
        flecha(ax, ay, ax, by, c.aire, 2.2);
        texto(`Viento: ${num(L.v)} m/s`, ax + (rot > 1 ? 0 : 7), ay - 10, c.suave, 10.5, 650, rot > 1 ? 'right' : 'left');
        if (rot > 1) {
            flecha(ax, by, bx + 3, by, c.suave, 2);
            texto(`Por el giro: ${num(rot)} m/s`, ax, by + 12, c.suave, 10.5, 650, 'right');
            flecha(ax, ay, bx, by, c.tinta, 2);
            texto('Lo que siente el aspa', ax - 82, (ay + by) / 2 - 16, c.tinta, 10.5, 700, 'right');
        }
        const fuerza = clamp01(a.cp / 0.48);
        if (fuerza > 0.03 && !L.parado) {
            const [fx, fy] = pt(0.1, 0.3);
            const largo = 16 + 58 * fuerza;
            flecha(fx, fy + 3, fx + largo, fy + 3, c.guinda, 3);
            texto('Empuja el giro', fx + largo / 2, fy + 15, c.tinta, 10.5, 700);
        }
        const zona = paso >= 60 ? 'De canto: el viento pasa sin empujar' : paso < 3 ? 'De frente: toma todo lo que puede' : a.cp < 0.02 ? 'Girada de más: ya casi no empuja' : 'Girada: suelta parte del viento';
        texto(zona, W / 2, H - 25, c.tinta, 11.5, 700);
        texto(`Paso ${num(paso)}°: toma ${num(a.cp * 100)} de cada 100`, W / 2, H - 9, c.suave, 11, 600);
    }

    // Más arriba, más viento: el perfil de altura y el buje.
    function altura(t, L, c) {
        const yS = H - 36;
        const yA = 12;
        const xB = 58;
        trazo([[xB - 34, yS], [W - 12, yS]], c.linea, 1);
        const hMax = 180;
        const y = h => yS - (h / hMax) * (yS - yA);
        const S = L.S;
        const m = L.mes - 1;
        const vSit = h => S.ws50[m] * (h / 50) ** (1 / 7);
        const esc = (W - xB - 90) / 12;
        const pts = [];
        for (let h = 5; h <= hMax; h += 5) pts.push([xB + vSit(h) * esc, y(h)]);
        trazo(pts, c.aire, 2);
        for (const h of [20, 60, 100, 140, 180]) {
            const xv = xB + vSit(h) * esc;
            flecha(xB, y(h), xv, y(h), c.aire, 1.4);
            texto(`${h} m`, xB - 6, y(h), c.suave, 10, 600, 'right');
        }
        // el aerogenerador, a su altura
        const xT = W - 44;
        trazo([[xT, yS], [xT, y(L.buje)]], c.suave, 3);
        const rPx = (68 / hMax) * (yS - yA);
        ctx.strokeStyle = c.suave;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const a = t * 1.3 + (i * 2 * Math.PI) / 3;
            trazo([[xT, y(L.buje)], [xT + Math.cos(a) * rPx, y(L.buje) + Math.sin(a) * rPx]], c.suave, 2);
        }
        const xv = xB + vSit(L.buje) * esc;
        trazo([[xB, y(L.buje)], [xT, y(L.buje)]], c.guinda, 1.2);
        punto(xv, y(L.buje), 4.5, c.guinda);
        texto(`${num(vSit(L.buje), 1)} m/s en ${MES[m]}, a ${num(L.buje)} m`, xB + (W - xB - 60) / 2, H - 22, c.tinta, 11.5, 700);
        texto(`Sopla ${num(S.ws50[m], 1)} m/s a 50 m (NASA POWER)`, xB + (W - xB - 60) / 2, H - 8, c.suave, 10.5, 600);
    }

    // Vista desde arriba: la estela se abre y al de atrás le llega menos.
    function estela(t, L, c) {
        const F = L.fila.lista;
        const x0 = 40;
        const x1 = W - 56;
        const sep = (x1 - x0) / 2;
        const cy = H / 2 - 8;
        const rPx = Math.min((H - 70) / 2, 38);
        for (let i = 0; i < 3; i++) {
            const x = x0 + i * sep;
            if (i < 3) {
                ctx.fillStyle = c.aire;
                ctx.globalAlpha = 0.16;
                ctx.beginPath();
                ctx.moveTo(x, cy - rPx);
                const fin = Math.min(x + sep * 1.05, W - 4);
                const apertura = 1 + (0.075 * 2 * L.separacion * (fin - x)) / sep;
                ctx.lineTo(fin, cy - rPx * apertura ** 0.6);
                ctx.lineTo(fin, cy + rPx * apertura ** 0.6);
                ctx.lineTo(x, cy + rPx);
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
        // hilos del viento
        for (let k = 0; k < 18; k++) {
            const fy = azar(k + 3) * 2 - 1;
            const dentro = Math.abs(fy) < 1;
            const u = fract(azar(k + 9) + t * (0.12 + (L.v || 0) * 0.012));
            const x = 4 + u * (W - 8);
            const y = cy + fy * (rPx + 10);
            const atras = x > x0 && dentro ? (x > x0 + sep ? 0.6 : 0.8) : 1;
            punto(x, y, 1.4 + atras * 0.7, c.aire);
        }
        for (let i = 0; i < 3; i++) {
            const x = x0 + i * sep;
            trazo([[x, cy - rPx], [x, cy + rPx]], c.panel, 4);
            texto(`${num(F[i].u, 1)} m/s`, x, cy - rPx - 12, c.tinta, 11, 700);
            texto(`${num(F[i].mw, 2)} MW`, x, cy + rPx + 12, c.suave, 11, 650);
        }
        texto(`${num(L.separacion)} diámetros entre cada uno: ${num(L.separacion * 136)} m`, W / 2, H - 22, c.tinta, 11.5, 700);
        texto(`Alineados con el viento se pierde ${num(L.fila.perdida * 100)} de cada 100`, W / 2, H - 8, c.suave, 11, 600);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'control') perfil(t, L, c);
        else if (modo === 'ano') altura(t, L, c);
        else if (modo === 'estela') estela(t, L, c);
        else reparto(t, L, c);
    }
    return { dibujar };
}
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
