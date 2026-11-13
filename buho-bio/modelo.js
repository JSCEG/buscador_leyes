// El búho biomecánico, en cifras: forma del cuerpo y de la cabeza, cadena del ala, partes del búho y pose. Sin three.js
// ni DOM, para que la geometría, la cámara y las pruebas lean de un solo lugar.
//
// Unidades: del tope del libro a la coronilla mide 3.5. Se para en y = LIBRO.tope; x a su izquierda (derecha en pantalla),
// z hacia quien mira.

export const D2R = Math.PI / 180;
export const clamp01 = x => Math.min(1, Math.max(0, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const suave = x => { const k = clamp01(x); return k * k * (3 - 2 * k); };
export const sale = x => 1 - (1 - clamp01(x)) ** 3;
export const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- forma
// Tres libros apilados, con el formato de los del sitio (0.72 : 1), más delgados: largo de la cabeza al pie, ancho del lomo al
// corte, grueso. Cada uno de abajo es un poco mayor (ver libros.js).
export const GROSOR = 0.095; // del largo; en el sitio el lomo es de 0.16, pero aquí se ven mejor delgados
export const LIBRO = { largo: 2.2, ancho: 2.2 * 0.72, grueso: 2.2 * GROSOR, tope: -1.7 };
export const PISO = LIBRO.tope - LIBRO.grueso * (1 + 1.05 + 1.1);
export const CUELLO = [0, 0.72, 0.04]; // eje de giro de la cabeza
export const CABEZA = { c: [0, 0.5, 0.06], rx: 0.95, ry: 0.72, rzF: 0.6, rzB: 0.7 }; // relativa a CUELLO
export const OJOS = [-0.44, 0.44].map(x => [x, 0.5]); // en la cara, relativos a CUELLO
export const R_OJO = 0.25;
export const R_DISCO = 0.44; // disco facial de lamas alrededor de cada ojo

// Cuerpo de arriba (t = 0, base del cuello) a abajo (t = 1, rabadilla), filas parejas: y, centro en z, radio en x, radio al
// frente y radio atrás. Pecho lleno y espalda más plana, como un búho posado.
const FILAS = [
    [0.62, 0.0, 0.3, 0.26, 0.28],
    [0.42, 0.04, 0.5, 0.43, 0.42],
    [0.12, 0.08, 0.68, 0.6, 0.5],
    [-0.2, 0.08, 0.72, 0.66, 0.52],
    [-0.52, 0.04, 0.66, 0.58, 0.48],
    [-0.8, -0.04, 0.5, 0.4, 0.4],
    [-1.02, -0.12, 0.22, 0.18, 0.2],
];
function fila(t) {
    const x = clamp01(t) * (FILAS.length - 1);
    const i = Math.min(FILAS.length - 2, Math.floor(x));
    const k = x - i;
    const a = FILAS[Math.max(0, i - 1)];
    const b = FILAS[i];
    const c = FILAS[i + 1];
    const d = FILAS[Math.min(FILAS.length - 1, i + 2)];
    // Catmull-Rom: el contorno no hace quiebres entre filas
    return b.map((_, j) => 0.5 * (2 * b[j] + (c[j] - a[j]) * k + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * k * k + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * k * k * k));
}

/** Punto del cuerpo: t de arriba abajo, a alrededor desde el frente (+z) hacia +x, k cuánto se infla. */
export function cuerpo(t, a, k = 1) {
    const [y, cz, rx, rzF, rzB] = fila(t);
    const c = Math.cos(a);
    return [rx * k * Math.sin(a), y, cz + (c >= 0 ? rzF : rzB) * k * c];
}

/** Punto de la cabeza, relativo a CUELLO: t de la coronilla a la base, a como en cuerpo(). */
export function cabeza(t, a, k = 1) {
    const f = clamp01(t) * Math.PI;
    const s = Math.sin(f);
    const c = Math.cos(a);
    const rz = c >= 0 ? CABEZA.rzF : CABEZA.rzB;
    return [CABEZA.rx * k * s * Math.sin(a), CABEZA.c[1] + CABEZA.ry * k * Math.cos(f), CABEZA.c[2] + rz * k * s * c];
}

/** Normal hacia afuera de una superficie (t, a, k) → punto. */
export function normal(S, t, a, k = 1) {
    const e = 0.004;
    const p = S(t, a, k);
    const q = S(t + e, a, k);
    const r = S(t - e, a, k);
    const u = S(t, a + e, k);
    const dt = [q[0] - r[0], q[1] - r[1], q[2] - r[2]];
    const da = [u[0] - p[0], u[1] - p[1], u[2] - p[2]];
    const n = [dt[1] * da[2] - dt[2] * da[1], dt[2] * da[0] - dt[0] * da[2], dt[0] * da[1] - dt[1] * da[0]];
    const l = Math.hypot(...n) || 1;
    return n.map(v => v / l);
}

/** Punto y normal al frente de la cabeza para un (x, y) de la cara, relativos a CUELLO. */
export function enCara(x, y) {
    const dx = x / CABEZA.rx;
    const dy = (y - CABEZA.c[1]) / CABEZA.ry;
    const q = Math.max(0.03, 1 - dx * dx - dy * dy);
    const z = CABEZA.c[2] + CABEZA.rzF * Math.sqrt(q);
    const n = [x / CABEZA.rx ** 2, (y - CABEZA.c[1]) / CABEZA.ry ** 2, (z - CABEZA.c[2]) / CABEZA.rzF ** 2];
    const l = Math.hypot(...n);
    return { p: [x, y, z], n: n.map(v => v / l) };
}

// ---------------------------------------------------------------- el ala
export const ALA = { hombro: [0.6, 0.24, -0.02], humero: 0.62, radio: 0.78, mano: 0.55, secundarias: 12, primarias: 10 };

/** Ángulos del ala (grados, absolutos en su plano) para a = 0 plegada y a = 1 abierta. */
export function angulosAla(a) {
    const b = suave(a * 1.25); // el brazo se adelanta; la mano termina al último
    const c = suave(a * 1.1 - 0.05);
    const m = suave(a * 1.25 - 0.25);
    return { giro: lerp(66, 6, b), inclina: lerp(0.05, 0.1, b), humero: lerp(-50, 36, b), radio: lerp(150, 20, c), mano: lerp(-65, 44, m) };
}

/**
 * Las plumas del ala, por capas: clase (larga marfil, guinda, cristal u hoja), hueso, ángulos absolutos plegada y abierta, y
 * z: a qué altura del plano van (las de mayor z tapan a las demás, del lado de afuera).
 */
const capa = (n, clase, hueso, f0, f1, largo, ancho, plegada, abierta, z) => Array.from({ length: n }, (_, i) => {
    const k = n > 1 ? i / (n - 1) : 0;
    return { clase, hueso, f: lerp(f0, f1, k), largo: lerp(largo[0], largo[1], k), ancho, plegada: lerp(plegada[0], plegada[1], k), abierta: lerp(abierta[0], abierta[1], k), z: z + i * 0.0035 };
});
export const PLUMAS_ALA = [
    ...capa(ALA.secundarias, 'guinda', 'radio', 0.05, 0.95, [1.14, 1.32], 0.29, [-72, -66], [-122, -66], 0.0),
    ...capa(ALA.primarias, 'larga', 'mano', 0.05, 0.95, [1.5, 1.92], 0.27, [-60, -64], [-58, 42], 0.02),
    ...capa(8, 'cristal', 'radio', 0.08, 0.92, [0.94, 1.08], 0.36, [-72, -64], [-120, -68], 0.075),
    ...capa(6, 'cristal', 'mano', 0.1, 0.9, [1.1, 1.3], 0.34, [-60, -62], [-56, 30], 0.08),
    ...capa(7, 'hoja', 'radio', 0.05, 0.95, [0.48, 0.54], 0.34, [-72, -60], [-112, -70], 0.12),
    ...capa(5, 'hoja', 'mano', 0.05, 0.95, [0.52, 0.62], 0.32, [-58, -60], [-52, 18], 0.125),
    ...capa(4, 'hoja', 'humero', 0.15, 0.95, [0.6, 0.5], 0.36, [-58, -52], [-120, -108], 0.16),
];

/** Punta del ala en su plano, para revisar que quepa. */
function puntaAla(a) {
    const g = angulosAla(a);
    const paso = (l, deg) => [l * Math.cos(deg * D2R), l * Math.sin(deg * D2R)];
    const e = paso(ALA.humero, g.humero);
    const w = paso(ALA.radio, g.radio);
    const h = paso(ALA.mano, g.mano);
    const primarias = PLUMAS_ALA.filter(p => p.clase === 'larga');
    const ultima = primarias[primarias.length - 1];
    const q = paso(ultima.largo * lerp(0.76, 1, a), lerp(ultima.plegada, ultima.abierta, a));
    return [e[0] + w[0] + h[0] + q[0], e[1] + w[1] + h[1] + q[1]];
}

// ---------------------------------------------------------------- las partes (cada una es una sección del sitio)
// mira, az, el y tam: a dónde va la cámara al elegirla. alas: si conviene verla con las alas abiertas.
export const PARTES = [
    { parte: 'ojos', mirada: [8, -3], seccion: 'Buscar', mira: [0, 1.32, 0.5], az: 0, el: 2, tam: 1.75 },
    { parte: 'libro', mirada: [-14, 19], seccion: 'Acervo', mira: [0, -2.02, 0.45], az: -20, el: 26, tam: 2.7 },
    { parte: 'columna', mirada: [46, 3], seccion: 'Cronología', mira: [0, -0.2, -0.45], az: 172, el: 10, tam: 2.2 },
    { parte: 'garras', mirada: [18, 15], seccion: 'Permisos', mira: [0.36, -1.55, 0.42], az: 24, el: 12, tam: 1.15 },
    { parte: 'alas', mirada: [32, -2], seccion: 'Polos', mira: [2.2, 1.0, 0], az: 12, el: 6, tam: 4.4, alas: 1 },
    { parte: 'cara', mirada: [-18, -3], seccion: 'Análisis', mira: [0, 1.25, 0.45], az: -24, el: 4, tam: 2.05 },
    { parte: 'nucleo', mirada: [6, 12], seccion: 'Aprende', mira: [0, -0.02, 0.62], az: 12, el: 5, tam: 1.55 },
];

// ---------------------------------------------------------------- pose
/**
 * Todo lo que necesita posar(): sale de los controles y del reloj. alas 0 plegadas · 1 abiertas; adentro 0 blindado · 1 se
 * ve la máquina; desarme 0 armado · 1 cada placa fuera por su eje; noche 0 día · 1 noche; yaw y pitch de la cabeza en
 * grados; parpado 0 abierto · 1 cerrado; abre la pupila; luz cuánto brillan los núcleos.
 */
export function pose({ alas = 0, adentro = 0, desarme = 0, noche = 0, t = 0, yaw = 0, pitch = 0, parpado = 0, abre = 0.55, luz = 1, realce = 0, camara = null } = {}) {
    const respira = 0.5 - 0.5 * Math.cos(t * 1.35);
    const c = camara || { mira: [0, 0, 0], az: 0, el: 4, d: 14 };
    return {
        t, alas, adentro, desarme, noche, yaw: yaw * D2R, pitch: pitch * D2R, parpado, abre, luz, realce,
        respira,
        latido: 1 + 0.1 * Math.sin(t * 2.2) + 0.05 * Math.sin(t * 5.1),
        penacho: Math.sin(t * 0.7) * Math.sin(t * 2.3),
        cola: Math.sin(t * 0.9),
        camara: { mira: c.mira, az: c.az * D2R, el: c.el * D2R, d: c.d, fov: c.fov || 26 },
    };
}

export function posicionCamara({ mira, az, el, d }) {
    return [mira[0] + d * Math.cos(el) * Math.sin(az), mira[1] + d * Math.sin(el), mira[2] + d * Math.cos(el) * Math.cos(az)];
}

/** Revisión de las cifras. Devuelve los problemas encontrados. */
export function revisar() {
    const problemas = [];
    const [, yBase] = cuerpo(1, 0);
    if (yBase < LIBRO.tope + 0.4) problemas.push('la rabadilla queda demasiado cerca del libro');
    if (CUELLO[1] + CABEZA.c[1] - CABEZA.ry * 0.6 < cuerpo(0, 0)[1]) problemas.push('la cara se hunde en los hombros');
    const plegada = puntaAla(0);
    if (ALA.hombro[1] + plegada[1] < LIBRO.tope) problemas.push(`el ala plegada atraviesa el libro (${(ALA.hombro[1] + plegada[1]).toFixed(2)})`);
    const abierta = puntaAla(1);
    if (ALA.hombro[0] + abierta[0] > 4.9) problemas.push(`el ala abierta se sale del encuadre (${(ALA.hombro[0] + abierta[0]).toFixed(2)})`);
    if (R_OJO * 2 > 2 * Math.abs(OJOS[0][0])) problemas.push('los ojos se tocan');
    return problemas;
}
