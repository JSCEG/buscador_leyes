// El diagrama que explica cada modo, dibujado en un lienzo 2D: el campo que gira y el rotor que lo sigue, la corriente y la velocidad al
// arrancar, a dónde va cada watt que entra, y la temperatura contra lo que aguanta el aislamiento. No es a escala. Lee las mismas
// lecturas que el resto.
import { PRUEBAS, TNOM } from './modelo.js';

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
    const trazo = (puntos, color, ancho = 1.5) => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.beginPath(); puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
    const flecha = (x0, y0, x1, y1, color, ancho = 2.5) => {
        trazo([[x0, y0], [x1, y1]], color, ancho);
        const a = Math.atan2(y1 - y0, x1 - x0);
        const l = 8;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - l * Math.cos(a - 0.4), y1 - l * Math.sin(a - 0.4)); ctx.lineTo(x1 - l * Math.cos(a + 0.4), y1 - l * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
    };

    // Cómo gira: tres bobinas, el campo que gira y el rotor un poco atrás (en cámara muy lenta).
    let angCampo = 0;
    let angRotor = 0;
    let antes = 0;
    function gira(t, L, c) {
        const dt = clamp(t - antes, 0, 0.1);
        antes = t;
        const r = Math.min(H * 0.32, 70);
        const cx = Math.max(r + 24, W * 0.3);
        const cy = Math.max(r + 40, H * 0.55);
        // el campo da una vuelta cada 2 s a 1,800 rpm; el rotor, un poco menos
        angCampo += dt * Math.PI * (L.vueltasCampo / 1800);
        angRotor += dt * Math.PI * (L.rpm / 1800);
        ctx.strokeStyle = c.linea; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        FASES.forEach((col, k) => {
            for (const s of [0, Math.PI]) {
                const a = (k * 2 * Math.PI) / 3 + s;
                caja(cx + Math.cos(a) * (r + 6) - 5, cy + Math.sin(a) * (r + 6) - 5, 10, 10, 3, col);
            }
        });
        flecha(cx, cy, cx + Math.cos(angCampo) * r * 0.95, cy + Math.sin(angCampo) * r * 0.95, c.guinda, 2.5);
        flecha(cx, cy, cx + Math.cos(angRotor) * r * 0.6, cy + Math.sin(angRotor) * r * 0.6, c.tinta, 3.5);
        const xs = Math.min(W - 140, cx + r + 34);
        if (W > 330) {
            caja(xs, cy - 26, 12, 3, 1, c.guinda); texto(`Campo: ${num(L.vueltasCampo)} rpm`, xs + 18, cy - 25, c.tinta, 10.5, 700, 'left');
            caja(xs, cy - 4, 12, 4, 1, c.tinta); texto(`Rotor: ${num(L.rpm)} rpm`, xs + 18, cy - 2, c.tinta, 10.5, 700, 'left');
            texto(`resbala ${num(L.deslizamiento, 1)} %`, xs + 18, cy + 18, c.suave, 10, 650, 'left');
        }
        texto(cabe(`${num(L.f, 1)} Hz y 4 polos: el campo da 120 × ${num(L.f, 1)} ÷ 4 = ${num(L.vueltasCampo)} vueltas por minuto`, `Campo a ${num(L.vueltasCampo)} rpm`), W / 2, 14, c.tinta, 10.5, 700);
    }

    // El arranque: dos medidores, corriente y velocidad.
    function arranque(t, L, c) {
        const x0 = 24;
        const x1 = W - 24;
        const medidor = (y, titulo, v, max, marca, txt, col) => {
            const sx = u => x0 + (x1 - x0) * clamp(u / max, 0, 1);
            texto(titulo, x0, y - 12, c.suave, 10, 650, 'left');
            caja(x0, y, x1 - x0, 12, 5, 'rgba(127,127,127,0.18)');
            caja(x0, y, sx(v) - x0, 12, 5, col);
            if (marca !== null) { trazo([[sx(marca), y - 4], [sx(marca), y + 16]], c.tinta, 2); }
            texto(txt, clamp(sx(v), x0 + 30, x1 - 30), y + 26, c.tinta, 10.5, 750);
        };
        const a = L.ahora;
        const y1 = Math.max(52, H * 0.3);
        medidor(y1, 'Corriente (la raya: la nominal)', a.I, 30, PRUEBAS.plena.I, `${num(a.I, 1)} A`, a.I > 3 * PRUEBAS.plena.I ? c.guinda : '#2f7fd1');
        medidor(y1 + Math.max(56, H * 0.3), 'Velocidad (la raya: 1,800 rpm)', a.n, 1900, 1800, `${num(a.n)} rpm`, '#2fb36a');
        const msg = !L.corriendo ? 'Toca «Arrancar»' : L.llega !== null && L.t >= L.llega ? `Arrancó en ${num(L.llega, 2)} s` : `Arrancando: ${num(L.t, 2)} s`;
        texto(cabe(`${msg} · pico de ${num(L.pico, 1)} A`, msg), W / 2, 14, c.tinta, 10.5, 700);
    }

    // La eficiencia: de cada 100 W que entran, a dónde va cada uno.
    function carga(t, L, c) {
        const x0 = 16;
        const x1 = W - 16;
        const y = Math.max(44, H * 0.32);
        const h = 26;
        const sale = (x1 - x0) * (L.util / Math.max(1, L.Pin));
        caja(x0, y, Math.max(0.5, sale - 2), h, 4, '#2fb36a');
        const partes = [['Estator', L.cobre1, '#c8743c'], ['Núcleo', L.nucleo, '#6c7178'], ['Rotor', L.cobre2, '#9aa0a8'], ['Fricción', L.friccion + L.otras, '#7fb7e6']];
        const yp = y + h + 34;
        let x = x0;
        partes.forEach(([n, v, col]) => { const w = ((x1 - x0) * v) / Math.max(1, L.perd); caja(x, yp, Math.max(0.5, w - 2), 18, 3, col); if (w > 58) texto(n, x + w / 2, yp + 9, '#ffffff', 9.5, 700); x += w; });
        texto(`Sale en el eje: ${num(L.efPct, 1)} de cada 100`, (x0 + x1) / 2, y - 14, c.tinta, 11, 750);
        texto(cabe(`Se vuelven calor ${num(L.perd)} W, así repartidos (agrandado):`, `${num(L.perd)} W de calor:`), (x0 + x1) / 2, yp - 12, c.suave, 10, 650);
        texto(L.cumple2025 ? 'Cumple la norma de 2025' : 'No llega a los 86.5 % de la norma de 2025', (x0 + x1) / 2, Math.min(H - 12, yp + 36), L.cumple2025 ? c.suave : c.guinda, 10.5, 700);
    }

    // La temperatura: el devanado contra lo que aguanta su aislamiento.
    function calor(t, L, c) {
        const x0 = 24;
        const x1 = W - 24;
        const y = Math.max(60, H * 0.42);
        const max = Math.max(150, L.final * 1.1);
        const sx = v => x0 + (x1 - x0) * clamp(v / max, 0, 1);
        caja(x0, y, x1 - x0, 16, 6, 'rgba(127,127,127,0.18)');
        caja(x0, y, sx(L.aumento) - x0, 16, 6, L.pasa ? c.guinda : '#ff8a3c');
        trazo([[sx(L.final), y - 6], [sx(L.final), y + 22]], c.tinta, 2);
        trazo([[sx(PRUEBAS.temperatura.permitido), y - 10], [sx(PRUEBAS.temperatura.permitido), y + 26]], c.guinda, 2.5);
        texto(`ahora: +${num(L.aumento)} °C`, clamp(sx(L.aumento), x0 + 40, x1 - 40), y + 34, c.tinta, 10.5, 750);
        texto(`clase F: +${PRUEBAS.temperatura.permitido}`, clamp(sx(PRUEBAS.temperatura.permitido), x0 + 40, x1 - 40), y - 18, c.guinda, 10, 700);
        texto(cabe(`Devanado a ${num(L.devanado)} °C · al final subirá ${num(L.final)} °C`, `Devanado a ${num(L.devanado)} °C`), W / 2, 14, c.tinta, 10.5, 700);
        if (W > 330) texto(`par: ${num((L.par / TNOM) * 100)} % del nominal`, W / 2, Math.min(H - 12, y + 56), c.suave, 10, 650);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'arranque') arranque(t, L, c);
        else if (modo === 'carga') carga(t, L, c);
        else if (modo === 'calor') calor(t, L, c);
        else gira(t, L, c);
    }
    return { dibujar };
}
