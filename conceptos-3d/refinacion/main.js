// «Refinación: torre de destilación», en 3D: el horno calienta el crudo, que entra a la base de la torre (zona flash);
// el vapor sube por los platos y se enfría: lo pesado se condensa abajo y lo ligero llega arriba. Cada corte sale por su
// tubo a su tanque: gas y GLP por el domo, nafta del tambor de reflujo, turbosina y diésel por los lados, residuo abajo.
//
// Entrada: la temperatura del horno (280 a 390 °C). Más caliente, más del crudo se vaporiza: sube el diésel y baja el
// residuo. Arriba de ~380 °C el crudo empieza a romperse (se forma coque en los tubos del horno).
//
// Cifras (típicas, verificar si se citan en un texto):
// - Crudo mediano tipo Istmo (≈ 33 °API) y una torre de 150,000 barriles al día.
// - Curva de destilación (porcentaje del crudo que ya hirvió a cada temperatura): 2 % a 40 °C, 26 % a 200 °C,
//   37 % a 250 °C, 58 % a 340 °C, 62 % a 370 °C, 66 % a 400 °C.
// - En la zona flash se vaporiza lo que hierve hasta unos 20 °C menos que la salida del horno: a 370 °C, ≈ 60 %.
// - Cortes a 370 °C: gas y GLP 2 %, nafta 24 %, turbosina 11 %, diésel 21 %, residuo ≈ 42 %.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const CRUDO_BD = 150000;
const CURVA = [[0, 0], [40, 2], [200, 26], [250, 37], [340, 58], [370, 62], [400, 66], [450, 72]];
const destilado = T => {
    for (let i = 1; i < CURVA.length; i++) {
        const [t0, f0] = CURVA[i - 1];
        const [t1, f1] = CURVA[i];
        if (T <= t1) return f0 + (f1 - f0) * (clamp(T, t0, t1) - t0) / (t1 - t0);
    }
    return CURVA.at(-1)[1];
};
// cortes por rango de ebullición (°C)
const CORTES = [
    { id: 'glp', nombre: 'Gas y GLP', de: 0, a: 40, color: '#b9c2c9' },
    { id: 'nafta', nombre: 'Nafta', de: 40, a: 200, color: '#e2c95c' },
    { id: 'turbosina', nombre: 'Turbosina', de: 200, a: 250, color: '#d6c39a' },
    { id: 'diesel', nombre: 'Diésel', de: 250, a: 340, color: '#c8964a' },
];
const BASE = 0.16;
const XT = 0.2; // torre
const RT = 0.42;
const ALTO_T = 3.6;
const ALTURA = { residuo: 0.42, flash: 0.95, diesel: 1.65, turbosina: 2.35, domo: BASE + ALTO_T };

let horno = 370;
let rendimientos = null;
let piezasR = null;

function cortes(T) {
    const flash = T - 20;
    const vapor = destilado(flash);
    const salida = CORTES.map(c => ({ ...c, pct: Math.max(0, Math.min(destilado(c.a), vapor) - destilado(c.de)) }));
    const residuo = 100 - vapor;
    return { vapor, salida, residuo };
}

