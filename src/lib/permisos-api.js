/**
 * CNE and SENER permits API (services/permisos-api/API.md), through the server proxy /api/permisos/<endpoint>
 * (server/permisos-proxy.js keeps the API key). Pure helpers for the «CNE y SENER» tab: labels, filters and
 * the fields a record shows.
 */
import { STATE_NAME } from './cne-tables.js';
import { infraType } from './infra-icons.js';

/** Sources of the API, in the order the filters list them. */
export const SOURCES = Object.freeze([
    { key: 'electricidad', label: 'Generación eléctrica', autoridad: 'CNE' },
    { key: 'petroliferos', label: 'Expendios de petrolíferos', autoridad: 'CNE' },
    { key: 'gas-lp', label: 'Gas LP', autoridad: 'CNE' },
    { key: 'gas-natural', label: 'Gas natural', autoridad: 'CNE' },
    { key: 'transporte', label: 'Transporte', autoridad: 'CNE' },
    { key: 'comercializacion', label: 'Comercialización', autoridad: 'CNE' },
    { key: 'infraestructura', label: 'Infraestructura de hidrocarburos', autoridad: 'CNE' },
    { key: 'suministro', label: 'Suministro eléctrico', autoridad: 'CNE' },
    { key: 'terceros', label: 'Terceros acreditados', autoridad: 'CNE' },
    { key: 'asignaciones', label: 'Asignaciones', autoridad: 'SENER' },
    { key: 'pozos', label: 'Pozos', autoridad: 'SENER' },
    { key: 'contratos-ee', label: 'Contratos de exploración y extracción', autoridad: 'SENER' },
    { key: 'comercio-exterior', label: 'Comercio exterior', autoridad: 'SENER' },
    { key: 'biocombustibles', label: 'Biocombustibles', autoridad: 'SENER' },
].map(source => Object.freeze(source)));
export const SOURCE = Object.fromEntries(SOURCES.map(source => [source.key, source]));

export const MARKETS = Object.freeze(['Electricidad', 'Petrolíferos', 'Gas natural', 'Gas LP', 'Petróleo crudo', 'Petroquímicos', 'Biocombustibles', 'Varios']);

/** Laws the SENER tables name by code (Ley_aplicable); the acervo uses the same siglas. */
export const LAWS = Object.freeze({ LSH: 'Ley del Sector Hidrocarburos', LBio: 'Ley de Biocombustibles' });

/** Physical table names of the update log → source key («Asignaciones_SENER» → «asignaciones»). */
const PHYSICAL = {
    Electricidad_autorizado: 'electricidad', Expendios_autorizado: 'petroliferos', GasLP_autorizado: 'gas-lp', GasNatural_autorizado: 'gas-natural',
    Transporte_autorizado: 'transporte', Comercializacion_autorizado: 'comercializacion', Infraestructura_Hidrocarburos_autorizado: 'infraestructura',
    Suministro_Electrico_autorizado: 'suministro', Terceros_Acreditados_CNE: 'terceros', Asignaciones_SENER: 'asignaciones',
    Asignaciones_SENER_Municipios: 'asignaciones', ComercioExterior_SENER_autorizado: 'comercio-exterior', Contratos_EE_SENER: 'contratos-ee',
    Pozos_SENER: 'pozos', Biocombustibles_SENER_autorizado: 'biocombustibles',
};
export const sourceOfTable = name => PHYSICAL[String(name || '').replace(/^dbo\./, '')] || null;

/** Query string of the filters that have a value. */
export function query(params = {}) {
    const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
    return new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString();
}

/** GET /api/permisos/<endpoint>; throws with `status` on errors. */
export async function getPermisos(endpoint, params = {}, signal) {
    const qs = query(params);
    const response = await fetch(`/api/permisos/${endpoint}${qs ? `?${qs}` : ''}`, { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status });
    return response.json();
}

