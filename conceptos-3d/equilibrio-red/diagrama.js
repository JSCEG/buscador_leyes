// El diagrama que explica cada modo, dibujado en un lienzo 2D: la balanza entre lo que se genera y lo que se consume, la reserva de cada
// hora del día y los pasos del corte de carga. No es a escala. Lee las mismas lecturas que el resto.
import { BANDA, F0, PASOS, RESERVA, estadoOperativo } from './modelo.js';

const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const hora = h => { const x = ((h % 24) + 24) % 24; return `${String(Math.floor(x)).padStart(2, '0')}:${String(Math.floor((x % 1) * 60)).padStart(2, '0')}`; };
const COLOR = { normal: '#2fb36a', alerta: '#e0a03c', emergencia: '#e0302a' };

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
    const texto = (t, x, y, color, tam = 11, peso = 650, alin = 'center') => { ctx.fillStyle = color; ctx.font = `${peso} ${tam}px Manrope, system-ui, sans-serif`; ctx.textAlign = alin; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y, W - 12); };
    const cabe = (largo, corto, tam = 10.5, peso = 700) => { ctx.font = `${peso} ${tam}px Manrope, system-ui, sans-serif`; return ctx.measureText(largo).width < W - 24 ? largo : corto; };
    const caja = (x, y, w, h, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, Math.max(h, 0.5), r); ctx.fill(); };
    const borde = (x, y, w, h, r, color, ancho = 1.5) => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke(); };
    const trazo = (puntos, color, ancho = 1.5, guiones = null) => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(guiones ?? []); ctx.beginPath(); puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.setLineDash([]); };

    /** Una regla de frecuencia de f0 a f1 con la banda normal y la marca de la frecuencia de ahora. */
    function regla(x0, x1, y, f, c, f0 = 58.5, f1 = 61.5, marcas = [59, 60, 61]) {
        const xf = v => x0 + ((clamp(v, f0, f1) - f0) / (f1 - f0)) * (x1 - x0);
        caja(x0, y - 5, x1 - x0, 10, 5, c.superficie);
        caja(xf(BANDA.min), y - 5, xf(BANDA.max) - xf(BANDA.min), 10, 3, '#2fb36a');
        for (const m of marcas) { trazo([[xf(m), y + 7], [xf(m), y + 11]], c.suave, 1); texto(num(m, m % 1 ? 1 : 0), xf(m), y + 19, c.suave, 9.5, 600); }
        const sale = f < BANDA.min || f > BANDA.max;
        trazo([[xf(f), y - 11], [xf(f), y + 11]], sale ? c.guinda : c.tinta, 3);
        texto(`${num(f, 2)} Hz`, xf(f), y - 20, sale ? c.guinda : c.tinta, 11.5, 750);
        return xf;
    }

    // Se dispara una central y menos máquinas girando: la balanza y quién cubre lo que falta.
    function balanza(t, L, c) {
        const cx = W / 2;
        const yP = Math.max(58, H * 0.36);
        const brazo = Math.min(W * 0.36, 170);
        const falta = L.disparada ? Math.max(0, L.inercia) : 0;
        const ang = clamp(falta / Math.max(1, L.perdida), 0, 1) * 0.22;
        const [dx, dy] = [Math.cos(ang) * brazo, Math.sin(ang) * brazo];
        // el pie y el brazo
        trazo([[cx, yP], [cx - 12, yP + 26], [cx + 12, yP + 26], [cx, yP]], c.tinta, 1.6);
        trazo([[cx - dx, yP - dy], [cx + dx, yP + dy]], c.tinta, 3);
        punto(cx, yP, 4, c.guinda);
        // los platos
        const plato = (x, y, nombre, sub) => { trazo([[x - 34, y + 16], [x + 34, y + 16]], c.tinta, 2.5); trazo([[x, y], [x, y + 16]], c.linea, 1); texto(nombre, x, y - 12, c.tinta, 11, 750); texto(sub, x, y + 30, c.suave, 10, 600); };
        plato(cx - dx, yP - dy, 'Se genera', L.disparada ? `faltan ${num(falta)} MW` : 'lo mismo');
        plato(cx + dx, yP + dy, 'Se consume', `${num(L.demanda)} MW`);
        const msg = !L.disparada ? 'En equilibrio: se genera lo mismo que se consume' : falta > 20 ? `Faltan ${num(falta)} MW: salen del giro de las máquinas y la frecuencia baja` : L.f < F0 - 0.005 ? 'Ya no falta: la frecuencia deja de caer y empieza a subir' : 'De nuevo en equilibrio, a 60 Hz';
        texto(cabe(msg, falta > 20 ? `Faltan ${num(falta)} MW: la frecuencia baja` : msg), cx, 14, falta > 20 ? c.guinda : c.tinta, 10.5, 700);
        regla(Math.max(20, W * 0.08), W - Math.max(20, W * 0.08), Math.min(H - 26, yP + 64), L.apagon ? 57 : L.f, c);
    }

    // La reserva del día: una tira de 24 horas con el estado de cada una.
    function reserva(t, L, c) {
        const x0 = Math.max(18, W * 0.06);
        const x1 = W - Math.max(18, W * 0.06);
        const y = Math.max(46, H * 0.32);
        const h = 26;
        const D = L.D;
        for (let i = 0; i < 24; i++) {
            const ro = D.en('ro', i + 0.5);
            const xa = x0 + (i / 24) * (x1 - x0);
            caja(xa + 0.5, y, (x1 - x0) / 24 - 1, h, 2, COLOR[estadoOperativo(ro)]);
        }
        const xh = x0 + (L.hora / 24) * (x1 - x0);
        trazo([[xh, y - 8], [xh, y + h + 8]], c.tinta, 2.5);
        for (const hh of [0, 6, 12, 18, 24]) texto(`${hh} h`, x0 + (hh / 24) * (x1 - x0), y + h + 18, c.suave, 9.5, 600);
        texto(`${hora(L.hora)}: reserva de ${num(L.ro * 100, 1)} %`, W / 2, y - 22, COLOR[L.estado], 12, 750);
        const leyenda = cabe('Verde: normal, más de 6 % · Ámbar: alerta, de 3 a 6 % · Rojo: emergencia, menos de 3 %', 'Verde normal · Ámbar alerta · Rojo emergencia', 10, 600);
        texto(leyenda, W / 2, Math.min(H - 30, y + h + 40), c.suave, 10, 600);
        const msg = L.corte > 0 ? `Hay que cortar ${num(L.corte)} MW, por turnos, para volver a 3 %` : L.estado === 'alerta' ? 'Alerta: si ahora se dispara una central, no alcanzaría' : `Sobran ${num(L.reserva)} MW por si algo falla`;
        texto(cabe(msg, L.corte > 0 ? `Cortar ${num(L.corte)} MW por turnos` : msg), W / 2, Math.min(H - 12, y + h + 60), L.corte > 0 ? c.guinda : c.tinta, 10.5, 700);
    }

    // Cuando falta mucho: los cuatro sectores y su paso.
    function corte(t, L, c) {
        const x0 = Math.max(18, W * 0.06);
        const x1 = W - Math.max(18, W * 0.06);
        const yS = Math.max(34, H * 0.18);
        const w = (x1 - x0) / 4;
        PASOS.forEach((p, i) => {
            const cortado = L.cortes.some(k => k.i === i);
            const x = x0 + i * w + 4;
            caja(x, yS, w - 8, 30, 5, cortado ? c.linea : c.superficie);
            borde(x, yS, w - 8, 30, 5, cortado ? c.guinda : c.tinta, 1.2);
            for (let k = 0; k < 3; k++) caja(x + 8 + k * ((w - 24) / 3), yS + 9, (w - 24) / 3 - 4, 12, 2, cortado ? '#4a4f57' : '#ffd27a');
            texto(`Paso ${i + 1} · ${num(p.f, 1)} Hz`, x + (w - 8) / 2, yS + 42, cortado ? c.guinda : c.tinta, w < 92 ? 9 : 10, 700);
        });
        // la regla va abajo, con lugar para el número de la frecuencia entre los pasos y ella
        const yR = Math.max(yS + 80, Math.min(H - 26, yS + 104));
        const xf = regla(x0, x1, yR, L.apagon ? 57 : L.f, c, 57, 61, [57, 58, 59, 60, 61]);
        for (const p of PASOS) trazo([[xf(p.f), yR - 7], [xf(p.f), yR + 7]], c.guinda, 1.5);
        const msg = L.apagon ? 'No alcanzó: la frecuencia bajó de 57 Hz y el sistema se cae' : L.cortes.length ? `Se cortaron ${num(L.cortado)} MW para salvar el resto` : L.disparada ? 'La frecuencia cae: cada paso espera su ajuste' : 'Toca «Que se pierda»';
        texto(cabe(msg, L.apagon ? 'El sistema se cae' : msg), W / 2, 14, L.apagon || L.cortes.length ? c.guinda : c.tinta, 10.5, 700);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'reserva') reserva(t, L, c);
        else if (modo === 'corte') corte(t, L, c);
        else balanza(t, L, c);
    }
    return { dibujar, RESERVA };
}
