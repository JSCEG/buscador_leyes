// «Motor eléctrico», en 3D: la corriente vuelve imanes a las bobinas (electroimanes) y esos imanes jalan y empujan al
// imán del eje, que hace girar un ventilador. Se alimenta con una pila (corriente directa: un control invierte la
// corriente de las bobinas cada media vuelta) o con un contacto (corriente alterna: se invierte sola).
//
// Un solo dato lo mueve todo: el ángulo del rotor θ. La velocidad decide cuánto avanza; del ángulo salen la corriente
// de las bobinas, el color de sus polos, los puntos que corren por los cables, la gráfica y las cifras.
//
// Cifras:
// - Corriente alterna, motor síncrono de 2 polos: n = 120 · f ÷ p = 120 × 60 ÷ 2 = 3,600 vueltas por minuto.
//   (Un motor de inducción, el más común en casa, gira un poco menos, ~3,450: su rotor «resbala» de 2 a 5 %.)
// - Corriente directa: un motor chico de 12 V (ventilador, juguete) da unas 3,000 vueltas por minuto sin carga y su
//   velocidad crece con el voltaje. Es una cifra típica, no de un modelo en particular: verificar si se usa en un texto.
// - Con 2 polos, la corriente de las bobinas cambia de sentido 2 veces por vuelta: a 3,000 rpm son 100 veces por segundo.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';
import { crearCorriente } from '../comun/corriente.js';

const RPM_CD = 3000; // a 12 V
const V_CD = 12;
const F_RED = 60; // Hz
const POLOS = 2;
const RPM_CA = (120 * F_RED) / POLOS; // 3,600
const Y = 1.2; // altura del eje
const XM = -0.4; // centro del motor (estator y rotor)
const PISO_CABLE = 0.182; // cara de la bancada (0.16) + radio del cable

let rpm = 0;
let angulo = 0;
let corrienteBobinas = 0;
let piezasMotor = null; // lo que construir() deja para paso()

