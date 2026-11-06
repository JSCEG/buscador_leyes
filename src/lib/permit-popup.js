/** The permit's counts from the public registry, for the map's window. Missing data shows nothing. */
const COUNTS = [
    ['ResolucionesAsociadas', 'Resoluciones'],
    ['AcuerdosAsociados', 'Acuerdos'],
    ['OficiosAsociados', 'Oficios'],
    ['AnexosAsociados', 'Anexos'],
];

export function popupCounts(row) {
    if (!row) return '';
    const items = COUNTS.filter(([field]) => Number.isFinite(Number(row[field])) && row[field] !== null && row[field] !== undefined)
        .map(([field, label]) => `<div><dt>${label}</dt><dd>${Number(row[field]).toLocaleString('es-MX')}</dd></div>`);
    return items.length ? `<dl class="pmm-cuentas">${items.join('')}</dl>` : '';
}

/** Asks the registry once per permit. A slow or failed registry resolves to null: the window keeps working. */
export function registryCounts(fetchPermit, cache = new Map()) {
    return async numero => {
        if (cache.has(numero)) return cache.get(numero);
        let row = null;
        try { row = await fetchPermit(numero); } catch { row = null; }
        cache.set(numero, row);
        return row;
    };
}
