/**
 * El color de vidrio con el que carga el búho. Si la persona ya eligió uno en sus muestras, se respeta; si no, se turnan azul y
 * verde de una visita a otra (dentro de la misma visita no cambia: la portada y la guía se ven igual).
 */
const ELEGIDO = 'buho-vidrio';
const ULTIMO = 'buho-vidrio-turno';
const DE_ESTA_VISITA = 'buho-vidrio-visita';
export const VIDRIOS_BUHO = Object.freeze(['azul', 'verde', 'ambar', 'guinda']);

const leer = (almacen, clave) => { try { return almacen?.getItem(clave) ?? null; } catch { return null; } };
const guardar = (almacen, clave, valor) => { try { almacen?.setItem(clave, valor); } catch { /* sin almacenamiento también funciona */ } };

export function vidrioDelBuho({ local = globalThis.localStorage, sesion = globalThis.sessionStorage } = {}) {
    const elegido = leer(local, ELEGIDO);
    if (VIDRIOS_BUHO.includes(elegido)) return elegido;
    const visita = leer(sesion, DE_ESTA_VISITA);
    if (visita === 'azul' || visita === 'verde') return visita;
    const toca = leer(local, ULTIMO) === 'azul' ? 'verde' : 'azul';
    guardar(local, ULTIMO, toca);
    guardar(sesion, DE_ESTA_VISITA, toca);
    return toca;
}

export function elegirVidrioDelBuho(vidrio, { local = globalThis.localStorage } = {}) {
    if (VIDRIOS_BUHO.includes(vidrio)) guardar(local, ELEGIDO, vidrio);
}
