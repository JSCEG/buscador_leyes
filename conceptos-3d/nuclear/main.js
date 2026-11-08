// «Central nuclear», en 3D: un reactor de agua en ebullición. En el núcleo, el uranio se fisiona y calienta el agua, que
// hierve dentro de la vasija; el vapor va directo a la turbina, que mueve al generador; luego el condensador, enfriado con
// agua de mar, lo vuelve agua y una bomba la regresa al reactor. Las barras de control, que entran por abajo, frenan la
// reacción en cadena. Todo el reactor está dentro de un edificio de contención.
//
// Entrada: cuánto se sacan las barras de control (%). Botón: operación normal o paro (las barras entran de golpe).
//
// Modelo (calculado aquí, de ejemplo): 2,350 MW térmicos a plena potencia, 34 % de eficiencia (unos 800 MW eléctricos);
// cada fisión libera unos 200 MeV, así que se fisiona alrededor de 1 gramo de uranio-235 por cada MW térmico al día.
// Fuentes técnicas: DOE, «Nuclear 101: How Does a Nuclear Reactor Work?»; EIA, «Nuclear power plants»; OpenStax, fisión.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const BASE = 0.16;
const P_TERMICA = 2350;
const EFICIENCIA = 0.34;
const XR = -1.4;

let piezasN = null;
let tiempo = 0;
let barrasFuera = 85;
let potencia = 0.82;
let giro = 0;
const fraccion = fuera => clamp((fuera - 15) / 85, 0, 1);

