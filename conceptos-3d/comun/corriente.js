import { MeshBasicMaterial, InstancedMesh, SphereGeometry, Matrix4, Vector3, Raycaster } from 'three';

// Corriente eléctrica por los cables, igual en todas las máquinas.
// - Puntos amarillos (la convención para la corriente; el verde es el cable de tierra y el azul, el agua) que se mueven
//   con la carga que ha pasado (q = ∫ i dt). En corriente alterna van y vienen; en corriente directa avanzan siempre en
//   un sentido.
// - Una marca + (guinda) y una − (grafito) sobre cada cable dicen qué polo es en este instante. En alterna se
//   intercambian cada medio ciclo; cerca de cero se desvanecen, porque ahí no hay polaridad que leer.
// Cada cable se da como curva de ida a vuelta; el segundo de un par es el regreso y su corriente va al revés.

export function crearCorriente({ raiz, escena, curvas, P, puntosPorCable = 22, radio = 0.027 }) {
    const material = new MeshBasicMaterial({ color: P.corriente, transparent: true });
    const puntos = new InstancedMesh(new SphereGeometry(radio, 10, 8), material, puntosPorCable * curvas.length);
    puntos.frustumCulled = false;
    raiz.add(puntos);
    const mtx = new Matrix4();
    const p = new Vector3();
    const dir = new Vector3();
    const rayo = new Raycaster();

    // una marca por cable, a la mitad de su largo
    const marcas = curvas.map(() => {
        const el = document.createElement('span');
        el.className = 'c-polo';
        el.setAttribute('aria-hidden', 'true');
        escena.append(el);
        return el;
    });

    let carga = 0;
    return {
        material,
        // avance: fracción del cable que recorre la carga por unidad de corriente y de tiempo
        // corriente: de −1 a 1 (relativa); dt: tiempo de la escena; visible: de 0 a 1; camara, w, h: para las marcas
        // polos: de 0 a 1; la máquina lo baja cuando la polaridad cambia tan rápido que las marcas solo parpadearían
        actualizar({ avance, corriente, dt, visible, polos = 1, camara, w, h }) {
            carga += avance * corriente * dt;
            material.opacity = visible;
            puntos.visible = visible > 0.02;
            if (puntos.visible) {
                curvas.forEach((curva, c) => {
                    const sentido = c % 2 === 0 ? 1 : -1;
                    for (let i = 0; i < puntosPorCable; i++) {
                        const u = (((i / puntosPorCable) + sentido * carga) % 1 + 1) % 1;
                        curva.getPointAt(u, p);
                        mtx.makeTranslation(p.x, p.y, p.z);
                        puntos.setMatrixAt(c * puntosPorCable + i, mtx);
                    }
                });
                puntos.instanceMatrix.needsUpdate = true;
            }
            // polos: el cable de ida es + cuando la corriente es positiva; el de regreso, lo contrario
            const nitidez = visible * polos * Math.min(1, Math.abs(corriente) / 0.25);
            curvas.forEach((curva, c) => {
                const el = marcas[c];
                if (nitidez < 0.02) { el.style.opacity = '0'; return; }
                const positivo = (corriente > 0) === (c % 2 === 0);
                el.textContent = positivo ? '+' : '−';
                el.classList.toggle('es-positivo', positivo);
                curva.getPointAt(0.5, p);
                raizAMundo(raiz, p);
                // si una pieza tapa el cable desde la cámara, la marca se esconde (es una etiqueta, no atraviesa piezas)
                dir.copy(p).sub(camara.position);
                const lejos = dir.length();
                rayo.set(camara.position, dir.normalize());
                rayo.far = lejos - 0.06;
                const tapado = rayo.intersectObjects(raiz.children, true).some(g => g.object !== puntos && g.object.visible && !g.object.isLineSegments);
                el.style.opacity = String(tapado ? 0 : nitidez);
                p.project(camara);
                el.style.transform = `translate(${(p.x * 0.5 + 0.5) * w}px, ${(-p.y * 0.5 + 0.5) * h}px) translate(-50%, -140%)`;
            });
        },
    };
}

const raizAMundo = (raiz, v) => raiz.localToWorld(v);
