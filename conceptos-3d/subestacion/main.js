// «Subestación eléctrica», en 3D: una subestación de distribución que recibe una línea de 115 kV y entrega 13.8 kV a
// los circuitos de la ciudad. De izquierda a derecha: la línea que llega a su marco, las cuchillas (seccionadores), el
// interruptor de potencia, el transformador, las barras de 13.8 kV con sus alimentadores, y la caseta de control.
//
// Entrada: la carga de la zona (MW). Con la misma potencia, del lado de 13.8 kV pasa unas 8.3 veces más corriente que
// del lado de 115 kV. Botón «Mantenimiento»: primero abre el interruptor (corta la corriente) y después las cuchillas
// (dejan una abertura que se ve); al volver, se cierran en orden inverso.
//
// Cifras: I = P ÷ (√3 × V), con factor de potencia 1 para no complicar; transformador de ejemplo de 30 MVA.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';
import { crearCorriente } from '../comun/corriente.js';

const F = 60;
const V_ALTA = 115;
const V_MEDIA = 13.8;
const CAPACIDAD = 30;
const BASE = 0.16;
const FASES = [-0.35, 0, 0.35];
const Y_ALTA = 1.35;

let piezasS = null;
let fase = 0;
let maniobra = 0; // 0 cerrado · 1 interruptor abierto · 2 cuchillas abiertas
let carga = 18;
const amperes = (mw, kv) => (mw * 1000) / (Math.sqrt(3) * kv);

