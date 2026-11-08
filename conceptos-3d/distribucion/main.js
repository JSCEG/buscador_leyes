// «Red de distribución», en 3D: una calle. Desde la subestación sale un alimentador de 13.8 kV por los postes; en un poste,
// tres cortacircuitos fusibles protegen a un transformador que baja a 220/127 V; de ahí la red de baja tensión corre por
// los postes y una acometida baja a cada casa, donde un medidor cuenta la energía.
//
// Entrada: la hora del día. Cada casa consume según un perfil de ejemplo (poco en la madrugada, más en la mañana y lo
// máximo en la noche); el medidor de la casa de enfrente suma los kWh del día.
// Botón «Falla»: una rama toca la línea de baja tensión; el fusible del transformador se abre (cae) para proteger la red
// y las casas se quedan sin luz.
//
// Cifras: perfil y transformador de 50 kVA de ejemplo; I = P ÷ (√3 × V) en 13.8 kV y 220 V.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';
import { crearCorriente } from '../comun/corriente.js';

const F = 60;
const BASE = 0.16;
const KVA = 50;
const N_CASAS = 6;
const MI_CASA = 2; // la casa cuyo medidor se lee
const POSTES = [-2.7, -1.35, 0, 1.35, 2.7];
const Y_MEDIA = 1.55;
const Y_BAJA = 1.12;
const Z_POSTE = -0.15;
// consumo de una casa de ejemplo (kW) según la hora: madrugada, mañana, tarde y noche
const perfil = h => {
    const g = (c, a, s) => { const u = ((h - c + 36) % 24) - 12; return a * Math.exp(-(u * u) / (2 * s * s)); };
    return 0.3 + g(7.5, 0.7, 1.2) + g(14, 0.4, 2) + g(20.5, 1.6, 1.8);
};
const factorCasa = i => 0.8 + 0.4 * ((i * 37) % 10) / 10;
// energía del día hasta la hora h (kWh), sumando el perfil en pasos de 6 minutos
const energiaHasta = (h, k = 1) => { let e = 0; for (let t = 0; t < h; t += 0.1) e += perfil(t + 0.05) * 0.1 * k; return e; };

let piezasD = null;
let fase = 0;
let hora = 20;
let caido = 0;

