// Las líneas eléctricas de las figuras, puras (sin three.js), iguales en todas: una línea aérea son tres fases que cuelgan entre
// apoyos (postes, torres, marcos, boquillas, barras), y cada cable, aéreo o de piso, termina en algo que existe en la figura.
// Las dibuja planta-comun/conductores.js; la página la arma cada figura en su lugar.js y la revisa su prueba con cablesSueltos().

/** Un apoyo de una línea: su centro, hacia dónde se abren las fases (del centro a la fase de un lado) y el largo del aislador que cuelga. */
export const apoyo = (p, fase, aislador = 0) => ({ p, fase, aislador });

/** Un apoyo sobre la cruceta de un poste o torre: las fases se abren perpendiculares a la línea, sobre el brazo que más se le acerca. */
export function enCruceta(p, antes, despues, largo = 0.25, aislador = 0.08) {
    const dx = despues[0] - antes[0];
    const dz = despues[2] - antes[2];
    return apoyo(p, Math.abs(dx) > Math.abs(dz) ? [0, 0, largo] : [largo, 0, 0], aislador);
}

/** Los puntos de un conductor que cuelga entre apoyos (parábola, flecha de 3.5 % del claro). desplaza: -1, 0 o 1, la fase. */
export function colgar(apoyos, desplaza = 0, n = 16, flecha = 0.035) {
    const punto = a => [a.p[0] + desplaza * a.fase[0], a.p[1] - a.aislador + desplaza * a.fase[1], a.p[2] + desplaza * a.fase[2]];
    const puntos = [punto(apoyos[0])];
    for (let i = 0; i < apoyos.length - 1; i++) {
        const a = punto(apoyos[i]);
        const b = punto(apoyos[i + 1]);
        const f = flecha * Math.hypot(b[0] - a[0], b[2] - a[2]);
        for (let k = 1; k <= n; k++) {
            const t = k / n;
            puntos.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 4 * f * t * (1 - t), a[2] + (b[2] - a[2]) * t]);
        }
    }
    return puntos;
}

/** Una línea aérea para LINEAS: sin tubo (la dibujan los conductores); sus partículas corren por la fase de en medio. */
export const lineaAerea = (id, apoyos, extra = {}) => ({ id, fluido: 'elec', r: 0.012, cable: true, oculto: true, apoyos, puntos: colgar(apoyos), ...extra });

/**
 * Los cables cuelgan de algo: cada punta cae en un borne y cada punto de en medio en un borne (poste, torre, charola) o en el piso.
 * Las líneas aéreas se revisan por sus apoyos. remate: puntas que salen por la orilla del sitio, como 'rnt (fin)'.
 */
export function cablesSueltos(lineas, bornes, remate = new Set(), { piso = 0.06, tolerancia = 0.03 } = {}) {
    const cerca = p => Object.values(bornes).some(b => Math.hypot(p[0] - b[0], p[1] - b[1], p[2] - b[2]) < tolerancia);
    const sueltos = [];
    for (const L of lineas.filter(l => l.cable)) {
        const puntos = L.apoyos ? L.apoyos.map(a => a.p) : L.puntos;
        puntos.forEach((p, i) => {
            const punta = i === 0 ? 'inicio' : i === puntos.length - 1 ? 'fin' : null;
            if (punta && remate.has(`${L.id} (${punta})`)) return;
            if (cerca(p) || (!punta && p[1] <= piso)) return;
            sueltos.push(`${L.id} (punto ${i + 1}, sin borne)`);
        });
    }
    return sueltos;
}
