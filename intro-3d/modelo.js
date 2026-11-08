// El búho mecánico de la entrada, como funciones puras del tiempo. Aquí no hay three.js ni DOM: solo cifras.
// main.js dibuja lo que este archivo dice y scripts/render-intro-3d.mjs lo usa para saber dónde queda el ojo en el último
// cuadro (ahí abre el iris del sitio). Así el video, la posición del ojo y la duración no pueden contradecirse.
//
// Referencia: la ilustración del búho mecánico (marfil, mecanismo grafito y acero, plumas y ojos guinda). Unidades del
// mundo: el cuerpo mide 1.24 de ancho y del penacho a las garras el búho mide 2.9; con las alas abiertas, unos 6.5.

export const DURACION = 8.5;
export const FPS = 60;

// Cuerpo y cabeza como elipsoides: centro y radios.
export const CUERPO = { c: [0, -0.2, 0], r: [0.62, 0.82, 0.56] };
export const CABEZA = { c: [0, 0.92, 0.02], r: [0.58, 0.48, 0.47] };
// La cabeza se construye a su medida y se agranda alrededor de su centro: en la referencia es tan ancha como el cuerpo.
export const ESCALA_CABEZA = 1.45;
const enCabeza = ([x, y, z]) => [CABEZA.c[0] + (x - CABEZA.c[0]) * ESCALA_CABEZA, CABEZA.c[1] + (y - CABEZA.c[1]) * ESCALA_CABEZA, CABEZA.c[2] + (z - CABEZA.c[2]) * ESCALA_CABEZA];
// Los ojos en la cara (sobre la superficie de la cabeza); el iris del sitio abre desde el primero (izquierda en pantalla).
export const OJOS = [-0.23, 0.23].map(x => {
    const [cx, cy, cz] = CABEZA.c;
    const [rx, ry, rz] = CABEZA.r;
    const y = 0.95;
    return [x, y, cz + rz * Math.sqrt(1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2)];
});
export const OJO = enCabeza([OJOS[0][0], OJOS[0][1], OJOS[0][2] + 0.15]); // el iris, en el mundo, ya con la cabeza agrandada
export const HOMBRO = [0.5, 0.25, -0.05]; // ala derecha; la izquierda es su espejo
export const PIE = -1.79; // punta de las garras (la pierna sale bajo el cuerpo: muslo, rodilla y espinilla)
export const ENGRANE = { centro: [0, -0.12, 0.5], radio: 0.16 }; // el engrane del pecho, de donde salen las secciones
export const N_SECUNDARIAS = 10;
export const N_PLUMAS = 22; // por ala: 10 secundarias en el antebrazo y 12 primarias en la mano

// Las secciones del sitio, en el orden del menú (index.html, .bu-riel__nav). Cada una es una pieza del búho.
export const SECCIONES = ['Buscar', 'Acervo', 'Cronología', 'Permisos', 'Polos', 'Análisis', 'Aprende'];
export const MODULO = 0.62; // lado del módulo
export const ANCHO_ETIQUETA = 0.95; // lo que ocupa «Cronología», la etiqueta más larga, a la letra de 34 px en 1080 (horizontal)

const D2R = Math.PI / 180;
const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;
const suave = x => { const k = clamp01(x); return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; };
const sale = x => 1 - (1 - clamp01(x)) ** 3; // cubic-bezier(0.16, 1, 0.3, 1) aproximada
const entra = x => clamp01(x) ** 3;
const rebote = x => { const k = clamp01(x) - 1; return 1 + 2.2 * k * k * k + 1.2 * k * k; };
const tramo = (t, a, b, f = suave) => f((t - a) / (b - a));
const campana = (t, centro, ancho) => { const k = 1 - Math.abs(t - centro) / ancho; return k <= 0 ? 0 : suave(k); };

/** Valor con llaves [[t, v], ...]; v es número o arreglo. */
function llaves(lista, t, f = suave) {
    if (t <= lista[0][0]) return lista[0][1];
    for (let i = 0; i < lista.length - 1; i++) {
        const [t0, v0] = lista[i];
        const [t1, v1] = lista[i + 1];
        if (t <= t1) {
            const k = f((t - t0) / (t1 - t0));
            return Array.isArray(v0) ? v0.map((v, j) => lerp(v, v1[j], k)) : lerp(v0, v1, k);
        }
    }
    return lista[lista.length - 1][1];
}

