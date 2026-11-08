// «Central de ciclo combinado», en 3D: una turbina de gas mueve el primer generador; sus gases de escape, aún muy
// calientes, hierven agua en el recuperador de calor (HRSG), y ese vapor mueve una turbina de vapor con el segundo
// generador. El vapor se vuelve agua en el condensador, que se enfría con la torre, y regresa al recuperador.
//
// Entrada: la carga de la planta (30 a 100 %). Los dos generadores giran siempre a 3,600 vueltas por minuto (60 Hz,
// dos polos): la carga cambia la potencia, no la velocidad.
//
// Cifras de una planta típica «1×1» (una turbina de gas y una de vapor). Son aproximadas: sirven para ver las
// proporciones, no los datos de una central en particular.
// - A plena carga: 450 MW, 300 de la turbina de gas y 150 de la de vapor (la de vapor da 50 % más con el mismo gas).
// - Eficiencia: ≈ 58 % en ciclo combinado; la turbina de gas sola, ≈ 38 %. A carga parcial baja: η ≈ 0.58 − 0.12 (1 − c)².
// - Gases de escape de la turbina de gas: ≈ 600 °C (bajan con la carga); salen por la chimenea a ≈ 90 °C.
// - Vapor ≈ 565 °C; condensador ≈ 40 °C.
// - Gas natural: poder calorífico ≈ 50 MJ/kg y densidad ≈ 0.8 kg/m³: a plena carga, 450 ÷ 0.58 ≈ 776 MW de calor
//   = 15.5 kg/s ≈ 19 m³/s ≈ 1.7 millones de m³ al día.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';
import { crearCorriente } from '../comun/corriente.js';

const MW_GAS = 300;
const MW_VAPOR = 150;
const F = 60;
const Y1 = 0.95; // eje de la turbina de gas
const ZV = 1.15; // línea de la turbina de vapor (adelante: la torre va atrás para no taparla)
const Y2 = 0.75; // eje de la turbina de vapor
const PISO = 0.18;

let carga = 1;
let fase = 0;
let cifrasCC = null;
let piezasCC = null;

const eficiencia = c => 0.58 - 0.12 * (1 - c) ** 2;

