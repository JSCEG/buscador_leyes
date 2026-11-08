// «Gasoductos», en 3D: un tramo de 300 km de un ducto de gas natural, enterrado. Al inicio, la trampa donde se mete el
// «diablo»; a los 75 km, una válvula de seccionamiento; a los 150 km, una estación de compresión; al final, la estación
// de regulación y medición (City Gate) que baja la presión y le agrega el olor antes de entregar el gas.
//
// Entrada: el gas que se envía (0 a 100 % de la capacidad). La válvula se puede cerrar.
//
// Cifras típicas de un ducto grande (verificar si se citan en un texto; no son de un ducto en particular):
// - Tubo de 42 pulgadas (1.07 m), presión de transporte 70 bar, gas a ≈ 8 m/s a plena carga: ≈ 50 millones de m³ al día.
// - La presión cae a lo largo del tubo: P₁² − P₂² = k · Q² · L (forma de la fórmula de Weymouth). Calibrada para que a
//   plena carga baje de 70 a 45 bar en 150 km; la estación de compresión la regresa a 70 (relación 1.5).
// - City Gate: 20 bar a la central eléctrica y 4 bar a la red de la ciudad; ahí se agrega el mercaptano (el olor).
// - Con la válvula cerrada el gas deja de pasar: antes de la válvula la presión sube a 70 bar en todo el tramo; después,
//   la ciudad sigue consumiendo y el tramo se va vaciando.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const P0 = 70; // bar
const P_LLEGADA_PLENA = 45;
const KM = 300;
const K = (P0 ** 2 - P_LLEGADA_PLENA ** 2) / 150; // bar²/km a plena carga
const CAPACIDAD = 50; // millones de m³ al día
const V_PLENA = 8; // m/s
const KM_VALVULA = 75;
const KM_COMPRESION = 150;
const X0 = -3.5;
const X1 = 3.5;
const xKm = km => X0 + (km / KM) * (X1 - X0);
const Y_TUBO = 0.36;
const SUELO = 0.6; // cara de arriba de la tierra
const R_TUBO = 0.11;

let flujo = 1;
let pAbajo = P_LLEGADA_PLENA; // presión al final cuando la válvula se cierra (se va vaciando)
let perfil = null;
let piezasG = null;

// presión a lo largo del ducto (km) para un flujo q (0 a 1), con la válvula abierta
function presion(km, q) {
    const tramo = km < KM_COMPRESION ? km : km - KM_COMPRESION;
    return Math.sqrt(Math.max(0, P0 ** 2 - K * q * q * tramo));
}