// Los momentos del recorrido, en segundos. timeline.json se escribe de aquí.
export const MOMENTOS = {
    ojo: 0, cuerpo: 0.35, alas: 1.25, abre: 2.35, secciones: 2.7, recorrido: 3.5, cierra: 5.4, nombre: 6.35, fin: 7.9,
};

// Dos formatos: horizontal (16:9) y vertical (9:16). Cambia la cámara, cuánto se alzan las alas y dónde van los módulos.
export const FORMATOS = {
    horizontal: {
        alzar: 0,
        camara: [
            [0.0, { mira: [0, 1.02, 0.15], az: 0, el: 0, d: 3.6 }],
            [1.2, { mira: [0, 1.02, 0.15], az: 0, el: 0, d: 3.6 }],
            [2.35, { mira: [0, 0.2, 0], az: -22, el: 8, d: 11.5 }],
            [3.3, { mira: [0, -0.75, 0], az: -10, el: 5, d: 13.2 }],
            [5.4, { mira: [0, -0.75, 0], az: -5, el: 4, d: 13.2 }],
            [6.6, { mira: [0, 0.35, 0], az: -12, el: 7, d: 9.5 }],
            [7.9, { mira: [0, 1.02, 0.15], az: 0, el: 0, d: 3.6 }],
        ],
        // Una sonrisa de 7 módulos bajo las garras, separados 1.2: más que la etiqueta más larga (0.95), así no se tocan.
        modulos: SECCIONES.map((_, i) => {
            const x = -3.6 + 1.2 * i;
            return [x, -2.3 - 0.7 * Math.sqrt(Math.max(0, 1 - (x / 4.2) ** 2)), 0.9];
        }),
        etiqueta: 'abajo',
        titulo: 0.84,
    },
    vertical: {
        alzar: 30,
        camara: [
            [0.0, { mira: [0, 1.02, 0.15], az: 0, el: 0, d: 5.8 }],
            [1.2, { mira: [0, 1.02, 0.15], az: 0, el: 0, d: 5.8 }],
            [1.8, { mira: [0, 0.45, 0], az: -12, el: 6, d: 21 }],
            [2.35, { mira: [0, 0.2, 0], az: -18, el: 7, d: 19.5 }],
            [3.4, { mira: [0, -2.8, 0], az: -8, el: 4, d: 25 }],
            [5.4, { mira: [0, -2.8, 0], az: -4, el: 3, d: 25 }],
            [6.6, { mira: [0, 0.35, 0], az: -10, el: 6, d: 17 }],
            [7.9, { mira: [0, 1.02, 0.15], az: 0, el: 0, d: 5.8 }],
        ],
        // Una columna, como un menú: el módulo a la izquierda y su nombre a la derecha.
        modulos: SECCIONES.map((_, i) => [-0.85, -2.65 - 0.95 * i, 0.9]),
        etiqueta: 'derecha',
        titulo: 0.82,
    },
};

export const formatoDe = aspecto => (aspecto < 1 ? 'vertical' : 'horizontal');