crearMaquina({
    figura: 'motor',
    nombre: 'el motor',
    partes: [
        { n: 1, nombre: 'Ventilador', ancla: [-2.4, 2.15, 0], vista: { tx: -2.2, ty: 1.2, tz: 0, az: -58, el: 14, d: 4.4 } },
        { n: 2, nombre: 'Imán que gira (rotor)', ancla: [XM, 1.78, 0.2], vista: { tx: XM, ty: 1.2, tz: 0, az: 26, el: 20, d: 3.7 }, corte: true },
        { n: 3, nombre: 'Bobinas: electroimanes (estator)', ancla: [XM, 2.0, 0.3], vista: { tx: XM, ty: 1.2, tz: 0, az: 36, el: 24, d: 3.9 }, corte: true },
        { n: 4, nombre: 'Control', ancla: [1.55, 0.95, 0], vista: { tx: 1.6, ty: 0.55, tz: 0, az: 32, el: 22, d: 3.2 } },
        { n: 5, nombre: 'Pila (corriente directa)', ancla: [2.55, 0.8, 0.85], vista: { tx: 2.5, ty: 0.45, tz: 0.8, az: 18, el: 18, d: 2.9 } },
        { n: 6, nombre: 'Contacto (corriente alterna)', ancla: [2.45, 1.35, -1.2], vista: { tx: 2.4, ty: 0.75, tz: -1.0, az: 12, el: 10, d: 3.1 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0.2, ty: 0.95, tz: 0, az: 30, el: 22, d: 9.0 },
        { id: 'frente', texto: 'Frente', tx: 0.2, ty: 0.95, tz: 0, az: 0, el: 6, d: 8.6 },
        { id: 'lado', texto: 'Lado', tx: -0.5, ty: 1.1, tz: 0, az: -86, el: 10, d: 6.4 },
        { id: 'arriba', texto: 'Arriba', tx: 0.2, ty: 0.6, tz: 0, az: 0, el: 68, d: 9.0 },
        { id: 'adentro', texto: 'Adentro', tx: XM, ty: 1.2, tz: 0, az: 26, el: 14, d: 3.8, corte: true },
    ],
    entrada: { etiqueta: 'Velocidad', min: 0, max: 100, paso: 1, valor: 100, aria: 'Velocidad del motor, en porcentaje' },
    selectores: [{ id: 'fuente', etiqueta: 'Fuente de corriente', valor: 'cd', opciones: [{ id: 'cd', texto: 'Pila (CD)' }, { id: 'ca', texto: 'Contacto (CA)' }] }],
    hud: '<b data-c="rpm"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'rpm', etiqueta: 'Velocidad', nota: 'vueltas por minuto' },
        { id: 'fuente', etiqueta: 'Fuente', nota: 'lo que alimenta al motor' },
        { id: 'polo', etiqueta: 'Polo de arriba', nota: 'del electroimán, en este instante' },
        { id: 'cambios', etiqueta: 'Cambios de sentido', nota: 'de la corriente en las bobinas' },
    ],
    curva: {
        titulo: 'Corriente en las bobinas',
        leyenda: [{ texto: 'bobinas' }],
        nota: 'Con pila, el control la invierte de golpe cada media vuelta; con contacto, sube y baja sola.',
        dibujar(g, w, h, estado) {
            // dos vueltas del rotor hacia atrás; el presente queda a la derecha
            const cd = estado.sel.fuente === 'cd';
            const m = clamp(rpm / 300, 0, 1);
            g.strokeStyle = estado.P.acento;
            g.lineWidth = 2.4;
            g.beginPath();
            for (let px = 0; px <= w; px += 2) {
                const a = angulo - Math.PI * 4 * (1 - px / w);
                const i = (cd ? Math.sign(Math.sin(a)) : Math.sin(a)) * m;
                const y = h / 2 - i * (h / 2 - 8);
                if (px === 0) g.moveTo(px, y); else g.lineTo(px, y);
            }
            g.stroke();
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(w - 4, h / 2 - corrienteBobinas * (h / 2 - 8), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: true,

    construir({ raiz, M, P, sombra, contorno, aro, conCorte, escena }) {
        // bancada
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.16, 2.9), M.ceramica))).translateY(0.08));

        // chumaceras
        const chumaceras = [-1.7, 0.9].map(x => {
            const g = new THREE.Group();
            g.position.set(x, 0, 0);
            const pata = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.34, Y - 0.2, 0.62), M.ceramica)));
            pata.position.y = 0.16 + (Y - 0.2) / 2;
            const caja = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 28).rotateZ(Math.PI / 2), M.grafito));
            caja.position.y = Y;
            const tapas = [aro(0.19, 0.022, -0.17), aro(0.19, 0.022, 0.17)];
            tapas.forEach(t => { t.position.y = Y; });
            g.add(pata, caja, ...tapas);
            raiz.add(g);
            return g;
        });
        // eje
        const eje = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 3.6, 24).rotateZ(Math.PI / 2), M.acero));
        eje.position.set(-0.75, Y, 0);
        raiz.add(eje);

        // 1 · Ventilador: cubo grafito, cinco aspas blancas con borde de tinta y un aro guinda de protección
        const ventilador = new THREE.Group();
        ventilador.position.set(-2.4, Y, 0);
        ventilador.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 28).rotateZ(Math.PI / 2), M.grafito)), aro(0.16, 0.02, 0.11));
        for (let i = 0; i < 5; i++) {
            const brazo = new THREE.Group();
            brazo.rotation.x = (i / 5) * Math.PI * 2;
            const aspa = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.56, 0.26), M.ceramica)));
            aspa.position.y = 0.44;
            aspa.rotation.y = 0.5; // inclinada para empujar el aire
            brazo.add(aspa);
            ventilador.add(brazo);
        }
        raiz.add(ventilador);
        // el aire que empuja: trazos pálidos que salen hacia atrás, más rápidos cuanto más gira
        const AIRE = 36;
        const aire = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.012, 0.16, 4, 6).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: P.suave, transparent: true, opacity: 0.45 }), AIRE);
        aire.frustumCulled = false;
        raiz.add(aire);
        const aireDatos = Array.from({ length: AIRE }, (_, i) => ({ r: 0.18 + ((i * 37) % 11) / 11 * 0.55, a: i * 2.399, f: (i * 0.618) % 1 }));

        // 2 · Rotor: imán de dos polos (norte guinda, sur grafito) con sus letras
        const rotor = new THREE.Group();
        rotor.position.set(XM, Y, 0);
        const mitad = (color, inicio) => {
            const m = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.0, 48, 1, false, inicio, Math.PI).rotateZ(-Math.PI / 2), M.mat(color, { roughness: 0.5 })));
            m.userData.sinResalte = true;
            return m;
        };
        rotor.add(mitad(P.norte, Math.PI), mitad(P.sur, 0));
        const letra = texto => {
            const c = document.createElement('canvas');
            c.width = c.height = 128;
            const g = c.getContext('2d');
            g.fillStyle = '#ffffff';
            g.font = '600 92px Manrope, sans-serif';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText(texto, 64, 70);
            const t = new THREE.CanvasTexture(c);
            t.colorSpace = THREE.SRGBColorSpace;
            return new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
        };
        for (const [texto, y] of [['N', 0.23], ['S', -0.23]]) for (const lado of [1, -1]) {
            const l = letra(texto);
            l.position.set(lado * 0.502, y, 0);
            l.rotation.y = lado * Math.PI / 2;
            rotor.add(l);
        }
        raiz.add(rotor);

        // 3 · Estator: carcasa blanca (se corta con «Ver por dentro») y dos electroimanes, arriba y abajo
        const estator = new THREE.Group();
        estator.position.set(XM, Y, 0);
        const R_IN = 0.84;
        const R_OUT = 1.02;
        const LARGO = 1.24;
        const perfil = [new THREE.Vector2(R_IN, -LARGO / 2), new THREE.Vector2(R_OUT, -LARGO / 2), new THREE.Vector2(R_OUT, LARGO / 2), new THREE.Vector2(R_IN, LARGO / 2), new THREE.Vector2(R_IN, -LARGO / 2)];
        const carcasa = sombra(new THREE.Mesh(new THREE.LatheGeometry(perfil, 72).rotateZ(-Math.PI / 2), conCorte(M.ceramica.clone())));
        contorno(carcasa, 35, Object.assign(M.contorno.clone(), { clippingPlanes: [carcasa.material.clippingPlanes[0]] }));
        for (const lado of [-1, 1]) carcasa.add(Object.assign(aro(R_OUT - 0.01, 0.026, lado * LARGO / 2), { material: conCorte(M.borde.clone()) }));
        estator.add(carcasa);
        // cada electroimán: núcleo de hierro (grafito), bobina de cobre alrededor y una cara de polo que cambia de
        // color con la corriente: guinda = norte, grafito = sur (los mismos colores del imán)
        const caras = [];
        const electroiman = signo => {
            const g = new THREE.Group();
            const nucleo = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.36), M.grafito));
            nucleo.position.y = signo * 0.7;
            const cara = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.07, 0.5), M.mat(P.sur, { roughness: 0.45 })));
            cara.position.y = signo * 0.53;
            cara.userData.sinResalte = true;
            caras.push(cara);
            for (let v = 0; v < 5; v++) {
                const espira = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.026, 8, 40).rotateX(Math.PI / 2), M.cobre));
                espira.scale.set(1.05, 1, 0.95);
                espira.position.y = signo * (0.6 + v * 0.045);
                g.add(espira);
            }
            g.add(nucleo, cara);
            return g;
        };
        const poloArriba = electroiman(1);
        const poloAbajo = electroiman(-1);
        estator.add(poloArriba, poloAbajo);
        raiz.add(estator);
        // tornillos de las tapas de la carcasa: salen volando al desarmar
        const TORNILLOS = [];
        for (const lado of [-1, 1]) for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
            TORNILLOS.push({ base: new THREE.Vector3(lado * (LARGO / 2 + 0.02), Math.cos(a) * 0.93, Math.sin(a) * 0.93), sale: new THREE.Vector3(lado * (0.45 + 0.25 * ((i * 7) % 3)), Math.cos(a) * 0.55, Math.sin(a) * 0.55) });
        }
        const tornillos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.038, 12, 10), M.grafito, TORNILLOS.length);
        tornillos.castShadow = true;
        tornillos.frustumCulled = false;
        raiz.add(tornillos);

        // 4 · Control: caja blanca con un chip y dos luces que dicen el sentido de la corriente de las bobinas
        const control = new THREE.Group();
        control.position.set(1.55, 0.16, 0);
        control.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.6), M.ceramica))).translateY(0.21));
        control.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.26), M.grafito)).translateY(0.44));
        const luz = color => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.3 })); m.userData.sinResalte = true; return m; };
        const luzMas = luz(P.positivo);
        luzMas.position.set(-0.18, 0.44, 0.2);
        const luzMenos = luz(P.negativo === '#2b2c31' ? '#5b5e63' : P.negativo);
        luzMenos.position.set(0.18, 0.44, 0.2);
        control.add(luzMas, luzMenos);
        raiz.add(control);

        // 5 · Pila de 12 V acostada: cuerpo blanco, banda guinda, borne + guinda y − grafito
        const pila = new THREE.Group();
        pila.position.set(2.55, 0.16 + 0.22, 0.85);
        pila.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.8, 40).rotateZ(Math.PI / 2), M.ceramica)), 40));
        pila.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.16, 40).rotateZ(Math.PI / 2), M.borde)).translateX(0.18));
        pila.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 20).rotateZ(Math.PI / 2), M.borde)).translateX(0.43));
        pila.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 30).rotateZ(Math.PI / 2), M.grafito)).translateX(-0.41));
        const rotulo = (() => {
            const c = document.createElement('canvas');
            c.width = 256;
            c.height = 128;
            const g = c.getContext('2d');
            g.fillStyle = P.tinta;
            g.font = '700 64px Manrope, sans-serif';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText('12 V', 128, 66);
            const t = new THREE.CanvasTexture(c);
            t.colorSpace = THREE.SRGBColorSpace;
            const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.17), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
            m.position.set(-0.12, 0.05, 0.222);
            return m;
        })();
        pila.add(rotulo);
        raiz.add(pila);

        // 6 · Contacto: un muro con su placa (dos ranuras y la tierra) y una clavija enchufada
        const contacto = new THREE.Group();
        contacto.position.set(2.45, 0.16, -1.25);
        contacto.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.95, 0.08), M.ceramica))).translateY(0.475));
        const placa = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.46, 0.03), M.ceramica)));
        placa.position.set(0, 0.55, 0.055);
        contacto.add(placa, sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.012), M.borde)).translateY(0.55).translateZ(0.04));
        for (const x of [-0.06, 0.06]) contacto.add(new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.07, 0.01), M.grafito).translateX(x).translateY(0.6).translateZ(0.072));
        contacto.add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.01, 16).rotateX(Math.PI / 2), M.grafito).translateY(0.5).translateZ(0.072));
        const clavija = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.12), M.grafito));
        clavija.position.set(0, 0.58, 0.13);
        contacto.add(clavija);
        raiz.add(contacto);

        // Cables: pegados a la bancada, en pares (ida y regreso). Pila → control, contacto → control, control → bobinas.
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const tubo = c => raiz.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 64, 0.022, 8, false), M.cable)));
        const PC = PISO_CABLE;
        const deLaPila = [
            curva([2.98, 0.38, 0.85], [3.06, PC, 0.85], [3.0, PC, 0.5], [2.2, PC, 0.4], [1.95, PC, 0.14], [1.91, 0.26, 0.12]),
            curva([2.12, 0.38, 0.85], [2.04, PC, 0.78], [1.98, PC, 0.32], [1.91, 0.26, 0.04]),
        ];
        const delContacto = [
            curva([2.41, 0.58, -1.06], [2.41, 0.4, -1.0], [2.41, PC, -0.95], [2.05, PC, -0.45], [1.95, PC, -0.12], [1.91, 0.26, -0.06]),
            curva([2.49, 0.58, -1.06], [2.49, 0.4, -1.0], [2.49, PC, -0.9], [2.12, PC, -0.4], [1.95, PC, -0.2], [1.91, 0.26, -0.14]),
        ];
        const SAL = XM + LARGO / 2 + 0.02;
        const aBobinas = [
            curva([1.19, 0.26, 0.08], [1.08, PC, 0.45], [0.55, PC, 0.48], [SAL + 0.08, PC, 0.22], [SAL, 0.3, 0.12]),
            curva([1.19, 0.26, -0.08], [1.08, PC, -0.45], [0.55, PC, -0.48], [SAL + 0.08, PC, -0.22], [SAL, 0.3, -0.12]),
        ];
        [...deLaPila, ...delContacto, ...aBobinas].forEach(tubo);
        const corrientes = {
            pila: crearCorriente({ raiz, escena, curvas: deLaPila, P }),
            contacto: crearCorriente({ raiz, escena, curvas: delContacto, P }),
            bobinas: crearCorriente({ raiz, escena, curvas: aBobinas, P }),
        };

        piezasMotor = { ventilador, eje, rotor, carcasa, estator, caras, luzMas, luzMenos, aire, aireDatos, tornillos, TORNILLOS, corrientes };
        return {
            piezas: { 1: [ventilador], 2: [rotor, eje, ...chumaceras], 3: [estator], 4: [control], 5: [pila], 6: [contacto] },
            movibles: [
                { parte: 1, objetos: [ventilador], hacia: [-1.1, 0, 0] },
                { parte: 2, objetos: [rotor, eje], hacia: [0, 0, 0] },
                { parte: 2, objetos: [chumaceras[0]], hacia: [-0.55, 0, 0] },
                { parte: 2, objetos: [chumaceras[1]], hacia: [0.6, 0, 0] },
                // la carcasa sale atrás y arriba; el electroimán de arriba sube y el de abajo sale por enfrente, por
                // debajo del imán (su cara queda a 0.62 del eje y el imán mide 0.45: no se tocan al pasar)
                { parte: 3, objetos: [carcasa], hacia: [0, 0.5, -2.3] },
                { parte: 3, objetos: [poloArriba], hacia: [0, 1.4, 0] },
                { parte: 3, objetos: [poloAbajo], hacia: [0, 0, 1.6] },
                { parte: 4, objetos: [control], hacia: [0.3, 0, 0.5] },
                { parte: 5, objetos: [pila], hacia: [0.45, 0, 0.4] },
                { parte: 6, objetos: [contacto], hacia: [0.45, 0, -0.3] },
            ],
            anclas: { 1: [ventilador, [0, 0.95, 0]], 2: [rotor, [0, 0.62, 0]], 3: [poloArriba, [0, 1.15, 0]], 4: [control, [0, 0.62, 0]], 5: [pila, [0, 0.42, 0]], 6: [contacto, [0, 1.12, 0]] },
        };
    },

    paso(estado) {
        const { ventilador, eje, rotor, carcasa, estator, caras, luzMas, luzMenos, aire, aireDatos, tornillos, TORNILLOS, corrientes } = piezasMotor;
        const { dt, dtSim, e, arrastre, P, M } = estado;
        const cd = estado.sel.fuente === 'cd';
        const fraccion = estado.entrada / 100;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.3));
        // desarmado, o con el imán, las bobinas, el control o su fuente fuera de lugar, el motor no tiene con qué girar
        const suelto = Math.max(e * 10, arrastre[2].length() * 4, arrastre[3].length() * 4, arrastre[4].length() * 4, arrastre[cd ? 5 : 6].length() * 4);
        const conectado = 1 - clamp(suelto, 0, 1);
        const rpmMeta = (cd ? RPM_CD : RPM_CA) * fraccion * conectado;
        rpm += (rpmMeta - rpm) * (1 - Math.exp(-dt / 0.6));
        angulo += (rpm / 60) * Math.PI * 2 * dtSim;
        const fuerza = clamp(rpm / 300, 0, 1);
        // la corriente de las bobinas: con pila, el control la invierte cada media vuelta; con contacto, es la de la red
        corrienteBobinas = (cd ? Math.sign(Math.sin(angulo)) : Math.sin(angulo)) * fuerza;

        ventilador.rotation.x = angulo;
        eje.rotation.x = angulo;
        rotor.rotation.x = angulo;
        // caras de los polos: arriba norte (guinda) cuando la corriente es positiva; abajo, al revés
        const tinte = (cara, i) => cara.material.color.set(P.sur).lerp(new THREE.Color(P.norte), clamp((i + 1) / 2, 0, 1));
        tinte(caras[0], corrienteBobinas);
        tinte(caras[1], -corrienteBobinas);
        luzMas.material.emissiveIntensity = corrienteBobinas > 0.1 ? 1.4 : 0;
        luzMenos.material.emissiveIntensity = corrienteBobinas < -0.1 ? 1.2 : 0;
        // aire del ventilador
        const m4 = new THREE.Matrix4();
        const velAire = (rpm / RPM_CA) * 1.6;
        aireDatos.forEach((d, i) => {
            d.f = (d.f + dt * velAire) % 1;
            const s = velAire > 0.02 && e < 0.05 ? 1 : 0;
            m4.makeTranslation(ventilador.position.x - 0.25 - d.f * 1.1, Y + Math.cos(d.a) * d.r, Math.sin(d.a) * d.r).scale(new THREE.Vector3(s, s, s));
            aire.setMatrixAt(i, m4);
        });
        aire.instanceMatrix.needsUpdate = true;
        // tornillos: siguen a la carcasa; con «Ver por dentro» los de la mitad cortada no están
        const p = new THREE.Vector3();
        TORNILLOS.forEach((t, i) => {
            p.copy(t.base).addScaledVector(t.sale, e).add(carcasa.position).add(estator.position);
            m4.makeTranslation(p.x, p.y, p.z);
            if (p.z > estado.plano.constant + 0.01) m4.scale(new THREE.Vector3(0, 0, 0));
            tornillos.setMatrixAt(i, m4);
        });
        tornillos.instanceMatrix.needsUpdate = true;

        // cables: se desvanecen al desarmar o al sacar el control, la pila o el contacto
        const cables = 1 - clamp(Math.max(e * 6, arrastre[3].length() * 3, arrastre[4].length() * 3, arrastre[5].length() * 3, arrastre[6].length() * 3), 0, 1);
        M.cable.opacity = cables;
        M.cable.visible = cables > 0.02;
        estado.motor = { cd, cables, fuerza };

        const cambiosPorSegundo = (rpm / 60) * 2;
        return {
            cifras: {
                rpm: `${num(Math.round(rpm / 10) * 10)} rpm`,
                hud: cd ? `Pila · ${num(V_CD * fraccion)} V de corriente directa` : `Contacto · ${num(F_RED * fraccion)} Hz de corriente alterna`,
                fuente: cd ? `Pila, ${num(V_CD * fraccion)} V` : `Contacto, ${num(F_RED * fraccion)} Hz`,
                polo: Math.abs(corrienteBobinas) < 0.1 ? '—' : corrienteBobinas > 0 ? 'Norte' : 'Sur',
                cambios: `${num(cambiosPorSegundo)} por segundo`,
            },
        };
    },

    // la corriente por los cables se dibuja después de la cámara (sus marcas + y − se colocan en la pantalla)
    despues(estado) {
        const { corrientes } = piezasMotor;
        const { cd, cables, fuerza } = estado.motor;
        const flips = (rpm / 60) * 2 * estado.lento.k;
        const polos = 1 - clamp(flips - 2, 0, 1);
        const base = { avance: 0.12, dt: estado.dt, camara: estado.camara, w: estado.w, h: estado.h };
        // la pila da corriente siempre en el mismo sentido; el contacto, alterna (al ritmo del rotor, que va sincronizado)
        corrientes.pila.actualizar({ ...base, corriente: cd ? fuerza : 0, visible: cd ? cables * fuerza : 0, polos: 1 });
        corrientes.contacto.actualizar({ ...base, corriente: cd ? 0 : Math.sin(angulo) * fuerza, visible: cd ? 0 : cables * fuerza, polos });
        corrientes.bobinas.actualizar({ ...base, corriente: corrienteBobinas, visible: cables * fuerza, polos });
    },
});