crearMaquina({
    figura: 'subestacion',
    nombre: 'la subestación',
    partes: [
        { n: 1, nombre: 'Línea de llegada (115 kV)', ancla: [-2.9, 2.0, 0], vista: { tx: -2.6, ty: 1.0, tz: 0, az: 22, el: 14, d: 3.2 } },
        { n: 2, nombre: 'Cuchillas (seccionadores)', ancla: [-1.75, 1.9, 0.5], vista: { tx: -1.75, ty: 1.1, tz: 0, az: 16, el: 16, d: 2.6 } },
        { n: 3, nombre: 'Interruptor de potencia', ancla: [-0.95, 1.9, 0.5], vista: { tx: -0.95, ty: 0.9, tz: 0, az: 12, el: 14, d: 2.6 } },
        { n: 4, nombre: 'Transformador de potencia', ancla: [0.25, 2.0, 0], vista: { tx: 0.25, ty: 0.8, tz: 0, az: 10, el: 16, d: 3.0 } },
        { n: 5, nombre: 'Barras y alimentadores (13.8 kV)', ancla: [2.0, 1.4, 0.4], vista: { tx: 2.0, ty: 0.7, tz: 0.1, az: -14, el: 16, d: 3.0 } },
        { n: 6, nombre: 'Caseta de control', ancla: [1.5, 1.3, -1.1], vista: { tx: 1.5, ty: 0.6, tz: -1.0, az: -6, el: 10, d: 2.4 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: -0.2, ty: 0.85, tz: 0, az: 14, el: 20, d: 7.6 },
        { id: 'alta', texto: 'Lado de 115 kV', tx: -1.6, ty: 1.0, tz: 0, az: 20, el: 14, d: 3.8 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.3, tz: 0, az: 0, el: 70, d: 7.6 },
    ],
    entrada: { etiqueta: 'Carga de la zona', min: 0, max: 30, paso: 0.5, valor: 18, aria: 'Carga eléctrica de la zona en megawatts' },
    selectores: [{ id: 'servicio', etiqueta: 'Operación', valor: 'servicio', opciones: [{ id: 'servicio', texto: 'En servicio' }, { id: 'mantenimiento', texto: 'Mantenimiento' }] }],
    lento: [
        { id: 'lento', texto: '1/60', k: 1 / 60, nota: 'Cámara lenta: un ciclo de la red dura un segundo.' },
        { id: 'real', texto: 'Real', k: 1, nota: 'La corriente de cada fase va y viene 60 veces por segundo, desfasada un tercio de ciclo de las otras.' },
    ],
    hud: '<b data-c="mw"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'ialta', etiqueta: 'Corriente en 115 kV', nota: 'por fase' },
        { id: 'imedia', etiqueta: 'Corriente en 13.8 kV', nota: 'por fase, 8.3 veces más' },
        { id: 'uso', etiqueta: 'Uso del transformador', nota: `de ${CAPACIDAD} MVA (ejemplo)` },
        { id: 'estado', etiqueta: 'Estado', nota: 'interruptor y cuchillas' },
    ],
    curva: {
        titulo: 'Corriente de cada lado según la carga',
        leyenda: [{ texto: '13.8 kV' }, { texto: '115 kV' }],
        nota: 'La misma potencia pasa con mucha menos corriente en alta tensión. I = P ÷ (√3 × V).',
        dibujar(g, w, h, estado) {
            const x = p => (p / 30) * (w - 10) + 5;
            const y = a => h - 6 - (a / 1300) * (h - 14);
            g.lineWidth = 1.4;
            g.strokeStyle = estado.P.tinta;
            g.beginPath(); g.moveTo(x(0), y(0)); g.lineTo(x(30), y(amperes(30, V_ALTA))); g.stroke();
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath(); g.moveTo(x(0), y(0)); g.lineTo(x(30), y(amperes(30, V_MEDIA))); g.stroke();
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(carga), y(amperes(carga, V_MEDIA)), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: false,
    anchoVertical: 1.8,
    lejaniaMax: 3.0,
    entradaRecorrido: t => 15 + 12 * Math.sin(t * 0.3),

    construir({ raiz, M, P, sombra, contorno, escena }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.16, 3.2), M.mat(P.ceramica === '#f7f5f1' ? '#ecebe6' : '#d9d7d1', { roughness: 0.9 })))).translateY(0.08));
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        // aislador de porcelana: columna de discos
        const aislador = (alto, radio = 0.045) => {
            const g = new THREE.Group();
            const n = Math.max(3, Math.round(alto / 0.07));
            g.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(radio * 0.6, radio * 0.6, alto, 12), M.ceramica)).translateY(alto / 2));
            for (let i = 0; i < n; i++) g.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, 0.018, 18), M.ceramica)).translateY(0.04 + (i * (alto - 0.08)) / (n - 1)));
            return g;
        };
        const pata = (x, z, alto) => { const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.06, alto, 0.06), M.grafito)); m.position.set(x, BASE + alto / 2, z); return m; };

        // 1 · torre y marco de remate de la línea de 115 kV
        const llegada = new THREE.Group();
        for (const z of [-0.6, 0.6]) llegada.add(pata(-2.4, z, 1.55));
        llegada.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.4), M.borde)).translateX(-2.4).translateY(BASE + 1.55));
        const torre = new THREE.Group();
        torre.position.set(-3.15, BASE, 0);
        for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            const p = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 2.0, 6), M.borde));
            p.position.set(dx * 0.1, 1.0, dz * 0.1);
            p.rotation.set(dz * 0.05, 0, -dx * 0.05);
            torre.add(p);
        }
        torre.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 1.0), M.borde)).translateY(1.75));
        llegada.add(torre);
        raiz.add(llegada);

        // 2 · cuchillas: dos aisladores por fase y una navaja que gira hacia arriba al abrir
        const cuchillas = new THREE.Group();
        const navajas = [];
        for (const z of FASES) {
            for (const x of [-1.95, -1.55]) { const a = aislador(0.55); a.position.set(x, BASE + 0.6, z); cuchillas.add(a); }
            const base = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.1), M.grafito));
            base.position.set(-1.75, BASE + 0.58, z);
            cuchillas.add(base, pata(-1.75, z, 0.56));
            const bisagra = new THREE.Group();
            bisagra.position.set(-1.95, BASE + 1.17, z);
            bisagra.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 0.04), M.acero)).translateX(0.21));
            cuchillas.add(bisagra);
            navajas.push(bisagra);
        }
        raiz.add(cuchillas);

        // 3 · interruptor de potencia: tres polos sobre un gabinete con su mecanismo y una lámpara de estado
        const interruptor = new THREE.Group();
        interruptor.position.set(-0.95, BASE, 0);
        interruptor.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.0), M.ceramica))).translateY(0.25));
        interruptor.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 1.02), M.borde)).translateY(0.5));
        for (const z of FASES) {
            const polo = aislador(0.55, 0.07);
            polo.position.set(0, 0.52, z);
            interruptor.add(polo, sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16), M.acero)).translateY(1.12).translateZ(z));
        }
        const lampara = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshBasicMaterial({ color: P.positivo }));
        lampara.position.set(0.21, 0.36, 0.3);
        lampara.userData.sinResalte = true;
        interruptor.add(lampara);
        raiz.add(interruptor);

        // 4 · transformador de potencia: tanque, radiadores, boquillas de alta (altas) y de media (bajas), tanque conservador
        const trafo = new THREE.Group();
        trafo.position.set(0.25, BASE, 0);
        trafo.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 1.0), M.ceramica))).translateY(0.425));
        trafo.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.97, 0.04, 1.02), M.borde)).translateY(0.85));
        for (const s of [-1, 1]) for (let i = 0; i < 5; i++) trafo.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.025), M.acero)).translateY(0.4).translateZ(s * (0.53 + i * 0.06)));
        for (const z of FASES) {
            const b = aislador(0.45, 0.055);
            b.position.set(-0.3, 0.86, z);
            const bm = aislador(0.2, 0.04);
            bm.position.set(0.3, 0.86, z);
            trafo.add(b, bm);
        }
        trafo.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 24).rotateX(Math.PI / 2), M.ceramica)), 40).translateY(1.15).translateX(0.05).translateZ(0));
        trafo.children.at(-1).position.set(0.05, 1.12, 0);
        raiz.add(trafo);

        // 5 · barras de 13.8 kV y tres alimentadores que salen hacia la ciudad
        const barras = new THREE.Group();
        for (const z of [-0.6, 0.6]) barras.add(pata(1.4, z, 0.95), pata(2.4, z, 0.95));
        barras.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.06), M.borde)).translateX(1.9).translateY(BASE + 0.95).translateZ(-0.6));
        barras.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.06), M.borde)).translateX(1.9).translateY(BASE + 0.95).translateZ(0.6));
        for (const z of FASES) barras.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 10).rotateZ(Math.PI / 2), M.cobre)).translateX(1.9).translateY(BASE + 0.85).translateZ(z));
        const salidas = [];
        for (const [i, z] of [[0, -0.9], [1, 0.05], [2, 1.0]]) {
            const poste = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 10), M.ceramica));
            poste.position.set(3.15, BASE + 0.45, z);
            const cruceta = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.4), M.grafito));
            cruceta.position.set(3.15, BASE + 0.85, z);
            const caja = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.22), M.ceramica)));
            caja.position.set(2.65, BASE + 0.16, z * 0.8);
            barras.add(poste, cruceta, caja);
            salidas.push(curva([2.3, BASE + 0.85, FASES[i]], [2.6, BASE + 0.55, z * 0.8], [2.9, BASE + 0.8, z], [3.15, BASE + 0.87, z]));
        }
        raiz.add(barras);

        // 6 · caseta de control con su pantalla
        const caseta = new THREE.Group();
        caseta.position.set(1.5, BASE, -1.1);
        caseta.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.5), M.ceramica))).translateY(0.25));
        caseta.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.05, 0.58), M.borde)).translateY(0.52));
        const tablero = pantalla(0.7, 0.32);
        tablero.position.set(0, 0.28, 0.255);
        caseta.add(tablero);
        raiz.add(caseta);

        // conductores: de la torre al marco, a las cuchillas, al interruptor y a las boquillas de alta; de las de media a las barras
        const conductores = new THREE.Group();
        const altas = [];
        const medias = [];
        FASES.forEach(z => {
            const tramo1 = curva([-3.15, BASE + 1.75, z * 1.3], [-2.8, BASE + 1.45, z * 1.15], [-2.4, BASE + 1.5, z], [-2.1, BASE + 1.25, z], [-1.95, BASE + 1.19, z]);
            const tramo2 = curva([-1.55, BASE + 1.19, z], [-1.3, BASE + 1.3, z], [-0.95, BASE + 1.2, z]);
            const tramo3 = curva([-0.95, BASE + 1.2, z], [-0.6, BASE + 1.45, z], [-0.05, BASE + 1.38, z]);
            const tramoM = curva([0.55, BASE + 1.08, z], [0.9, BASE + 1.1, z], [1.4, BASE + 0.9, z], [1.5, BASE + 0.86, z]);
            for (const c of [tramo1, tramo2, tramo3]) conductores.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.012, 6, false), M.grafito));
            conductores.add(new THREE.Mesh(new THREE.TubeGeometry(tramoM, 40, 0.016, 6, false), M.cobre));
            // para la corriente, cada fase es un solo recorrido (en la corriente común, el segundo cable de un par es el regreso)
            altas.push(curva(...[tramo1, tramo2, tramo3].flatMap(c => c.points.map(p => p.toArray()))));
            medias.push(tramoM);
        });
        salidas.forEach(c => conductores.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.012, 6, false), M.grafito)));
        raiz.add(conductores);
        // corriente por fase (tres fases, desfasadas un tercio de ciclo): pocos puntos en alta, muchos en media
        const corrAlta = altas.map(t => crearCorriente({ raiz, escena, curvas: [t], P, radio: 0.02, puntosPorCable: 10 }));
        const corrMedia = medias.map((t, i) => crearCorriente({ raiz, escena, curvas: [curva(...[t, salidas[i]].flatMap(c => c.points.map(p => p.toArray())))], P, radio: 0.02, puntosPorCable: 26 }));

        piezasS = { navajas, lampara, tablero, corrAlta, corrMedia };
        return {
            piezas: { 1: [llegada], 2: [cuchillas], 3: [interruptor], 4: [trafo], 5: [barras], 6: [caseta] },
            movibles: [
                { parte: 1, objetos: [torre], hacia: [-0.4, 0, 0] },
                { parte: 2, objetos: [cuchillas], hacia: [-0.2, 0.5, 0.3] },
                { parte: 3, objetos: [interruptor], hacia: [0, 0.4, 0.5] },
                { parte: 4, objetos: [trafo], hacia: [0.1, 0.6, -0.4] },
                { parte: 5, objetos: [barras], hacia: [0.4, 0, 0.3] },
                { parte: 6, objetos: [caseta], hacia: [0.2, 0, -0.5] },
            ],
            anclas: { 1: [torre, [0, 2.0, 0]], 2: [cuchillas, [-1.75, 1.6, 0.4]], 3: [interruptor, [0, 1.45, 0.3]], 4: [trafo, [0, 1.45, 0]], 5: [barras, [1.9, 1.3, 0.3]], 6: [caseta, [0, 0.8, 0]] },
        };
    },

    paso(estado) {
        const S = piezasS;
        const { dt, dtSim } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.3));
        carga = estado.entrada;
        fase += 2 * Math.PI * F * dtSim;
        // maniobra: abre primero el interruptor y luego las cuchillas; al cerrar, al revés
        const objetivo = estado.sel.servicio === 'mantenimiento' ? 2 : 0;
        maniobra += clamp(objetivo - maniobra, -dt * 0.8, dt * 0.8);
        const abiertoInt = maniobra > 0.5;
        const abiertoCuch = clamp(maniobra - 1, 0, 1);
        S.navajas.forEach(n => { n.rotation.z = abiertoCuch * 1.2; });
        S.lampara.material.color.set(abiertoInt ? estado.P.negativo : estado.P.positivo);
        const pasa = abiertoInt ? 0 : 1;
        const mw = carga * pasa;
        const iA = amperes(mw, V_ALTA);
        const iM = amperes(mw, V_MEDIA);
        S.tablero.userData.poner([`${num(V_ALTA)} kV · ${num(iA)} A`, `${num(V_MEDIA, 1)} kV · ${num(iM)} A`, `${num(mw, 1)} MW`]);
        estado.sub = { mw };
        const estadoTxt = maniobra < 0.02 ? 'en servicio' : maniobra > 1.98 ? 'abierto y aislado' : abiertoInt ? 'abriendo cuchillas' : 'abriendo interruptor';
        return {
            cifras: {
                mw: `${num(mw, 1)} MW`,
                hud: maniobra > 0.02 ? (maniobra > 1.98 ? 'Aislada: las cuchillas abiertas dejan ver que no hay conexión' : 'Maniobra: primero el interruptor, después las cuchillas') : `${num(V_ALTA)} kV entran · ${num(V_MEDIA, 1)} kV salen a la ciudad`,
                ialta: `${num(iA)} A`,
                imedia: `${num(iM)} A`,
                uso: `${num((mw / CAPACIDAD) * 100)} %`,
                estado: estadoTxt,
            },
        };
    },

    despues(estado) {
        const S = piezasS;
        const { mw } = estado.sub;
        const base = { camara: estado.camara, w: estado.w, h: estado.h, dt: estado.dtSim, polos: 0 };
        const k = mw / CAPACIDAD;
        [0, 1, 2].forEach(i => {
            const onda = Math.sin(fase - (i * 2 * Math.PI) / 3);
            S.corrAlta[i].actualizar({ ...base, avance: 0.02 * 2 * Math.PI * F, corriente: onda * k * 0.12, visible: k > 0.01 ? 1 : 0 });
            S.corrMedia[i].actualizar({ ...base, avance: 0.02 * 2 * Math.PI * F, corriente: onda * k, visible: k > 0.01 ? 1 : 0 });
        });
    },
});

// tablero de la caseta: tres renglones claros sobre fondo oscuro
function pantalla(ancho, alto) {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = Math.round(320 * alto / ancho);
    const g = c.getContext('2d');
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t }));
    m.userData.sinResalte = true;
    let ultimo = '';
    m.userData.poner = lineas => {
        const clave = lineas.join('|');
        if (clave === ultimo) return;
        ultimo = clave;
        g.fillStyle = '#13151f';
        g.fillRect(0, 0, c.width, c.height);
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        lineas.forEach((l, i) => {
            g.fillStyle = i === 2 ? '#ffd23f' : '#d9ffe6';
            g.font = `700 ${Math.round(c.height * (i === 2 ? 0.26 : 0.2))}px Manrope, sans-serif`;
            g.fillText(l, c.width / 2, c.height * (0.2 + i * 0.3));
        });
        t.needsUpdate = true;
    };
    return m;
}