crearMaquina({
    figura: 'nuclear',
    nombre: 'la central nuclear',
    partes: [
        { n: 1, nombre: 'Combustible (núcleo)', ancla: [XR, 1.2, 0.3], vista: { tx: XR, ty: 0.8, tz: 0, az: 4, el: 8, d: 2.0 }, corte: true },
        { n: 2, nombre: 'Barras de control', ancla: [XR - 0.2, 0.6, 0.35], vista: { tx: XR, ty: 0.6, tz: 0, az: 8, el: 6, d: 2.0 }, corte: true },
        { n: 3, nombre: 'Vasija del reactor', ancla: [XR + 0.3, 1.6, 0.3], vista: { tx: XR, ty: 0.9, tz: 0, az: 6, el: 10, d: 2.6 }, corte: true },
        { n: 4, nombre: 'Edificio de contención', ancla: [XR, 2.3, 0.5], vista: { tx: XR, ty: 1.0, tz: 0, az: 16, el: 14, d: 3.6 } },
        { n: 5, nombre: 'Turbina y generador', ancla: [0.9, 1.3, 0], vista: { tx: 0.9, ty: 0.7, tz: 0, az: 10, el: 18, d: 2.6 } },
        { n: 6, nombre: 'Condensador y agua de mar', ancla: [1.4, 0.6, 0.9], vista: { tx: 1.2, ty: 0.4, tz: 0.6, az: -8, el: 18, d: 2.8 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: -0.2, ty: 0.9, tz: 0, az: 14, el: 16, d: 7.4 },
        { id: 'reactor', texto: 'El reactor', tx: XR, ty: 0.85, tz: 0, az: 6, el: 8, d: 2.8, corte: true },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.3, tz: 0, az: 0, el: 70, d: 7.4 },
    ],
    entrada: { etiqueta: 'Barras de control fuera', min: 0, max: 100, paso: 1, valor: 85, aria: 'Cuánto se sacan las barras de control, en porcentaje' },
    selectores: [{ id: 'modo', etiqueta: 'Operación', valor: 'normal', opciones: [{ id: 'normal', texto: 'Operación' }, { id: 'paro', texto: 'Paro' }] }],
    lento: [
        { id: 'real', texto: 'Normal', k: 1, nota: 'El vapor sale del reactor, mueve la turbina y regresa como agua.' },
        { id: 'lento', texto: 'Despacio', k: 0.35, nota: 'Más despacio, para seguir el camino del agua y del vapor.' },
    ],
    hud: '<b data-c="mwe"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'termica', etiqueta: 'Calor del reactor', nota: 'potencia térmica' },
        { id: 'potencia', etiqueta: 'Potencia del reactor', nota: 'de su máximo' },
        { id: 'uranio', etiqueta: 'Uranio-235 al día', nota: 'que se fisiona' },
        { id: 'barras', etiqueta: 'Barras de control', nota: 'dentro del núcleo' },
    ],
    curva: {
        titulo: 'Potencia según las barras de control',
        leyenda: [{ texto: 'potencia eléctrica (MW)' }],
        nota: 'Modelo simplificado: con las barras dentro no hay reacción en cadena; al sacarlas, la reacción y el calor suben.',
        dibujar(g, w, h, estado) {
            const x = b => (b / 100) * (w - 10) + 5;
            const y = p => h - 6 - (p / (P_TERMICA * EFICIENCIA)) * (h - 14);
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath();
            for (let b = 0; b <= 100; b += 1) { const p = fraccion(b) * P_TERMICA * EFICIENCIA; if (b === 0) g.moveTo(x(b), y(p)); else g.lineTo(x(b), y(p)); }
            g.stroke();
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(barrasFuera), y(potencia * P_TERMICA * EFICIENCIA), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: true,
    anchoVertical: 1.6,
    lejaniaMax: 2.8,
    entradaRecorrido: t => 55 + 40 * Math.sin(t * 0.25),

    construir({ raiz, M, P, TEMA, sombra, contorno, conCorte }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.16, 3.0), M.ceramica))).translateY(0.08));
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));

        // 4 · edificio de contención: cilindro con cúpula (se corta con «Ver por dentro»)
        const contencion = new THREE.Group();
        contencion.position.set(XR, BASE, 0);
        const muroMat = conCorte(M.ceramica.clone());
        contencion.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.55, 48, 1, true), muroMat)), 40).translateY(0.775));
        contencion.add(sombra(new THREE.Mesh(new THREE.SphereGeometry(0.85, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), muroMat)).translateY(1.55));
        contencion.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.025, 10, 60).rotateX(Math.PI / 2), conCorte(M.borde.clone()))).translateY(1.55));
        raiz.add(contencion);

        // 3 · vasija del reactor, con el agua y las burbujas
        const vasija = new THREE.Group();
        vasija.position.set(XR, BASE + 0.15, 0);
        const casco = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.1, 40, 1, true), conCorte(M.acero.clone())));
        casco.position.y = 0.6;
        const tapa = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.32, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), conCorte(M.acero.clone())));
        tapa.position.y = 1.15;
        const fondo = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.32, 40, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), conCorte(M.acero.clone())));
        fondo.position.y = 0.05;
        const agua = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.85, 36), M.agua);
        agua.position.y = 0.48;
        vasija.add(casco, tapa, fondo, agua);
        // 1 · el núcleo: barras de combustible que brillan con la potencia
        const nucleo = new THREE.Group();
        nucleo.position.y = 0.42;
        const barrasComb = [];
        const brillo = new THREE.MeshStandardMaterial({ color: P.grafito, emissive: P.acento, emissiveIntensity: 0, roughness: 0.4, metalness: 0.3 });
        for (let i = -3; i <= 3; i++) for (let j = -1; j <= 1; j++) {
            const b = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 8), brillo);
            b.position.set(i * 0.06, 0, j * 0.06);
            nucleo.add(b);
            barrasComb.push(b);
        }
        vasija.add(nucleo);
        // 2 · barras de control: cruces que suben desde abajo, entre el combustible
        const control = new THREE.Group();
        for (const i of [-2.5, -0.5, 1.5]) {
            const c = new THREE.Group();
            c.position.set(i * 0.06 + 0.03, 0, 0.03);
            c.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.012), M.grafito)), sombra(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.45, 0.05), M.grafito)));
            c.add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6), M.acero).translateY(-0.45));
            control.add(c);
        }
        vasija.add(control);
        const burbujas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }), 40);
        burbujas.frustumCulled = false;
        const semillas = Array.from({ length: 40 }, (_, i) => [((i * 37) % 40) / 40, ((i * 13) % 40) / 40, ((i * 7) % 40) / 40]);
        vasija.add(burbujas);
        raiz.add(vasija);

        // 5 · turbina y generador, en su nave
        const nave = new THREE.Group();
        nave.position.set(0.9, BASE, 0);
        nave.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.7), M.ceramica))).translateY(0.125));
        nave.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.03, 0.72), M.borde)).translateY(0.25));
        const carcasa = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.6, 28).rotateZ(Math.PI / 2), M.ceramica)), 40);
        carcasa.position.set(-0.3, 0.48, 0);
        const eje = new THREE.Group();
        eje.position.set(0, 0.48, 0);
        eje.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 12).rotateZ(Math.PI / 2), M.acero)));
        for (let i = 0; i < 8; i++) { const b = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.36, 0.04), M.borde)); b.position.x = 0.08; b.rotation.x = (i * Math.PI) / 8; eje.add(b); }
        const gen = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.4, 28).rotateZ(Math.PI / 2), M.cobre)), 40);
        gen.position.set(0.4, 0.48, 0);
        nave.add(carcasa, eje, gen);
        raiz.add(nave);

        // 6 · condensador bajo la turbina y el agua de mar que lo enfría
        const condensador = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.5), M.grafito)));
        condensador.position.set(0.6, BASE + 0.1, 0.65);
        raiz.add(condensador);
        const mar = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.04, 0.5), M.agua);
        mar.position.set(0, BASE + 0.02, 1.25);
        raiz.add(mar);
        const vidrio = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, transparent: true, opacity: 0.3, clearcoat: 1, depthWrite: false });
        const flujos = [];
        const tubo = (c, r, color, n, vel) => {
            const t = new THREE.Mesh(new THREE.TubeGeometry(c, 64, r, 10, false), vidrio);
            t.renderOrder = 2;
            raiz.add(t);
            const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r * 0.75, 8, 6), new THREE.MeshBasicMaterial({ color }), n);
            im.frustumCulled = false;
            im.renderOrder = 3;
            raiz.add(im);
            flujos.push({ c, im, n, vel });
            return t;
        };
        const VAPOR = TEMA === 'oscuro' ? '#f1efea' : '#ffffff';
        const lineaVapor = tubo(curva([XR, BASE + 1.42, 0], [XR + 0.4, BASE + 1.5, 0], [XR + 1.0, BASE + 1.35, 0], [0.3, BASE + 0.9, 0], [0.45, BASE + 0.6, 0]), 0.04, VAPOR, 18, 0.35);
        const retorno = tubo(curva([0.4, BASE + 0.1, 0.65], [-0.1, BASE + 0.06, 0.75], [-0.5, BASE + 0.06, 0.5], [XR + 0.55, BASE + 0.15, 0.2], [XR + 0.3, BASE + 0.3, 0.05]), 0.03, P.agua, 16, 0.2);
        const marEntra = tubo(curva([1.6, BASE + 0.03, 1.15], [1.4, BASE + 0.08, 0.95], [0.95, BASE + 0.1, 0.7]), 0.03, P.agua, 8, 0.3);
        const marSale = tubo(curva([0.25, BASE + 0.1, 0.7], [0.0, BASE + 0.08, 0.95], [-0.2, BASE + 0.03, 1.15]), 0.03, P.agua, 8, 0.3);
        // línea a la red
        const linea = curva([1.3, BASE + 0.6, -0.2], [1.8, BASE + 1.4, -0.9], [2.8, BASE + 1.1, -1.0]);
        raiz.add(new THREE.Mesh(new THREE.TubeGeometry(linea, 32, 0.012, 6, false), M.grafito));
        const poste = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.03, 1.1, 4), M.borde));
        poste.position.set(2.8, BASE + 0.55, -1.0);
        raiz.add(poste);

        piezasN = { control, brillo, burbujas, semillas, flujos, eje };
        return {
            piezas: { 1: [nucleo], 2: [control], 3: [casco, tapa, fondo], 4: [contencion], 5: [nave], 6: [condensador, mar, marEntra, marSale] },
            movibles: [
                { parte: 4, objetos: [contencion], hacia: [0, 0.9, 0] },
                { parte: 5, objetos: [nave], hacia: [0.2, 0.4, -0.3] },
            ],
            anclas: { 1: [nucleo, [0, 0.25, 0.1]], 2: [control, [0, -0.1, 0.1]], 3: [vasija, [0.3, 1.2, 0]], 4: [contencion, [0, 2.0, 0.3]], 5: [nave, [0, 0.8, 0]], 6: [condensador, [0, 0.3, 0]] },
        };
    },

    paso(estado) {
        const N = piezasN;
        const { dt, dtSim, e } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.5));
        const paro = estado.sel.modo === 'paro';
        barrasFuera += ((paro ? 0 : estado.entrada) - barrasFuera) * (1 - Math.exp(-dt / (paro ? 0.15 : 0.5)));
        const objetivo = fraccion(barrasFuera);
        potencia += (objetivo - potencia) * (1 - Math.exp(-dtSim / 1.5));
        tiempo += dtSim;
        // las barras de control suben desde abajo: dentro (0 % fuera) llegan a la mitad del núcleo
        N.control.position.y = 0.42 - (barrasFuera / 100) * 0.5;
        N.brillo.emissiveIntensity = 1.4 * potencia;
        giro += dtSim * 6 * potencia;
        N.eje.rotation.x = giro;
        const m = new THREE.Matrix4();
        const q = new THREE.Vector3();
        N.burbujas.visible = potencia > 0.03;
        if (N.burbujas.visible) {
            N.semillas.forEach(([a, b, c], i) => {
                const u = (b + tiempo * (0.2 + 0.5 * potencia)) % 1;
                m.makeTranslation((a - 0.5) * 0.5, 0.25 + u * 0.6, (c - 0.5) * 0.5);
                m.scale(new THREE.Vector3(1, 1, 1).multiplyScalar(i / 40 < potencia ? 1 : 0));
                N.burbujas.setMatrixAt(i, m);
            });
            N.burbujas.instanceMatrix.needsUpdate = true;
        }
        N.flujos.forEach(f => {
            f.im.visible = potencia > 0.03 && e < 0.2;
            if (!f.im.visible) return;
            for (let i = 0; i < f.n; i++) { f.c.getPointAt(((i / f.n) + tiempo * f.vel * (0.3 + potencia)) % 1, q); m.makeTranslation(q.x, q.y, q.z); f.im.setMatrixAt(i, m); }
            f.im.instanceMatrix.needsUpdate = true;
        });

        const termica = potencia * P_TERMICA;
        return {
            cifras: {
                mwe: `${num(termica * EFICIENCIA)} MW`,
                hud: paro ? 'Paro: las barras entran y la reacción en cadena se detiene' : potencia < 0.03 ? 'Barras dentro: no hay reacción en cadena' : 'El uranio se fisiona, el agua hierve y el vapor mueve la turbina',
                termica: `${num(termica)} MW`,
                potencia: `${num(potencia * 100)} %`,
                uranio: `${num(termica / 950, 1)} kg`,
                barras: `${num(100 - barrasFuera)} %`,
            },
        };
    },
});