crearMaquina({
    figura: 'ciclo-combinado',
    nombre: 'la central',
    partes: [
        { n: 1, nombre: 'Entrada de gas natural', ancla: [-2.6, 0.7, 1.4], vista: { tx: -2.4, ty: 0.5, tz: 1.1, az: 20, el: 22, d: 3.2 } },
        { n: 2, nombre: 'Compresor y cámara de combustión', ancla: [-1.6, 1.65, 0.2], vista: { tx: -1.6, ty: 0.95, tz: 0, az: 28, el: 18, d: 3.6 }, corte: true },
        { n: 3, nombre: 'Turbina de gas', ancla: [-0.6, 1.7, 0.2], vista: { tx: -1.4, ty: 0.95, tz: 0, az: 32, el: 16, d: 4.6 }, corte: true },
        { n: 4, nombre: 'Recuperador de calor (HRSG)', ancla: [1.1, 2.3, 0.3], vista: { tx: 1.1, ty: 1.2, tz: 0, az: 26, el: 18, d: 4.4 }, corte: true },
        { n: 5, nombre: 'Turbina de vapor', ancla: [2.4, 1.45, ZV], vista: { tx: 2.6, ty: 0.8, tz: ZV, az: 30, el: 18, d: 3.6 }, corte: true },
        { n: 6, nombre: 'Torre de enfriamiento / Condensador', ancla: [2.85, 1.7, -0.95], vista: { tx: 2.6, ty: 0.9, tz: -0.3, az: 36, el: 16, d: 4.6 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 1.1, tz: 0, az: 22, el: 22, d: 10.4 },
        { id: 'frente', texto: 'Frente', tx: 0, ty: 1.0, tz: 0, az: 0, el: 8, d: 9.6 },
        { id: 'atras', texto: 'Atrás', tx: 0.4, ty: 1.0, tz: -0.5, az: 160, el: 14, d: 9.0 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.5, tz: 0, az: 0, el: 68, d: 10.4 },
        { id: 'adentro', texto: 'Adentro', tx: -0.4, ty: 1.1, tz: 0, az: 20, el: 14, d: 6.0, corte: true },
    ],
    entrada: { etiqueta: 'Carga de la planta', min: 30, max: 100, paso: 1, valor: 100, aria: 'Carga de la planta, en porcentaje' },
    anchoVertical: 1.55,
    lejaniaMax: 3.5,
    hud: '<b data-c="total"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'total', etiqueta: 'Potencia', nota: 'de los dos generadores' },
        { id: 'eficiencia', etiqueta: 'Eficiencia', nota: 'la turbina de gas sola: ≈ 38 %' },
        { id: 'escape', etiqueta: 'Gases de escape', nota: 'al salir de la turbina de gas' },
        { id: 'gas', etiqueta: 'Gas natural', nota: 'lo que consume' },
    ],
    curva: {
        titulo: 'De cada 100 unidades de energía del gas',
        leyenda: [{ texto: 'turbina de gas' }, { texto: 'turbina de vapor' }, { texto: 'calor que se pierde' }],
        nota: 'Sin el recuperador y la turbina de vapor, ese tramo también se perdería por la chimenea.',
        dibujar(g, w, h, estado) {
            if (!cifrasCC) return;
            const { gasPct, vaporPct } = cifrasCC;
            const tramos = [[gasPct, estado.P.acento], [vaporPct, estado.P.tinta], [100 - gasPct - vaporPct, estado.TEMA === 'oscuro' ? '#3a3c44' : '#d9dbdb']];
            g.clearRect(0, 0, w, h);
            let x = 0;
            const alto = Math.min(46, h - 30);
            const y = (h - alto) / 2;
            g.font = '600 13px Manrope, sans-serif';
            g.textBaseline = 'middle';
            for (const [pct, color] of tramos) {
                const ancho = (pct / 100) * w;
                g.fillStyle = color;
                g.fillRect(x, y, Math.max(0, ancho - 2), alto);
                if (ancho > 36) {
                    g.fillStyle = color === estado.P.acento || color === estado.P.tinta ? (estado.TEMA === 'oscuro' ? '#0a0707' : '#ffffff') : estado.P.tinta;
                    if (color === estado.P.tinta && estado.TEMA === 'oscuro') g.fillStyle = '#0a0707';
                    g.fillText(`${Math.round(pct)}`, x + 10, y + alto / 2);
                }
                x += ancho;
            }
        },
    },
    corte: true,

    construir({ raiz, M, P, TEMA, sombra, contorno, aro, conCorte, escena }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.16, 3.8), M.ceramica))).translateY(0.08));
        const vidrio = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false });
        // una pieza torneada a lo largo del eje x: perfil de [x, radio]
        const torneado = (perfil, material) => {
            const puntos = perfil.map(([x, r]) => new THREE.Vector2(r, x));
            const m = sombra(new THREE.Mesh(new THREE.LatheGeometry(puntos, 56).rotateZ(-Math.PI / 2), material));
            return m;
        };
        const ruedaAlabes = (x, radio, alabes, ancho, mat) => {
            const g = new THREE.Group();
            g.position.x = x;
            g.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(radio * 0.45, radio * 0.45, ancho, 24).rotateZ(Math.PI / 2), M.grafito)));
            for (let i = 0; i < alabes; i++) {
                const b = new THREE.Group();
                b.rotation.x = (i / alabes) * Math.PI * 2;
                const a = sombra(new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.8, radio * 0.55, 0.02), mat));
                a.position.y = radio * 0.7;
                a.rotation.y = 0.5;
                b.add(a);
                g.add(b);
            }
            return g;
        };

        // ------------------------------------------------ 2 y 3 · turbina de gas: rotor, carcasa, combustores, generador
        const rotorGas = new THREE.Group();
        rotorGas.position.set(0, Y1, 0);
        rotorGas.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 16).rotateZ(Math.PI / 2), M.acero)).translateX(-1.55));
        // los álabes llegan a 0.975 del radio de su rueda: cada rueda se calcula para quedar 2 cm dentro de su carcasa
        const dentroCompresor = x => 0.41 - (x + 2.25) * (0.11 / 1.05);
        const dentroTurbina = x => 0.32 + (x + 0.95) * (0.17 / 0.75);
        for (let k = 0; k < 6; k++) { const x = -2.1 + k * 0.17; rotorGas.add(ruedaAlabes(x, (dentroCompresor(x) - 0.02) / 0.975, 18, 0.06, M.acero)); }
        for (let k = 0; k < 3; k++) { const x = -0.8 + k * 0.2; rotorGas.add(ruedaAlabes(x, (dentroTurbina(x) - 0.02) / 0.975, 14, 0.08, M.cobre)); }
        raiz.add(rotorGas);
        const carcasaCompresor = torneado([[-2.32, 0.55], [-2.25, 0.47], [-1.2, 0.36], [-1.2, 0.3], [-2.25, 0.41], [-2.32, 0.5]], conCorte(M.ceramica.clone()));
        const carcasaTurbina = torneado([[-0.95, 0.38], [-0.2, 0.55], [-0.2, 0.49], [-0.95, 0.32]], conCorte(M.ceramica.clone()));
        for (const c of [carcasaCompresor, carcasaTurbina]) { c.position.y = Y1; contorno(c, 30, Object.assign(M.contorno.clone(), { clippingPlanes: [c.material.clippingPlanes[0]] })); }
        const bocaAire = Object.assign(aro(0.53, 0.03, -2.32), { material: conCorte(M.borde.clone()) });
        bocaAire.position.y = Y1;
        // cámara de combustión: ocho latas alrededor del eje, con banda guinda
        const combustores = new THREE.Group();
        combustores.position.set(-1.08, Y1, 0);
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const lata = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.34, 16).rotateZ(Math.PI / 2), M.ceramica));
            lata.position.set(0, Math.cos(a) * 0.44, Math.sin(a) * 0.44);
            const banda = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16).rotateZ(Math.PI / 2), M.borde));
            banda.position.copy(lata.position);
            combustores.add(lata, banda);
        }
        const llama = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.05, 10, 48).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ color: P.acento, transparent: true, opacity: 0 }));
        llama.userData.sinResalte = true;
        combustores.add(llama);
        const carcasaGas = new THREE.Group();
        carcasaGas.add(carcasaCompresor, bocaAire, combustores);
        const carcasaTG = new THREE.Group();
        carcasaTG.add(carcasaTurbina);
        raiz.add(carcasaGas, carcasaTG);
        // generador 1 (en el extremo frío) y su base
        const generador = (x, y, z, r, largo) => {
            const g = new THREE.Group();
            g.position.set(x, y, z);
            g.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, largo, 40).rotateZ(Math.PI / 2), M.ceramica)), 40));
            g.add(aro(r, 0.026, largo / 2), aro(r, 0.026, -largo / 2));
            const pie = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(largo * 0.8, y - 0.16 - r * 0.5, r * 1.4), M.ceramica)));
            pie.position.y = -(y - 0.16) / 2 - r * 0.25;
            g.add(pie);
            return g;
        };
        const gen1 = generador(-2.95, Y1, 0, 0.4, 0.8);
        raiz.add(gen1);
        // ducto de escape: de la turbina al recuperador
        const ducto = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.2, 0.84), conCorte(M.ceramica.clone()))));
        ducto.position.set(0.1, 0.16 + 0.6 + 0.1, 0);
        raiz.add(ducto);

        // ------------------------------------------------ 4 · recuperador de calor: caja, chimenea, domo y tubos por dentro
        const hrsg = new THREE.Group();
        const cajaHRSG = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.74, 0.9), conCorte(M.ceramica.clone()))), 30, Object.assign(M.contorno.clone(), { clippingPlanes: [] }));
        cajaHRSG.position.set(1.1, 0.16 + 0.87, 0);
        cajaHRSG.children[0].material.clippingPlanes = cajaHRSG.material.clippingPlanes;
        const chimenea = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.2, 28), M.ceramica)));
        chimenea.position.set(1.55, 1.9 + 0.6, 0);
        const bocaChimenea = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 10, 32).rotateX(Math.PI / 2), M.borde));
        bocaChimenea.position.set(1.55, 3.1, 0);
        const domo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.8, 24).rotateX(Math.PI / 2), M.ceramica));
        domo.position.set(0.85, 2.04, 0);
        const tapasDomo = [-0.4, 0.4].map(z => { const t = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.03, 24).rotateX(Math.PI / 2), M.borde)); t.position.set(0.85, 2.04, z); return t; });
        hrsg.add(cajaHRSG, chimenea, bocaChimenea, domo, ...tapasDomo);
        raiz.add(hrsg);
        const tubos = new THREE.Group();
        const tuboMat = M.cobre.clone();
        for (const x of [0.65, 0.95, 1.25]) for (let i = 0; i < 6; i++) {
            const t = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.3, 10), tuboMat));
            t.position.set(x, 0.95, -0.32 + i * 0.13);
            tubos.add(t);
        }
        raiz.add(tubos);

        // ------------------------------------------------ 5 · turbina de vapor y generador 2
        const rotorVapor = new THREE.Group();
        rotorVapor.position.set(0, Y2, ZV);
        rotorVapor.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 14).rotateZ(Math.PI / 2), M.acero)).translateX(2.55));
        for (let k = 0; k < 4; k++) rotorVapor.add(ruedaAlabes(1.95 + k * 0.17, 0.22 + k * 0.05, 14, 0.06, M.acero));
        raiz.add(rotorVapor);
        const carcasaVapor = torneado([[1.82, 0.28], [2.6, 0.44], [2.6, 0.38], [1.82, 0.22]], conCorte(M.ceramica.clone()));
        carcasaVapor.position.set(0, Y2, ZV);
        contorno(carcasaVapor, 30, Object.assign(M.contorno.clone(), { clippingPlanes: [carcasaVapor.material.clippingPlanes[0]] }));
        const turbinaVapor = new THREE.Group();
        turbinaVapor.add(carcasaVapor);
        for (const x of [1.82, 2.6]) { const a = Object.assign(aro(x < 2 ? 0.28 : 0.44, 0.022, x), { material: conCorte(M.borde.clone()) }); a.position.y = Y2; a.position.z = ZV; turbinaVapor.add(a); }
        raiz.add(turbinaVapor);
        const gen2 = generador(3.1, Y2, ZV, 0.36, 0.7);
        raiz.add(gen2);

        // ------------------------------------------------ 6 · condensador y torre de enfriamiento
        const enfriamiento = new THREE.Group();
        const condensador = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.45), M.ceramica)));
        condensador.position.set(2.35, 0.37, 0.45);
        const perfilTorre = [];
        for (let i = 0; i <= 16; i++) {
            const t = i / 16;
            const y = 0.16 + t * 1.6;
            const r = 0.38 + 0.2 * (2 * t - 1.25) ** 2 * (t < 0.62 ? 1 : 0.75);
            perfilTorre.push(new THREE.Vector2(r, y));
        }
        const torre = sombra(new THREE.Mesh(new THREE.LatheGeometry(perfilTorre, 48), new THREE.MeshPhysicalMaterial({ color: P.ceramica, roughness: 0.5, clearcoat: 0.6, side: THREE.DoubleSide })));
        contorno(torre, 50);
        torre.position.set(2.85, 0, -0.95);
        torre.scale.setScalar(0.85);
        const bocaTorre = sombra(new THREE.Mesh(new THREE.TorusGeometry(perfilTorre.at(-1).x, 0.025, 10, 48).rotateX(Math.PI / 2), M.borde));
        bocaTorre.position.set(2.85, 0.16 + 1.6 * 0.85, -0.95);
        bocaTorre.scale.setScalar(0.85);
        enfriamiento.add(condensador, torre, bocaTorre);
        raiz.add(enfriamiento);

        // ------------------------------------------------ 1 · entrada de gas: tubo de vidrio, válvula y medidor
        const entradaGas = new THREE.Group();
        const valvula = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 10, 32).rotateY(Math.PI / 2), M.borde));
        valvula.position.set(-2.6, 0.48, 1.4);
        const vastago = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 10), M.grafito));
        vastago.position.set(-2.6, 0.36, 1.4);
        const medidor = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.24), M.ceramica)));
        medidor.position.set(-2.05, 0.31, 1.4);
        entradaGas.add(valvula, vastago, medidor);
        raiz.add(entradaGas);

        // ------------------------------------------------ tuberías de vidrio y lo que corre por ellas
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const tubo = (c, r) => { const m = new THREE.Mesh(new THREE.TubeGeometry(c, 80, r, 12, false), vidrio); m.renderOrder = 2; raiz.add(m); return m; };
        const rutas = {
            gas: curva([-3.7, 0.26, 1.4], [-2.6, 0.26, 1.4], [-1.6, 0.26, 1.2], [-1.15, 0.3, 0.7], [-1.08, 0.5, 0.48]),
            aire: curva([-3.3, 2.0, 0.6], [-2.9, 1.6, 0.35], [-2.5, Y1 + 0.05, 0.1], [-2.0, Y1, 0]),
            escape: curva([-0.4, Y1, 0], [0.1, 0.95, 0], [0.6, 0.95, 0.15], [1.1, 1.15, -0.15], [1.45, 1.6, 0], [1.55, 2.0, 0], [1.55, 3.1, 0], [1.6, 3.8, 0.05]),
            vapor: curva([0.85, 2.04, 0.4], [1.0, 2.3, 0.75], [1.65, 1.9, ZV], [1.78, Y2 + 0.06, ZV]),
            aCondensador: curva([2.62, Y2, ZV], [2.7, 0.5, 0.9], [2.45, 0.5, 0.6]),
            alimentacion: curva([2.1, 0.26, 0.45], [1.85, PISO + 0.08, 0.3], [1.7, PISO + 0.08, 0.3], [1.65, 0.3, 0.3]),
            torreIda: curva([2.6, 0.3, 0.25], [2.65, PISO + 0.08, -0.2], [2.72, PISO + 0.1, -0.62]),
            torreVuelta: curva([2.98, PISO + 0.1, -0.62], [2.85, PISO + 0.08, -0.2], [2.5, 0.3, 0.25]),
            pluma: curva([2.85, 1.45, -0.95], [2.88, 2.2, -0.95], [3.0, 3.0, -1.0]),
        };
        tubo(rutas.gas, 0.05);
        tubo(rutas.vapor, 0.05);
        tubo(rutas.aCondensador, 0.06);
        tubo(rutas.alimentacion, 0.035);
        tubo(rutas.torreIda, 0.04);
        tubo(rutas.torreVuelta, 0.04);
        // flujos: puntos que corren por cada ruta, con su color
        const flujo = (ruta, n, radio, color, opacidad = 1) => {
            const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacidad });
            const im = new THREE.InstancedMesh(new THREE.SphereGeometry(radio, 10, 8), mat, n);
            im.frustumCulled = false;
            im.renderOrder = 3;
            raiz.add(im);
            return { ruta, n, im, mat, f: 0 };
        };
        const flujos = {
            gas: flujo(rutas.gas, 20, 0.028, P.tinta, 0.7),
            aire: flujo(rutas.aire, 26, 0.03, P.suave, 0.55),
            escape: flujo(rutas.escape, 40, 0.045, '#ffffff'), // el color de cada punto lo pone paso()
            vapor: flujo(rutas.vapor, 18, 0.035, TEMA === 'oscuro' ? '#ffffff' : '#c9ccd3'),
            aCondensador: flujo(rutas.aCondensador, 10, 0.035, TEMA === 'oscuro' ? '#ffffff' : '#c9ccd3'),
            alimentacion: flujo(rutas.alimentacion, 10, 0.026, P.agua),
            torreIda: flujo(rutas.torreIda, 10, 0.028, P.agua),
            torreVuelta: flujo(rutas.torreVuelta, 10, 0.028, P.agua),
            pluma: flujo(rutas.pluma, 16, 0.09, TEMA === 'oscuro' ? '#ffffff' : '#e6e4df', 0.55),
        };
        // los gases se enfrían: guinda a la salida de la turbina, gris al salir por la chimenea
        const caliente = new THREE.Color(P.acento);
        const frio = new THREE.Color(P.suave);
        for (let i = 0; i < flujos.escape.n; i++) flujos.escape.im.setColorAt(i, caliente);

        // ------------------------------------------------ electricidad: de cada generador por la base a la red
        const poste = new THREE.Group();
        poste.position.set(0.6, 0.16, -1.7);
        poste.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 10), M.grafito)).translateY(0.75));
        poste.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.05), M.grafito)).translateY(1.4));
        raiz.add(poste);
        const cables = [
            curva([-2.95, 0.45, -0.3], [-2.9, PISO, -0.6], [-1.5, PISO, -1.55], [0.45, PISO, -1.62], [0.55, 0.25, -1.68]),
            curva([3.1, 0.4, ZV - 0.28], [3.35, PISO, 0.6], [3.4, PISO, -1.3], [1.4, PISO, -1.76], [0.68, PISO, -1.74], [0.65, 0.25, -1.72]),
        ];
        cables.forEach(c => raiz.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 64, 0.022, 8, false), M.cable))));
        const corrientes = cables.map(c => crearCorriente({ raiz, escena, curvas: [c], P }));

        piezasCC = { rotorGas, rotorVapor, llama, tuboMat, flujos, caliente, frio, corrientes, vidrio };
        return {
            piezas: { 1: [entradaGas], 2: [carcasaGas], 3: [carcasaTG, rotorGas, gen1], 4: [hrsg, tubos, ducto], 5: [turbinaVapor, rotorVapor, gen2], 6: [enfriamiento] },
            // las carcasas suben y dejan ver los álabes y los tubos; generadores y torre se abren hacia afuera
            movibles: [
                { parte: 1, objetos: [entradaGas], hacia: [-0.3, 0, 0.35] },
                { parte: 2, objetos: [carcasaGas], hacia: [0, 1.05, 0] },
                { parte: 3, objetos: [carcasaTG], hacia: [0, 1.05, 0] },
                { parte: 3, objetos: [gen1], hacia: [-0.45, 0, 0] },
                { parte: 4, objetos: [hrsg], hacia: [0, 1.5, 0] },
                { parte: 5, objetos: [turbinaVapor], hacia: [0, 0.9, 0] },
                { parte: 5, objetos: [gen2], hacia: [0.45, 0, 0] },
                { parte: 6, objetos: [enfriamiento], hacia: [0.4, 0, -0.35] },
            ],
            anclas: { 1: [entradaGas, [-2.3, 0.75, 1.4]], 2: [carcasaGas, [-1.7, 1.7, 0]], 3: [carcasaTG, [-0.55, 1.75, 0]], 4: [hrsg, [1.1, 2.35, 0]], 5: [turbinaVapor, [2.2, 1.45, ZV]], 6: [enfriamiento, [2.85, 1.75, -0.95]] },
        };
    },

    paso(estado) {
        const { rotorGas, rotorVapor, llama, tuboMat, flujos, caliente, frio, vidrio } = piezasCC;
        const { dt, dtSim, e, arrastre, M } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.6));
        carga = estado.entrada / 100;
        // desarmado o con una pieza fuera, la planta se detiene
        const armado = 1 - clamp(Math.max(e * 8, ...[1, 2, 3, 4, 5, 6].map(n => arrastre[n].length() * 3)), 0, 1);
        const c = carga * armado;
        fase += 2 * Math.PI * F * dtSim * armado;
        rotorGas.rotation.x = fase;
        rotorVapor.rotation.x = fase;
        const eta = eficiencia(carga);
        const mwGas = MW_GAS * c;
        const mwVapor = MW_VAPOR * c;
        const total = mwGas + mwVapor;
        const calor = total / eta; // MW de calor del gas
        const m3dia = (calor * 1e6 / 50e6) / 0.8 * 86400 / 1e6; // millones de m³ al día
        const escape = 600 - 120 * (1 - carga);
        cifrasCC = { gasPct: (mwGas / calor) * 100 || 0, vaporPct: (mwVapor / calor) * 100 || 0 };
        if (!c) cifrasCC = { gasPct: 0, vaporPct: 0 };
        llama.material.opacity = 0.75 * c;
        tuboMat.emissive.set(estado.P.acento);
        tuboMat.emissiveIntensity = 0.25 * c;

        // los flujos avanzan con la carga (en tiempo de pantalla, para que se vean a cualquier cámara lenta)
        const m4 = new THREE.Matrix4();
        const p = new THREE.Vector3();
        const col = new THREE.Color();
        const vel = { gas: 0.35, aire: 0.4, escape: 0.22, vapor: 0.35, aCondensador: 0.3, alimentacion: 0.25, torreIda: 0.25, torreVuelta: 0.25, pluma: 0.08 };
        for (const [k, fl] of Object.entries(flujos)) {
            fl.f = (fl.f + dt * vel[k] * (0.3 + 0.7 * c)) % 1;
            fl.im.visible = c > 0.02;
            for (let i = 0; i < fl.n; i++) {
                const u = ((i / fl.n) + fl.f) % 1;
                fl.ruta.getPointAt(u, p);
                const s = k === 'pluma' ? 0.4 + u * 1.4 : 1;
                m4.makeScale(s, s, s).setPosition(p);
                fl.im.setMatrixAt(i, m4);
                if (k === 'escape') fl.im.setColorAt(i, col.copy(caliente).lerp(frio, clamp((u - 0.35) / 0.5, 0, 1)));
            }
            fl.im.instanceMatrix.needsUpdate = true;
            if (fl.im.instanceColor) fl.im.instanceColor.needsUpdate = true;
            if (k === 'pluma') fl.mat.opacity = 0.5 * c;
        }
        const visibles = 1 - clamp(e * 6, 0, 1);
        vidrio.opacity = 0.22 * visibles;
        M.cable.opacity = visibles;
        M.cable.visible = visibles > 0.02;
        estado.cc = { c, visibles };

        return {
            cifras: {
                total: `${num(total)} MW`,
                hud: c ? `${num(mwGas)} de gas + ${num(mwVapor)} de vapor · ${num(eta * 100)} %` : 'Detenida',
                eficiencia: `${num(eta * 100 * (c ? 1 : 0))} %`,
                escape: `${num(c ? escape : 25)} °C`,
                gas: `${num(m3dia * (c ? 1 : 0), 1)} millones de m³/día`,
            },
        };
    },

    despues(estado) {
        const { corrientes } = piezasCC;
        const { c, visibles } = estado.cc;
        const polos = 1 - clamp(F * estado.lento.k * 2 - 2, 0, 1);
        const avance = 0.05 * (2 * Math.PI * F);
        const sen = Math.sin(fase);
        // corriente alterna de 60 Hz de cada generador: la del de gas es el doble que la del de vapor
        corrientes[0].actualizar({ avance, corriente: sen * c, dt: estado.dtSim, visible: visibles * clamp(c * 4, 0, 1), polos, camara: estado.camara, w: estado.w, h: estado.h });
        corrientes[1].actualizar({ avance: avance * 0.5, corriente: sen * c, dt: estado.dtSim, visible: visibles * clamp(c * 4, 0, 1), polos, camara: estado.camara, w: estado.w, h: estado.h });
    },
});
