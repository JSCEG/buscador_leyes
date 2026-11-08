// El diagrama que explica cada proceso, dibujado en un lienzo 2D: la celda del electrolizador, la celda de combustible y el
// reactor de pirólisis. No es a escala: muestra quién entra, quién sale y por dónde viajan los electrones.
const fract = x => x - Math.floor(x);
const azar = a => { const x = Math.sin(a * 127.1) * 43758.5453; return x - Math.floor(x); };

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

    /** Celda: electrólisis (corriente de la fuente) o pila (corriente hacia el foco). */
    function celda(modo, t, f, c) {
        const esPila = modo === 'pila';
        const cx = W / 2;
        const yTop = 30;
        const yBot = H - 15;
        const alto = yBot - yTop;
        const anchoE = 12;
        const xIzq = cx - 50;
        const xDer = cx + 50;
        // cuerpo de la celda
        ctx.fillStyle = c.superficie;
        redondeado(xIzq - 28, yTop, xDer - xIzq + 56, alto, 8);
        ctx.fill();
        ctx.strokeStyle = c.linea;
        ctx.lineWidth = 1;
        ctx.stroke();
        // electrodos y membrana
        ctx.fillStyle = c.tinta;
        ctx.globalAlpha = 0.72;
        ctx.fillRect(xIzq - anchoE / 2, yTop, anchoE, alto);
        ctx.fillRect(xDer - anchoE / 2, yTop, anchoE, alto);
        ctx.globalAlpha = 1;
        ctx.fillStyle = c.guinda;
        ctx.fillRect(cx - 3, yTop, 6, alto);
        texto('Membrana', cx, H - 6, c.suave, 9.5, 600);
        // cable de arriba, con la fuente o el foco
        ctx.strokeStyle = c.elec;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xIzq, yTop);
        ctx.lineTo(xIzq, 12);
        ctx.lineTo(xDer, 12);
        ctx.lineTo(xDer, yTop);
        ctx.stroke();
        ctx.fillStyle = c.fondoPanel;
        redondeado(cx - 44, 2, 88, 20, 10);
        ctx.fill();
        ctx.strokeStyle = c.elec;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        texto(esPila ? 'Da electricidad' : 'Entra electricidad', cx, 12.5, c.tinta, 9.5, 700);
        // electrones por el cable: en la electrólisis van del ánodo (derecha) al cátodo (izquierda) empujados por la fuente;
        // en la pila, del ánodo (izquierda) al cátodo (derecha), y ahí se aprovechan
        const pasos = 6;
        const longitud = (xDer - xIzq) + 2 * (yTop - 12);
        for (let k = 0; k < pasos; k++) {
            let u = fract(k / pasos + t * 0.35 * (0.3 + f));
            if (!esPila) u = 1 - u;
            const s = u * longitud;
            let x;
            let y;
            const tramo = yTop - 12;
            if (s < tramo) { x = xIzq; y = yTop - s; } else if (s < tramo + (xDer - xIzq)) { x = xIzq + (s - tramo); y = 12; } else { x = xDer; y = 12 + (s - tramo - (xDer - xIzq)); }
            if (Math.abs(x - cx) < 46 && y === 12) continue;
            punto(x, y, 2.2 * Math.min(1, f * 3), c.elec);
        }
        // protones por la membrana: siempre hacia el lado del oxígeno en la pila, hacia el hidrógeno en la electrólisis
        for (let k = 0; k < 5; k++) {
            const u = fract(k / 5 + t * 0.5 * (0.3 + f) + azar(k));
            const y = yTop + 10 + azar(k + 3) * (alto - 18);
            const x = esPila ? xIzq + 10 + u * (xDer - xIzq - 20) : xDer - 10 - u * (xDer - xIzq - 20);
            punto(x, y, 1.8 * Math.min(1, f * 3), c.suave);
        }
        // lado izquierdo: hidrógeno. Lado derecho: oxígeno
        const burbujas = (x, n, r, color, vel, sube, sem) => {
            for (let k = 0; k < n; k++) {
                const u = fract(k / n + t * vel * (0.3 + f) + azar(k + sem));
                const y = sube ? yBot - 4 - u * (alto - 8) : yTop + 4 + u * (alto - 8);
                punto(x + Math.sin(u * 9 + k + sem) * 3, y, r * Math.min(1, f * 3), color);
            }
        };
        burbujas(xIzq - 17, esPila ? 3 : 6, 2.8, c.h2, 0.5, !esPila, 11);
        burbujas(xDer + 17, 3, 3.4, c.o2, 0.5, !esPila, 21);
        // el agua
        burbujas(xDer + 10, 4, 2.2, c.agua, esPila ? 0.6 : 0.45, !esPila, esPila ? 31 : 41);
        const y = yTop + alto - 12;
        texto(esPila ? 'Entra H₂' : 'Sale H₂', xIzq - 33, yTop + 12, c.tinta, 10, 700, 'right');
        texto(esPila ? 'Entra O₂' : 'Sale O₂', xDer + 33, yTop + 12, c.tinta, 10, 700, 'left');
        texto(esPila ? 'Sale agua' : 'Entra agua', xDer + 33, y, c.tinta, 10, 700, 'left');
        texto(esPila ? 'Ánodo' : 'Cátodo', xIzq - 33, y, c.suave, 9.5, 600, 'right');
    }

    /** Reactor de pirólisis: el metano burbujea en metal fundido y se parte. */
    function reactor(t, f, c, temp) {
        const cx = W / 2;
        const w = 110;
        const yTop = 8;
        const yBot = H - 8;
        const alto = yBot - yTop;
        const nivel = yTop + alto * 0.3;
        ctx.fillStyle = c.superficie;
        redondeado(cx - w / 2, yTop, w, alto, 10);
        ctx.fill();
        const g = ctx.createLinearGradient(0, nivel, 0, yBot);
        g.addColorStop(0, '#c23a06');
        g.addColorStop(0.5, '#ff7a12');
        g.addColorStop(1, '#ffe08a');
        ctx.globalAlpha = 0.4 + 0.6 * f;
        ctx.fillStyle = g;
        redondeado(cx - w / 2 + 5, nivel, w - 10, yBot - nivel - 5, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = c.linea;
        ctx.lineWidth = 1;
        redondeado(cx - w / 2, yTop, w, alto, 10);
        ctx.stroke();
        // carbono que flota
        for (let k = 0; k < 16; k++) punto(cx - w / 2 + 11 + (k / 15) * (w - 22), nivel - 1 + Math.sin(t + k) * 0.8, 2.7, '#1b1b1f');
        // metano que sube
        for (let k = 0; k < 8; k++) {
            const u = fract(k / 8 + t * 0.32 * (0.3 + f) + azar(k));
            const x = cx - 38 + azar(k + 7) * 76 + Math.sin(u * 8 + k) * 3;
            punto(x, yBot - 8 - u * (yBot - nivel - 12), 3.3, c.ch4);
        }
        // hidrógeno que sale por arriba
        for (let k = 0; k < 6; k++) {
            const u = fract(k / 6 + t * 0.4 * (0.3 + f) + azar(k + 3));
            const x = cx - 32 + azar(k + 13) * 64;
            punto(x, nivel - 6 - u * (nivel - yTop - 10), 2.4 * f, c.h2);
        }
        texto('Sale H₂', cx + w / 2 + 8, yTop + 14, c.tinta, 10, 700, 'left');
        texto('Carbono sólido', cx + w / 2 + 8, nivel, c.tinta, 10, 700, 'left');
        texto(`Metal a ${Math.round(temp).toLocaleString('es-MX')} °C`, cx - w / 2 - 8, (nivel + yBot) / 2 - 8, c.tinta, 10, 700, 'right');
        texto('Entra CH₄', cx - w / 2 - 8, yBot - 10, c.tinta, 10, 700, 'right');
    }

    return {
        dibujar(modo, t, f, colores, temp) {
            medir();
            if (W < 10) return;
            ctx.clearRect(0, 0, W, H);
            if (modo === 'turquesa') reactor(t, f, colores, temp); else celda(modo, t, f, colores);
        },
    };
}
