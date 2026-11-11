// El diagrama que explica cada modo, dibujado en un lienzo 2D: a dónde va la luz, cómo sale la corriente de la celda, cómo le pega el sol a la
// fila, qué hace el inversor y cómo se llena el SAEE. No es a escala: muestra quién entra, quién sale y qué cifras tiene. Lee las mismas lecturas
// que el resto.
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
    const caja = (x, y, w, h, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
    const trazo = (puntos, color, ancho = 1.5) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = ancho;
        ctx.beginPath();
        puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
    };
    /** Una banda de energía: su grueso es lo que lleva, y corren puntos por ella. */
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
        const n = Math.max(2, Math.round(grueso / 4));
        for (let i = 0; i < n; i++) {
            const u = fract(i / n + t * 0.35);
            const c0 = (1 - u) ** 3;
            const c1 = 3 * (1 - u) ** 2 * u;
            const c2 = 3 * (1 - u) * u * u;
            const c3 = u ** 3;
            punto(c0 * x0 + (c1 + c2) * xm + c3 * x1, (c0 + c1) * y0 + (c2 + c3) * y1 + (azar(i) - 0.5) * grueso * 0.6, 1.8, color);
        }
    };

    // A dónde va la luz: la mayor parte se vuelve calor; lo que sale, llega casi todo a la red.
    function reparto(t, L, c) {
        const R = L.c.reparto;
        const y0 = 8;
        const alto = H - 34;
        if (R.red <= 0 && R.calor <= 0) {
            texto('Sin sol, los módulos no dan nada', W / 2, H / 2, c.suave, 12.5, 650);
            return;
        }
        const col = 60;
        caja(6, y0, col - 10, alto, 7, c.fondoTinta);
        texto('Luz', 6 + (col - 10) / 2, y0 + alto / 2 - 7, c.claro, 11, 700);
        texto('100', 6 + (col - 10) / 2, y0 + alto / 2 + 8, c.claro, 13, 750);
        const nada = R.reflejo + R.polvo;
        const elec = R.red + R.cables + R.inversor + R.transporte;
        const hNada = Math.max(2, nada * alto);
        const hCalor = R.calor * alto;
        const hElec = Math.max(6, elec * alto);
        const esc = alto / (hNada + hCalor + hElec);
        const xs = [col - 4, W * 0.56];
        const yA = y0 + (hElec * esc) / 2;
        const yB = y0 + hElec * esc + (hCalor * esc) / 2;
        const yC = y0 + hElec * esc + hCalor * esc + (hNada * esc) / 2;
        banda(xs[0], yA, xs[1], yA, hElec * esc, c.elec, t);
        banda(xs[0], yB, xs[1], yB, hCalor * esc, c.caliente, t);
        banda(xs[0], yC, xs[1], yC, hNada * esc, c.frio, t);
        texto(`Electricidad: ${num(elec * 100)}`, xs[1] + 6, yA, c.tinta, 11.5, 700, 'left');
        texto(`Calor en la celda: ${num(R.calor * 100)}`, xs[1] + 6, yB, c.suave, 11, 650, 'left');
        texto(`Polvo y reflejo: ${num(nada * 100)}`, xs[1] + 6, Math.min(yC, H - 34), c.suave, 11, 650, 'left');
        texto(`Llegan a la red ${num(R.red * 100)} de cada 100 de luz`, W / 2, H - 10, c.tinta, 11.5, 650);
    }

    // La celda por dentro: la luz suelta electrones, la unión los empuja hacia arriba y regresan por el cable.
    function celda(t, L, c) {
        const luz = clamp01(L.c.luzCelda / 1000);
        const x0 = 48;
        const ancho = W - 96;
        const yN = 40;
        const hN = 28;
        const hP = H - yN - hN - 30;
        const yU = yN + hN;
        caja(x0, yN, ancho, hN, 3, c.capaN);
        caja(x0, yU, ancho, hP, 3, c.capaP);
        // la unión
        ctx.fillStyle = c.guinda;
        ctx.fillRect(x0, yU - 1.5, ancho, 3);
        // hilos de plata
        for (let i = 0; i < 6; i++) caja(x0 + 10 + (i * (ancho - 28)) / 5, yN - 5, 8, 6, 1, c.suave);
        // luz
        for (let i = 0; i < 9; i++) {
            const u = fract(azar(i + 3) + t * 0.6);
            const x = x0 + 20 + azar(i + 21) * (ancho - 40);
            if (luz > 0.02) punto(x, 2 + u * (yU + 16), 2, c.luz);
        }
        // electrones que suben
        const n = Math.round(14 * luz);
        for (let i = 0; i < n; i++) {
            const u = fract(azar(i + 40) + t * (0.28 + azar(i) * 0.2));
            const x = x0 + 14 + azar(i + 60) * (ancho - 28);
            punto(x, yU + hP * 0.75 - u * (hP * 0.75 + hN), 2.4, c.cd);
        }
        // el camino por fuera
        const camino = [[x0 + ancho, yN + 6], [W - 16, yN + 6], [W - 16, yU + hP - 6], [x0 + ancho, yU + hP - 6]];
        trazo(camino, c.suave, 1.4);
        const total = (W - 16 - x0 - ancho) * 2 + (hP + hN - 12);
        for (let i = 0; i < 4 && luz > 0.02; i++) {
            let d = fract(i / 4 + t * 0.4) * total;
            const tramo = W - 16 - x0 - ancho;
            let x;
            let y;
            if (d < tramo) { x = x0 + ancho + d; y = yN + 6; } else if ((d -= tramo) < hP + hN - 12) { x = W - 16; y = yN + 6 + d; } else { d -= hP + hN - 12; x = W - 16 - d; y = yU + hP - 6; }
            punto(x, y, 2.4, c.cd);
        }
        texto('Capa con electrones de sobra', x0 + ancho / 2, yN + hN / 2, c.claro, 10.5, 700);
        texto('Capa con huecos', x0 + ancho / 2, yU + hP / 2, c.claro, 10.5, 700);
        texto(`${num(L.c.tCelda)} °C: ${num(L.c.puntos.vmp / 72, 2)} V por celda`, W / 2, H - 10, c.tinta, 11.5, 650);
        texto('Luz', 22, yN - 18, c.suave, 11, 650);
    }

    // La fila vista de frente, de este a oeste: con cuánto ángulo le pega el sol.
    function fila(t, L, c) {
        const C = L.c;
        const s = C.s;
        const yS = H - 42;
        trazo([[8, yS], [W - 8, yS]], c.linea, 1);
        const cx = W / 2;
        const sep = Math.min(W * 0.26, 118);
        const giro = (L.seguidor ? C.giro : 0) * (Math.PI / 180);
        const wF = Math.min(sep * 0.42, 46);
        const incl = L.seguidor ? 0 : L.inclinacion;
        [-1, 0, 1].forEach(k => {
            const x = cx + k * sep;
            trazo([[x, yS], [x, yS - 26]], c.suave, 2);
            // de lado, una mesa fija se ve casi plana: se acorta con su inclinación al sur
            const w = wF * (L.seguidor ? 1 : Math.cos((incl * Math.PI) / 180));
            trazo([[x - Math.cos(giro) * w, yS - 26 - Math.sin(giro) * w], [x + Math.cos(giro) * w, yS - 26 + Math.sin(giro) * w]], c.panel, 4);
        });
        if (s.y > 0.01) {
            const dx = s.x;
            const dy = s.y;
            const nd = Math.hypot(dx, dy) || 1;
            const [ux, uy] = [dx / nd, dy / nd];
            for (let i = 0; i < 7; i++) {
                const off = (i - 3) * (sep * 0.33);
                const xt = cx + off;
                const u = fract(azar(i + 7) + t * 0.5);
                const L0 = H * 0.8;
                ctx.globalAlpha = 0.5;
                trazo([[xt + ux * L0, yS - 26 - uy * L0], [xt, yS - 26]], c.luz, 1);
                ctx.globalAlpha = 1;
                punto(xt + ux * L0 * (1 - u), yS - 26 - uy * L0 * (1 - u), 2.2, c.luz);
            }
        }
        const coseno = C.luz.coseno;
        texto(L.seguidor ? `La fila gira ${num(Math.abs(C.giro))}° al ${C.giro >= 0 ? 'este' : 'oeste'}` : `Mesa fija, ${num(L.inclinacion)}° al sur`, W / 2, H - 25, c.tinta, 11.5, 700);
        texto(s.y > 0.01 ? `Aprovecha ${num(coseno * 100)} de cada 100 de la luz directa` : 'De noche, las filas se quedan planas', W / 2, H - 9, c.suave, 11, 600);
    }

    // De directa a alterna: lo que llega, lo que cabe y lo que se recorta.
    function inversor(t, L, c) {
        const C = L.c;
        const nom = 800;
        const x0 = 14;
        const xm = W * 0.42;
        const x1 = W - 14;
        const yB = H - 46;
        const hMax = H - 60;
        const esc = hMax / (nom * 1.5);
        const dcH = C.dc * esc;
        // directa: un nivel parejo
        caja(x0, yB - dcH, xm - x0 - 22, dcH, 3, c.panelSuave);
        trazo([[x0, yB - dcH], [xm - 22, yB - dcH]], c.cd, 2);
        const n = Math.round(6 * clamp01(C.dc / nom));
        for (let i = 0; i < n; i++) punto(x0 + fract(i / n + t * 0.4) * (xm - x0 - 22), yB - dcH - 1, 2.2, c.cd);
        texto(`Llegan ${num(C.dc)} MW`, (x0 + xm - 22) / 2, 10, c.tinta, 11.5, 700);
        // el inversor
        caja(xm - 16, yB - hMax, 32, hMax, 6, c.fondoTinta);
        texto('≈', xm, yB - hMax / 2, c.claro, 17, 700);
        // alterna: una onda que no pasa del tope
        const tope = nom * esc;
        const amp = Math.min(C.ca, nom) * esc;
        const pts = [];
        const N = 90;
        for (let i = 0; i <= N; i++) {
            const k = i / N;
            pts.push([xm + 22 + k * (x1 - xm - 22), yB - amp / 2 - (amp / 2) * Math.sin(k * Math.PI * 6 - t * 5)]);
        }
        trazo(pts, c.elec, 2);
        ctx.globalAlpha = 0.55;
        trazo([[xm + 22, yB - tope], [x1, yB - tope]], c.suave, 1);
        ctx.globalAlpha = 1;
        texto(`Salen ${num(C.ca)} MW`, (xm + 22 + x1) / 2, 10, c.tinta, 11.5, 700);
        trazo([[x0, yB], [x1, yB]], c.linea, 1);
        texto(C.recorte > 1 ? `Sobran ${num(C.recorte)} MW: se recortan` : `El inversor cabe ${num(nom)} MW`, W / 2, H - 27, C.recorte > 1 ? c.guinda : c.suave, 11.5, 700);
        texto(`Rinde ${num(C.rendimientoInv * 100, 1)} de cada 100`, W / 2, H - 10, c.suave, 11, 600);
    }

    // El SAEE: su carga y hacia dónde va la energía ahora.
    function sae(t, L, c) {
        const soc = L.soc ?? 0;
        const xB = W / 2 - 54;
        const wB = 108;
        const yB = 16;
        const hB = H - 62;
        caja(xB - 2, yB - 2, wB + 4, hB + 4, 7, c.linea);
        caja(xB, yB, wB, hB, 6, c.superficie);
        const hF = hB * clamp01(soc);
        if (hF > 1) caja(xB, yB + hB - hF, wB, hF, 5, c.sae);
        texto(`${num(soc * 100)} %`, W / 2, yB + hB / 2, c.tinta, 16, 750);
        const carga = L.carga > 1;
        const descarga = L.descarga > 1;
        const yF = yB + hB / 2;
        const anchoFlecha = Math.max(4, Math.min(16, (Math.max(L.carga, L.descarga) / Math.max(1, L.sae)) * 16));
        if (carga) banda(12, yF, xB - 3, yF, anchoFlecha, c.sae, t);
        if (descarga) banda(xB + wB + 3, yF, W - 12, yF, anchoFlecha, c.sae, t);
        texto(carga ? `Entran ${num(L.carga)} MW` : 'Del sol', 12, yF - 20, carga ? c.tinta : c.suave, 11, 650, 'left');
        texto(descarga ? `Salen ${num(L.descarga)} MW` : 'A la red', W - 12, yF - 20, descarga ? c.tinta : c.suave, 11, 650, 'right');
        const estado = L.sae <= 0 ? 'Sin SAEE' : carga ? 'Guarda lo del mediodía' : descarga ? 'Entrega al caer el sol' : soc > 0.97 ? 'Lleno, esperando la tarde' : 'En espera';
        texto(estado, W / 2, H - 27, c.tinta, 11.5, 700);
        texto(L.sae > 0 ? `${num(L.sae)} MW, ${num(L.cap)} MWh` : 'Mueve el tamaño del SAEE', W / 2, H - 10, c.suave, 11, 600);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'calor') celda(t, L, c);
        else if (modo === 'seguidor') fila(t, L, c);
        else if (modo === 'inversor') inversor(t, L, c);
        else if (modo === 'sae') sae(t, L, c);
        else reparto(t, L, c);
    }
    return { dibujar };
}