/**
 * Every page of a collection, `pageSize` at a time. Past `limit` records it stops after the first page and
 * says so (`tooMany`): the caller shows a count instead of thousands of points.
 */
export async function getAllPages(endpoint, params, { signal, pageSize = 500, limit = 3000 } = {}) {
    const first = await getPermisos(endpoint, { ...params, page: 1, pageSize }, signal);
    if ((first.total || 0) > limit) return { total: first.total, data: [], tooMany: true };
    const pages = Math.ceil((first.total || 0) / pageSize);
    const rest = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, i) => getPermisos(endpoint, { ...params, page: i + 2, pageSize }, signal)));
    return { total: first.total || 0, data: [first, ...rest].flatMap(page => page.data || []) };
}

/**
 * What each SENER title is, in plain words, and how the tab shows it: as points, coloured by state or only in
 * the table (when the source does not publish where it is).
 */
export const SENER_GUIDE = Object.freeze([
    { key: 'asignaciones', icon: 'area', title: 'Asignaciones', shown: 'Color por estado',
        text: 'Áreas que el Estado asigna a Petróleos Mexicanos para explorar y extraer petróleo y gas. La fuente dice en qué estados y municipios están, no su punto exacto.' },
    { key: 'pozos', icon: 'pozo', title: 'Pozos', shown: 'Puntos en el mapa',
        text: 'Pozos petroleros terminados que reporta la SENER, con su ubicación y la asignación o el contrato al que pertenecen. No tienen vigencia: se informa si producen o están cerrados.' },
    { key: 'contratos-ee', icon: 'contrato', title: 'Contratos de exploración y extracción', shown: 'Solo en la tabla',
        text: 'Contratos con empresas, de rondas de licitación o migraciones de asignaciones, para explorar y extraer hidrocarburos en tierra o en el mar.' },
    { key: 'comercio-exterior', icon: 'importacion', title: 'Comercio exterior', shown: 'Solo en la tabla',
        text: 'Permisos para importar o exportar petrolíferos, gas y petróleo, por producto y fracción arancelaria, con la cantidad autorizada.' },
    { key: 'biocombustibles', icon: 'bioenergia', title: 'Biocombustibles', shown: 'Solo en la tabla',
        text: 'Permisos y avisos de exención para producir, almacenar o comercializar biocombustibles, conforme a la Ley de Biocombustibles.' },
].map(item => Object.freeze(item)));

/** Sectors of the map, in the order of the cluster rings (same colours as the Mapa tab). */
export const SECTORS = ['electricidad', 'petroliferos', 'gaslp', 'gasnatural', 'cne-transporte', 'cne-comercializacion', 'cne-infraestructura', 'cne-suministro', 'cne-terceros', 'sener'];
const MARKER = {
    electricidad: row => ({ sector: 'electricidad', ...infraType('electricidad', { tecnologia: row.tipo }) }),
    petroliferos: row => ({ sector: 'petroliferos', ...infraType('petroliferos', { tipoPermiso: row.tipo }) }),
    'gas-lp': row => ({ sector: 'gaslp', ...infraType('gas-lp', { tipoPermiso: row.tipo }) }),
    'gas-natural': row => ({ sector: 'gasnatural', ...infraType('gas-natural', { tipoPermiso: row.tipo }) }),
    transporte: row => ({ sector: 'cne-transporte', icon: 'distribucion', label: row.tipo || 'Transporte' }),
    comercializacion: row => ({ sector: 'cne-comercializacion', icon: 'otro', label: row.tipo || 'Comercialización' }),
    infraestructura: row => ({ sector: 'cne-infraestructura', icon: 'almacenamiento', label: row.tipo || 'Infraestructura de hidrocarburos' }),
    suministro: row => ({ sector: 'cne-suministro', icon: 'generacion', label: row.tipo || 'Suministro eléctrico' }),
    terceros: row => ({ sector: 'cne-terceros', icon: 'otro', label: row.tipo || 'Tercero acreditado' }),
    pozos: row => ({ sector: 'sener', icon: 'pozo', label: row.tipo || 'Pozo' }),
};
/** Sector, icon and label of a record's pin, as in the Mapa tab. */
export function markerOf(row) {
    return (MARKER[row?.tabla] || (() => ({ sector: 'sener', icon: 'otro', label: SOURCE[row?.tabla]?.label || 'Registro' })))(row || {});
}

