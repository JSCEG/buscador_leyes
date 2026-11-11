// «Planeación vinculante, regla 54/46 y Desarrollo Mixto», en 3D: una maqueta del sistema eléctrico. A la izquierda las
// centrales de CFE, a la derecha una fila de centrales privadas, al centro la mesa de la SENER con el plan (PLADESE) y
// una probeta que muestra cuánta energía del año pone cada quien; atrás, las redes de transmisión, que son del Estado.
//
// Entrada: cuánta energía del año piden producir las empresas privadas (%). Cada central privada de la fila es un 10 %.
// La ley pide que el Estado mantenga al menos el 54 % de la energía que se inyecta a la red en el año (LSE, art. 12),
// así que, en este modelo, lo que pase del 46 % se queda esperando en la planeación.
// Botón: el esquema de Desarrollo Mixto. Producción de Largo Plazo: el Estado no aporta capital y toda la energía es
// para la CFE (art. 39). Inversión Mixta: CFE conserva al menos el 54 % del capital (art. 40).
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const BASE = 0.16;
const TOPE = 46;
const POR_PLANTA = 10;
const N_PRIV = 7;
const PC = 0.19;
const plpNota = 'Largo Plazo: vende su energía · Mixta: capital';

let piezasD = null;
let tiempo = 0;
let pedido = 30;

