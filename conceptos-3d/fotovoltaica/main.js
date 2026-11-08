// «Central fotovoltaica», en 3D: filas de módulos solares sobre seguidores que giran de este a oeste, la caja de
// conexiones, el inversor, el transformador, la línea a la red y el piranómetro que mide la luz.
//
// Entrada: la hora del día (solar). De la hora sale todo: dónde está el sol (y la luz y las sombras de la escena),
// cuánto gira el seguidor, cuánta luz llega al módulo, cuánta energía produce y la corriente por los cables.
//
// Modelo (día despejado de equinoccio en el norte de México; sirve para ver la forma del día, no para diseñar):
// - Latitud 29° (Sonora). Ángulo horario H = 15° × (hora − 12). Con declinación 0:
//   este = −sen H, arriba = cos H · cos φ, sur = cos H · sen φ. Al mediodía el sol sube a 90° − 29° = 61°.
// - Luz directa (modelo de Meinel): DNI = 1,353 × 0.7^(AM^0.678) W/m², con masa de aire AM = 1 ÷ sen(elevación).
//   Al mediodía AM ≈ 1.14 y DNI ≈ 916 W/m². Luz difusa: 10 % de la directa (con nubes, la directa cae al 15 % y la
//   difusa sube a 180 W/m²).
// - Seguidor de un eje norte–sur: gira el ángulo β = atan(este ÷ arriba), hasta ±60°; de noche vuelve a plano.
// - Módulo de 550 W (en condiciones estándar: 1,000 W/m² y 25 °C): produce 550 × luz en el módulo ÷ 1,000.
// - El piranómetro está horizontal: mide la luz que llega al suelo. A las 9:00 marca ≈ 593 W/m² mientras el módulo,
//   girado 49°, recibe ≈ 859 W/m²: eso gana el seguidor.
// - El inversor convierte con ≈ 98 % de eficiencia.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';
import { crearCorriente } from '../comun/corriente.js';

const LATITUD = 29 * Math.PI / 180;
const MODULO_W = 550;
const LIMITE = 60 * Math.PI / 180;
const PISO_CABLE = 0.182;
const FILAS = [-2.55, -1.55, -0.55]; // x de cada fila (los ejes van de norte a sur, a lo largo de z)
const ALTO_EJE = 0.95;
const MODULOS_POR_FILA = 5;
const F = 60;

let hora = 12;
let fase = 0;
let solar = null; // lo que calcula paso() para la gráfica
let piezasPV = null;