crearMaquina({
    figura: 'gasoductos',
    nombre: 'el gasoducto',
    partes: [
        { n: 1, nombre: 'Tubería enterrada', ancla: [xKm(40), Y_TUBO + 0.15, 0.2], vista: { tx: xKm(40), ty: 0.45, tz: 0, az: 18, el: 16, d: 3.0 }, corte: true },
        { n: 2, nombre: 'Estación de compresión', ancla: [xKm(150), 1.75, 0], vista: { tx: xKm(150), ty: 0.9, tz: 0, az: 26, el: 20, d: 3.8 } },
        { n: 3, nombre: 'Válvula de seccionamiento', ancla: [xKm(75), 1.2, 0], vista: { tx: xKm(75), ty: 0.7, tz: 0, az: 22, el: 16, d: 2.6 }, corte: true },
        { n: 4, nombre: 'Trampa de diablos', ancla: [-3.35, 1.25, -0.6], vista: { tx: -3.1, ty: 0.75, tz: -0.4, az: -30, el: 18, d: 3.0 }, corte: true },
        { n: 5, nombre: 'Estación de regulación y medición (City Gate)', ancla: [3.0, 1.6, 0], vista: { tx: 2.9, ty: 0.9, tz: 0.2, az: 32, el: 20, d: 3.6 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 0.6, tz: 0, az: 20, el: 26, d: 8.8 },
        { id: 'frente', texto: 'Frente', tx: 0, ty: 0.7, tz: 0, az: 0, el: 8, d: 9.6 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.3, tz: 0, az: 0, el: 70, d: 10.2 },
        { id: 'adentro', texto: 'Adentro', tx: -1.4, ty: 0.5, tz: 0, az: 14, el: 10, d: 4.6, corte: true },
    ],
    entrada: { etiqueta: 'Gas que se envía', min: 0, max: 100, paso: 1, valor: 100, aria: 'Gas que se envía, en porcentaje de la capacidad' },
    selectores: [{ id: 'valvula', etiqueta: 'Válvula de seccionamiento', valor: 'abierta', opciones: [{ id: 'abierta', texto: 'Válvula abierta' }, { id: 'cerrada', texto: 'Válvula cerrada' }] }],
    lento: [{ id: 'real', texto: 'Normal', k: 1, nota: 'El gas real va a unos 8 m/s: aquí se ve mucho más rápido.' }],
    anchoVertical: 1.6,
    lejaniaMax: 3.6,
    hud: '<b data-c="flujoCorto"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'flujo', etiqueta: 'Gas', nota: 'millones de m³ al día' },
        { id: 'compresion', etiqueta: 'En la compresora', nota: 'llega → sale' },
        { id: 'llegada', etiqueta: 'Llega al City Gate', nota: 'y sale a 20 bar y a 4 bar' },
        { id: 'velocidad', etiqueta: 'Velocidad del gas', nota: 'dentro del tubo' },
    ],
    curva: {
        titulo: 'Presión a lo largo del ducto',
        leyenda: [{ texto: 'ahora' }, { texto: 'sin flujo' }],
        nota: 'Por el roce con el tubo la presión baja; la estación de compresión la vuelve a subir a los 150 km.',
        dibujar(g, w, h, estado) {
            if (!perfil) return;
            const x = km => (km / KM) * w;
            const y = p => h - 8 - (p / 80) * (h - 16);
            g.clearRect(0, 0, w, h);
            g.strokeStyle = estado.TEMA === 'oscuro' ? '#262a36' : '#d9dbdb';
            g.lineWidth = 1;
            for (const km of [KM_VALVULA, KM_COMPRESION]) { g.beginPath(); g.moveTo(x(km), 4); g.lineTo(x(km), h - 4); g.stroke(); }
            g.setLineDash([4, 4]);
            g.strokeStyle = estado.P.tinta;
            g.beginPath(); g.moveTo(0, y(P0)); g.lineTo(w, y(P0)); g.stroke();
            g.setLineDash([]);
            g.strokeStyle = estado.P.acento;
            g.lineWidth = 2.4;
            g.beginPath();
            for (let px = 0; px <= w; px += 2) {
                const p = perfil(px / w * KM);
                if (px === 0) g.moveTo(px, y(p)); else g.lineTo(px, y(p));
            }
            g.stroke();
            g.fillStyle = estado.P.suave;
            g.font = '600 11px Manrope, sans-serif';
            g.fillText('válvula', x(KM_VALVULA) + 4, 14);
            g.fillText('compresora', x(KM_COMPRESION) + 4, 14);
            g.fillText(`${num(perfil(KM))} bar`, w - 54, y(perfil(KM)) - 6);
        },
    },
    corte: true,

    construir({ raiz, M, P, TEMA, sombra, contorno, aro, conCorte }) {
        // base y tierra (la tierra se corta con «Ver por dentro» y deja ver el tubo enterrado)
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.16, 3.2), M.ceramica))).translateY(0.08));
        // tierra translúcida: se ve el tubo enterrado y lo que corre por dentro
        const tierraMat = conCorte(new THREE.MeshPhysicalMaterial({ color: TEMA === 'oscuro' ? '#5a5048' : '#d9cfc0', roughness: 0.9, transparent: true, opacity: 0.5, depthWrite: false }));
        const tierra = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.6, SUELO - 0.16, 3.2), tierraMat)), 30, Object.assign(M.contorno.clone(), { clippingPlanes: tierraMat.clippingPlanes }));
        tierra.position.y = 0.16 + (SUELO - 0.16) / 2;
        raiz.add(tierra);
        // 1 · tubería: acero con recubrimiento (grafito), soldaduras guinda cada tramo; también se corta
        const ducto = new THREE.Group();
        const tuboMat = conCorte(M.grafito.clone());
        const tubo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(R_TUBO, R_TUBO, X1 - X0 + 0.4, 40, 1, true).rotateZ(Math.PI / 2), tuboMat));
        tubo.position.y = Y_TUBO;
        ducto.add(tubo);
        for (let x = X0; x <= X1; x += 0.5) {
            const s = Object.assign(aro(R_TUBO + 0.006, 0.012, x), { material: conCorte(M.borde.clone()) });
            s.position.y = Y_TUBO;
            ducto.add(s);
        }
        raiz.add(ducto);
        // el gas por dentro: puntos claros (el tubo es oscuro por dentro) que avanzan con el flujo
        const GAS = 70;
        const gasMat = new THREE.MeshBasicMaterial({ color: TEMA === 'oscuro' ? '#f1efea' : '#e6e4df', transparent: true, opacity: 0.9 });
        const gas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), gasMat, GAS);
        gas.frustumCulled = false;
        raiz.add(gas);
        // el diablo: un cilindro grafito con copas guinda que viaja por dentro del tubo
        const diablo = new THREE.Group();
        diablo.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 20).rotateZ(Math.PI / 2), M.grafito)));
        for (const x of [-0.1, 0.1]) diablo.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(R_TUBO - 0.01, R_TUBO - 0.01, 0.04, 24).rotateZ(Math.PI / 2), M.borde)).translateX(x));
        diablo.position.set(X0, Y_TUBO, 0);
        raiz.add(diablo);

        const sobreSuelo = y => SUELO + y;
        // 4 · trampa de diablos (lanzador): un barril más ancho, inclinado, con su tapa guinda, unido al ducto
        const trampa = new THREE.Group();
        trampa.position.set(-3.35, 0, -0.6);
        const barril = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.9, 32).rotateZ(Math.PI / 2), conCorte(M.ceramica.clone()))), 40);
        barril.position.set(0.1, sobreSuelo(0.35), 0);
        const tapa = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 32).rotateZ(Math.PI / 2), M.borde));
        tapa.position.set(-0.38, sobreSuelo(0.35), 0);
        const bajada = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 20), M.grafito));
        bajada.position.set(0.5, sobreSuelo(0.05), 0);
        const apoyo = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.25), M.ceramica)));
        apoyo.position.set(-0.15, sobreSuelo(0.1), 0);
        trampa.add(barril, tapa, bajada, apoyo);
        const receptor = trampa.clone();
        receptor.position.set(3.35 - 0.6, 0, -0.75);
        receptor.rotation.y = Math.PI; // el receptor mira al revés: el diablo llega por la derecha
        raiz.add(trampa, receptor);
        // 3 · válvula de seccionamiento: cuerpo esférico enterrado, vástago y actuador con volante guinda arriba
        const valvula = new THREE.Group();
        valvula.position.set(xKm(KM_VALVULA), 0, 0);
        const cuerpo = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 18), conCorte(M.ceramica.clone())));
        cuerpo.position.y = Y_TUBO;
        const vastago = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, SUELO - Y_TUBO + 0.25, 12), M.grafito));
        vastago.position.y = (Y_TUBO + SUELO + 0.25) / 2;
        const actuador = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.24), M.ceramica)));
        actuador.position.y = sobreSuelo(0.33);
        const volante = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 10, 36).rotateX(Math.PI / 2), M.borde));
        volante.position.y = sobreSuelo(0.5);
        const disco = new THREE.Mesh(new THREE.CylinderGeometry(R_TUBO - 0.01, R_TUBO - 0.01, 0.02, 24).rotateZ(Math.PI / 2), M.borde);
        disco.position.y = Y_TUBO;
        disco.userData.sinResalte = true;
        valvula.add(cuerpo, vastago, actuador, volante, disco);
        raiz.add(valvula);
        // 2 · estación de compresión: nave blanca, dos turbocompresores, chimeneas y tubos que suben del ducto
        const estacion = new THREE.Group();
        estacion.position.set(xKm(KM_COMPRESION), 0, 0);
        const nave = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.9), M.ceramica)));
        nave.position.set(0, sobreSuelo(0.35), -0.55);
        const techo = sombra(new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.05, 0.94), M.borde));
        techo.position.set(0, sobreSuelo(0.72), -0.55);
        estacion.add(nave, techo);
        const helices = [];
        for (const z of [0.15, 0.6]) {
            const unidad = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.7, 32).rotateZ(Math.PI / 2), M.ceramica)), 40);
            unidad.position.set(0, sobreSuelo(0.22), z);
            const rim1 = aro(0.17, 0.018, -0.35); rim1.position.set(-0.35, sobreSuelo(0.22), z);
            const rim2 = aro(0.17, 0.018, 0.35); rim2.position.set(0.35, sobreSuelo(0.22), z);
            const chimenea = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 14), M.grafito));
            chimenea.position.set(0.25, sobreSuelo(0.6), z);
            const helice = new THREE.Group();
            helice.position.set(-0.36, sobreSuelo(0.22), z);
            for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.24, 0.05), M.grafito); a.rotation.x = i * Math.PI / 4; helice.add(a); }
            helices.push(helice);
            estacion.add(unidad, rim1, rim2, chimenea, helice);
        }
        for (const x of [-0.3, 0.3]) {
            const subida = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, SUELO - Y_TUBO + 0.22, 16), M.grafito));
            subida.position.set(x, (Y_TUBO + SUELO + 0.22) / 2, 0.15);
            estacion.add(subida);
        }
        raiz.add(estacion);
        // 5 · City Gate: casa blanca, dos reguladores guinda, medidor, tanque de odorante y las dos salidas
        const city = new THREE.Group();
        city.position.set(3.0, 0, 0);
        const casa = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.6), M.ceramica)));
        casa.position.set(0.2, sobreSuelo(0.275), -0.65);
        city.add(casa);
        const subidaC = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, SUELO - Y_TUBO + 0.25, 16), M.grafito));
        subidaC.position.set(-0.4, (Y_TUBO + SUELO + 0.25) / 2, 0);
        const colector = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 16).rotateZ(Math.PI / 2), M.grafito));
        colector.position.set(0.05, sobreSuelo(0.25), 0);
        city.add(subidaC, colector);
        for (const x of [-0.15, 0.2]) {
            const reg = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 20), M.borde));
            reg.position.set(x, sobreSuelo(0.36), 0);
            city.add(reg);
        }
        const medidor = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), M.ceramica)));
        medidor.position.set(0.45, sobreSuelo(0.25), 0);
        const odorante = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.34, 24), M.ceramica)), 40);
        odorante.position.set(0.1, sobreSuelo(0.17), 0.45);
        const rotulo = (() => {
            const c = document.createElement('canvas');
            c.width = 256;
            c.height = 64;
            const g = c.getContext('2d');
            g.fillStyle = P.tinta;
            g.font = '700 30px Manrope, sans-serif';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText('mercaptano', 128, 34);
            const t = new THREE.CanvasTexture(c);
            t.colorSpace = THREE.SRGBColorSpace;
            const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
            m.position.set(0.1, sobreSuelo(0.2), 0.572);
            return m;
        })();
        city.add(medidor, odorante, rotulo);
        raiz.add(city);
        // el gas que se ve: sube por tubos de vidrio en la compresora y en el City Gate (puntos en tinta)
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const rutaGas = curva(...[X0, -3.0, -2.0, -1.0, 0, 1.0, 2.0, 2.6].map(x => [x, Y_TUBO, 0]));

        piezasG = { gas, gasMat, GAS, diablo, disco, helices, rutaGas, volante };
        return {
            piezas: { 1: [ducto], 2: [estacion], 3: [valvula], 4: [trampa, receptor], 5: [city] },
            // la tierra se va hacia atrás y deja el tubo a la vista; lo de arriba sube
            movibles: [
                { parte: 1, objetos: [tierra], hacia: [0, -0.02, -1.6] },
                { parte: 2, objetos: [estacion], hacia: [0, 0.6, 0] },
                { parte: 3, objetos: [valvula], hacia: [0, 0.5, 0.4] },
                { parte: 4, objetos: [trampa], hacia: [-0.3, 0.5, -0.2] },
                { parte: 5, objetos: [city], hacia: [0.3, 0.5, 0] },
            ],
            anclas: { 1: [ducto, [xKm(40), Y_TUBO + 0.25, 0.3]], 2: [estacion, [0, 1.5, -0.4]], 3: [valvula, [0, 1.25, 0]], 4: [trampa, [0, 1.0, 0]], 5: [city, [0, 1.35, 0]] },
        };
    },

    paso(estado) {
        const { gas, gasMat, GAS, diablo, disco, helices, rutaGas, volante } = piezasG;
        const { dt, e } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.5));
        const abierta = estado.sel.valvula === 'abierta';
        // desarmado no pasa gas
        const q = (estado.entrada / 100) * (1 - clamp(e * 8, 0, 1));
        flujo += ((abierta ? q : 0) - flujo) * (1 - Math.exp(-dt / 0.8));
        const llegaAbierta = presion(KM, flujo);
        // con la válvula cerrada el tramo de adelante se vacía (la ciudad sigue consumiendo) hasta 20 bar
        pAbajo += ((abierta ? llegaAbierta : 20) - pAbajo) * (1 - Math.exp(-dt / (abierta ? 0.6 : 6)));
        perfil = km => {
            if (abierta) return presion(km, flujo);
            return km < KM_VALVULA ? P0 : pAbajo;
        };

        // gas por dentro y el diablo: avanzan con el flujo
        const avance = flujo * 0.18 * dt;
        const m4 = new THREE.Matrix4();
        const p = new THREE.Vector3();
        gas.userData.f = ((gas.userData.f || 0) + avance) % 1;
        for (let i = 0; i < GAS; i++) {
            const u = ((i / GAS) + gas.userData.f) % 1;
            rutaGas.getPointAt(u, p);
            p.y += Math.sin(i * 7.1) * 0.05;
            p.z += Math.cos(i * 3.7) * 0.05;
            // con la válvula cerrada, del otro lado de ella ya casi no hay gas
            const lejos = !abierta && p.x > xKm(KM_VALVULA);
            const s = lejos ? clamp((pAbajo - 20) / 25, 0.15, 1) : 1;
            m4.makeScale(s, s, s).setPosition(p);
            gas.setMatrixAt(i, m4);
        }
        gas.instanceMatrix.needsUpdate = true;
        gasMat.opacity = 0.9;
        diablo.userData.u = ((diablo.userData.u || 0) + avance * 0.6) % 1;
        diablo.position.x = X0 + 0.3 + diablo.userData.u * (X1 - X0 - 0.8);
        // la válvula: el disco gira 90° al cerrar; el volante también
        const meta = abierta ? 0 : Math.PI / 2;
        disco.rotation.y += ((abierta ? Math.PI / 2 : 0) - disco.rotation.y) * (1 - Math.exp(-dt / 0.3));
        volante.rotation.y += (meta * 3 - volante.rotation.y) * (1 - Math.exp(-dt / 0.3));
        helices.forEach(hh => { hh.rotation.x += dt * 20 * flujo; });

        const llegaCompresora = abierta ? presion(KM_COMPRESION - 0.001, flujo) : P0;
        const llega = abierta ? llegaAbierta : pAbajo;
        const mm3 = CAPACIDAD * flujo;
        const v = V_PLENA * flujo * (P0 + P_LLEGADA_PLENA) / 2 / Math.max(20, (P0 + llega) / 2);
        return {
            cifras: {
                flujo: `${num(mm3, 1)} millones`,
                flujoCorto: `${num(mm3, 1)} millones de m³`,
                hud: abierta ? `al día · ${num(llegaCompresora)} → ${num(P0)} bar en la compresora · ${num(v, 1)} m/s` : 'Válvula cerrada: el gas no pasa',
                compresion: abierta ? `${num(llegaCompresora)} → ${num(P0)} bar` : 'sin flujo',
                llegada: `${num(llega)} bar`,
                velocidad: `${num(v, 1)} m/s`,
            },
        };
    },
});
