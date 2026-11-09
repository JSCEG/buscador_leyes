/**
 * Addresses of the energy calculator: #calculadora, #calculadora=<pestaña> and the full shared link
 * #calculadora=petroliferos&v=100&u=mbd&p=gasolina&b=fisica&t=35. This only checks the shape of
 * each value; normalizarEstado in motor.js drops what does not fit the tab. No imports: ui.js loads
 * this at start.
 */

const PESTANAS = ['electricidad', 'petroliferos', 'gas-natural', 'gas-lp', 'otras'];
const PREFIJO = '#calculadora';

const numero = s => (/^-?\d+(\.\d+)?$/.test(s ?? '') ? Number(s) : undefined);
const id = s => (/^[a-z0-9-]+$/.test(s ?? '') ? s : undefined);
const una = opciones => s => (opciones.includes(s) ? s : undefined);

const CAMPOS = [['v', 'valor', numero], ['u', 'unidad', id], ['p', 'producto', id], ['b', 'base', una(['oficial', 'fisica'])], ['h', 'horas', numero], ['mg', 'magnitud', id]];
const AJUSTES = [['t', numero], ['d', numero], ['c', id], ['pc', numero], ['k', una(['superior', 'inferior'])], ['m', id], ['pm', una(['man', 'abs'])], ['a', numero], ['dt', s => (s === '1' ? true : undefined)]];

/** The calculator state an address asks for, or null when the address is not the calculator's. */
export function calcRoute(hash) {
    if (typeof hash !== 'string') return null;
    if (hash === PREFIJO) return { pestana: 'electricidad' };
    if (!hash.startsWith(`${PREFIJO}=`)) return null;
    const [primera, ...resto] = hash.slice(PREFIJO.length + 1).split('&');
    const params = new URLSearchParams(resto.join('&'));
    const ruta = { pestana: PESTANAS.includes(primera) ? primera : 'electricidad' };
    for (const [clave, nombre, leer] of CAMPOS) {
        const v = leer(params.get(clave));
        if (v !== undefined) ruta[nombre] = v;
    }
    const ajustes = {};
    for (const [clave, leer] of AJUSTES) {
        const v = leer(params.get(clave));
        if (v !== undefined) ajustes[clave] = v;
    }
    if (Object.keys(ajustes).length) ruta.ajustes = ajustes;
    return ruta;
}

const vacio = v => v === undefined || v === null || v === '' || v === false;

/** The address for a calculator state; defaults (base oficial, empty values) are left out. */
export function calcHash(estado = {}) {
    const pestana = PESTANAS.includes(estado.pestana) ? estado.pestana : 'electricidad';
    const partes = [];
    for (const [clave, nombre] of CAMPOS) {
        const v = estado[nombre];
        if (vacio(v) || (clave === 'b' && v === 'oficial')) continue;
        partes.push(`${clave}=${encodeURIComponent(v)}`);
    }
    for (const [clave] of AJUSTES) {
        const v = estado.ajustes?.[clave];
        if (vacio(v)) continue;
        partes.push(`${clave}=${v === true ? '1' : encodeURIComponent(v)}`);
    }
    if (!partes.length && pestana === 'electricidad') return PREFIJO;
    return `${PREFIJO}=${[pestana, ...partes].join('&')}`;
}
