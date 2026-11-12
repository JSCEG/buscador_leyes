// Los conductores de las líneas aéreas, iguales en todas las figuras: tres fases de aluminio que cuelgan entre apoyos, con sus
// cadenas de aisladores en postes y torres. Las líneas salen de planta-comun/lineas.js (las que traen `apoyos`).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { colgar } from './lineas.js';

export const MATERIAL_CONDUCTOR = () => new THREE.MeshStandardMaterial({ color: '#7d838b', roughness: 0.38, metalness: 0.85, envMapIntensity: 1 });
export const MATERIAL_AISLADOR = () => new THREE.MeshStandardMaterial({ color: '#9fb8c4', roughness: 0.25, metalness: 0.1 });

/**
 * Dibuja las líneas aéreas de LINEAS (las que traen `apoyos`) y devuelve sus mallas. Una línea con `fases: 1` lleva un solo conductor.
 * parteDe(L): a qué punto clave pertenece cada línea; partes: el registro del kit, para que se pueda tocar.
 */
export function crearLineasAereas({ raiz, lineas, partes = {}, parteDe = () => null, movil = false, conductor = MATERIAL_CONDUCTOR(), aislador = MATERIAL_AISLADOR(), grueso = 0.0065 }) {
    const mallas = [];
    for (const L of lineas.filter(l => l.apoyos)) {
        const hilos = [];
        const cadenas = [];
        // fases: 3 (lo normal) o 1, para una línea monofásica o una acometida
        for (const k of L.fases === 1 ? [0] : [-1, 0, 1]) {
            const curva = new THREE.CatmullRomCurve3(colgar(L.apoyos, k).map(p => new THREE.Vector3(...p)));
            hilos.push(new THREE.TubeGeometry(curva, Math.max(12, Math.round(curva.getLength() * 28)), grueso, 5));
            for (const a of L.apoyos) {
                if (!a.aislador) continue;
                // la cadena de aisladores: un eje con sus platos, colgando del apoyo
                for (let j = 0; j < 4; j++) {
                    const g = new THREE.CylinderGeometry(0.016, 0.016, 0.008, 10);
                    g.translate(a.p[0] + k * a.fase[0], a.p[1] - 0.012 - (j * (a.aislador - 0.02)) / 3, a.p[2] + k * a.fase[2]);
                    cadenas.push(g);
                }
                const eje = new THREE.CylinderGeometry(0.004, 0.004, a.aislador, 6);
                eje.translate(a.p[0] + k * a.fase[0], a.p[1] - a.aislador / 2, a.p[2] + k * a.fase[2]);
                cadenas.push(eje);
            }
        }
        const parte = parteDe(L);
        const malla = new THREE.Mesh(mergeGeometries(hilos), conductor);
        malla.castShadow = !movil;
        raiz.add(malla);
        mallas.push(malla);
        if (parte && partes[parte]) partes[parte].push(malla);
        if (cadenas.length) {
            const m = new THREE.Mesh(mergeGeometries(cadenas), aislador);
            raiz.add(m);
            mallas.push(m);
            if (parte && partes[parte]) partes[parte].push(m);
        }
    }
    return mallas;
}