crearMaquina({
    figura: 'desarrollo-mixto-sen',
    nombre: 'el sistema eléctrico',
    partes: [
        { n: 1, nombre: 'Rectoría SENER y permisos CNE', ancla: [0, 2.1, -0.6], vista: { tx: 0, ty: 1.0, tz: -0.6, az: 4, el: 12, d: 3.0 } },
        { n: 2, nombre: 'Generación estatal (CFE ≥ 54 %)', ancla: [-2.6, 1.3, -0.1], vista: { tx: -2.6, ty: 0.5, tz: 0, az: 18, el: 16, d: 3.0 } },
        { n: 3, nombre: 'Esquemas de Desarrollo Mixto', ancla: [-1.1, 1.5, 0.85], vista: { tx: -1.1, ty: 0.6, tz: 0.85, az: 10, el: 18, d: 2.6 } },
        { n: 4, nombre: 'Generación privada (≤ 46 %)', ancla: [2.2, 1.3, 0.4], vista: { tx: 2.1, ty: 0.5, tz: 0.4, az: -16, el: 18, d: 3.4 } },
        { n: 5, nombre: 'Almacenamiento en baterías (SAE)', ancla: [0.4, 1.0, 1.05], vista: { tx: 0.4, ty: 0.4, tz: 1.0, az: 0, el: 18, d: 2.4 } },
        { n: 6, nombre: 'RNT y RGD (Exclusivas del Estado)', ancla: [-1.5, 2.2, -1.3], vista: { tx: 0, ty: 1.0, tz: -1.3, az: 6, el: 10, d: 5.0 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 0.8, tz: 0, az: 10, el: 22, d: 8.2 },
        { id: 'probeta', texto: 'La regla', tx: 0, ty: 1.0, tz: -0.6, az: 0, el: 8, d: 3.2 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.3, tz: 0, az: 0, el: 70, d: 8.2 },
    ],
    entrada: { etiqueta: 'Energía que piden los privados', min: 0, max: 70, paso: 1, valor: 30, aria: 'Porcentaje de la energía del año que piden producir las empresas privadas' },
    selectores: [{ id: 'mixto', etiqueta: 'Esquema de Desarrollo Mixto', valor: 'plp', opciones: [{ id: 'plp', texto: 'Largo Plazo' }, { id: 'inversion', texto: 'Inversión Mixta' }] }],
    lento: [
        { id: 'lento', texto: 'Despacio', k: 0.35, nota: 'La energía corre despacio por la red.' },
        { id: 'real', texto: 'Normal', k: 1, nota: 'La regla se mide con el promedio de todo el año, no con cada hora.' },
    ],
    hud: '<b data-c="estado"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'cfe', etiqueta: 'Estado (CFE)', nota: 'al menos 54 % del año' },
        { id: 'privados', etiqueta: 'Privados', nota: 'hasta 46 % del año' },
        { id: 'espera', etiqueta: 'En espera', nota: 'lo que pasa del 46 %' },
        { id: 'esquema', etiqueta: 'Desarrollo Mixto', nota: plpNota },
    ],
    curva: {
        titulo: 'Parte del Estado según lo que piden los privados',
        leyenda: [{ texto: 'energía del Estado' }, { texto: 'mínimo de 54 %' }],
        nota: 'Mientras los privados pidan hasta 46 %, todo cabe. Lo que pasa de ahí no entra: el Estado no baja de 54 %.',
        dibujar(g, w, h, estado) {
            const x = p => (p / 70) * (w - 10) + 5;
            const y = s => h - 6 - ((s - 20) / 80) * (h - 14);
            g.lineWidth = 1.2;
            g.strokeStyle = estado.P.tinta;
            g.setLineDash([4, 4]);
            g.beginPath(); g.moveTo(x(0), y(54)); g.lineTo(x(70), y(54)); g.stroke();
            g.setLineDash([]);
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath(); g.moveTo(x(0), y(100)); g.lineTo(x(TOPE), y(54)); g.lineTo(x(70), y(54)); g.stroke();
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(pedido), y(100 - Math.min(pedido, TOPE)), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: false,
    anchoVertical: 1.95,
    lejaniaMax: 3.1,
    entradaRecorrido: t => 35 + 30 * Math.sin(t * 0.28),

    construir({ raiz, M, P, sombra, contorno }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.16, 3.4), M.ceramica))).translateY(0.08));
        const luz = () => M.mat(P.grafito, { roughness: 0.4 });
        const planta = (techo, ancho = 0.5) => {
            const g = new THREE.Group();
            g.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.34, 0.44), M.ceramica))).translateY(0.17));
            g.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.02, 0.04, 0.46), techo)).translateY(0.36));
            g.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.36, 14), M.ceramica)).translateY(0.52).translateX(ancho / 2 - 0.1));
            const foco = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), luz());
            foco.position.set(-ancho / 2 + 0.08, 0.26, 0.225);
            g.add(foco);
            g.userData.foco = foco;
            return g;
        };

        // 2 · centrales de CFE (techo guinda)
        const cfe = new THREE.Group();
        cfe.position.set(-2.6, BASE, 0);
        const plantasCFE = [[-0.35, -0.45], [0.35, -0.45], [0, 0.35]].map(([x, z]) => { const p = planta(M.borde, 0.6); p.position.set(x, 0, z); cfe.add(p); return p; });
        raiz.add(cfe);

        // 4 · fila de centrales privadas (techo grafito), cada una un 10 % del año, en orden. El cristal guinda marca el 46 %:
        // lo que queda detrás de él se queda en gris, esperando.
        const priv = new THREE.Group();
        priv.position.set(0.95, BASE, 0.3);
        const plantasPriv = [];
        for (let i = 0; i < N_PRIV; i++) {
            const p = planta(M.grafito, 0.3);
            p.position.set(i * 0.36, 0, 0);
            const tapaLuz = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.3), new THREE.MeshBasicMaterial({ color: P.corriente, transparent: true, opacity: 0, depthWrite: false }));
            tapaLuz.position.set(0, 0.17, 0.222);
            tapaLuz.userData.sinResalte = true;
            p.add(tapaLuz);
            p.userData.luz = tapaLuz;
            priv.add(p);
            plantasPriv.push(p);
        }
        const xTope = Math.floor(TOPE / POR_PLANTA) * 0.36 - 0.15 + 0.3 * ((TOPE % POR_PLANTA) / POR_PLANTA); // dentro de la quinta central, en su 60 %
        const tope = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.0), new THREE.MeshPhysicalMaterial({ color: P.acento, transparent: true, opacity: 0.2, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }));
        tope.rotation.y = Math.PI / 2;
        tope.position.set(xTope, 0.5, 0);
        tope.renderOrder = 3;
        const poste = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.0, 0.03), M.borde));
        poste.position.set(xTope, 0.5, 0.45);
        const marca46 = letrero(0.3, 0.12, '46 %');
        marca46.position.set(xTope, 1.08, 0.45);
        priv.add(tope, poste, marca46);
        raiz.add(priv);

        // 1 · mesa de la SENER: el plan abierto y la probeta de la energía del año (guinda = Estado, grafito = privados)
        const sener = new THREE.Group();
        sener.position.set(0, BASE, -0.65);
        sener.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.6), M.ceramica))).translateY(0.2));
        sener.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.03, 0.62), M.borde)).translateY(0.4));
        const libro = new THREE.Group();
        libro.position.set(-0.3, 0.43, 0.05);
        for (const s of [-1, 1]) {
            const hoja = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.3), M.ceramica)));
            hoja.position.x = s * 0.115;
            hoja.rotation.z = -s * 0.12;
            libro.add(hoja);
        }
        libro.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.012, 0.32), M.borde)).translateY(-0.015));
        const portada = letrero(0.36, 0.09, 'PLADESE');
        portada.rotation.x = -Math.PI / 2;
        portada.position.set(0, 0.03, 0.2);
        libro.add(portada);
        sener.add(libro);
        const vidrio = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.06, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
        const probeta = new THREE.Group();
        probeta.position.set(0.3, 0.42, 0);
        const ALTO_P = 1.4;
        const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, ALTO_P, 36, 1, true), vidrio);
        tubo.position.y = ALTO_P / 2;
        tubo.renderOrder = 2;
        probeta.add(tubo, sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 36), M.grafito)));
        const capaE = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1, 32), M.borde);
        const capaP = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1, 32), M.grafito);
        probeta.add(capaE, capaP);
        const raya = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.012, 8, 40).rotateX(Math.PI / 2), M.mat(P.corriente, { roughness: 0.5 }));
        raya.position.y = 0.025 + ALTO_P * 0.54;
        probeta.add(raya);
        const lectura = letrero(0.42, 0.13, '');
        lectura.position.set(0, ALTO_P + 0.16, 0);
        probeta.add(lectura);
        sener.add(probeta);
        raiz.add(sener);

        // 3 · central de Desarrollo Mixto, con el pastel del capital encima: todo grafito (lo pone el particular) o 54 % guinda (CFE)
        const mixto = new THREE.Group();
        mixto.position.set(-1.1, BASE, 0.85);
        const pm = planta(M.borde, 0.6);
        pm.children[1].material = M.grafito;
        mixto.add(pm);
        const pastel = new THREE.Group();
        pastel.position.set(-0.1, 0.62, 0);
        const rebCFE = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 40, 1, false, 0, Math.PI * 2 * 0.54), M.borde));
        const rebPriv = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 40, 1, false, Math.PI * 2 * 0.54, Math.PI * 2 * 0.46), M.grafito));
        const rebTodo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 40), M.grafito));
        pastel.add(rebCFE, rebPriv, rebTodo);
        mixto.add(pastel);
        raiz.add(mixto);

        // 5 · baterías (SAE): dos contenedores con su barra de carga
        const saee = new THREE.Group();
        saee.position.set(0.4, BASE, 1.05);
        const cargas = [];
        for (const x of [-0.3, 0.3]) {
            const c = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.28), M.ceramica)));
            c.position.set(x, 0.14, 0);
            saee.add(c, sombra(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.03, 0.3), M.borde)).translateX(x).translateY(0.2));
            const barra = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.01), M.mat(P.corriente, { roughness: 0.5 }));
            barra.position.set(x, 0.1, 0.145);
            saee.add(barra);
            cargas.push(barra);
        }
        raiz.add(saee);

        // 6 · red de transmisión del Estado: torres guinda con sus cables y la energía que corre
        const red = new THREE.Group();
        const xs = [-3.0, -1.4, 0.2, 1.8, 3.2];
        const torres = xs.map(x => {
            const t = new THREE.Group();
            t.position.set(x, BASE, -1.35);
            for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                const pata = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 1.3, 6), M.borde));
                pata.position.set(dx * 0.08, 0.65, dz * 0.08);
                pata.rotation.set(dz * 0.06, 0, -dx * 0.06);
                t.add(pata);
            }
            t.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.03), M.borde)).translateY(1.25));
            red.add(t);
            return t;
        });
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const hilos = [-0.27, 0.27].map(dx => {
            const pts = [];
            xs.forEach((x, i) => {
                pts.push([x + dx, BASE + 1.23, -1.35]);
                if (i < xs.length - 1) pts.push([(x + xs[i + 1]) / 2 + dx, BASE + 1.08, -1.35]);
            });
            const c = curva(...pts);
            red.add(new THREE.Mesh(new THREE.TubeGeometry(c, 160, 0.008, 6, false), M.grafito));
            return c;
        });
        const puntos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 10, 8), new THREE.MeshBasicMaterial({ color: P.corriente }), 48);
        puntos.frustumCulled = false;
        red.add(puntos);
        // bajadas: de las centrales a la red, por el piso
        const bajada = (a, b) => red.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(curva(a, [a[0], PC, (a[2] + b[2]) / 2], [b[0], PC, (a[2] + b[2]) / 2 - 0.2], b), 48, 0.018, 8, false), M.cable)));
        bajada([-2.6, PC, -0.7], [-3.0, BASE + 0.05, -1.3]);
        bajada([1.8, PC, -0.1], [1.8, BASE + 0.05, -1.3]);
        // Producción de Largo Plazo: la central mixta vende su energía a CFE por un cable propio
        const aCFE = curva([-1.25, PC, 0.62], [-1.6, PC, 0.5], [-2.0, PC, 0.45], [-2.3, PC, 0.4]);
        red.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(aCFE, 48, 0.018, 8, false), M.cable)));
        const puntosMixto = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: P.corriente }), 8);
        puntosMixto.frustumCulled = false;
        red.add(puntosMixto);
        raiz.add(red);

        piezasD = { plantasCFE, plantasPriv, capaE, capaP, ALTO_P, lectura, rebCFE, rebPriv, rebTodo, cargas, hilos, puntos, aCFE, puntosMixto, pm };
        return {
            piezas: { 1: [sener], 2: [cfe], 3: [mixto], 4: [priv], 5: [saee], 6: [red] },
            movibles: [
                { parte: 1, objetos: [sener], hacia: [0, 0.5, -0.2] },
                { parte: 2, objetos: [cfe], hacia: [-0.4, 0, 0.2] },
                { parte: 3, objetos: [mixto], hacia: [-0.2, 0.3, 0.4] },
                { parte: 4, objetos: [priv], hacia: [0.4, 0, 0.2] },
                { parte: 5, objetos: [saee], hacia: [0, 0.2, 0.5] },
                { parte: 6, objetos: torres, hacia: [0, 0.4, -0.3] },
            ],
            anclas: { 1: [sener, [0.3, 2.2, 0]], 2: [cfe, [0, 1.0, 0]], 3: [mixto, [0, 1.0, 0]], 4: [priv, [0.7, 0.9, 0]], 5: [saee, [0, 0.6, 0]], 6: [torres[1], [0, 1.6, 0]] },
        };
    },

    paso(estado) {
        const S = piezasD;
        const { dt, dtSim, e, P } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.3));
        tiempo += dtSim;
        pedido = estado.entrada;
        const privados = Math.min(pedido, TOPE);
        const espera = Math.max(0, pedido - TOPE);
        const estadoPct = 100 - privados;
        const suave = 1 - Math.exp(-dt / 0.2);

        // la fila privada: cada central es un 10 %; se ilumina la parte que cabe, lo demás queda en gris tras la pluma
        S.plantasPriv.forEach((p, i) => {
            const pide = clamp((pedido - i * POR_PLANTA) / POR_PLANTA, 0, 1);
            const cabe = clamp((privados - i * POR_PLANTA) / POR_PLANTA, 0, 1);
            p.visible = pide > 0.02;
            p.scale.setScalar(0.4 + 0.6 * clamp(pide * 3, 0, 1));
            p.userData.luz.material.opacity = 0.55 * cabe;
            p.userData.luz.scale.x = Math.max(0.001, cabe);
            p.userData.luz.position.x = -0.14 + 0.14 * cabe;
            p.userData.foco.material.color.set(cabe > 0.02 ? P.corriente : P.grafito);
        });
        S.plantasCFE.forEach(p => p.userData.foco.material.color.set(P.corriente));

        // la probeta
        const hE = S.ALTO_P * estadoPct / 100;
        const hP = S.ALTO_P * privados / 100;
        S.capaE.scale.y += (hE - S.capaE.scale.y) * suave;
        S.capaP.scale.y += (hP - S.capaP.scale.y) * suave;
        S.capaE.position.y = 0.025 + S.capaE.scale.y / 2;
        S.capaP.position.y = 0.025 + S.capaE.scale.y + S.capaP.scale.y / 2;
        S.lectura.userData.poner(`Estado ${num(estadoPct)} %`);

        // Desarrollo Mixto
        const plp = estado.sel.mixto === 'plp';
        S.rebCFE.visible = S.rebPriv.visible = !plp;
        S.rebTodo.visible = plp;
        const m = new THREE.Matrix4();
        const q = new THREE.Vector3();
        S.puntosMixto.visible = plp && e < 0.2;
        if (S.puntosMixto.visible) {
            for (let i = 0; i < 8; i++) { S.aCFE.getPointAt(((i / 8) + tiempo * 0.25) % 1, q); m.makeTranslation(q.x, q.y + 0.02, q.z); S.puntosMixto.setMatrixAt(i, m); }
            S.puntosMixto.instanceMatrix.needsUpdate = true;
        }
        // baterías: se cargan y descargan
        S.cargas.forEach((b, i) => { const c = 0.55 + 0.4 * Math.sin(tiempo * 0.6 + i * 1.5); b.scale.x = c; b.position.x = (i ? 0.3 : -0.3) - 0.18 * (1 - c); });
        // la energía por la red
        S.puntos.visible = e < 0.2;
        if (S.puntos.visible) {
            for (let i = 0; i < 48; i++) {
                const hilo = S.hilos[i % 2];
                hilo.getPointAt(((i / 48) + tiempo * 0.06 * (i % 2 ? 1 : -1) + 1) % 1, q);
                m.makeTranslation(q.x, q.y, q.z);
                S.puntos.setMatrixAt(i, m);
            }
            S.puntos.instanceMatrix.needsUpdate = true;
        }

        return {
            cifras: {
                estado: `Estado ${num(estadoPct)} %`,
                hud: espera > 0 ? `Los privados piden ${num(pedido)} %: solo cabe 46 %` : 'Se cumple la regla: el Estado pone al menos 54 %',
                cfe: `${num(estadoPct)} %`,
                privados: `${num(privados)} %`,
                espera: espera > 0 ? `${num(espera)} %` : 'nada',
                esquema: plp ? 'todo a CFE' : 'CFE ≥ 54 %',
            },
        };
    },
});

// letrero: textura de canvas clara con texto oscuro, que se vuelve a dibujar solo cuando cambia
function letrero(ancho, alto, texto) {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = Math.round(320 * alto / ancho);
    const g = c.getContext('2d');
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    m.userData.sinResalte = true;
    let ultimo = null;
    m.userData.poner = s => {
        if (s === ultimo) return;
        ultimo = s;
        g.clearRect(0, 0, c.width, c.height);
        g.fillStyle = '#f7f5f1';
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#9b2247';
        let tam = Math.round(c.height * 0.62);
        g.font = `700 ${tam}px Manrope, sans-serif`;
        tam = Math.floor(tam * Math.min(1, (c.width * 0.9) / Math.max(1, g.measureText(s).width)));
        g.font = `700 ${tam}px Manrope, sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(s, c.width / 2, c.height / 2 + 2);
        t.needsUpdate = true;
    };
    m.userData.poner(texto);
    return m;
}
