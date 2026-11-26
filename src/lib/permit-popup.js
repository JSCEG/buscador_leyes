/** The permit's counts for the map's window. Missing data shows nothing. */
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

/**
 * Conteos del globo desde las ligas de Azure (/api/mapa/ligas, Ligas_Permisos_CNE): sólo resoluciones, que es lo que
 * Azure trae. Acuerdos, oficios y anexos no están en Azure y no se muestran. Sin ligas, nada.
 */
export function conteosDeLigas(ligas) {
    return ligas?.encontrado ? { ResolucionesAsociadas: (ligas.resoluciones || []).length } : null;
}
