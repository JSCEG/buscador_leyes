// «Central eólica», en 3D: un aerogenerador de 3 MW con rotor de 120 m. El viento empuja las aspas (sustentación, como
// el ala de un avión), el rotor gira lento, la caja de engranes acelera el giro para el generador, y un transformador al
// pie de la torre sube el voltaje para la red. El anemómetro mide el viento; la góndola gira para mirar al viento; con
// viento fuerte el sistema de paso gira las aspas para soltar el exceso y, con viento peligroso, la turbina se detiene.
//
// Entrada: la velocidad del viento (m/s). Botón: de dónde viene el viento (la góndola gira para encararlo).
//
// Modelo (calculado aquí): P = ½ · ρ · A · v³ · Cp con ρ = 1.225 kg/m³, A = π · 60² m² y Cp = 0.40, limitada a 3 MW;
// arranca a 3.5 m/s y se detiene a 25 m/s (DOE: arranca con 7 a 11 mph y se apaga arriba de 55 a 65 mph); el rotor gira
// con una relación de punta de 7 (unas 12 rpm como máximo) y la caja de engranes multiplica por 100.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const RHO = 1.225;
const AREA = Math.PI * 60 * 60;
const CP = 0.4;
const NOMINAL = 3e6;
const ARRANQUE = 3.5;
const PARO = 25;
const V_NOM = Math.cbrt(NOMINAL / (0.5 * RHO * AREA * CP));
const BASE = 0.16;
const ALTO = 1.95;
const R_ASPA = 0.95;

const potencia = v => (v < ARRANQUE || v >= PARO ? 0 : Math.min(NOMINAL, 0.5 * RHO * AREA * v * v * v * CP));
const rpmRotor = v => (v < ARRANQUE || v >= PARO ? 0 : Math.min(12, (7 * v / 60) * (60 / (2 * Math.PI))));
const paso = v => (v >= PARO ? 90 : v > V_NOM ? Math.min(28, (v - V_NOM) * 1.9) : 0);

let piezasW = null;
let giro = 0;
let pasoActual = 0;
let yaw = 0;
let viento = 9;
let tiempo = 0;

