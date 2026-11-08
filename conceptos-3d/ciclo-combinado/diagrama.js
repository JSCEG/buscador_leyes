// El diagrama que explica cada modo, dibujado en un lienzo 2D: a dónde va la energía del gas, qué tanto aire cabe en la turbina y cómo se
// suceden las etapas del arranque. No es a escala: muestra quién entra, quién sale y qué cifras tiene. Lee las mismas lecturas que el resto.
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
    const caja = (x, y, w, h, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
    /** Una banda de energía: su grueso es lo que lleva, y corren puntos por ella. */
    const banda = (x0, y0, x1, y1, grueso, color, t, activo = true) => {
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
        if (!activo) return;
        const n = Math.max(2, Math.round(grueso / 3));
        for (let i = 0; i < n; i++) {
            const u = fract(i / n + t * 0.35);
            const c0 = (1 - u) ** 3;
            const c1 = 3 * (1 - u) ** 2 * u;
            const c2 = 3 * (1 - u) * u * u;
            const c3 = u ** 3;
            punto(c0 * x0 + (c1 + c2) * xm + c3 * x1, (c0 + c1) * y0 + (c2 + c3) * y1 + (azar(i) - 0.5) * grueso * 0.6, 1.8, color);
        }
    };

    // A dónde va la energía del gas: la turbina se lleva una parte y el resto sigue al recuperador o se va por la chimenea.
    function energia(t, L, c) {
        const R = L.c.reparto;
        const G = L.c.g;
        const escala = Math.max(0.6, (H - 34) / 100);
        const y0 = 8;
        const xs = [52, W * 0.42, W * 0.72];
        const col = 62;
        // gas
        caja(6, y0, col - 10, 100 * escala, 7, c.fondoTinta);
        texto('Gas', 6 + (col - 10) / 2, y0 + (100 * escala) / 2 - 7, '#ffffff', 11, 700);
        texto('100', 6 + (col - 10) / 2, y0 + (100 * escala) / 2 + 8, '#ffffff', 13, 750);
        const g = R.gas * 100 * escala;
        const v = R.vapor * 100 * escala;
        const tor = R.torre * 100 * escala;
        const chi = R.chimenea * 100 * escala;
        const resto = 100 * escala - g;
        // del gas a la turbina y al escape
        const ty = y0 + g / 2;
        const ey = y0 + g + resto / 2;
        const tieneV = R.vapor > 0.005;
        banda(col - 4, ty, xs[1], ty, g, c.elec, t);
        banda(col - 4, ey, xs[1], ey, resto, c.caliente, t);
        // etiquetas al centro
        texto(`Turbina de gas: ${num(R.gas * 100)}`, xs[1] + 6, ty, c.tinta, 11.5, 700, 'left');
        if (!tieneV) {
            banda(xs[1], ey, xs[2], ey, resto, c.caliente, t);
            texto('Chimenea de paso', xs[2] + 6, ey - 8, c.tinta, 11.5, 700, 'left');
            texto(`${num(G.tEscape)} °C: se pierden ${num(resto / escala)}`, xs[2] + 6, ey + 8, c.suave, 11, 600, 'left');
        } else {
            const vy = ey - resto / 2 + v / 2;
            const toy = vy + v / 2 + tor / 2;
            const chy = toy + tor / 2 + chi / 2;
            banda(xs[1], vy, xs[2], vy, v, c.elec, t);
            banda(xs[1], toy, xs[2], toy, tor, c.torre, t);
            banda(xs[1], chy, xs[2], chy, chi, c.frio, t);
            texto(`Vapor: ${num(R.vapor * 100)}`, xs[2] + 6, vy, c.tinta, 11.5, 700, 'left');
            texto(`Torre: ${num(R.torre * 100)}`, xs[2] + 6, toy, c.suave, 11, 650, 'left');
            texto(`Chimenea: ${num(R.chimenea * 100)}`, xs[2] + 6, chy, c.suave, 11, 650, 'left');
            texto('Recuperador', (xs[1] + xs[2]) / 2, Math.max(ey - resto / 2 - 9, y0 + 6), c.suave, 10.5, 650);
        }
        texto(`Sale a la red: ${num(R.red * 100)} de cada 100`, W / 2, H - 10, c.tinta, 11.5, 650);
    }

    // Cuánto aire cabe: dos ductos iguales, uno a 15 °C y nivel del mar, otro como está ahora.
    function aire(t, L, c) {
        const G = L.c.g;
        const ref = 625;
        const n0 = 42;
        const paneles = [
            { x: 10, nombre: 'Catálogo', sub: '15 °C, nivel del mar', dens: 1, m: ref, T: 15 },
            { x: W / 2 + 4, nombre: 'Ahora', sub: `${num(L.tAire)} °C, ${num(L.altitud)} m`, dens: G.m / (ref * G.v), m: G.m, T: G.tAireC },
        ];
        const w = W / 2 - 14;
        const alto = H - 66;
        for (const p of paneles) {
            caja(p.x, 28, w, alto, 8, c.superficie);
            const cuantos = Math.round(n0 * Math.min(1.1, p.dens));
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(p.x, 28, w, alto, 8);
            ctx.clip();
            for (let i = 0; i < cuantos; i++) {
                const u = fract(azar(i + 1) + t * (0.18 + azar(i + 9) * 0.1));
                punto(p.x + u * w, 34 + azar(i + 40) * (alto - 12), 2.4, c.aire);
            }
            ctx.restore();
            texto(p.nombre, p.x + 2, 12, c.tinta, 11.5, 700, 'left');
            texto(p.sub, p.x + w, 12, c.suave, 10.5, 600, 'right');
            texto(`${num(p.m)} kg/s de aire`, p.x + w / 2, H - 26, c.tinta, 11.5, 700);
        }
        texto(L.enfriar ? `El enfriador deja entrar el aire a ${num(G.tAireC)} °C` : 'Cada punto es aire: en caliente y en alto caben menos', W / 2, H - 9, c.suave, 11, 600);
    }

    // Las etapas del arranque, sobre una línea.
    function etapas(t, L, c) {
        const A = L.arranque;
        const lista = L.etapas ?? [];
        const x0 = 12;
        const ancho = W - 24;
        const sx = m => x0 + (m / A.total) * ancho;
        const filas = Math.max(1, lista.length);
        const alto = Math.min(24, (H - 44) / filas);
        lista.forEach((e, i) => {
            const y = 8 + i * (alto + 4);
            caja(sx(e[1]), y, Math.max(3, sx(e[2]) - sx(e[1])), alto, 5, A.min >= e[1] ? (A.min < e[2] ? c.guinda : c.tintaSuave) : c.superficie);
            const hecho = A.min >= e[1];
            const enBarra = sx(e[2]) - sx(e[1]) > 180;
            texto(e[0], enBarra ? sx(e[1]) + 8 : Math.min(sx(e[2]) + 6, W - 4), y + alto / 2, enBarra && hecho ? c.fondoPanel : c.tinta, 11, 650, enBarra ? 'left' : (sx(e[2]) + 6 > W - 150 ? 'right' : 'left'));
        });
        const xA = sx(A.min);
        ctx.strokeStyle = c.tinta;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(xA, 4);
        ctx.lineTo(xA, H - 24);
        ctx.stroke();
        texto(`Minuto ${num(A.min)} de ${num(A.total)}`, W / 2, H - 10, c.tinta, 11.5, 650);
    }

    function dibujar(modo, t, L, c) {
        medir();
        if (W < 10 || H < 10) return;
        ctx.clearRect(0, 0, W, H);
        if (modo === 'clima') aire(t, L, c);
        else if (modo === 'arranque') etapas(t, L, c);
        else energia(t, L, c);
    }
    return { dibujar };
}