crearMaquina({
    figura: 'refinacion',
    nombre: 'la torre',
    partes: [
        { n: 1, nombre: 'Horno de carga', ancla: [-2.2, 1.9, 0.3], vista: { tx: -2.1, ty: 0.9, tz: 0.3, az: 24, el: 18, d: 3.8 }, corte: true },
        { n: 2, nombre: 'Zona de vaporización (Flash)', ancla: [XT, ALTURA.flash + 0.3, RT], vista: { tx: XT - 0.4, ty: ALTURA.flash, tz: 0, az: 20, el: 14, d: 3.2 }, corte: true },
        { n: 3, nombre: 'Gas y GLP (domo, <40 °C)', ancla: [XT, ALTURA.domo + 0.25, 0], vista: { tx: 1.0, ty: 3.0, tz: -0.6, az: 28, el: 16, d: 4.2 } },
        { n: 4, nombre: 'Nafta (≈40–200 °C)', ancla: [2.75, 1.25, -0.55], vista: { tx: 1.8, ty: 1.4, tz: -0.8, az: 30, el: 18, d: 4.2 } },
        { n: 5, nombre: 'Corte de turbosina y queroseno (medio, ~180-250 °C)', ancla: [XT + RT, ALTURA.turbosina + 0.2, 0.1], vista: { tx: 1.2, ty: 1.7, tz: 0.2, az: 32, el: 14, d: 4.2 } },
        { n: 6, nombre: 'Corte de diésel (medio-bajo, ~250-340 °C)', ancla: [XT + RT, ALTURA.diesel + 0.2, 0.2], vista: { tx: 1.3, ty: 1.2, tz: 0.6, az: 30, el: 14, d: 4.2 } },
        { n: 7, nombre: 'Residuo atmosférico (fondo, >350 °C)', ancla: [1.6, 1.0, 1.4], vista: { tx: 1.0, ty: 0.6, tz: 0.9, az: 30, el: 18, d: 3.6 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0.1, ty: 1.7, tz: 0, az: 24, el: 16, d: 10.6 },
        { id: 'frente', texto: 'Frente', tx: 0.1, ty: 1.7, tz: 0, az: 0, el: 6, d: 10.0 },
        { id: 'arriba', texto: 'Arriba', tx: 0.1, ty: 0.6, tz: 0, az: 0, el: 70, d: 10.4 },
        { id: 'adentro', texto: 'Adentro', tx: XT, ty: 2.0, tz: 0, az: 16, el: 8, d: 5.4, corte: true },
    ],
    entrada: { etiqueta: 'Temperatura del horno', min: 280, max: 390, paso: 1, valor: 370, aria: 'Temperatura de salida del horno, en grados' },
    lento: [{ id: 'normal', texto: 'Normal', k: 1, nota: 'Los flujos se mueven a ritmo de maqueta.' }],
    anchoVertical: 1.5,
    lejaniaMax: 3.4,
    // en el recorrido el horno sube de 300 a 380 °C y vuelve a bajar
    entradaRecorrido: t => 340 + 40 * Math.sin((t / 36) * Math.PI * 2),
    hud: '<b data-c="horno"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'vapor', etiqueta: 'Se vaporiza', nota: 'en la zona flash' },
        { id: 'nafta', etiqueta: 'Nafta', nota: 'barriles al día (base de la gasolina)' },
        { id: 'diesel', etiqueta: 'Diésel', nota: 'barriles al día' },
        { id: 'residuo', etiqueta: 'Residuo', nota: 'barriles al día (a la torre de vacío)' },
    ],
    curva: {
        titulo: 'Qué sale de cada 100 barriles de crudo',
        leyenda: [{ texto: 'GLP' }, { texto: 'nafta' }, { texto: 'turbosina' }, { texto: 'diésel' }],
        nota: 'El resto es residuo: con más calor en el horno, menos residuo y más diésel.',
        dibujar(g, w, h, estado) {
            if (!rendimientos) return;
            g.clearRect(0, 0, w, h);
            const alto = Math.min(40, h - 30);
            const y = (h - alto) / 2;
            let x = 0;
            const tramos = [...rendimientos.salida.map(c => [c.pct, c.color, c.nombre]), [rendimientos.residuo, estado.TEMA === 'oscuro' ? '#5a4a40' : '#3a2f2a', 'Residuo']];
            g.font = '700 12px Manrope, sans-serif';
            g.textBaseline = 'middle';
            for (const [pct, color, nombre] of tramos) {
                const ancho = (pct / 100) * w;
                g.fillStyle = color;
                g.fillRect(x, y, Math.max(0, ancho - 2), alto);
                if (ancho > 44) {
                    g.fillStyle = nombre === 'Residuo' ? '#f4f2ee' : '#0a0707';
                    g.fillText(`${Math.round(pct)} %`, x + 6, y + alto / 2);
                }
                x += ancho;
            }
        },
    },
    corte: true,

    construir({ raiz, M, P, TEMA, sombra, contorno, aro, conCorte }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.16, 3.8), M.ceramica))).translateY(0.08));
        const vidrio = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false });
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const rotulo = (texto, ancho, alto) => {
            const c = document.createElement('canvas');
            c.width = 256;
            c.height = Math.round(256 * alto / ancho);
            const g = c.getContext('2d');
            g.fillStyle = P.tinta;
            g.font = '700 46px Manrope, sans-serif';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText(texto, 128, c.height / 2 + 2);
            const t = new THREE.CanvasTexture(c);
            t.colorSpace = THREE.SRGBColorSpace;
            return new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
        };

        // tanque de crudo (de donde sale la carga), no es parte de la ficha
        const crudo = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.75, 40), M.ceramica)), 40);
        crudo.position.set(-3.3, BASE + 0.375, -1.1);
        const rCrudo = rotulo('Crudo', 0.5, 0.13);
        rCrudo.position.set(-3.3, BASE + 0.45, -0.67);
        raiz.add(crudo, rCrudo);

        // 1 · horno: caja blanca con ventana de fuego, serpentín por dentro y chimenea
        const hornoG = new THREE.Group();
        hornoG.position.set(-2.2, BASE, 0.3);
        const caja = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 0.9), conCorte(M.ceramica.clone()))), 30, Object.assign(M.contorno.clone(), { clippingPlanes: [] }));
        caja.position.y = 0.65;
        caja.children[0].material.clippingPlanes = caja.material.clippingPlanes;
        const chimenea = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.9, 24), M.ceramica)));
        chimenea.position.set(0.3, 1.3 + 0.95, -0.1);
        const boca = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 10, 28).rotateX(Math.PI / 2), M.borde));
        boca.position.set(0.3, 3.2, -0.1);
        const llama = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.5), new THREE.MeshBasicMaterial({ color: P.acento, transparent: true, opacity: 0.7 }));
        llama.position.y = 0.25;
        llama.userData.sinResalte = true;
        const serpentinMat = M.cobre.clone();
        for (let i = 0; i < 6; i++) {
            const t = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 10).rotateZ(Math.PI / 2), serpentinMat));
            t.position.set(0, 0.5 + i * 0.13, -0.18);
            hornoG.add(t);
        }
        hornoG.add(caja, chimenea, boca, llama);
        raiz.add(hornoG);

        // la torre: casco blanco que se corta, aros guinda, platos por dentro, faldón abajo
        const torre = new THREE.Group();
        torre.position.set(XT, 0, 0);
        const casco = sombra(new THREE.Mesh(new THREE.CylinderGeometry(RT, RT, ALTO_T, 48, 1, true), conCorte(M.ceramica.clone())));
        casco.position.y = BASE + ALTO_T / 2;
        contorno(casco, 30, Object.assign(M.contorno.clone(), { clippingPlanes: casco.material.clippingPlanes }));
        const tapa = sombra(new THREE.Mesh(new THREE.SphereGeometry(RT, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), conCorte(M.ceramica.clone())));
        tapa.position.y = BASE + ALTO_T;
        torre.add(casco, tapa);
        for (const y of [ALTURA.flash, ALTURA.diesel, ALTURA.turbosina, BASE + ALTO_T - 0.05]) {
            const a = Object.assign(aro(RT + 0.005, 0.02, 0), { material: conCorte(M.borde.clone()) });
            a.rotation.z = Math.PI / 2;
            a.position.y = y;
            torre.add(a);
        }
        const platos = new THREE.Group();
        for (let y = ALTURA.flash + 0.25; y < BASE + ALTO_T - 0.2; y += 0.22) {
            const plato = sombra(new THREE.Mesh(new THREE.CylinderGeometry(RT - 0.02, RT - 0.02, 0.02, 40, 1, false, 0, Math.PI * 1.75), M.acero));
            plato.position.y = y;
            plato.rotation.y = (Math.round(y / 0.22) % 2) * Math.PI;
            platos.add(plato);
        }
        torre.add(platos);
        raiz.add(torre);
        // el vapor que sube por dentro de la torre: guinda (caliente) abajo, gris (frío) arriba
        const VAPOR = 60;
        const vapor = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }), VAPOR);
        vapor.frustumCulled = false;
        const caliente = new THREE.Color(P.acento);
        const frio = new THREE.Color(P.suave);
        for (let i = 0; i < VAPOR; i++) vapor.setColorAt(i, caliente);
        raiz.add(vapor);

        // 2 · zona flash: la línea de transferencia del horno a la base de la torre (vidrio) y su boquilla guinda
        const flash = new THREE.Group();
        const transferencia = curva([-1.6, 0.95, 0.3], [-1.0, 1.05, 0.25], [-0.5, ALTURA.flash, 0.15], [XT - RT, ALTURA.flash, 0.05]);
        const tuboT = new THREE.Mesh(new THREE.TubeGeometry(transferencia, 48, 0.06, 12, false), vidrio);
        tuboT.renderOrder = 2;
        const boquilla = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 10, 24).rotateY(Math.PI / 2), M.borde));
        boquilla.position.set(XT - RT, ALTURA.flash, 0.05);
        flash.add(tuboT, boquilla);
        raiz.add(flash);

        // 3 · domo: línea de vapores al condensador (enfriador de aire), tambor de reflujo y esfera de GLP
        const domo = new THREE.Group();
        const condensador = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, 0.6), M.ceramica)));
        condensador.position.set(1.45, 2.95, -1.05);
        const ventiladores = [];
        for (const x of [-0.2, 0.2]) {
            const v = new THREE.Group();
            v.position.set(1.45 + x, 3.04, -1.05);
            for (let i = 0; i < 3; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.04), M.grafito); a.rotation.y = (i / 3) * Math.PI; v.add(a); }
            ventiladores.push(v);
            domo.add(v);
        }
        for (const [x, z] of [[1.1, -1.3], [1.8, -1.3], [1.1, -0.8], [1.8, -0.8]]) {
            const pata = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.8, 0.05), M.grafito));
            pata.position.set(x, BASE + 1.4, z);
            domo.add(pata);
        }
        const esfera = contorno(sombra(new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 20), M.ceramica)), 40);
        esfera.position.set(2.9, BASE + 0.58, -1.35);
        const piesEsfera = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.22, 24), M.grafito));
        piesEsfera.position.set(2.9, BASE + 0.11, -1.35);
        const rGlp = rotulo('GLP', 0.3, 0.1);
        rGlp.position.set(2.9, BASE + 0.58, -0.985);
        domo.add(condensador, esfera, piesEsfera, rGlp);
        raiz.add(domo);
        // 4 · nafta: tambor de reflujo (horizontal) y tanque de nafta
        const naftaG = new THREE.Group();
        const tambor = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.75, 28).rotateZ(Math.PI / 2), M.ceramica)), 40);
        tambor.position.set(1.45, 1.25, -1.05);
        naftaG.add(tambor);
        // tanques de producto (nafta, turbosina, diésel, residuo)
        const tanque = (x, z, r, alto, texto) => {
            const g = new THREE.Group();
            g.position.set(x, BASE, z);
            g.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, alto, 36), M.ceramica)), 40).translateY(alto / 2));
            g.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(r + 0.005, r + 0.005, 0.05, 36, 1, true), M.borde)).translateY(alto - 0.06));
            const rt = rotulo(texto, 0.52, 0.13);
            rt.position.set(0, alto * 0.55, r + 0.01);
            g.add(rt);
            return g;
        };
        const tNafta = tanque(2.85, -0.45, 0.3, 0.75, 'Nafta');
        naftaG.add(tNafta);
        raiz.add(naftaG);
        const tTurbo = tanque(2.85, 0.35, 0.28, 0.7, 'Turbosina');
        const tDiesel = tanque(2.85, 1.15, 0.3, 0.75, 'Diésel');
        const tResiduo = tanque(1.55, 1.35, 0.3, 0.6, 'Residuo');
        const turbosinaG = new THREE.Group();
        const dieselG = new THREE.Group();
        const residuoG = new THREE.Group();
        turbosinaG.add(tTurbo);
        dieselG.add(tDiesel);
        residuoG.add(tResiduo);
        raiz.add(turbosinaG, dieselG, residuoG);

        // tuberías de vidrio y lo que corre por ellas (con el color de cada producto)
        const rutas = {
            carga: curva([-3.3, 0.3, -0.65], [-3.0, 0.24, -0.2], [-2.7, 0.3, 0.3], [-2.65, 0.55, 0.3]),
            transferencia,
            domo: curva([XT, ALTURA.domo + RT - 0.05, 0], [XT + 0.2, ALTURA.domo + 0.55, -0.3], [1.1, 3.2, -0.9], [1.2, 3.0, -1.05]),
            reflujo: curva([1.7, 2.9, -1.05], [1.85, 2.2, -1.05], [1.75, 1.45, -1.05]),
            glp: curva([1.6, 1.4, -1.05], [2.2, 1.4, -1.3], [2.6, 0.95, -1.35]),
            nafta: curva([1.75, 1.15, -1.0], [2.2, 0.6, -0.7], [2.62, 0.75, -0.48]),
            turbosina: curva([XT + RT, ALTURA.turbosina, 0.05], [1.2, 2.1, 0.2], [2.3, 1.1, 0.35], [2.65, 0.82, 0.35]),
            diesel: curva([XT + RT, ALTURA.diesel, 0.15], [1.3, 1.4, 0.7], [2.3, 1.0, 1.1], [2.62, 0.85, 1.15]),
            residuo: curva([XT + 0.2, ALTURA.residuo, RT - 0.1], [0.7, 0.3, 1.0], [1.3, 0.35, 1.3], [1.4, 0.68, 1.35]),
        };
        for (const [k, c] of Object.entries(rutas)) {
            if (k === 'transferencia') continue;
            const m = new THREE.Mesh(new THREE.TubeGeometry(c, 56, k === 'domo' ? 0.06 : 0.04, 10, false), vidrio);
            m.renderOrder = 2;
            raiz.add(m);
        }
        const color = { carga: '#3a2f2a', transferencia: P.acento, domo: P.suave, reflujo: CORTES[1].color, glp: CORTES[0].color, nafta: CORTES[1].color, turbosina: CORTES[2].color, diesel: CORTES[3].color, residuo: TEMA === 'oscuro' ? '#7a6658' : '#3a2f2a' };
        const flujos = Object.fromEntries(Object.entries(rutas).map(([k, ruta]) => {
            const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: color[k] }), 16);
            im.frustumCulled = false;
            im.renderOrder = 3;
            raiz.add(im);
            return [k, { im, ruta, f: 0 }];
        }));

        piezasR = { flujos, vapor, VAPOR, caliente, frio, llama, serpentinMat, ventiladores, vidrio };
        return {
            piezas: { 1: [hornoG], 2: [flash], 3: [domo], 4: [naftaG], 5: [turbosinaG], 6: [dieselG], 7: [residuoG] },
            // el casco de la torre se va atrás y deja ver los platos; el horno sube; los tanques se abren
            movibles: [
                { parte: 1, objetos: [hornoG], hacia: [-0.4, 0, 0.4] },
                { parte: 2, objetos: [casco, tapa], hacia: [0, 0, -1.7] },
                { parte: 3, objetos: [domo], hacia: [0.2, 0.6, -0.3] },
                { parte: 4, objetos: [naftaG], hacia: [0.4, 0, -0.1] },
                { parte: 5, objetos: [turbosinaG], hacia: [0.4, 0, 0.1] },
                { parte: 6, objetos: [dieselG], hacia: [0.4, 0, 0.3] },
                { parte: 7, objetos: [residuoG], hacia: [0.1, 0, 0.45] },
            ],
            anclas: { 1: [hornoG, [0, 1.6, 0]], 2: [flash, [XT - 0.3, ALTURA.flash + 0.35, 0.2]], 3: [domo, [1.45, 3.3, -1.05]], 4: [naftaG, [2.85, 1.15, -0.45]], 5: [turbosinaG, [2.85, 1.1, 0.35]], 6: [dieselG, [2.85, 1.15, 1.15]], 7: [residuoG, [1.55, 1.0, 1.35]] },
        };
    },

    paso(estado) {
        const { flujos, vapor, VAPOR, caliente, frio, llama, serpentinMat, ventiladores, vidrio } = piezasR;
        const { dt, e } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.5));
        horno = estado.entrada;
        const operando = 1 - clamp(e * 8, 0, 1);
        rendimientos = cortes(horno);
        const { salida, residuo, vapor: pctVapor } = rendimientos;
        const pct = Object.fromEntries(salida.map(c => [c.id, c.pct]));
        // el fuego y el serpentín: más calor, más brillo
        const calor = clamp((horno - 280) / 110, 0, 1);
        llama.material.opacity = (0.35 + 0.55 * calor) * operando;
        serpentinMat.emissive.set(estado.P.acento);
        serpentinMat.emissiveIntensity = (0.1 + 0.35 * calor) * operando;
        ventiladores.forEach(v => { v.rotation.y += dt * 12 * operando; });

        // flujos: la velocidad de cada uno sigue a su caudal
        const m4 = new THREE.Matrix4();
        const p = new THREE.Vector3();
        const vel = { carga: 1, transferencia: 1, domo: (pct.glp + pct.nafta) / 26, reflujo: pct.nafta / 24, glp: pct.glp / 2, nafta: pct.nafta / 24, turbosina: pct.turbosina / 11, diesel: pct.diesel / 21, residuo: residuo / 42 };
        for (const [k, fl] of Object.entries(flujos)) {
            const v = clamp(vel[k], 0, 1.6) * operando;
            fl.f = (fl.f + dt * 0.3 * v) % 1;
            fl.im.visible = v > 0.02;
            for (let i = 0; i < 16; i++) {
                fl.ruta.getPointAt(((i / 16) + fl.f) % 1, p);
                m4.makeTranslation(p.x, p.y, p.z);
                fl.im.setMatrixAt(i, m4);
            }
            fl.im.instanceMatrix.needsUpdate = true;
        }
        // vapor dentro de la torre: sube desde la zona flash; llega más alto cuanto más se vaporizó
        const tope = ALTURA.flash + (ALTURA.domo - ALTURA.flash) * clamp(pctVapor / 62, 0.3, 1);
        const col = new THREE.Color();
        vapor.visible = operando > 0.02;
        for (let i = 0; i < VAPOR; i++) {
            const u = ((i / VAPOR) + estado.T * 0.12) % 1;
            const y = ALTURA.flash + u * (tope - ALTURA.flash);
            const a = i * 2.4;
            const r = 0.12 + ((i * 37) % 10) / 10 * 0.22;
            m4.makeTranslation(XT + Math.cos(a) * r, y, Math.sin(a) * r);
            vapor.setMatrixAt(i, m4);
            vapor.setColorAt(i, col.copy(caliente).lerp(frio, (y - ALTURA.flash) / (ALTURA.domo - ALTURA.flash)));
        }
        vapor.instanceMatrix.needsUpdate = true;
        if (vapor.instanceColor) vapor.instanceColor.needsUpdate = true;
        vidrio.opacity = 0.22 * (1 - clamp(e * 6, 0, 1));

        const bd = x => num(Math.round(CRUDO_BD * x / 100 / 100) * 100);
        return {
            cifras: {
                horno: `${num(horno)} °C`,
                hud: horno > 380 ? 'Demasiado caliente: el crudo se rompe y forma coque' : `${num(CRUDO_BD)} barriles de crudo al día · se vaporiza ${num(pctVapor)} %`,
                vapor: `${num(pctVapor)} %`,
                nafta: `${bd(pct.nafta)} b/d`,
                diesel: `${bd(pct.diesel)} b/d`,
                residuo: `${bd(residuo)} b/d`,
            },
        };
    },
});