// el sol y la luz a una hora dada (cielo: 'despejado' | 'nublado')
function sol(h, cielo = 'despejado') {
    const H = (15 * (h - 12)) * Math.PI / 180;
    const este = -Math.sin(H);
    const arriba = Math.cos(H) * Math.cos(LATITUD);
    const sur = Math.cos(H) * Math.sin(LATITUD);
    const elev = Math.asin(clamp(arriba, -1, 1));
    if (arriba <= 0.01) return { este, arriba, sur, elev, dni: 0, difusa: 0, beta: 0, poa: 0, ghi: 0, plano: 0 };
    const am = 1 / Math.sin(elev);
    let dni = 1353 * 0.7 ** (am ** 0.678);
    let difusa = 0.1 * dni;
    if (cielo === 'nublado') { difusa = Math.min(180, 0.5 * dni) ; dni *= 0.15; }
    const beta = clamp(Math.atan2(este, arriba), -LIMITE, LIMITE);
    const incidencia = Math.max(0, este * Math.sin(beta) + arriba * Math.cos(beta));
    const poa = dni * incidencia + difusa;
    const ghi = dni * arriba + difusa;
    return { este, arriba, sur, elev, dni, difusa, beta, poa, ghi, plano: ghi };
}
const reloj = h => { const m = Math.round(h * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

crearMaquina({
    figura: 'fotovoltaica',
    nombre: 'la central',
    partes: [
        { n: 1, nombre: 'Módulo solar', ancla: [FILAS[2], ALTO_EJE + 0.55, 0.6], vista: { tx: FILAS[2], ty: 0.9, tz: 0.4, az: 20, el: 30, d: 3.4 } },
        { n: 2, nombre: 'Seguidor solar', ancla: [FILAS[1], ALTO_EJE + 0.1, 1.55], vista: { tx: FILAS[1], ty: 0.7, tz: 1.2, az: 8, el: 12, d: 3.4 } },
        { n: 3, nombre: 'Caja de conexiones', ancla: [0.45, 0.85, 1.25], vista: { tx: 0.4, ty: 0.45, tz: 1.1, az: 24, el: 22, d: 2.6 } },
        { n: 4, nombre: 'Inversor', ancla: [1.3, 1.2, 0.55], vista: { tx: 1.3, ty: 0.6, tz: 0.55, az: 26, el: 18, d: 3.0 } },
        { n: 5, nombre: 'Transformador', ancla: [2.25, 1.35, -0.15], vista: { tx: 2.25, ty: 0.7, tz: -0.15, az: 30, el: 18, d: 3.2 } },
        { n: 6, nombre: 'Línea a la red', ancla: [3.0, 2.35, -1.0], vista: { tx: 2.9, ty: 1.4, tz: -0.9, az: 30, el: 12, d: 4.4 } },
        { n: 7, nombre: 'Piranómetro', ancla: [-3.05, 1.2, 1.15], vista: { tx: -3.0, ty: 0.8, tz: 1.1, az: -20, el: 20, d: 2.4 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 1.2, tz: 0, az: 22, el: 22, d: 10.2 },
        { id: 'sol', texto: 'Desde el sur', tx: -1.4, ty: 0.8, tz: 0, az: 0, el: 10, d: 7.6 },
        { id: 'oriente', texto: 'Oriente', tx: -1.0, ty: 0.9, tz: 0, az: 90, el: 12, d: 7.4 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.3, tz: 0, az: 0, el: 70, d: 9.6 },
    ],
    entrada: { etiqueta: 'Hora del día', min: 5.5, max: 18.5, paso: 0.05, valor: 12, aria: 'Hora del día, hora solar' },
    selectores: [{ id: 'cielo', etiqueta: 'Cielo', valor: 'despejado', opciones: [{ id: 'despejado', texto: 'Despejado' }, { id: 'nublado', texto: 'Nublado' }] }],
    lento: [
        { id: 'lento', texto: '1/60', k: 1 / 60, nota: 'Corriente alterna en cámara lenta: 60 veces más despacio.' },
        { id: 'real', texto: 'Real', k: 1, nota: 'A velocidad real la corriente alterna va y viene 60 veces por segundo.' },
    ],
    // el recorrido pasa por todo el día: amanece, mediodía y atardece en unos 40 segundos
    // es la máquina más ancha: en un celular vertical la cámara puede alejarse más para que quepa
    anchoVertical: 1.55,
    lejaniaMax: 3.5,
    entradaRecorrido: t => 6 + 12 * (((t / 40) % 1)),
    hud: '<b data-c="potencia"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'hora', etiqueta: 'Hora solar', nota: 'equinoccio, norte de México' },
        { id: 'ghi', etiqueta: 'Piranómetro', nota: 'luz que llega al suelo' },
        { id: 'poa', etiqueta: 'Luz en el módulo', nota: 'el seguidor lo gira hacia el sol' },
        { id: 'potencia', etiqueta: 'Un módulo produce', nota: 'de 550 W en condiciones estándar' },
    ],
    curva: {
        titulo: 'Lo que produce un módulo durante el día',
        leyenda: [{ texto: 'con seguidor' }, { texto: 'fijo y plano' }],
        nota: 'Solo produce de día. El seguidor gana sobre todo en la mañana y en la tarde.',
        dibujar(g, w, h, estado) {
            const cielo = estado.sel.cielo;
            const x = hh => ((hh - 5.5) / 13) * w;
            const y = p => h - 6 - (p / MODULO_W) * (h - 14);
            g.strokeStyle = estado.TEMA === 'oscuro' ? '#262a36' : '#d9dbdb';
            g.lineWidth = 1;
            g.beginPath(); g.moveTo(0, h - 6); g.lineTo(w, h - 6); g.stroke();
            const serie = (campo, color, ancho) => {
                g.strokeStyle = color;
                g.lineWidth = ancho;
                g.beginPath();
                for (let px = 0; px <= w; px += 2) {
                    const hh = 5.5 + (px / w) * 13;
                    const s = sol(hh, cielo);
                    const p = MODULO_W * s[campo] / 1000;
                    if (px === 0) g.moveTo(px, y(p)); else g.lineTo(px, y(p));
                }
                g.stroke();
            };
            serie('plano', estado.P.tinta, 1.4);
            serie('poa', estado.P.acento, 2.4);
            if (solar) {
                g.fillStyle = estado.P.acento;
                g.beginPath(); g.arc(x(hora), y(MODULO_W * solar.poa / 1000), 4.5, 0, Math.PI * 2); g.fill();
            }
        },
    },
    corte: false,

    construir({ raiz, M, P, TEMA, sombra, contorno, aro, escena, sol: luzSol, scene }) {
        // la maqueta: una base blanca grande
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.16, 3.6), M.ceramica))).translateY(0.08));
        // la luz del sol de la escena la mueve paso(); su sombra cubre toda la maqueta
        Object.assign(luzSol.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 30 });
        luzSol.shadow.camera.updateProjectionMatrix();
        scene.add(luzSol.target);

        // el sol: una esfera tibia que recorre el cielo
        const astro = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 20), new THREE.MeshBasicMaterial({ color: TEMA === 'oscuro' ? '#fff1c9' : '#ffe3a1' }));
        const halo = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 20), new THREE.MeshBasicMaterial({ color: '#ffe3a1', transparent: true, opacity: 0.25 }));
        astro.add(halo);
        raiz.add(astro);

        // módulo: vidrio oscuro con la rejilla de celdas y marco de aluminio; proporción real 2.28 × 1.13 m
        const LARGO = 0.5; // a lo largo del eje (norte–sur)
        const ANCHO = 1.0; // de este a oeste
        const celdas = (() => {
            const c = document.createElement('canvas');
            c.width = 256;
            c.height = 128;
            const g = c.getContext('2d');
            g.fillStyle = '#1b2333';
            g.fillRect(0, 0, 256, 128);
            g.strokeStyle = '#6b7690';
            g.lineWidth = 1.5;
            for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo((i * 256) / 12, 0); g.lineTo((i * 256) / 12, 128); g.stroke(); }
            for (let j = 1; j < 6; j++) { g.beginPath(); g.moveTo(0, (j * 128) / 6); g.lineTo(256, (j * 128) / 6); g.stroke(); }
            const t = new THREE.CanvasTexture(c);
            t.colorSpace = THREE.SRGBColorSpace;
            return t;
        })();
        const vidrio = new THREE.MeshPhysicalMaterial({ map: celdas, roughness: 0.45, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1, emissive: new THREE.Color(P.acento), emissiveIntensity: 0 });
        const panelGeo = new THREE.BoxGeometry(ANCHO, 0.035, LARGO);
        const modulos = [];
        const filas = FILAS.map((x, f) => {
            const fila = new THREE.Group(); // gira alrededor del eje (z)
            fila.position.set(x, ALTO_EJE, 0);
            const paneles = new THREE.Group(); // los módulos de la fila: al desarmar suben del tubo
            fila.add(paneles);
            for (let i = 0; i < MODULOS_POR_FILA; i++) {
                const z = -1.2 + i * (LARGO + 0.05) + LARGO / 2;
                const m = sombra(new THREE.Mesh(panelGeo, [M.acero, M.acero, vidrio, M.acero, M.acero, M.acero]));
                m.position.set(0, 0.06, z);
                paneles.add(m);
                modulos.push(m);
            }
            raiz.add(fila);
            return { fila, paneles, f };
        });
        // 2 · Seguidor: el tubo de torsión (grafito), los postes blancos y el motor con su aro guinda en la fila de en medio
        const seguidor = new THREE.Group();
        const tubos = [];
        for (const { fila } of filas) {
            const tubo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.9, 16).rotateX(Math.PI / 2), M.grafito));
            fila.add(tubo);
            tubos.push(tubo);
            for (const z of [-1.25, 0, 1.25]) {
                const poste = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.08, ALTO_EJE - 0.16, 0.08), M.ceramica)));
                poste.position.set(fila.position.x, 0.16 + (ALTO_EJE - 0.16) / 2, z);
                seguidor.add(poste);
            }
        }
        const motor = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 24).rotateX(Math.PI / 2), M.grafito));
        motor.position.set(FILAS[1], ALTO_EJE - 0.15, 1.45);
        const motorAro = aro(0.11, 0.018, 0);
        motorAro.rotation.y = Math.PI / 2;
        motorAro.position.set(FILAS[1], ALTO_EJE - 0.15, 1.54);
        seguidor.add(motor, motorAro);
        raiz.add(seguidor);

        // 3 · Caja de conexiones
        const caja = new THREE.Group();
        caja.position.set(0.45, 0.16, 1.25);
        caja.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.26), M.ceramica))).translateY(0.25));
        caja.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.02), M.borde)).translateY(0.4).translateZ(0.135));
        raiz.add(caja);
        // 4 · Inversor: gabinete blanco con rejillas y una franja guinda
        const inversor = new THREE.Group();
        inversor.position.set(1.3, 0.16, 0.55);
        inversor.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.55), M.ceramica))).translateY(0.45));
        for (let i = 0; i < 6; i++) inversor.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.018, 0.01), M.grafito).translateY(0.3 + i * 0.07).translateZ(0.28));
        inversor.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.71, 0.05, 0.56), M.borde)).translateY(0.82));
        const luzInversor = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), new THREE.MeshStandardMaterial({ color: P.acento, emissive: new THREE.Color(P.acento), emissiveIntensity: 0 }));
        luzInversor.position.set(0.22, 0.72, 0.28);
        luzInversor.userData.sinResalte = true;
        inversor.add(luzInversor);
        raiz.add(inversor);
        // 5 · Transformador: tanque blanco con aletas de enfriamiento y tres boquillas
        const trafo = new THREE.Group();
        trafo.position.set(2.25, 0.16, -0.15);
        trafo.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.7), M.ceramica))).translateY(0.4));
        for (let i = 0; i < 7; i++) trafo.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.6, 0.18), M.grafito)).translateX(-0.3 + i * 0.1).translateY(0.42).translateZ(-0.44));
        for (let i = 0; i < 3; i++) {
            const b = new THREE.Group();
            b.position.set(-0.25 + i * 0.25, 0.8, 0.1);
            b.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.36, 14), M.ceramica)).translateY(0.18));
            for (let k = 0; k < 3; k++) b.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 20), k % 2 ? M.ceramica : M.borde)).translateY(0.06 + k * 0.12));
            trafo.add(b);
        }
        raiz.add(trafo);
        // 6 · Línea a la red: un poste con cruceta y aisladores; los cables salen de la maqueta hacia la red
        const linea = new THREE.Group();
        linea.position.set(3.0, 0.16, -1.0);
        linea.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.1, 12), M.grafito)).translateY(1.05));
        linea.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), M.grafito)).translateY(1.95));
        for (const x of [-0.38, 0, 0.38]) linea.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 12), M.ceramica)).translateX(x).translateY(2.06));
        raiz.add(linea);
        // 7 · Piranómetro: cúpula de vidrio sobre un disco blanco, en un poste
        const piranometro = new THREE.Group();
        piranometro.position.set(-3.05, 0.16, 1.15);
        piranometro.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 10), M.grafito)).translateY(0.4));
        piranometro.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 28), M.ceramica))).translateY(0.83));
        piranometro.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 40).rotateX(Math.PI / 2), M.borde)).translateY(0.86));
        piranometro.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.35, clearcoat: 1 })).translateY(0.86));
        raiz.add(piranometro);

        // Cables por la base. Corriente directa: de cada fila a la caja y de la caja al inversor. Corriente alterna: del
        // inversor al transformador y del transformador a la línea (por el aire, como en una subestación).
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const PC = PISO_CABLE;
        const deFilas = FILAS.map((x, i) => curva([x + 0.06, 0.4, 1.25], [x + 0.08, PC, 1.32], [x + 0.4, PC, 1.45 + i * 0.04], [0.1, PC, 1.45], [0.24, 0.22, 1.25]));
        const aInversor = [
            curva([0.66, 0.22, 1.29], [0.8, PC, 1.32], [1.0, PC, 0.95], [1.0, PC, 0.7], [0.95, 0.24, 0.6]),
            curva([0.66, 0.22, 1.21], [0.76, PC, 1.2], [0.92, PC, 0.9], [0.92, PC, 0.62], [0.95, 0.24, 0.5]),
        ];
        const aTrafo = [
            curva([1.65, 0.24, 0.6], [1.75, PC, 0.55], [1.8, PC, 0.1], [1.85, 0.24, -0.05]),
            curva([1.65, 0.24, 0.5], [1.72, PC, 0.45], [1.76, PC, 0.0], [1.85, 0.24, -0.25]),
        ];
        const aLinea = [
            curva([2.0, 1.32, -0.05], [2.4, 1.6, -0.6], [2.62, 2.12, -1.0]),
            curva([2.5, 1.32, -0.05], [2.8, 1.7, -0.6], [3.0, 2.12, -1.0]),
            curva([3.0, 2.12, -1.0], [3.4, 2.0, -1.4], [3.7, 2.05, -1.75]),
        ];
        const tubo = (c, r) => raiz.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 64, r, 8, false), M.cable)));
        deFilas.forEach(c => tubo(c, 0.016));
        aInversor.forEach(c => tubo(c, 0.024));
        aTrafo.forEach(c => tubo(c, 0.024));
        aLinea.forEach(c => tubo(c, 0.014));
        const corrientes = {
            // una por fila: las tres van en el mismo sentido (hacia la caja)
            filas: deFilas.map(c => crearCorriente({ raiz, escena, curvas: [c], P, radio: 0.022, puntosPorCable: 16 })),
            cd: crearCorriente({ raiz, escena, curvas: aInversor, P }),
            ca: crearCorriente({ raiz, escena, curvas: aTrafo, P }),
            red: crearCorriente({ raiz, escena, curvas: aLinea.slice(0, 2), P, radio: 0.02, puntosPorCable: 14 }),
        };

        piezasPV = { filas, modulos, vidrio, astro, luzSol, luzInversor, corrientes, tubos };
        return {
            piezas: { 1: modulos, 2: [seguidor, ...tubos], 3: [caja], 4: [inversor], 5: [trafo], 6: [linea], 7: [piranometro] },
            // los módulos suben de su seguidor; los aparatos se abren hacia afuera
            movibles: [
                ...filas.map(({ paneles }) => ({ parte: 1, objetos: [paneles], hacia: [0, 0.9, 0] })),
                { parte: 3, objetos: [caja], hacia: [0, 0, 0.45] },
                { parte: 4, objetos: [inversor], hacia: [0.15, 0, 0.55] },
                { parte: 5, objetos: [trafo], hacia: [0.35, 0, 0.2] },
                { parte: 6, objetos: [linea], hacia: [0.4, 0, -0.3] },
                { parte: 7, objetos: [piranometro], hacia: [-0.3, 0.3, 0.3] },
            ],
            anclas: { 1: [filas[2].paneles, [0, 0.35, 0]], 2: [motor, [0, -0.45, 0.25]], 3: [caja, [0, 0.72, 0]], 4: [inversor, [0, 1.1, 0]], 5: [trafo, [0, 1.35, 0]], 6: [linea, [0, 2.3, 0]], 7: [piranometro, [0, 1.12, 0]] },
        };
    },

    paso(estado) {
        const { filas, vidrio, astro, luzSol, luzInversor } = piezasPV;
        const { dt, dtSim, e, arrastre, M } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.35));
        hora = estado.entrada;
        const s = sol(hora, estado.sel.cielo);
        solar = s;
        // el sol en el cielo de la maqueta y la luz de la escena desde él
        const R = 4.6;
        astro.position.set(s.este * R, Math.max(-1, s.arriba * R), s.sur * R);
        astro.visible = s.arriba > -0.05;
        // con nubes el sol se ve pálido y sin halo
        const nublado = estado.sel.cielo === 'nublado';
        astro.material.color.set(nublado ? '#e6e1d3' : (estado.TEMA === 'oscuro' ? '#fff1c9' : '#ffe3a1'));
        astro.children[0].material.opacity = nublado ? 0.06 : 0.25;
        luzSol.position.set(s.este * 12, Math.max(0.3, s.arriba * 12), s.sur * 12);
        luzSol.target.position.set(0, 0, 0);
        luzSol.intensity = (estado.TEMA === 'oscuro' ? 2.0 : 2.4) * clamp(s.arriba * 4, 0.05, 1) * (estado.sel.cielo === 'nublado' ? 0.45 : 1);
        // los seguidores giran hacia el sol (eje norte–sur)
        // three.js gira z de x hacia y: para que la normal se incline hacia el oriente (+x) el ángulo va con signo menos
        for (const { fila } of filas) fila.rotation.z = -s.beta;
        // los módulos brillan un poco con la luz que reciben (en guinda: la pieza que trabaja)
        vidrio.emissiveIntensity = clamp(s.poa / 1000, 0, 1) * 0.05;
        // desarmados o desconectados, no hay corriente
        const conectado = 1 - clamp(Math.max(e * 8, arrastre[1].length() * 3, arrastre[3].length() * 3, arrastre[4].length() * 3, arrastre[5].length() * 3), 0, 1);
        const potencia = (MODULO_W * s.poa / 1000) * conectado;
        luzInversor.material.emissiveIntensity = potencia > 5 ? 1.2 : 0;
        fase += 2 * Math.PI * F * dtSim;
        const cables = 1 - clamp(Math.max(e * 6, arrastre[3].length() * 3, arrastre[4].length() * 3, arrastre[5].length() * 3, arrastre[6].length() * 3), 0, 1);
        M.cable.opacity = cables;
        M.cable.visible = cables > 0.02;
        estado.pv = { fuerza: clamp(potencia / MODULO_W, 0, 1), cables };
        return {
            cifras: {
                potencia: `${num(potencia)} W`,
                hud: `${reloj(hora)} · seguidor ${num(Math.abs(s.beta * 180 / Math.PI))}° ${s.beta > 0.02 ? 'al oriente' : s.beta < -0.02 ? 'al poniente' : ''}`,
                hora: reloj(hora),
                ghi: `${num(s.ghi)} W/m²`,
                poa: `${num(s.poa * conectado)} W/m²`,
            },
        };
    },

    // corriente: directa de los módulos al inversor (siempre en un sentido, más rápida con más luz); alterna después
    despues(estado) {
        const { corrientes } = piezasPV;
        const { fuerza, cables } = estado.pv;
        const base = { camara: estado.camara, w: estado.w, h: estado.h };
        const polosCA = 1 - clamp(F * estado.lento.k * 2 - 2, 0, 1);
        corrientes.filas.forEach(c => c.actualizar({ ...base, avance: 0.25, corriente: fuerza, dt: estado.dt, visible: cables * clamp(fuerza * 4, 0, 1), polos: 0 }));
        corrientes.cd.actualizar({ ...base, avance: 0.25, corriente: fuerza, dt: estado.dt, visible: cables * clamp(fuerza * 4, 0, 1), polos: 1 });
        const ca = Math.sin(fase) * fuerza;
        const avance = 0.05 * (2 * Math.PI * F);
        corrientes.ca.actualizar({ ...base, avance, corriente: ca, dt: estado.dtSim, visible: cables * clamp(fuerza * 4, 0, 1), polos: polosCA });
        corrientes.red.actualizar({ ...base, avance: avance * 0.4, corriente: ca, dt: estado.dtSim, visible: cables * clamp(fuerza * 4, 0, 1), polos: polosCA });
    },
});
