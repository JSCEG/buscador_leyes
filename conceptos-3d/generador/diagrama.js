// El diagrama que explica cada modo, dibujado en un lienzo 2D: las tres fases que nacen al girar, las dos flechas que deben coincidir
// para sincronizar, el diagrama de flechas del generador con carga y a dónde se va la energía que entra. No es a escala. Lee las mismas
// lecturas que el resto.
import { EJ, GEN, SINCRO, VHZ } from './modelo.js';

const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const FASES = ['#c2185b', '#2f7fd1', '#e0a03c'];

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
    const trazo = (puntos, color, ancho = 1.5, guiones = null) => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(guiones ?? []); ctx.beginPath(); puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.setLineDash([]); };
    /** Una flecha de (x0, y0) a (x1, y1). */
    const flecha = (x0, y0, x1, y1, color, ancho = 2.5) => {
        trazo([[x0, y0], [x1, y1]], color, ancho);
        const a = Math.atan2(y1 - y0, x1 - x0);
        const l = 8;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - l * Math.cos(a - 0.4), y1 - l * Math.sin(a - 0.4)); ctx.lineTo(x1 - l * Math.cos(a + 0.4), y1 - l * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
    };

    // Cómo nace el voltaje: las tres fases, su frecuencia y su altura.
    function voltaje(t, L, c) {
        const x0 = Math.max(16, W * 0.05);
        const x1 = W - 16;
        const y0 = Math.max(46, H * 0.48);
        const amp = Math.min(H * 0.28, 70) * clamp(L.v / 2.1, 0, 1);
        trazo([[x0, y0], [x1, y0]], c.linea, 1);
        // tres ciclos de la red a lo ancho: si la frecuencia es menor, caben menos
        const ciclos = 3 * (L.f / GEN.f);
        const fase = t * 0.6;
        FASES.forEach((col, k) => {
            const pts = [];
            for (let i = 0; i <= 120; i++) { const u = i / 120; pts.push([x0 + u * (x1 - x0), y0 - amp * Math.sin(2 * Math.PI * (ciclos * u - fase) - (k * 2 * Math.PI) / 3)]); }
            trazo(pts, col, 2);
        });
        const msg = `${num(L.rpm)} vueltas por minuto → ${num(L.f, 1)} Hz · ${num(L.kV, 1)} kV`;
        texto(cabe(msg, `${num(L.f, 1)} Hz · ${num(L.kV, 1)} kV`), W / 2, 14, c.tinta, 11, 750);
        const vhz = L.vhz;
        const m = L.rpm < 1 ? 'Sin giro no hay voltaje' : vhz > VHZ.alarma ? `V/Hz: ${num(vhz)} %. Pasa de ${VHZ.alarma} %: el núcleo se sobreexcita` : `V/Hz: ${num(vhz)} % de lo nominal`;
        texto(cabe(m, vhz > VHZ.alarma ? `V/Hz: ${num(vhz)} %, sobreexcitado` : m), W / 2, Math.min(H - 12, y0 + Math.min(H * 0.28, 70) + 22), vhz > VHZ.alarma ? c.guinda : c.suave, 10.5, 700);
    }

    // Sincronizar: la flecha de la red quieta y la del generador girando; y las tres revisiones.
    function sincronizar(t, L, c) {
        const r = Math.min(H * 0.3, 66);
        const cx = Math.max(r + 24, W * 0.3);
        // el círculo empieza abajo del letrero de arriba
        const cy = Math.max(r + 46, H * 0.52);
        ctx.strokeStyle = c.linea; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        flecha(cx, cy, cx, cy - r, c.tinta);
        const a = ((L.cerrado ? 0 : L.angulo) * Math.PI) / 180;
        const rg = r * clamp(L.vS / 100, 0.8, 1.15);
        flecha(cx, cy, cx + rg * Math.sin(a), cy - rg * Math.cos(a), c.guinda);
        // los nombres: la red a la izquierda de su punta; el generador, del lado hacia donde apunta (y a un lado si casi coinciden)
        texto('Red', cx - 8, cy - r - 10, c.tinta, 10, 700, 'right');
        const [gx, gy] = [cx + rg * Math.sin(a), cy - rg * Math.cos(a)];
        const cerca = Math.abs(Math.sin(a)) < 0.35 && Math.cos(a) > 0;
        texto('Generador', cerca ? gx + 10 : gx + (Math.sin(a) >= 0 ? 8 : -8), cerca ? gy - 10 : gy - 12, c.guinda, 10, 700, cerca || Math.sin(a) >= 0 ? 'left' : 'right');
        // las tres revisiones del verificador
        const xs = Math.min(W - 150, cx + r + 30);
        const v = SINCRO.verificador;
        const filas = [
            [`Voltaje: ${L.dV >= 0 ? '+' : ''}${num(L.dV, 1)} %`, `de 0 a +${v.dV} %`, L.ok.dV],
            [`Frecuencia: ${L.df >= 0 ? '+' : ''}${num(L.df, 3)} Hz`, `de 0 a +${num(v.df, 2)} Hz`, L.ok.df],
            [`Ángulo: ${num(Math.round(L.angulo) || 0)}°`, `±${v.dA}°`, L.ok.dA],
        ];
        if (W > 330) filas.forEach(([q, lim, ok], i) => {
            const y = cy - r + 14 + i * 40;
            caja(xs, y - 9, 10, 10, 2, ok ? '#2fb36a' : '#e0a03c');
            texto(q, xs + 16, y - 4, c.tinta, 10.5, 700, 'left');
            texto(`debe ser ${lim}`, xs + 16, y + 10, c.suave, 9.5, 600, 'left');
        });
        const msg = L.cerrado ? (L.golpe > 2 ? `Se cerró fuera de fase: ${num(L.golpe, 1)} veces la corriente nominal` : 'Conectado a la red, en fase') : L.puede ? 'Se puede cerrar: las tres revisiones están en verde' : 'Todavía no: espera que la aguja pase por arriba';
        texto(cabe(msg, L.cerrado ? (L.golpe > 2 ? 'Fuera de fase' : 'Conectado') : L.puede ? 'Se puede cerrar' : 'Todavía no'), W / 2, 14, L.cerrado && L.golpe > 2 ? c.guinda : c.tinta, 10.5, 700);
    }

    // Cargar: el voltaje de la red, el empuje del campo (E) y el ángulo del rotor (δ).
    function carga(t, L, c) {
        const esc = Math.min((W - 60) / 3.2, (H - 70) / 2.2, 90);
        const ox = Math.max(24, W * 0.12);
        const oy = H - 34;
        const V = [ox + esc, oy];
        const d = (L.delta * Math.PI) / 180;
        const E = [ox + esc * L.E * Math.cos(d), oy - esc * L.E * Math.sin(d)];
        flecha(ox, oy, V[0], V[1], c.tinta);
        flecha(V[0], V[1], E[0], E[1], c.suave, 1.5);
        flecha(ox, oy, E[0], E[1], c.guinda);
        texto('V de la red', (ox + V[0]) / 2, oy + 14, c.tinta, 10, 700);
        texto(`E del campo: ${num(L.E, 2)}`, E[0] + 6, E[1] - 10, c.guinda, 10, 700, 'left');
        texto(`Xd × I`, (V[0] + E[0]) / 2 + 8, (V[1] + E[1]) / 2, c.suave, 9.5, 650, 'left');
        // el arco del ángulo
        ctx.strokeStyle = c.guinda; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ox, oy, esc * 0.35, -d, 0); ctx.stroke();
        texto(`δ = ${num(L.delta)}°`, ox + esc * 0.45, oy - 12, c.guinda, 10.5, 750, 'left');
        const msg = !L.paso ? 'El campo no alcanza: el rotor pierde el paso' : L.adelanto ? `Absorbe ${num(-L.Q)} MVAr: le falta campo` : `Da ${num(L.P)} MW y ${num(L.Q)} MVAr`;
        texto(cabe(msg, msg), W / 2, 14, !L.paso || L.delta > EJ.delta ? c.guinda : c.tinta, 10.5, 700);
    }

    // Lo que se calienta: de cada 100 MW que entran por el eje, a dónde va cada uno.
    function calor(t, L, c) {
        const x0 = Math.max(16, W * 0.05);
        const x1 = W - 16;
        const y = Math.max(44, H * 0.34);
        const h = 26;
        const entra = L.P + L.total;
        const sale = (x1 - x0) * (L.P / entra);
        caja(x0, y, sale - 2, h, 4, '#f2b233');
        const partes = [['Cobre', L.cobre, '#c8743c'], ['Campo', L.campo, '#c2185b'], ['Núcleo', L.nucleo, '#6c7178'], ['Ventilación', L.ventilacion, '#7fb7e6']];
        // las pérdidas son poquitas: se dibujan agrandadas en su propia tira
        const yp = y + h + 34;
        let x = x0;
        partes.forEach(([n, v, col]) => { const w = ((x1 - x0) * v) / L.total; caja(x, yp, Math.max(0.5, w - 2), 18, 3, col); if (w > 54) texto(n, x + w / 2, yp + 9, '#ffffff', 9.5, 700); x += w; });
        texto(`Sale a la red: ${num((L.P / entra) * 100, 2)} de cada 100`, (x0 + x1) / 2, y - 14, c.tinta, 11, 750);
        texto(cabe(`Se calientan ${num(L.total, 2)} MW, así repartidos (agrandado):`, `${num(L.total, 2)} MW de calor:`), (x0 + x1) / 2, yp - 12, c.suave, 10, 650);
        texto(L.medio === 'h2' ? 'Con hidrógeno a 3.16 kg/cm²' : 'Con aire: ventilar cuesta más', (x0 + x1) / 2, Math.min(H - 12, yp + 36), L.medio === 'h2' ? c.suave : c.guinda, 10.5, 700);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'sincronizar') sincronizar(t, L, c);
        else if (modo === 'carga') carga(t, L, c);
        else if (modo === 'calor') calor(t, L, c);
        else voltaje(t, L, c);
    }
    return { dibujar };
}
