// El diagrama que explica cada modo, dibujado en un lienzo 2D: el separador, los álabes, el intercambiador de la planta binaria y
// el yacimiento como un tanque. No es a escala: muestra quién entra, quién sale y qué cifras tiene. Lee las mismas lecturas que el resto.
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

    function separador(t, L, c) {
        const f = L.flash;
        const cx = W / 2;
        const [x0, x1, y0, y1] = [cx - 44, cx + 44, 8, H - 8];
        redondeado(x0, y0, x1 - x0, y1 - y0, 22);
        ctx.fillStyle = c.superficie;
        ctx.fill();
        ctx.save();
        redondeado(x0, y0, x1 - x0, y1 - y0, 22);
        ctx.clip();
        const nivel = y1 - (y1 - y0) * 0.24;
        ctx.fillStyle = c.separada;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x0, nivel, x1 - x0, y1 - nivel);
        ctx.globalAlpha = 1;
        const fuerza = Math.max(0.1, Math.min(1, f.x * 3.2));
        for (let i = 0; i < 40; i++) {
            const h = azar(i);
            const vapor = i / 40 < 0.28 + f.x;
            const u = fract(t * (vapor ? 0.35 : 0.28) + h);
            const a = u * 15 + h * 9;
            const r = vapor ? 26 * (1 - u * 0.75) : 36;
            const y = vapor ? (H * 0.55 + (y0 + 10 - H * 0.55) * u) : (H * 0.52 + (nivel - H * 0.52) * u);
            punto(cx + Math.cos(a) * r, y, vapor ? 2.4 : 2.2, vapor ? c.vapor : c.separada);
        }
        ctx.restore();
        ctx.strokeStyle = c.linea;
        ctx.lineWidth = 1;
        redondeado(x0, y0, x1 - x0, y1 - y0, 22);
        ctx.stroke();
        flecha(cx - 96, H * 0.52, x0 - 2, H * 0.52, c.caliente, 3);
        texto('Agua y vapor', cx - 96, H * 0.52 - 11, c.suave, 10.5, 600, 'center');
        texto(`${num(f.tempYac)} °C`, cx - 96, H * 0.52 + 12, c.tinta, 11, 700, 'center');
        flecha(x1 - 16, y0 + 26, cx + 88, y0 + 26, c.vapor, 2 + fuerza * 2);
        texto(`Vapor ${num(f.x * 100)} %`, cx + 92, y0 + 21, c.tinta, 11.5, 700, 'left');
        texto(`${num(f.mv * 3.6)} t/h`, cx + 92, y0 + 37, c.suave, 10.5, 600, 'left');
        flecha(x1 - 2, y1 - 20, cx + 88, y1 - 20, c.separada, 3);
        texto(`Agua ${num((1 - f.x) * 100)} %`, cx + 92, y1 - 26, c.tinta, 11.5, 700, 'left');
        texto(`${num(f.mb * 3.6)} t/h`, cx + 92, y1 - 10, c.suave, 10.5, 600, 'left');
        texto(`Separador`, cx - 96, y0 + 14, c.suave, 10.5, 600, 'center');
        texto(`${num(f.pSep, 1)} bar · ${num(f.Ts)} °C`, cx - 96, y0 + 29, c.tinta, 11, 700, 'center');
    }
    function alabes(t, L, c) {
        const f = L.seco;
        const filas = 6;
        const [x0, x1] = [Math.max(20, W / 2 - 150), Math.min(W - 20, W / 2 + 150)];
        const y = H / 2;
        for (let i = 0; i < filas; i++) {
            const x = x0 + 40 + (i / (filas - 1)) * (x1 - x0 - 80);
            const alto = 18 + i * 8;
            ctx.strokeStyle = c.tinta;
            ctx.globalAlpha = 0.72;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x, y - alto);
            ctx.lineTo(x, y + alto);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        for (let i = 0; i < 46; i++) {
            const h = azar(i);
            const u = fract(t * 0.32 + h);
            const x = x0 + u * (x1 - x0);
            const abre = 12 + u * 44;
            punto(x, y + (azar(i + 60) - 0.5) * 2 * abre, 2.1, c.vapor);
        }
        texto('Vapor del pozo', x0, 14, c.suave, 10.5, 600, 'left');
        texto(`${num(f.Ts)} °C · ${num(f.pSeco, 1)} bar`, x0, 29, c.tinta, 11, 700, 'left');
        texto('Sale con poca presión', x1, 14, c.suave, 10.5, 600, 'right');
        texto('50 °C · 0.12 bar', x1, 29, c.tinta, 11, 700, 'right');
        texto('Sin separador: el vapor entra directo a la turbina.', W / 2, H - 10, c.suave, 11, 600);
    }
    function intercambiador(t, L, c) {
        const b = L.binario;
        const [x0, x1] = [Math.max(14, W / 2 - 170), Math.min(W - 14, W / 2 + 170)];
        const y1 = H * 0.3;
        const y2 = H * 0.62;
        const alto = 26;
        ctx.fillStyle = c.superficie;
        redondeado(x0, y1 - alto / 2 - 5, x1 - x0, y2 - y1 + alto + 10, 10);
        ctx.fill();
        ctx.fillStyle = c.linea;
        ctx.fillRect(x0 + 4, (y1 + y2) / 2 - 1, x1 - x0 - 8, 2);
        for (let i = 0; i < 24; i++) {
            const u = fract(t * 0.2 + azar(i));
            punto(x1 - u * (x1 - x0), y1 + (azar(i + 40) - 0.5) * (alto - 8), 2.6, c.caliente);
        }
        for (let i = 0; i < 26; i++) {
            const u = fract(t * 0.24 + azar(i + 70));
            punto(x0 + u * (x1 - x0), y2 + (azar(i + 90) - 0.5) * (alto - 8), u > 0.42 ? 3 : 2, c.isopentano);
        }
        texto(`Agua caliente ${num(b.tempBin)} °C`, x1 - 2, y1 - alto / 2 - 13, c.tinta, 11, 700, 'right');
        texto(`Regresa a ${num(b.Tout ?? b.tempBin)} °C`, x0 + 2, y1 - alto / 2 - 13, c.suave, 11, 600, 'left');
        texto(`Isopentano líquido, 40 °C`, x0 + 2, y2 + alto / 2 + 14, c.suave, 11, 600, 'left');
        texto(`Hierve a ${num(b.Te || 0)} °C y va a la turbina`, x1 - 2, y2 + alto / 2 + 14, c.tinta, 11, 700, 'right');
    }
    function tanque(L, c) {
        const a = L.anios;
        const [x0, x1, y0, y1] = [W / 2 - 86, W / 2 + 86, 16, H - 16];
        redondeado(x0, y0, x1 - x0, y1 - y0, 10);
        ctx.fillStyle = c.superficie;
        ctx.fill();
        ctx.save();
        redondeado(x0, y0, x1 - x0, y1 - y0, 10);
        ctx.clip();
        const nivel = y0 + 8 + (y1 - y0 - 12) * Math.min(1, a.dp / 28);
        ctx.fillStyle = c.caliente;
        ctx.globalAlpha = 0.36;
        ctx.fillRect(x0, nivel, x1 - x0, y1 - nivel);
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.strokeStyle = c.linea;
        ctx.lineWidth = 1;
        redondeado(x0, y0, x1 - x0, y1 - y0, 10);
        ctx.stroke();
        texto(`Año ${num(a.anio)}`, W / 2, H / 2 - 16, c.tinta, 13, 700);
        texto(`${num(a.T)} °C`, W / 2, H / 2 + 2, c.tinta, 11, 650);
        texto(`${num(a.dp, 1)} bar menos`, W / 2, H / 2 + 17, c.tinta, 11, 650);
        const lado = Math.max(4, W / 2 - 86 - 8);
        const flechaL = Math.min(lado - 2, 34);
        flecha(x0 - 3, y0 + 26, x0 - 3 - flechaL, y0 + 26, c.caliente, 3);
        texto('Sube', x0 - 8, y0 + 12, c.suave, 10.5, 600, 'right');
        texto(`${num(a.m * 3.6)} t/h`, x0 - 8, y0 + 42, c.tinta, 11, 700, 'right');
        flecha(x1 + 3 + flechaL, y0 + 26, x1 + 3, y0 + 26, c.regresa, Math.max(1.5, 1.5 + a.R * 3));
        texto('Regresa', x1 + 8, y0 + 12, c.suave, 10.5, 600, 'left');
        texto(`${num(a.regresa * 3.6)} t/h`, x1 + 8, y0 + 42, c.tinta, 11, 700, 'left');
        flecha(W / 2 - 40, H, W / 2 - 40, y1 + 1, c.suave, 2);
        texto('Recarga natural', W / 2 - 32, H - 7, c.suave, 10.5, 600, 'left');
    }
    return {
        dibujar(modo, t, L, c) {
            medir();
            if (W < 40 || H < 40) return;
            ctx.clearRect(0, 0, W, H);
            if (modo === 'flash') separador(t, L, c);
            else if (modo === 'seco') alabes(t, L, c);
            else if (modo === 'binario') intercambiador(t, L, c);
            else tanque(L, c);
        },
    };
}