/** «NUEVO LEÓN» → «Nuevo León», from the INEGI code when there is one. */
export function stateLabel(efId, entidad) {
    if (efId && STATE_NAME[efId]) return STATE_NAME[efId];
    if (!efId || efId === '--') return 'Sin entidad';
    return String(entidad || '').toLowerCase().replace(/(^|\s)\p{L}/gu, letter => letter.toUpperCase());
}

/** «Gas natural, Petróleo crudo» instead of «Varios». */
export function marketLabel(record) {
    const listed = String(record?.mercadosAutorizados ?? '').split(';').map(name => name.trim()).filter(Boolean);
    if (record?.mercado === 'Varios' && listed.length) return listed.join(', ');
    return record?.mercado || '';
}

/** Status to show: the legal one, plus the source's own wording when it says more (wells have only the latter). */
export function statusLabel(record) {
    const legal = record?.estatus || '';
    const own = record?.estatusFuente || '';
    if (!legal) return own;
    return own && own !== legal ? `${legal} (${own})` : legal;
}

const DATE = /^(\d{4})-(\d{2})-(\d{2})/;
/** «2026-10-22» or an ISO timestamp → «22 oct 2026». */
export function shortDate(value) {
    const match = DATE.exec(String(value ?? ''));
    if (!match || Number(match[1]) < 1950) return '';
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
        .toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
}

/** UTC timestamp of a load → its day in Mexico City: «2026-10-23T03:42Z» → «22 oct 2026». */
export function localDate(value) {
    const when = new Date(String(value ?? ''));
    if (!value || Number.isNaN(when.getTime())) return '';
    return when.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'short', year: 'numeric' });
}

/** Latest load per authority and per source, from /actualizaciones. */
export function updatesSummary(rows = []) {
    const byAuthority = {};
    const bySource = {};
    for (const row of rows) {
        const when = row.fechaActualizacion || '';
        if (!byAuthority[row.autoridad] || when > byAuthority[row.autoridad]) byAuthority[row.autoridad] = when;
        const key = SOURCE[row.clave] ? row.clave : sourceOfTable(row.tabla);
        if (key && (!bySource[key] || when > bySource[key].fechaActualizacion)) bySource[key] = { ...row, source: key };
    }
    return { byAuthority, bySource: SOURCES.filter(source => bySource[source.key]).map(source => bySource[source.key]) };
}

// Fields of `datos` that the card already shows elsewhere, or that only matter to the database.
const SKIP = new Set(['id', 'numeroPermiso', 'numeroPermisoNorm', 'numeroAsignacion', 'numeroAsignacionNorm', 'numeroContrato', 'numeroContratoNorm',
    'nombrePozo', 'nombrePozoNorm', 'razonSocial', 'mercado', 'mercadosAutorizados', 'estatus', 'efId', 'mpoId', 'latitudGEO', 'longitudGEO',
    'latitud', 'longitud', 'autoridad', 'leyAplicable', 'fuente', 'fuenteUrl', 'fechaCorte', 'fechaActualizacion', 'comentarios', 'ligaPermiso',
    'ligaResolucion', 'ubicacion', 'efIDs', 'efIds', 'utmXConductor', 'utmYConductor', 'utmXObjetivo', 'utmYObjetivo', 'utmZona']);
