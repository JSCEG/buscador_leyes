// «CENACE y el despacho eléctrico», en 3D: una maqueta del orden de mérito. Las centrales son bloques en fila, de la más
// barata a la más cara: el ancho de cada bloque es su capacidad (GW) y su altura, su costo variable. Un cristal guinda
// marca la demanda; todo lo que queda a su izquierda se enciende. La última central que hace falta (la marginal) fija
// el precio, que una barra guinda lleva hasta la consola del CENACE y a la ciudad.
//
// Entrada: la demanda del país en ese momento (GW). Botón Día / Noche: de noche no hay solar y entran centrales más caras.
//
// Cifras: capacidades y costos de ejemplo, en números redondos, solo para ver cómo funciona el orden de mérito. El
// precio real (Precio Marginal Local) cambia por hora y por nodo, y suma pérdidas y congestión de la red.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const BASE = 0.16;
const X0 = -3.15;
const POR_GW = 0.0745; // ancho de la maqueta por cada GW
const FONDO = 1.1;
const ALTO = c => 0.22 + (c / 3500) * 1.25; // altura del bloque según su costo
const CENTRALES = [
    { id: 'solar', nombre: 'Solar', gw: 10, costo: 0, parte: 2 },
    { id: 'eolica', nombre: 'Eólica', gw: 6, costo: 0, parte: 2 },
    { id: 'hidro', nombre: 'Hidroeléctrica', gw: 8, costo: 300, parte: 2 },
    { id: 'cc', nombre: 'Ciclo combinado', gw: 26, costo: 1300, parte: 3 },
    { id: 'tg', nombre: 'Turbogás', gw: 8, costo: 3500, parte: 4 },
];
const pesos = x => `$${num(Math.round(x / 10) * 10)}`;

let piezasM = null;
let tiempo = 0;
let precio = 0;