/** Todo lo que se ve en el instante t. */
export function estado(t, aspecto = 16 / 9) {
    const nombre = formatoDe(aspecto);
    const F = FORMATOS[nombre];
    const M = MOMENTOS;

    // Luz: el búho sale de la oscuridad; el ojo ya brilla desde el principio.
    const luz = tramo(t, M.cuerpo, M.cuerpo + 1.05);
    const ojo = lerp(0.25, 1, tramo(t, 0, 0.5, sale)) + 0.6 * campana(t, M.fin + 0.15, 0.35);

    // El cuerpo nace detrás del emblema y vuelve a ocultarse al recuperar la pose frontal.
    const despliegue = tramo(t, 1.2, 2.25, sale) * (1 - tramo(t, 6.6, 7.8, sale));

    // Alas: el brazo se despliega y cada pluma se abre en abanico, de adentro hacia afuera (30 ms entre cada una).
    const ala = tramo(t, M.alas, M.alas + 0.9, sale) * despliegue;
    const plumas = Array.from({ length: N_PLUMAS }, (_, i) => tramo(t, M.alas + 0.1 + 0.03 * i, M.alas + 0.8 + 0.03 * i, rebote) * despliegue);
    const alzar = F.alzar * D2R * despliegue;

    // Apertura del cuerpo: abre después de las alas y cierra antes del nombre.
    const abierto = tramo(t, M.abre, M.abre + 0.65) * (1 - tramo(t, M.cierra + 0.25, M.cierra + 0.85));

    // Módulos: salen del engrane del pecho, se acomodan, el guinda pasa por cada uno y regresan.
    const modulos = F.modulos.map((destino, i) => {
        const sal = tramo(t, M.secciones + 0.07 * i, M.secciones + 0.7 + 0.07 * i, sale);
        const vuelve = tramo(t, M.cierra + 0.04 * i, M.cierra + 0.5 + 0.04 * i, entra);
        const f = sal * (1 - vuelve);
        const acento = campana(t, M.recorrido + 0.25 + 0.25 * i, 0.32);
        const etiqueta = tramo(t, M.secciones + 0.5 + 0.07 * i, M.secciones + 0.8 + 0.07 * i) * (1 - tramo(t, M.cierra, M.cierra + 0.25));
        return { f, acento, etiqueta, destino };
    });

    const titulo = tramo(t, M.nombre, M.nombre + 0.6, sale);
    const camara = llaves(F.camara.map(([tk, c]) => [tk, [...c.mira, c.az, c.el, c.d]]), t);
    return {
        t, formato: nombre, luz, ojo, despliegue, ala, plumas, alzar, abierto, modulos, titulo,
        engrane: t * 2.4, // el engrane gira siempre; solo se ve con el cuerpo abierto
        camara: { mira: camara.slice(0, 3), az: camara[3] * D2R, el: camara[4] * D2R, d: camara[5], fov: 30 },
    };
}

/**
 * El búho con sus dos controles, para la figura en vivo y la revisión de fidelidad: alas (0 plegadas, 1 abiertas y
 * alzadas) y desarme (0 armado, 1 cada pieza fuera por su eje y las secciones fuera del pecho). Las plumas se abren
 * de adentro hacia afuera conforme suben las alas; nada depende del reloj salvo el giro del engrane.
 */
export function pose({ alas = 1, desarme = 0, t = 0, aspecto = 16 / 9, camara = null } = {}) {
    const nombre = formatoDe(aspecto);
    const F = FORMATOS[nombre];
    const plumas = Array.from({ length: N_PLUMAS }, (_, i) => clamp01(alas * 1.35 - 0.35 * (i / (N_PLUMAS - 1))));
    const modulos = F.modulos.map((destino, i) => {
        const f = clamp01((desarme - 0.35 - 0.04 * i) / 0.45);
        return { f: sale(f), acento: 0, etiqueta: clamp01((desarme - 0.7) / 0.2), destino };
    });
    const c = camara || { mira: [0, 0.4, 0], az: 0, el: 4, d: 12 };
    return {
        t, formato: nombre, luz: 1, ojo: 1, despliegue: alas, ala: sale(alas), plumas, alzar: F.alzar * D2R * alas,
        abierto: desarme, modulos, titulo: 0, engrane: t * 2.4,
        camara: { mira: c.mira, az: c.az * D2R, el: c.el * D2R, d: c.d, fov: c.fov || 30 },
    };
}

/** Posición de la cámara a partir de la mira, el azimut, la elevación y la distancia. */
export function posicionCamara({ mira, az, el, d }) {
    return [mira[0] + d * Math.cos(el) * Math.sin(az), mira[1] + d * Math.sin(el), mira[2] + d * Math.cos(el) * Math.cos(az)];
}

/** Revisión de las cifras: módulos que no se tocan y que no chocan con el búho. Devuelve los problemas encontrados. */
export function revisar() {
    const problemas = [];
    const pieBuho = PIE;
    for (const [nombre, F] of Object.entries(FORMATOS)) {
        F.modulos.forEach((p, i) => {
            if (p[1] + MODULO / 2 > pieBuho - 0.25) problemas.push(`${nombre}: el módulo ${SECCIONES[i]} toca al búho`);
            const q = F.modulos[i + 1];
            if (!q) return;
            const separacion = F.etiqueta === 'abajo' ? Math.abs(q[0] - p[0]) : Math.abs(q[1] - p[1]);
            const minimo = F.etiqueta === 'abajo' ? ANCHO_ETIQUETA + 0.15 : MODULO + 0.2;
            if (separacion < minimo) problemas.push(`${nombre}: ${SECCIONES[i]} y ${SECCIONES[i + 1]} quedan a ${separacion.toFixed(2)} (mínimo ${minimo})`);
        });
    }
    return problemas;
}
