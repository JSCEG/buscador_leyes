// El diagrama que explica cada modo, dibujado en un lienzo 2D: cuánto lleva el transformador, cómo va el voltaje hasta la última casa,
// qué hace el fusible cuando cae una rama y a dónde se va la energía que entra a la calle. No es a escala. Lee las mismas lecturas que el
// resto.
import { CALLE, CRITERIO, FLUIDOS, PERDIDAS, TRAFO } from './modelo.js';

const fract = x => x - Math.floor(x);
const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp01 = x => Math.min(1, Math.max(0, x));
const hora = h => { const x = ((h % 24) + 24) % 24; return `${String(Math.floor(x)).padStart(2, '0')}:${String(Math.floor((x % 1) * 60)).padStart(2, '0')}`; };

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
    const caja = (x, y, w, h, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, Math.max(h, 0.5), r); ctx.fill(); };
    const borde = (x, y, w, h, r, color, ancho = 1.5) => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke(); };
    const trazo = (puntos, color, ancho = 1.5, guiones = null) => { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(guiones ?? []); ctx.beginPath(); puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.setLineDash([]); };
    const puntos = (camino, n, t, vel, color, r = 2.1) => {
        let largo = 0;
        const tramos = [];
        for (let i = 1; i < camino.length; i++) { const l = Math.hypot(camino[i][0] - camino[i - 1][0], camino[i][1] - camino[i - 1][1]); tramos.push(l); largo += l; }
        for (let k = 0; k < n; k++) {
            let d = fract(k / n + t * vel) * largo;
            for (let i = 0; i < tramos.length; i++) { if (d <= tramos[i]) { const u = d / tramos[i]; punto(camino[i][0] + (camino[i + 1][0] - camino[i][0]) * u, camino[i][1] + (camino[i + 1][1] - camino[i][1]) * u, r, color); break; } d -= tramos[i]; }
        }
    };
    const col = k => FLUIDOS[k].color;
    const casita = (x, y, w, luz, c) => { caja(x - w / 2, y - w * 0.7, w, w * 0.7, 2, c.superficie); borde(x - w / 2, y - w * 0.7, w, w * 0.7, 2, c.tinta, 1); caja(x - w * 0.18, y - w * 0.5, w * 0.36, w * 0.24, 1, luz ? '#ffd27a' : c.linea); };
    /** El transformador: un tanque con su barra de carga. */
    const tanque = (x, y, w, h, uso, c) => {
        borde(x, y, w, h, 8, c.tinta, 1.4);
        const k = clamp01(uso);
        caja(x + 3, y + 3 + (h - 6) * (1 - k), w - 6, (h - 6) * k, 6, uso > 1 ? c.guinda : uso > 0.8 ? '#e0a03c' : '#5b9bd5');
        texto(`${num(uso * 100)} %`, x + w / 2, y + h / 2, c.tinta, 12, 750);
    };

    // Un día en la calle: el transformador, las casas y la hora.
    function dia(t, L, c) {
        const x0 = Math.max(14, W * 0.05);
        const wT = Math.min(70, W * 0.16);
        const hT = Math.min(110, H - 70);
        const yT = Math.max(30, (H - hT) / 2 - 6);
        tanque(x0, yT, wT, hT, L.uso, c);
        texto(`${num(L.S, 1)} de ${TRAFO.kVA} kVA`, x0 + wT / 2, yT + hT + 14, c.suave, 10, 650);
        // la red y las casas
        const xa = x0 + wT + 12;
        const xb = W - 14;
        const yL = yT + hT * 0.3;
        trazo([[xa, yL], [xb, yL]], c.tinta, 2);
        puntos([[xa, yL], [xb, yL]], 12, t, 0.15 * (0.3 + L.uso), col('baja'), 2.2);
        const n = Math.max(4, Math.min(12, Math.floor((xb - xa) / 30)));
        for (let i = 0; i < n; i++) { const x = xa + ((i + 0.5) / n) * (xb - xa); trazo([[x, yL], [x, yL + 22]], c.linea, 1); casita(x, yL + 44, 18, true, c); }
        texto(`${num(L.casas)} casas · ${hora(L.hora)} · ${num(L.carga, 1)} kW`, (xa + xb) / 2, yL - 16, c.tinta, 11.5, 700);
        texto(`Una casa ahora: ${num(L.casa * 1000)} W; en el día, ${num(L.diaKWh, 1)} kWh`, (xa + xb) / 2, Math.min(H - 12, yL + 76), c.suave, 10.5, 600);
    }

    // El voltaje a lo largo de la calle, del transformador a la última casa.
    function voltaje(t, L, c) {
        const xa = Math.max(44, W * 0.1);
        const xb = W - 16;
        const ya = 30;
        const yb = H - 32;
        const [vMin, vMax] = [0.9, 1.1];
        const yv = v => yb - ((Math.min(vMax, Math.max(vMin, v)) - vMin) / (vMax - vMin)) * (yb - ya);
        const xm = m => xa + (m / CALLE.largo) * (xb - xa);
        caja(xa, yv(1 + CRITERIO.suministro), xb - xa, yv(1 - CRITERIO.suministro) - yv(1 + CRITERIO.suministro), 3, c.superficie);
        // las marcas de abajo hacia arriba; en un diagrama bajito se salta la que no cabe
        let ult = Infinity;
        for (const v of [0.95, 0.97, 1, 1.05]) {
            trazo([[xa, yv(v)], [xb, yv(v)]], c.linea, 1, v === 1 ? null : [3, 3]);
            if (ult - yv(v) >= 13) { texto(`${num(v * 100)} %`, xa - 6, yv(v), c.suave, 9.5, 600, 'right'); ult = yv(v); }
        }
        const p = L.perfil.map(q => [xm(q.m), yv(q.v)]);
        trazo(p, c.guinda, 2.6);
        const vuelve = L.P < 0;
        puntos(vuelve ? p.slice().reverse() : p, 10, t, 0.16, col(vuelve ? 'solar' : 'baja'), 2.3);
        texto('Transformador', xa, H - 12, c.tinta, 10, 700, 'left');
        texto(`Última casa, a ${CALLE.largo} m`, xb, H - 12, c.tinta, 10, 700, 'right');
        texto(`${num(L.fin * 100, 1)} %`, xb - 4, yv(L.fin) - 10, c.guinda, 11, 750, 'right');
        const largo = vuelve ? `${hora(L.hora)}: los paneles dan más de lo que gastan las casas; la energía regresa y el voltaje sube` : `${hora(L.hora)}: la energía va a las casas y el voltaje baja a lo largo`;
        const corto = vuelve ? `${hora(L.hora)}: la energía regresa y el voltaje sube` : `${hora(L.hora)}: el voltaje baja a lo largo`;
        ctx.font = '700 10.5px Manrope, system-ui, sans-serif';
        texto(ctx.measureText(largo).width < W - 24 ? largo : corto, W / 2, 13, c.tinta, 10.5, 700);
    }

    // Una rama sobre la red: la corriente de la falla y el fusible.
    function falla(t, L, c) {
        // el fusible y su letrero van arriba del tanque: la línea baja lo necesario para que quepan
        const yL = Math.max(80, Math.min(H * 0.45, H - 70));
        const x0 = Math.max(16, W * 0.05);
        const wT = 44;
        tanque(x0, yL - 34, wT, 68, 0, c);
        texto('7,620 V', x0 + wT / 2, yL - 46, c.suave, 9.5, 650);
        // el fusible, arriba del transformador
        const xf = x0 + wT / 2;
        const cayo = L.estado === 'abierto';
        trazo(cayo ? [[xf - 8, yL - 70], [xf + 6, yL - 56]] : [[xf, yL - 74], [xf, yL - 52]], cayo ? c.guinda : c.tinta, 3);
        texto(cayo ? 'Fusible fundido' : `Fusible de ${num(L.fusible)} A`, xf + 16, yL - 64, cayo ? c.guinda : c.tinta, 10, 700, 'left');
        // la red hacia la falla
        const xa = x0 + wT + 6;
        const xb = W - 18;
        const xr = xa + (L.d / CALLE.largo) * (xb - xa - 20);
        trazo([[xa, yL], [xb, yL]], c.tinta, 2);
        const hay = L.estado === 'falla' || L.estado === 'sigue';
        if (hay) { puntos([[xa, yL], [xr, yL]], 10, t, 0.6, col('falla'), 2.6); trazo([[xr - 10, yL - 20], [xr + 4, yL - 2]], '#7a6248', 3); punto(xr, yL, 5 + 2 * Math.sin(t * 40), '#ffb000'); }
        else if (!cayo) puntos([[xa, yL], [xb, yL]], 10, t, 0.15, col('baja'), 2.2);
        texto(`A ${num(L.d)} m: ${num(L.S.Ib)} A en 240 V, ${num(L.S.Ip, 1)} A en el fusible`, (xa + xb) / 2, yL + 22, c.tinta, 10.5, 700);
        const tF = L.S.t;
        texto(Number.isFinite(tF) && tF < 10 ? `El fusible se funde en ${tF < 0.1 ? 'menos de una décima de segundo' : `${num(tF, 1)} s`}` : 'El fusible no alcanza a fundirse: hace falta otra protección', (xa + xb) / 2, yL + 40, Number.isFinite(tF) && tF < 10 ? c.suave : c.guinda, 10.5, 650);
        if (cayo) texto('La calle se queda sin luz hasta que la cuadrilla lo cambie', (xa + xb) / 2, Math.min(H - 12, yL + 58), c.guinda, 10.5, 700);
    }

    // Lo que se pierde: de cada 100 kWh que entran a la calle.
    function perdidas(t, L, c) {
        const P = L.Pd;
        const x0 = Math.max(16, W * 0.05);
        const x1 = W - 16;
        const y = Math.max(40, H * 0.36);
        const h = 26;
        const total = P.entra;
        const partes = [
            { v: P.cobrada, t: 'Se cobra', color: col('baja') },
            { v: P.robada, t: 'Diablitos', color: c.guinda },
            { v: P.tecnicas, t: 'Se calienta', color: '#d9663a' },
        ];
        let x = x0;
        partes.forEach(p => { const w = ((x1 - x0) * p.v) / total; caja(x, y, Math.max(0.5, w - 2), h, 4, p.color); x += w; });
        texto('De cada 100 kWh que entran a la calle', (x0 + x1) / 2, y - 16, c.tinta, 11.5, 700);
        const pct = v => num((v / total) * 100, 1);
        texto(`Se cobran ${pct(P.cobrada)} · diablitos ${pct(P.robada)} · calor ${pct(P.tecnicas)}`, (x0 + x1) / 2, y + h + 16, c.tinta, 10.5, 650);
        texto(`El calor: núcleo ${pct(P.nucleo)}, devanados ${pct(P.cobre)}, cables ${pct(P.cables)}`, (x0 + x1) / 2, y + h + 34, c.suave, 10, 600);
        texto(`En todo el país, en 2024: técnicas ${num(PERDIDAS.tecnicas, 2)}, no técnicas ${num(PERDIDAS.noTecnicas, 2)}`, (x0 + x1) / 2, Math.min(H - 12, y + h + 54), c.suave, 10, 600);
        puntos([[x0, y + h / 2], [x1, y + h / 2]], 14, t, 0.12, '#ffffff', 1.8);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'voltaje') voltaje(t, L, c);
        else if (modo === 'falla') falla(t, L, c);
        else if (modo === 'perdidas') perdidas(t, L, c);
        else dia(t, L, c);
    }
    return { dibujar };
}