crearMaquina({
    figura: 'distribucion',
    nombre: 'la red de la calle',
    partes: [
        { n: 1, nombre: 'Alimentador de 13.8 kV', ancla: [-2.0, 2.1, -0.15], vista: { tx: -2.0, ty: 1.2, tz: -0.1, az: 16, el: 12, d: 3.4 } },
        { n: 2, nombre: 'Cortacircuito fusible', ancla: [0.0, 2.0, 0.1], vista: { tx: 0, ty: 1.4, tz: -0.1, az: 8, el: 10, d: 1.8 } },
        { n: 3, nombre: 'Transformador de poste', ancla: [0.35, 1.7, 0.1], vista: { tx: 0.15, ty: 1.15, tz: -0.1, az: 10, el: 10, d: 2.0 } },
        { n: 4, nombre: 'Red de baja tensión', ancla: [1.8, 1.6, -0.15], vista: { tx: 1.6, ty: 1.0, tz: -0.2, az: -8, el: 12, d: 3.0 } },
        { n: 5, nombre: 'Acometida', ancla: [1.1, 1.3, -0.6], vista: { tx: 1.0, ty: 0.8, tz: -0.6, az: 4, el: 14, d: 2.4 } },
        { n: 6, nombre: 'Medidor', ancla: [-0.1, 0.95, -0.75], vista: { tx: -0.11, ty: 0.48, tz: -0.78, az: 0, el: 6, d: 1.4 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 0.9, tz: 0, az: 12, el: 20, d: 7.6 },
        { id: 'poste', texto: 'El poste', tx: 0.1, ty: 1.3, tz: -0.1, az: 14, el: 8, d: 2.6 },
        { id: 'medidor', texto: 'El medidor', tx: -0.11, ty: 0.48, tz: -0.78, az: 0, el: 6, d: 1.5 },
    ],
    entrada: { etiqueta: 'Hora del día', min: 0, max: 24, paso: 0.25, valor: 20, aria: 'Hora del día' },
    selectores: [{ id: 'falla', etiqueta: 'Falla', valor: 'no', opciones: [{ id: 'no', texto: 'Sin falla' }, { id: 'si', texto: 'Rama en la línea' }] }],
    lento: [
        { id: 'lento', texto: '1/60', k: 1 / 60, nota: 'Cámara lenta: un ciclo de la red dura un segundo.' },
        { id: 'real', texto: 'Real', k: 1, nota: 'La corriente va y viene 60 veces por segundo.' },
    ],
    hud: '<b data-c="hora"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'calle', etiqueta: 'Consumo de la calle', nota: `${N_CASAS} casas, perfil de ejemplo` },
        { id: 'trafo', etiqueta: 'Carga del transformador', nota: `de ${KVA} kVA (ejemplo)` },
        { id: 'corrientes', etiqueta: 'Corriente', nota: 'en 13.8 kV · en 220 V' },
        { id: 'kwh', etiqueta: 'Medidor de una casa', nota: 'energía del día' },
    ],
    curva: {
        titulo: 'Consumo de la calle a lo largo del día',
        leyenda: [{ texto: 'kW de las casas' }],
        nota: 'Perfil de ejemplo: lo más alto llega en la noche, cuando todos están en casa.',
        dibujar(g, w, h, estado) {
            const total = t => Array.from({ length: N_CASAS }, (_, i) => perfil(t) * factorCasa(i)).reduce((a, b) => a + b, 0);
            const x = t => (t / 24) * (w - 10) + 5;
            const y = p => h - 6 - (p / 14) * (h - 14);
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath();
            for (let t = 0; t <= 24.001; t += 0.25) { if (t === 0) g.moveTo(x(t), y(total(t))); else g.lineTo(x(t), y(total(t))); }
            g.stroke();
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(hora), y(total(hora)), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: false,
    anchoVertical: 1.8,
    lejaniaMax: 3.0,
    entradaRecorrido: t => (6 + t * 0.9) % 24,

    construir({ raiz, M, P, TEMA, sombra, contorno, escena }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.16, 3.2), M.ceramica))).translateY(0.08));
        raiz.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.01, 0.7), M.mat(TEMA === 'oscuro' ? '#3a3c44' : '#d6d4cf', { roughness: 0.9 }))).translateY(BASE + 0.005).translateZ(0.45));
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const cable = (c, r = 0.011, mat = M.grafito) => new THREE.Mesh(new THREE.TubeGeometry(c, 64, r, 6, false), mat);

        // la subestación al fondo, de donde sale el alimentador
        const sub = new THREE.Group();
        sub.position.set(-3.25, BASE, -0.9);
        sub.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), M.ceramica))).translateY(0.225));
        sub.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.52), M.borde)).translateY(0.45));
        raiz.add(sub);

        // 1 · postes con cruceta (tres fases de media arriba) y su línea de baja más abajo
        const red = new THREE.Group();
        POSTES.forEach(x => {
            red.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.65, 12), M.ceramica)).translateX(x).translateY(BASE + 0.82).translateZ(Z_POSTE));
            red.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.7), M.grafito)).translateX(x).translateY(Y_MEDIA - 0.04).translateZ(Z_POSTE));
            for (const dz of [-0.3, 0, 0.3]) red.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.06, 8), M.ceramica)).translateX(x).translateY(Y_MEDIA).translateZ(Z_POSTE + dz));
            if (x > -2) red.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), M.grafito)).translateX(x).translateY(Y_BAJA).translateZ(Z_POSTE + 0.05));
        });
        const fasesMedia = [-0.3, 0, 0.3].map(dz => curva([-3.25, BASE + 0.45, -0.9 + dz * 0.3], [-3.0, Y_MEDIA - 0.1, Z_POSTE + dz], ...POSTES.map(x => [x, Y_MEDIA + 0.02, Z_POSTE + dz])));
        fasesMedia.forEach(c => red.add(cable(c)));
        raiz.add(red);

        // 2 · cortacircuitos fusibles en el poste del centro: tubitos que caen cuando se funde el fusible
        const fusibles = new THREE.Group();
        const tubos = [];
        [-0.2, 0, 0.2].forEach(dz => {
            fusibles.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 10), M.ceramica)).translateX(0.12).translateY(Y_MEDIA - 0.2).translateZ(Z_POSTE + dz));
            const giro = new THREE.Group();
            giro.position.set(0.12, Y_MEDIA - 0.3, Z_POSTE + dz);
            giro.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 10), M.borde)).translateY(0.11));
            fusibles.add(giro);
            tubos.push(giro);
        });
        raiz.add(fusibles);

        // 3 · transformador de poste: tanque cilíndrico con boquillas
        const trafo = new THREE.Group();
        trafo.position.set(0.2, Y_BAJA - 0.15, Z_POSTE + 0.12);
        trafo.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.42, 28), M.ceramica)), 40));
        trafo.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 28).rotateX(Math.PI / 2), M.borde)).translateY(0.21));
        trafo.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.12, 10), M.ceramica)).translateY(0.27));
        for (const dz of [-0.07, 0.07]) trafo.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8), M.grafito)).translateX(0.12).translateY(0.12).translateZ(dz));
        raiz.add(trafo);
        const puente = curva([0.12, Y_MEDIA - 0.3, Z_POSTE], [0.18, Y_MEDIA - 0.4, Z_POSTE + 0.1], [0.2, Y_BAJA + 0.18, Z_POSTE + 0.12]);
        raiz.add(cable(puente, 0.009));

        // 4 · red de baja tensión (de -1.35 a 2.7, en los postes)
        const baja = curva([0.32, Y_BAJA - 0.05, Z_POSTE + 0.12], ...POSTES.filter(x => x > -2).map(x => [x, Y_BAJA + 0.04, Z_POSTE + 0.05]));
        const bajaIzq = curva([0.32, Y_BAJA - 0.05, Z_POSTE + 0.08], [0, Y_BAJA + 0.04, Z_POSTE + 0.05], [-1.35, Y_BAJA + 0.04, Z_POSTE + 0.05]);
        const lineaBaja = new THREE.Group();
        lineaBaja.add(cable(baja, 0.014), cable(bajaIzq, 0.014));
        raiz.add(lineaBaja);

        // 5 y 6 · casas en fila, del otro lado de los postes, cada una con su acometida y su medidor en la fachada
        const casas = [];
        const acometidas = new THREE.Group();
        const xs = [-2.05, -1.2, -0.35, 0.65, 1.55, 2.45];
        xs.forEach((x, i) => {
            const enfrente = false;
            const z = enfrente ? 1.25 : -1.05;
            const casa = new THREE.Group();
            casa.position.set(x, BASE, z);
            casa.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.5), M.ceramica))).translateY(0.25));
            const techo = sombra(new THREE.Mesh(new THREE.ConeGeometry(0.47, 0.22, 4).rotateY(Math.PI / 4), M.borde));
            techo.scale.set(1, 1, 0.82);
            techo.position.y = 0.61;
            casa.add(techo);
            const lado = enfrente ? -1 : 1; // la fachada mira a la calle
            const ventanas = [-0.15, 0.15].map(dx => { const v = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.12), new THREE.MeshBasicMaterial({ color: P.grafito })); v.position.set(dx, 0.3, lado * 0.252); if (lado < 0) v.rotation.y = Math.PI; v.userData.sinResalte = true; casa.add(v); return v; });
            const medidor = new THREE.Group();
            medidor.position.set(0.24, 0.32, lado * 0.27);
            if (lado < 0) medidor.rotation.y = Math.PI;
            medidor.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.13, 0.04), M.ceramica)));
            const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.005, 16).rotateX(Math.PI / 2), M.borde);
            disco.position.z = 0.022;
            medidor.add(disco);
            casa.add(medidor);
            raiz.add(casa);
            const xp = x < -0.7 ? -1.35 : x < 0.3 ? 0 : x < 2.0 ? 1.35 : 2.7;
            const acom = curva([xp, Y_BAJA + 0.04, Z_POSTE + 0.05], [(xp + x) / 2, Y_BAJA - 0.12, (Z_POSTE + z) / 2], [x + 0.24, BASE + 0.42, z + lado * 0.27]);
            acometidas.add(cable(acom, 0.008));
            casas.push({ casa, ventanas, medidor, disco, acom, k: factorCasa(i), fase: 0 });
        });
        raiz.add(acometidas);
        // la pantalla del medidor de la casa junto al transformador
        const lectura = pantallita(0.09, 0.035);
        lectura.position.set(0, 0.045, 0.022);
        casas[MI_CASA].medidor.add(lectura);

        // árbol de enfrente: con falla, su rama toca la línea de baja tensión y se funde el fusible del transformador
        const arbol = new THREE.Group();
        arbol.position.set(0.85, BASE, 0.75);
        arbol.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8, 10), M.mat('#7a5a3a', { roughness: 0.9 }))).translateY(0.4));
        arbol.add(sombra(new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 14), M.mat(TEMA === 'oscuro' ? '#5f8a5a' : '#7fa877', { roughness: 0.9 }))).translateY(1.0));
        const rama = new THREE.Group();
        rama.position.set(0, 0.9, 0);
        rama.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.9, 8).translate(0, 0.45, 0), M.mat('#7a5a3a', { roughness: 0.9 }))));
        rama.rotation.set(-0.6, 0, 0.25);
        arbol.add(rama);
        raiz.add(arbol);

        // corriente: tres fases de media (pocos puntos), la línea de baja y cada acometida
        const corrMedia = fasesMedia.map(c => crearCorriente({ raiz, escena, curvas: [c], P, radio: 0.018, puntosPorCable: 14 }));
        const corrBaja = [baja, bajaIzq].map(c => crearCorriente({ raiz, escena, curvas: [c], P, radio: 0.02, puntosPorCable: 12 }));
        const corrCasa = casas.map(c => crearCorriente({ raiz, escena, curvas: [c.acom], P, radio: 0.016, puntosPorCable: 6 }));

        piezasD = { tubos, rama, casas, lectura, corrMedia, corrBaja, corrCasa };
        return {
            piezas: { 1: [red], 2: [fusibles], 3: [trafo], 4: [lineaBaja], 5: [acometidas], 6: casas.map(c => c.medidor) },
            movibles: [
                { parte: 2, objetos: [fusibles], hacia: [0.1, 0.4, 0.4] },
                { parte: 3, objetos: [trafo], hacia: [0.4, 0.2, 0.4] },
                { parte: 6, objetos: casas.map(c => c.casa), hacia: [0, 0, 0.3] },
            ],
            anclas: { 1: [red, [-2.0, 1.9, -0.15]], 2: [fusibles, [0.12, 1.85, -0.15]], 3: [trafo, [0, 0.4, 0]], 4: [lineaBaja, [1.8, 1.4, -0.1]], 5: [acometidas, [0.9, 1.2, -0.6]], 6: [casas[MI_CASA].medidor, [0, 0.35, 0]] },
        };
    },

    paso(estado) {
        const S = piezasD;
        const { dt, dtSim, e } = estado;
        // la hora corre suave (y da la vuelta de 24 a 0 sin regresar todo el día)
        let d = estado.entradaObjetivo - estado.entrada;
        if (Math.abs(d) > 12) estado.entrada += Math.sign(d) * 24;
        d = estado.entradaObjetivo - estado.entrada;
        estado.entrada += d * (1 - Math.exp(-dt / 0.25));
        hora = ((estado.entrada % 24) + 24) % 24;
        fase += 2 * Math.PI * F * dtSim;

        const falla = estado.sel.falla === 'si';
        S.rama.rotation.x += ((falla ? -1.46 : -0.6) - S.rama.rotation.x) * (1 - Math.exp(-dt / 0.3));
        const toca = falla && S.rama.rotation.x < -1.4;
        caido += clamp((toca ? 1 : 0) - caido, -dt * 1.5, dt * 1.5);
        S.tubos.forEach(t => { t.rotation.z = caido * 2.2; });
        const hay = (caido < 0.05 ? 1 : 0) * (1 - clamp(e * 6, 0, 1));

        let total = 0;
        S.casas.forEach((c, i) => {
            const kw = perfil(hora) * c.k * hay;
            total += kw;
            const luz = hay && (hora > 18.5 || hora < 6.5 || (hora > 6.5 && hora < 8));
            c.ventanas.forEach((v, j) => v.material.color.set(luz && (j === 0 || kw > 1.2 * c.k) ? estado.P.corriente : estado.P.grafito));
            c.fase += dtSim * kw * 6;
            c.disco.rotation.z = c.fase;
            c.kw = kw;
        });
        const iMedia = (total / (Math.sqrt(3) * 13.8));
        const iBaja = (total * 1000) / (Math.sqrt(3) * 220);
        const kwh = energiaHasta(hora, S.casas[MI_CASA].k);
        S.lectura.userData.poner(`${num(kwh, 1)} kWh`);
        estado.dist = { total, hay };
        const hh = Math.floor(hora);
        const mm = Math.floor((hora - hh) * 60);
        return {
            cifras: {
                hora: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} h`,
                hud: caido > 0.5 ? 'La rama tocó la línea de baja: el fusible del transformador se abrió y la calle se quedó sin luz' : falla ? 'Una rama se acerca a la línea…' : `13.8 kV en los postes · 220/127 V a las casas`,
                calle: `${num(total, 1)} kW`,
                trafo: `${num((total / KVA) * 100)} %`,
                corrientes: `${num(iMedia, 1)} A · ${num(iBaja)} A`,
                kwh: `${num(kwh, 1)} kWh`,
            },
        };
    },

    despues(estado) {
        const S = piezasD;
        const { total, hay } = estado.dist;
        const base = { camara: estado.camara, w: estado.w, h: estado.h, dt: estado.dtSim, polos: 0, avance: 0.02 * 2 * Math.PI * F };
        const k = total / KVA;
        S.corrMedia.forEach((c, i) => c.actualizar({ ...base, corriente: Math.sin(fase - (i * 2 * Math.PI) / 3) * k * 0.3, visible: hay }));
        S.corrBaja.forEach(c => c.actualizar({ ...base, corriente: Math.sin(fase) * k, visible: hay }));
        S.corrCasa.forEach((c, i) => c.actualizar({ ...base, corriente: Math.sin(fase) * (S.casas[i].kw / 3), visible: hay }));
    },
});

// pantallita del medidor: número claro sobre fondo oscuro
function pantallita(ancho, alto) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = Math.round(256 * alto / ancho);
    const g = c.getContext('2d');
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t }));
    m.userData.sinResalte = true;
    let ultimo = '';
    m.userData.poner = texto => {
        if (texto === ultimo) return;
        ultimo = texto;
        g.fillStyle = '#13151f';
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#7ef0a6';
        g.font = `700 ${Math.round(c.height * 0.62)}px Manrope, sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(texto, c.width / 2, c.height / 2 + 2);
        t.needsUpdate = true;
    };
    return m;
}