crearMaquina({
    figura: 'eolica',
    nombre: 'el aerogenerador',
    partes: [
        { n: 1, nombre: 'Aspas', ancla: [0.3, ALTO + 1.25, 0.4], vista: { tx: 0.3, ty: ALTO, tz: 0.3, az: 10, el: 8, d: 4.2 } },
        { n: 2, nombre: 'Sistema de paso', ancla: [0.3, ALTO + 0.55, 0.6], vista: { tx: 0.3, ty: ALTO, tz: 0.3, az: 30, el: 10, d: 1.6 } },
        { n: 3, nombre: 'Caja de engranes', ancla: [0.25, ALTO + 0.55, 0], vista: { tx: 0.3, ty: ALTO, tz: -0.1, az: 70, el: 18, d: 1.7 }, corte: true },
        { n: 4, nombre: 'Generador', ancla: [0.4, ALTO + 0.55, -0.35], vista: { tx: 0.3, ty: ALTO, tz: -0.2, az: 70, el: 18, d: 1.7 }, corte: true },
        { n: 5, nombre: 'Freno', ancla: [0.55, ALTO + 0.45, -0.15], vista: { tx: 0.3, ty: ALTO, tz: -0.15, az: 70, el: 18, d: 1.6 }, corte: true },
        { n: 6, nombre: 'Anemómetro y orientación', ancla: [0.1, ALTO + 0.6, -0.5], vista: { tx: 0.3, ty: ALTO + 0.1, tz: -0.2, az: 40, el: 30, d: 1.8 } },
        { n: 7, nombre: 'Torre y transformador', ancla: [0.9, 0.9, 0.5], vista: { tx: 0.5, ty: 0.6, tz: 0.2, az: 20, el: 14, d: 3.2 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0.1, ty: 1.35, tz: 0, az: 16, el: 12, d: 7.4 },
        { id: 'gondola', texto: 'La góndola', tx: 0.3, ty: ALTO, tz: -0.1, az: 60, el: 18, d: 2.2, corte: true },
        { id: 'frente', texto: 'De frente', tx: 0.3, ty: ALTO - 0.2, tz: 0, az: 0, el: 4, d: 5.4 },
    ],
    entrada: { etiqueta: 'Velocidad del viento', min: 0, max: 30, paso: 0.5, valor: 9, aria: 'Velocidad del viento en metros por segundo' },
    selectores: [{ id: 'direccion', etiqueta: 'Viento', valor: 'frente', opciones: [{ id: 'frente', texto: 'De frente' }, { id: 'lado', texto: 'De lado' }] }],
    lento: [
        { id: 'real', texto: 'Real', k: 1, nota: 'A velocidad real: el rotor da como máximo unas 12 vueltas por minuto.' },
        { id: 'rapido', texto: '×4', k: 4, nota: 'Cuatro veces más rápido, para ver la góndola girar hacia el viento.' },
    ],
    hud: '<b data-c="mw"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'viento', etiqueta: 'Viento', nota: 'a la altura del rotor' },
        { id: 'rpm', etiqueta: 'Giro del rotor', nota: 'vueltas por minuto' },
        { id: 'gen', etiqueta: 'Giro del generador', nota: 'caja de engranes × 100' },
        { id: 'paso', etiqueta: 'Ángulo de las aspas', nota: 'sistema de paso' },
    ],
    curva: {
        titulo: 'Curva de potencia del aerogenerador',
        leyenda: [{ texto: 'potencia (MW)' }],
        nota: 'Con poco viento no arranca; la potencia crece con el cubo del viento hasta 3 MW; con viento peligroso se detiene.',
        dibujar(g, w, h, estado) {
            const x = v => (v / 30) * (w - 10) + 5;
            const y = p => h - 6 - (p / NOMINAL) * (h - 16);
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath();
            for (let v = 0; v <= 30; v += 0.1) { if (v === 0) g.moveTo(x(v), y(potencia(v))); else g.lineTo(x(v), y(potencia(v))); }
            g.stroke();
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(viento), y(potencia(viento)), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: true,
    anchoVertical: 1.2,
    lejaniaMax: 2.4,
    entradaRecorrido: t => 14 + 13 * Math.sin(t * 0.22),

    construir({ raiz, M, P, sombra, contorno }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 3.0), M.ceramica))).translateY(0.08));

        // 7 · torre tubular y transformador al pie, con el cable a la red
        const torre = new THREE.Group();
        torre.position.set(0.3, BASE, 0);
        torre.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.13, ALTO, 32), M.ceramica)), 40).translateY(ALTO / 2));
        torre.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.08, 32), M.grafito)).translateY(0.04));
        for (const y of [0.65, 1.3]) torre.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.12 - y * 0.03, 0.008, 6, 32).rotateX(Math.PI / 2), M.borde)).translateY(y));
        const trafo = new THREE.Group();
        trafo.position.set(0.65, 0, 0.45);
        trafo.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.26), M.ceramica))).translateY(0.15));
        trafo.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.28), M.borde)).translateY(0.3));
        torre.add(trafo);
        raiz.add(torre);

        // 3, 4, 5 y 6 · góndola: se orienta al viento; adentro el eje lento, la caja de engranes, el freno y el generador
        const gondola = new THREE.Group();
        gondola.position.set(0.3, BASE + ALTO, 0);
        // «Ver por dentro» vuelve el casco casi transparente (la góndola gira, así que un corte fijo no sirve)
        const cascoMat = M.ceramica.clone();
        cascoMat.transparent = true;
        const casco = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.95), cascoMat)));
        casco.position.set(0, 0.1, -0.2);
        const franjaMat = M.borde.clone();
        franjaMat.transparent = true;
        const franja = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.345, 0.04, 0.955), franjaMat));
        franja.position.set(0, 0.2, -0.2);
        gondola.add(casco, franja);
        const ejeLento = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.4, 16).rotateX(Math.PI / 2), M.acero));
        ejeLento.position.set(0, 0.08, 0.1);
        const caja = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.2), M.grafito));
        caja.position.set(0, 0.08, -0.17);
        const ejeRapido = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 12).rotateX(Math.PI / 2), M.acero));
        ejeRapido.position.set(0, 0.08, -0.36);
        const freno = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 24).rotateX(Math.PI / 2), M.borde));
        freno.position.set(0, 0.08, -0.32);
        const generador = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 24).rotateX(Math.PI / 2), M.cobre));
        generador.position.set(0, 0.08, -0.52);
        gondola.add(ejeLento, caja, ejeRapido, freno, generador);
        // anemómetro de cazoletas y veleta, arriba
        const anemo = new THREE.Group();
        anemo.position.set(-0.08, 0.3, -0.5);
        anemo.add(new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 6), M.grafito).translateY(0.05));
        const copas = new THREE.Group();
        copas.position.y = 0.1;
        for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), M.borde); b.position.set(Math.cos((i * 2 * Math.PI) / 3) * 0.04, 0, Math.sin((i * 2 * Math.PI) / 3) * 0.04); copas.add(b); }
        anemo.add(copas);
        const veleta = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.035, 0.07), M.grafito);
        veleta.position.set(0.16, 0.37, -0.52);
        gondola.add(anemo, veleta);

        // 1 y 2 · rotor: buje y tres aspas que cambian su ángulo (paso)
        const rotor = new THREE.Group();
        rotor.position.set(0, 0.08, 0.32);
        rotor.add(contorno(sombra(new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), M.ceramica)), 40));
        rotor.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.012, 8, 32), M.borde)));
        const aspas = [];
        const perfil = new THREE.Shape();
        perfil.moveTo(-0.045, 0); perfil.quadraticCurveTo(0, 0.02, 0.06, 0.008); perfil.lineTo(0.03, R_ASPA); perfil.lineTo(-0.01, R_ASPA); perfil.quadraticCurveTo(-0.03, 0.4, -0.045, 0);
        const geoAspa = new THREE.ExtrudeGeometry(perfil, { depth: 0.012, bevelEnabled: false }).translate(0, 0.08, -0.006);
        for (let i = 0; i < 3; i++) {
            const brazo = new THREE.Group();
            brazo.rotation.z = (i * 2 * Math.PI) / 3;
            const pasoG = new THREE.Group();
            const aspa = contorno(sombra(new THREE.Mesh(geoAspa, M.ceramica)), 30);
            pasoG.add(aspa);
            const punta = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 0.014), M.borde));
            punta.position.set(0.01, R_ASPA + 0.02, 0);
            pasoG.add(punta);
            brazo.add(pasoG);
            rotor.add(brazo);
            aspas.push(pasoG);
        }
        gondola.add(rotor);
        raiz.add(gondola);

        // parque al fondo: dos aerogeneradores más pequeños
        const fondo = [];
        for (const [x, z, k] of [[-1.8, -0.9, 0.6], [2.1, -1.0, 0.55]]) {
            const t = new THREE.Group();
            t.position.set(x, BASE, z);
            t.scale.setScalar(k);
            t.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.13, ALTO, 20), M.ceramica)).translateY(ALTO / 2));
            t.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.7), M.ceramica)).translateY(ALTO + 0.1).translateZ(-0.15));
            const r = new THREE.Group();
            r.position.set(0, ALTO + 0.1, 0.24);
            for (let i = 0; i < 3; i++) { const a = new THREE.Mesh(geoAspa, M.ceramica); a.rotation.z = (i * 2 * Math.PI) / 3; r.add(a); }
            t.add(r);
            raiz.add(t);
            fondo.push(r);
        }

        // cable enterrado a la red y estelas de viento
        const curva = new THREE.CatmullRomCurve3([[0.95, 0.3, 0.45], [1.3, 0.18, 0.7], [2.2, 0.18, 0.8], [2.55, 0.3, 0.8]].map(p => new THREE.Vector3(...p)));
        raiz.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(curva, 48, 0.02, 8, false), M.cable)));
        const red = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), M.ceramica)));
        red.position.set(2.6, BASE + 0.15, 0.8);
        raiz.add(red);
        const estelas = [];
        const estelaMat = new THREE.MeshBasicMaterial({ color: P.suave, transparent: true, opacity: 0.35, depthWrite: false });
        for (let i = 0; i < 26; i++) {
            const s = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.5), estelaMat);
            s.userData = { fase: Math.random(), x: -2.4 + Math.random() * 4.8, y: 0.6 + Math.random() * 2.6, sinResalte: true };
            raiz.add(s);
            estelas.push(s);
        }

        piezasW = { gondola, rotor, aspas, copas, fondo, estelas, cascoMat, franjaMat, casco };
        return {
            piezas: { 1: aspas, 2: [rotor], 3: [caja], 4: [generador], 5: [freno], 6: [anemo, veleta], 7: [torre] },
            movibles: [
                { parte: 1, objetos: [rotor], hacia: [0, 0.2, 0.8] },
                { parte: 3, objetos: [caja], hacia: [0.5, 0.3, 0] },
                { parte: 4, objetos: [generador], hacia: [0.5, 0.2, -0.3] },
                { parte: 6, objetos: [anemo], hacia: [0, 0.4, 0] },
            ],
            anclas: { 1: [rotor, [0.2, R_ASPA, 0.05]], 2: [rotor, [0, 0.15, 0.1]], 3: [caja, [0, 0.2, 0]], 4: [generador, [0, 0.2, 0]], 5: [freno, [0, 0.15, 0]], 6: [anemo, [0, 0.2, 0]], 7: [torre, [0.4, 0.8, 0.3]] },
        };
    },

    paso(estado) {
        const W = piezasW;
        const { dt, dtSim } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.6));
        viento = estado.entrada;
        tiempo += dtSim;
        const p = potencia(viento);
        const rpm = rpmRotor(viento);
        pasoActual += (paso(viento) - pasoActual) * (1 - Math.exp(-dtSim / 2));
        // la góndola gira despacio hasta encarar el viento
        const objetivo = estado.sel.direccion === 'lado' ? -Math.PI / 2 : 0;
        yaw += clamp(objetivo - yaw, -dtSim * 0.25, dtSim * 0.25);
        W.gondola.rotation.y = yaw;
        giro += (rpm / 60) * 2 * Math.PI * dtSim;
        W.rotor.rotation.z = -giro;
        W.aspas.forEach(a => { a.rotation.y = (pasoActual * Math.PI) / 180; });
        W.copas.rotation.y += dtSim * viento * 1.5;
        W.fondo.forEach(r => { r.rotation.z -= (rpm / 60) * 2 * Math.PI * dtSim * 1.1; });
        // estelas: corren en la dirección del viento, más rápido y más largas con más viento
        const dir = new THREE.Vector3(estado.sel.direccion === 'lado' ? 1 : 0, 0, estado.sel.direccion === 'lado' ? 0 : -1);
        W.estelas.forEach(s => {
            const u = (s.userData.fase + tiempo * (0.04 + viento * 0.012)) % 1;
            s.visible = viento > 0.5;
            const largo = 0.2 + viento * 0.03;
            s.scale.z = largo / 0.5;
            if (dir.x) { s.rotation.y = Math.PI / 2; s.position.set(-2.8 + u * 5.6, s.userData.y, s.userData.x * 0.5); } else { s.rotation.y = 0; s.position.set(s.userData.x, s.userData.y, 1.6 - u * 3.2); }
            s.material.opacity = 0.35 * Math.sin(u * Math.PI);
        });
        const abierto = 1 - clamp(estado.plano.constant / 50, 0, 1);
        W.cascoMat.opacity = W.franjaMat.opacity = 1 - 0.85 * abierto;
        W.cascoMat.depthWrite = W.franjaMat.depthWrite = abierto < 0.5;
        W.casco.castShadow = abierto < 0.5;
        const parado = viento >= PARO;
        return {
            cifras: {
                mw: `${num(p / 1e6, 2)} MW`,
                hud: parado ? 'Viento peligroso: aspas en bandera y freno puesto' : viento < ARRANQUE ? 'Muy poco viento: la turbina espera' : p >= NOMINAL ? 'Potencia máxima: el sistema de paso suelta el viento que sobra' : 'La potencia crece con el cubo del viento',
                viento: `${num(viento, 1)} m/s · ${num(viento * 3.6)} km/h`,
                rpm: `${num(rpm, 1)} rpm`,
                gen: `${num(rpm * 100)} rpm`,
                paso: `${num(pasoActual)}°`,
            },
        };
    },
});