const LABELS = {
    fechaOtorgamiento: 'Fecha de otorgamiento', inicioVigencia: 'Inicio de vigencia', terminoVigencia: 'Término de vigencia', vigenciaTexto: 'Vigencia',
    tipoPermiso: 'Tipo de permiso', tipoAsignacion: 'Tipo de asignación', tipoTitulo: 'Tipo de título', tipoPozo: 'Tipo de pozo',
    tipoContractual: 'Tipo de título', numeroTitulo: 'Título', denominacionTitulo: 'Denominación del título', estatusPozo: 'Estatus del pozo',
    estatusSENER: 'Estatus publicado por SENER', estatusSener: 'Estatus publicado por SENER', profundidadVerticalM: 'Profundidad vertical (m)',
    profundidadDesarrolladaM: 'Profundidad desarrollada (m)', horizonteGeologico: 'Horizonte geológico', metodoUbicacion: 'Cómo se ubicó',
    capacidadAutorizadaMW: 'Capacidad autorizada (MW)', generacionEstimadaAnual: 'Generación estimada anual (GWh)', energeticoPrimario: 'Energético primario',
    fraccionArancelaria: 'Fracción arancelaria', nico: 'NICO', regimenAduanero: 'Régimen aduanero', cantidadAutorizada: 'Cantidad autorizada',
    empresasParticipantes: 'Empresas participantes', etapaContractual: 'Etapa contractual', etapaCorte: 'Trimestre de la etapa', duracionAnios: 'Duración (años)',
    numEntidades: 'Entidades', numMunicipios: 'Municipios', aguasTerritoriales: 'En aguas territoriales', entidadesFuente: 'Entidades (según la fuente)',
    municipiosFuente: 'Municipios (según la fuente)', enDatosAbiertos: 'En datos abiertos', fechaUltimaModificacion: 'Última modificación',
    numeroModificaciones: 'Modificaciones', fechasModificaciones: 'Fechas de modificación', numeroSolicitud: 'Solicitud', primerMesPublicado: 'Primer mes publicado',
    rfc: 'RFC', direccion: 'Dirección', inversionEstimadaMdls: 'Inversión estimada (millones de dólares)', inversionEstimada: 'Inversión estimada', modalidad: 'Modalidad', tecnologia: 'Tecnología', producto: 'Producto', unidad: 'Unidad',
};
/** «fechaDeEntradaEnOperacion» → «Fecha de entrada en operación». */
export function fieldLabel(key) {
    if (LABELS[key]) return LABELS[key];
    const words = String(key).replace(/([a-záéíóúñ0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase()
        .replace(/\bion\b/g, 'ión').replace(/cion\b/g, 'ción').replace(/\banio(s?)\b/g, 'año$1');
    return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Readable value of a source field, or '' to leave it out. */
export function fieldValue(key, value) {
    if (value === null || value === undefined || value === '' || value === 'S/D') return '';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'number') return value.toLocaleString('es-MX', { maximumFractionDigits: 2 });
    const text = String(value).trim();
    if (DATE.test(text) && /^fecha|vigencia|^inicio|^fin|^termino/i.test(key)) return shortDate(text) || text;
    return text.replace(/;\s*/g, '; ');
}

/** The source fields a record card lists, in their own order, without the ones shown elsewhere. */
export function detailFields(record) {
    return Object.entries(record?.datos || {})
        .filter(([key]) => !SKIP.has(key))
        .map(([key, value]) => ({ key, label: fieldLabel(key), value: fieldValue(key, value) }))
        .filter(field => field.value);
}

/** Links of a record: official permit and resolution (CNE) or the source file (SENER), without repeats. */
export function recordLinks(record) {
    const links = [];
    const add = (href, label) => { if (/^https:\/\//.test(href || '') && !links.some(link => link.href === href)) links.push({ href, label }); };
    add(record?.ligaPermiso, 'Ver el permiso');
    add(record?.ligaResolucion, 'Ver la resolución');
    add(record?.fuenteUrl, record?.autoridad === 'SENER' ? 'Ver la fuente oficial' : 'Ver el documento');
    return links;
}