crearMaquina({
    figura: 'mercado-cenace',
    nombre: 'el despacho',
    partes: [
        { n: 1, nombre: 'Consumo nacional (Demanda)', ancla: [3.0, 1.2, 0.3], vista: { tx: 2.9, ty: 0.5, tz: 0.2, az: -14, el: 16, d: 2.8 } },
        { n: 2, nombre: 'Despacho base (Renovables e Hidro)', ancla: [-2.3, 1.6, 0], vista: { tx: -2.3, ty: 0.6, tz: 0, az: 14, el: 16, d: 3.2 } },
        { n: 3, nombre: 'Despacho intermedio (Ciclo combinado)', ancla: [-0.4, 2.1, 0], vista: { tx: -0.4, ty: 0.9, tz: 0, az: 10, el: 14, d: 3.4 } },
        { n: 4, nombre: 'Pico y reserva (Turbogás)', ancla: [1.0, 2.6, 0], vista: { tx: 1.0, ty: 1.2, tz: 0, az: -10, el: 14, d: 3.0 } },
        { n: 5, nombre: 'Fijación de PML', ancla: [2.2, 1.7, -0.9], vista: { tx: 2.1, ty: 0.9, tz: -0.8, az: -8, el: 10, d: 2.6 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: -0.2, ty: 0.85, tz: 0, az: 12, el: 18, d: 7.3 },
        { id: 'frente', texto: 'De frente', tx: -0.6, ty: 1.0, tz: 0, az: 0, el: 2, d: 7.4 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.3, tz: 0, az: 0, el: 70, d: 8.4 },
    ],
    entrada: { etiqueta: 'Demanda del país', min: 15, max: 48, paso: 0.5, valor: 34, aria: 'Demanda eléctrica del país en gigawatts' },
    selectores: [{ id: 'hora', etiqueta: 'Hora del día', valor: 'dia', opciones: [{ id: 'dia', texto: 'Día' }, { id: 'noche', texto: 'Noche' }] }],
    lento: [
        { id: 'lento', texto: 'Despacio', k: 0.35, nota: 'Las centrales se mueven despacio.' },
        { id: 'real', texto: 'Normal', k: 1, nota: 'El CENACE vuelve a calcular el despacho a cada rato: la demanda cambia todo el día.' },
    ],
    hud: '<b data-c="precio"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'demanda', etiqueta: 'Demanda', nota: 'lo que consume el país ahora' },
        { id: 'encendidas', etiqueta: 'Centrales encendidas', nota: 'de la más barata a la más cara' },
        { id: 'marginal', etiqueta: 'Fija el precio', nota: 'la última que hace falta' },
        { id: 'reserva', etiqueta: 'Capacidad libre', nota: 'lo que queda para emergencias' },
    ],
    curva: {
        titulo: 'Orden de mérito: capacidad y costo de cada central',
        leyenda: [{ texto: 'costo de cada central' }, { texto: 'demanda' }],
        nota: 'Cifras de ejemplo. Entran primero las más baratas; la última que hace falta pone el precio para todas.',
        dibujar(g, w, h, estado) {
            const total = 58;
            const x = gw => (gw / total) * (w - 10) + 5;
            const y = c => h - 6 - (c / 3800) * (h - 16);
            let inicio = 0;
            g.lineWidth = 2.2;
            g.strokeStyle = estado.P.acento;
            g.beginPath();
            g.moveTo(x(0), y(0));
            for (const c of piezasM.bloques) {
                g.lineTo(x(inicio), y(c.def.costo));
                inicio += c.cap;
                g.lineTo(x(inicio), y(c.def.costo));
            }
            g.stroke();
            g.lineWidth = 1.4;
            g.strokeStyle = estado.P.tinta;
            g.setLineDash([4, 4]);
            g.beginPath(); g.moveTo(x(estado.entrada), y(0)); g.lineTo(x(estado.entrada), y(3800)); g.stroke();
            g.setLineDash([]);
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(estado.entrada), y(precio), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: false,
    anchoVertical: 1.95,
    lejaniaMax: 3.1,
    entradaRecorrido: t => 31 + 14 * Math.sin(t * 0.3),

    construir({ raiz, M, P, sombra, contorno }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.16, 3.2), M.ceramica))).translateY(0.08));
        const cubo = new THREE.BoxGeometry(1, 1, 1);
        const luzMat = () => new THREE.MeshBasicMaterial({ color: P.corriente, transparent: true, opacity: 0, depthWrite: false });

        // 2, 3 y 4 · los bloques de las centrales, cada uno con su maqueta encima
        const bloques = CENTRALES.map(def => {
            const g = new THREE.Group();
            const caja = contorno(sombra(new THREE.Mesh(cubo, M.ceramica)), 30);
            const tapa = sombra(new THREE.Mesh(cubo, M.borde));
            const encendido = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), luzMat());
            encendido.userData.sinResalte = true;
            const foco = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), M.mat(P.grafito, { roughness: 0.4 }));
            const encima = new THREE.Group();
            g.add(caja, tapa, encendido, foco, encima);
            raiz.add(g);
            return { def, g, caja, tapa, encendido, foco, encima, cap: def.gw, prendida: 0, anim: {} };
        });
        const [solar, eolica, hidro, cc, tg] = bloques;
        // solar: tres paneles inclinados
        const panelMat = M.mat('#2b3654', { roughness: 0.3, metalness: 0.4 });
        for (let i = 0; i < 3; i++) {
            const p = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.015, 0.2), panelMat));
            p.position.set(-0.3 + i * 0.3, 0.1, 0);
            p.rotation.x = -0.5;
            const pata = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8), M.grafito));
            pata.position.set(-0.3 + i * 0.3, 0.05, 0);
            solar.encima.add(p, pata);
        }
        // eólica: torre y rotor
        eolica.encima.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.7, 14), M.ceramica)).translateY(0.35));
        const rotor = new THREE.Group();
        rotor.position.set(0, 0.72, 0.06);
        rotor.add(sombra(new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), M.borde)));
        for (let i = 0; i < 3; i++) {
            const aspa = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.012).translate(0, 0.17, 0), M.ceramica));
            aspa.rotation.z = (i * 2 * Math.PI) / 3;
            rotor.add(aspa);
        }
        eolica.encima.add(rotor);
        eolica.anim.rotor = rotor;
        // hidro: cortina y su embalse
        const cortina = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.1), M.ceramica)));
        cortina.position.set(0, 0.16, 0.15);
        const embalse = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.4), M.agua);
        embalse.position.set(0, 0.12, -0.12);
        hidro.encima.add(cortina, embalse);
        // ciclo combinado: nave, chimenea y vapor
        const humo = (bloque, x, y, n) => {
            const bolas = [];
            for (let i = 0; i < n; i++) {
                const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, roughness: 1, depthWrite: false }));
                b.userData.sinResalte = true;
                b.userData.fase = i / n;
                b.position.set(x, y, 0);
                bloque.encima.add(b);
                bolas.push(b);
            }
            bloque.anim.humo = { bolas, x, y };
        };
        cc.encima.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 0.4), M.ceramica))).translateY(0.13).translateX(-0.12));
        cc.encima.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 16), M.ceramica)).translateY(0.3).translateX(0.25));
        cc.encima.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 20).rotateX(Math.PI / 2), M.borde)).translateY(0.6).translateX(0.25));
        humo(cc, 0.25, 0.62, 5);
        // turbogás: caja pequeña con chimenea corta
        tg.encima.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.3), M.ceramica))).translateY(0.09));
        tg.encima.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.3, 14), M.grafito)).translateY(0.24).translateX(0.1));
        humo(tg, 0.1, 0.38, 4);

        // 1 · la demanda: un cristal guinda que avanza sobre la fila, y la ciudad que consume
        const cristal = new THREE.Mesh(new THREE.PlaneGeometry(FONDO + 0.5, 2.3), new THREE.MeshPhysicalMaterial({ color: P.acento, transparent: true, opacity: 0.18, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }));
        cristal.rotation.y = Math.PI / 2;
        cristal.position.y = BASE + 1.15;
        cristal.renderOrder = 3;
        const filo = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.3, 0.03), M.borde));
        filo.position.set(0, BASE + 1.15, (FONDO + 0.5) / 2);
        const demanda = new THREE.Group();
        demanda.add(cristal, filo);
        raiz.add(demanda);
        const ciudad = new THREE.Group();
        ciudad.position.set(3.0, BASE, 0.35);
        const ventanas = [];
        const casas = [[-0.3, -0.35, 0.5], [0.15, -0.4, 0.75], [-0.35, 0.25, 0.4], [0.2, 0.2, 0.55], [0.0, 0.7, 0.35], [-0.42, 0.75, 0.3]];
        for (const [x, z, alto] of casas) {
            const casa = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, alto, 0.3), M.ceramica)));
            casa.position.set(x, alto / 2, z);
            const techo = sombra(new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.14, 4).rotateY(Math.PI / 4), M.borde));
            techo.position.set(x, alto + 0.07, z);
            ciudad.add(casa, techo);
            for (let f = 0; f < Math.floor(alto / 0.17); f++) {
                const v = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.07), new THREE.MeshBasicMaterial({ color: P.grafito }));
                v.position.set(x, 0.12 + f * 0.17, z + 0.152);
                v.userData.sinResalte = true;
                v.userData.umbral = ventanas.length;
                ciudad.add(v);
                ventanas.push(v);
            }
        }
        raiz.add(ciudad);

        // 5 · el precio: barra guinda a la altura de la central marginal, y la consola del CENACE que lo publica
        const barra = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 12).rotateZ(Math.PI / 2), M.borde));
        raiz.add(barra);
        const consola = new THREE.Group();
        consola.position.set(2.15, BASE, -0.85);
        consola.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.45), M.ceramica))).translateY(0.225));
        consola.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.03, 0.47), M.borde)).translateY(0.45));
        consola.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.5, 0.06), M.ceramica))).translateY(0.78));
        consola.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 10), M.grafito)).translateY(0.5));
        const pantalla = pantalla2(0.68, 0.4);
        pantalla.position.set(0, 0.78, 0.035);
        consola.add(pantalla);
        raiz.add(consola);

        piezasM = { bloques, cristal, demanda, barra, ventanas, pantalla, solar, eolica, cc, tg };
        const de = n => bloques.filter(b => b.def.parte === n).map(b => b.g);
        return {
            piezas: { 1: [ciudad, demanda], 2: de(2), 3: de(3), 4: de(4), 5: [consola, barra] },
            movibles: [
                { parte: 2, objetos: de(2), hacia: [-0.4, 0.3, 0.4] },
                { parte: 3, objetos: de(3), hacia: [0, 0.5, 0.5] },
                { parte: 4, objetos: de(4), hacia: [0.3, 0.6, 0.4] },
                { parte: 1, objetos: [ciudad], hacia: [0.4, 0, 0.4] },
                { parte: 5, objetos: [consola], hacia: [0.3, 0, -0.5] },
            ],
            anclas: { 1: [ciudad, [0, 1.1, 0]], 2: [hidro.g, [0, 1.0, 0]], 3: [cc.g, [0, 1.9, 0]], 4: [tg.g, [0, 2.4, 0]], 5: [consola, [0, 1.25, 0]] },
        };
    },

    paso(estado) {
        const S = piezasM;
        const { dt, dtSim, e } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.3));
        tiempo += dtSim;
        const D = estado.entrada;
        const noche = estado.sel.hora === 'noche';
        const suave = 1 - Math.exp(-dt / 0.25);
        // de noche la solar no tiene capacidad: su bloque se encoge y los demás se recorren
        S.solar.cap += ((noche ? 0 : S.solar.def.gw) - S.solar.cap) * suave;

        // acomodo de los bloques y despacho: todo lo que queda a la izquierda de la demanda se enciende
        let inicio = 0;
        let marginal = null;
        let encendidas = 0;
        const separa = e * 0.5;
        S.bloques.forEach((b, i) => {
            const w = Math.max(0.0001, b.cap * POR_GW);
            const h = ALTO(b.def.costo);
            const x = X0 + inicio * POR_GW + w / 2 + i * separa;
            b.g.position.set(x, BASE, 0);
            b.caja.scale.set(w, h, FONDO);
            b.caja.position.y = h / 2;
            b.tapa.scale.set(w + 0.01, 0.03, FONDO + 0.01);
            b.tapa.position.y = h;
            b.encima.position.y = h + 0.015;
            b.encima.scale.setScalar(clamp(w / 0.6, 0, 1));
            b.encima.visible = w > 0.02;
            b.g.visible = w > 0.005;
            const parte = b.cap > 0.05 ? clamp((D - inicio) / b.cap, 0, 1) : 0;
            b.prendida += (parte - b.prendida) * suave;
            if (parte > 0 && b.cap > 0.05) encendidas++;
            if (parte > 0 && parte < 1 && b.cap > 0.05) marginal = b;
            // la parte despachada se ilumina en el frente del bloque
            b.encendido.scale.set(Math.max(0.0001, w * b.prendida), h - 0.04, 1);
            b.encendido.position.set(-w / 2 + (w * b.prendida) / 2, h / 2, FONDO / 2 + 0.004);
            b.encendido.material.opacity = 0.5 * clamp(b.prendida * 4, 0, 1);
            b.foco.position.set(-w / 2 + 0.08, h - 0.1, FONDO / 2 + 0.03);
            b.foco.material.color.set(b.prendida > 0.02 ? estado.P.corriente : estado.P.grafito);
            b.foco.material.emissive?.set(b.prendida > 0.02 ? estado.P.corriente : '#000000');
            const k = clamp(b.prendida * 3, 0, 1);
            if (b.anim.rotor) b.anim.rotor.rotation.z -= dtSim * 4 * k;
            if (b.anim.humo) {
                b.anim.humo.bolas.forEach(bola => {
                    const u = (bola.userData.fase + tiempo * 0.4) % 1;
                    bola.visible = k > 0.05;
                    bola.position.set(b.anim.humo.x + u * 0.12, b.anim.humo.y + u * 0.5, 0);
                    bola.scale.setScalar((0.5 + u) * k);
                    bola.material.opacity = 0.55 * (1 - u) * k;
                });
            }
            b.inicio = inicio;
            inicio += b.cap;
        });
        const total = inicio;
        if (!marginal) marginal = [...S.bloques].reverse().find(b => b.prendida > 0.02 && b.cap > 0.05) || S.bloques[1];
        const falta = Math.max(0, D - total);
        precio += (marginal.def.costo - precio) * suave;

        // el cristal de la demanda y la barra del precio
        const xD = X0 + Math.min(D, total) * POR_GW + S.bloques.length * separa * clamp(D / total, 0, 1);
        S.demanda.position.x = xD;
        const yP = BASE + ALTO(precio) + 0.06;
        S.barra.scale.set(2.15 - X0 - 0.4, 1, 1);
        S.barra.position.set((X0 + 2.15 - 0.4) / 2, yP, -0.75);
        S.barra.visible = e < 0.3;
        // la ciudad: se encienden tantas ventanas como demanda haya (y parpadean si falta energía)
        const encendidasV = Math.round((D / 48) * S.ventanas.length);
        S.ventanas.forEach((v, i) => v.material.color.set(i < encendidasV && !(falta > 0 && Math.sin(tiempo * 12 + i) > 0.3) ? estado.P.corriente : estado.P.grafito));
        S.pantalla.userData.poner('PML (ejemplo)', `${pesos(precio)} /MWh`);

        return {
            cifras: {
                precio: `${pesos(precio)} /MWh`,
                hud: falta > 0 ? `Faltan ${num(falta, 1)} GW: no alcanza la capacidad` : `Precio de ejemplo · lo fija: ${marginal.def.nombre.toLowerCase()}`,
                demanda: `${num(D, 1)} GW`,
                encendidas: `${encendidas} de ${S.bloques.filter(b => b.cap > 0.05).length}`,
                marginal: marginal.def.nombre,
                reserva: `${num(Math.max(0, total - D), 1)} GW`,
            },
        };
    },
});

// pantalla de dos renglones: textura de canvas que se vuelve a dibujar solo cuando cambia el texto
function pantalla2(ancho, alto) {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = Math.round(320 * alto / ancho);
    const g = c.getContext('2d');
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t }));
    m.userData.sinResalte = true;
    let ultimo = '';
    m.userData.poner = (arriba, abajo) => {
        if (arriba + abajo === ultimo) return;
        ultimo = arriba + abajo;
        g.fillStyle = '#13151f';
        g.fillRect(0, 0, c.width, c.height);
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = '#a4a7ae';
        g.font = `600 ${Math.round(c.height * 0.17)}px Manrope, sans-serif`;
        g.fillText(arriba, c.width / 2, c.height * 0.3);
        g.fillStyle = '#ffd23f';
        let tam = Math.round(c.height * 0.3);
        g.font = `700 ${tam}px Manrope, sans-serif`;
        tam = Math.floor(tam * Math.min(1, (c.width * 0.9) / g.measureText(abajo).width));
        g.font = `700 ${tam}px Manrope, sans-serif`;
        g.fillText(abajo, c.width / 2, c.height * 0.66);
        t.needsUpdate = true;
    };
    return m;
}
