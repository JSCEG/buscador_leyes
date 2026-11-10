/**
 * Every source the energy calculator cites. Dated values live only here, in energeticos.js and in
 * mercado.js; they are reviewed each February, when SENER publishes the fuel list.
 * `cotejo` is 'pendiente' until a person has checked the value against the document and the user
 * approved it; `node scripts/audit-calc-fuentes.mjs --strict` fails while any is pending or a review
 * is older than 14 months. A source added later starts with `cotejo: 'pendiente'` until approved.
 */

// When the research consulted the web pages that have no publication date.
const CONSULTADO = '2026-11-08';
// The user approved every source on 2026-11-09 (docs/calculadora/fuentes-para-aprobar.md).
const COTEJADO = '2026-11-09';
const f = (id, titulo, emisor, url, fecha, revisado = COTEJADO) => ({ id, titulo, emisor, url, fecha, revisado, cotejo: 'humano' });
// A web page with no publication date: its date is the day it was consulted, and the page says so.
const web = (id, titulo, emisor, url) => ({ ...f(id, titulo, emisor, url, CONSULTADO), consultado: true });

const LISTA = [
    // Checked against the scan by the user on 2026-11-09: the eight values the calculator uses (page 1).
    // Signed by CONUEE's Director General on SENER letterhead.
    f('lista-2026', 'Lista de combustibles y sus poderes caloríficos 2026', 'CONUEE (SENER)', 'https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf', '2026-02-12'),
    f('ipcc-2006', 'Directrices del IPCC de 2006, volumen 2, cuadro 1.2', 'IPCC', 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_1_Ch1_Introduction.pdf', '2006'),
    f('acuerdo-rene-2015', 'Acuerdo de factores de emisión del Registro Nacional de Emisiones', 'Semarnat', 'https://dof.gob.mx/nota_detalle.php?codigo=5406149&fecha=03%2F09%2F2015', '2015-09-03'),
    f('aviso-semarnat-2026', 'Aviso del factor de emisión del sistema eléctrico nacional', 'Semarnat', 'https://www.gob.mx/cms/uploads/attachment/file/1081506/aviso_factor_de_emision_electrico_coa_2026.pdf', '2026'),
    f('nist-811', 'Guide for the Use of the International System of Units (SP 811)', 'NIST', 'https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf', '2008'),
    f('nom-008', 'NOM-008-SE-2021, Sistema General de Unidades de Medida', 'Secretaría de Economía', 'https://sidof.segob.gob.mx/notas/docFuente/5713228', '2021'),
    f('nom-001', 'NOM-001-SECRE-2010, Especificaciones del gas natural', 'CRE', 'https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/001secre2010.pdf', '2010'),
    f('nom-009', 'NOM-009-SESH-2011, Recipientes para gas LP', 'SENER', 'https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/009sesh2011.pdf', '2011'),
    f('nom-016', 'NOM-016-CRE-2016, Especificaciones de calidad de los petrolíferos', 'CRE', 'https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/016cre2016.pdf', '2016'),
    f('nom-213', 'NOM-213-SCFI-2018, Cilindros portátiles de gas LP', 'Secretaría de Economía', 'https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/NOM-213-SCFI-2018.pdf', '2018'),
    f('cne-precios-lp', 'Precios máximos de gas LP, del 8 al 14 de noviembre de 2026', 'CNE', 'https://www.gob.mx/cms/uploads/attachment/file/1115181/PRECIOS_MAXIMOS_VIGENTES_DEL_8_al_14_de_noviembre_DE_2026.pdf', '2026-11-08'),
    f('cenace-precio-neto-2025', 'Precio Neto de la Potencia en 2025, recálculo', 'CENACE', 'https://www.cenace.gob.mx/Docs/02_MBP/PrecioNetoPotencia/2025/Precio%20Neto%20de%20la%20Potencia%20en%202025%20(v2026%2009%2003)%20Rec%C3%A1lculo.pdf', '2026-09-03'),
    f('acuerdo-cne-2026', 'Acuerdo de tarifas finales de suministro básico 2026', 'CNE', 'https://dof.gob.mx/nota_detalle_popup.php?codigo=5783862', '2026'),
    // Read in the Diario Oficial on 2026-11-09: Artículo Único sets 13.9 % for 2025 and 2026; in force on publication.
    f('acuerdo-cel-2026', 'Acuerdo por el que se establecen los requisitos para la adquisición de Certificados de Energías Limpias para los años 2025 y 2026', 'SENER', 'https://sidof.segob.gob.mx/notas/5796405', '2026-08-17'),
    f('bme-2015', 'Bases del Mercado Eléctrico', 'SENER', 'http://www.dof.gob.mx/nota_detalle.php?codigo=5407715&fecha=08/09/2015', '2015-09-08'),
    // Article 19 of the LSE on this site (Supabase id; the LSE-Art-019 chunk id does not open).
    f('lse', 'Ley del Sector Eléctrico', 'Congreso de la Unión', '#art-07b3add5-c54c-401a-8332-1941d39b0b70', '2025-03-18'),
    f('pladese', 'Plan de Desarrollo del Sector Eléctrico', 'SENER', 'https://sidof.segob.gob.mx/notas/docFuente/5770297', '2025'),
    web('global-solar-atlas', 'Global Solar Atlas', 'Banco Mundial', 'https://globalsolaratlas.info'),
    f('copar-2012', 'Costos y parámetros de referencia (COPAR) 2012', 'CFE', 'https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf', '2012'),
    f('codigo-red', 'Código de Red', 'CRE', 'https://sidof.segob.gob.mx/notas/5639920', '2021'),
    f('acuerdo-shcp-2000', 'Acuerdo de tarifas con cargo por factor de potencia', 'SHCP', 'https://sidof.segob.gob.mx/notas/docFuente/2062903', '2000'),
    f('convocatoria-sae', 'Segunda Convocatoria de SENER, numeral 1.2.1', 'SENER', 'https://sidof.segob.gob.mx/notas/5787117', '2026-05-11'),
    web('gpsa', 'Correlación de compresibilidad de GPSA', 'Technical Toolboxes', 'https://help.technicaltoolboxes.com/knowledge-base/compressibility/'),
    web('vcf', 'Corrección de volumen por temperatura (API MPMS 11.1)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Volume_correction_factor'),
    web('nist-webbook', 'NIST Chemistry WebBook, propano y n-butano', 'NIST', 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C74986&Mask=1'),
    web('nws-altitud', 'Pressure altitude', 'Servicio Meteorológico de EE. UU.', 'https://www.weather.gov/media/epz/wxcalc/pressureAltitude.pdf'),
    web('eia-gas', 'Contenido de energía del gas natural', 'EIA', 'https://www.eia.gov/tools/faqs/faq.php?id=45&t=8'),
    web('pemex-crudos', 'Hojas de datos de crudos Maya, Istmo y Olmeca', 'Pemex', 'https://www.pemex.com/comercializacion/productos/HDS/petroleo/HDS_Crudo_Maya.pdf'),
    f('anexo-21', 'Anexo 21 de la Resolución Miscelánea Fiscal 2026', 'SAT', 'https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_21_RMF2026-13012026.pdf', '2026-01-13'),
];

export const FUENTES = Object.freeze(Object.fromEntries(LISTA.map(x => [x.id, Object.freeze(x)])));

/** The date as the page writes it: «consultado el 2026-11-08» for a web page without a publication date. */
export const fechaFuente = x => (x.consultado ? `consultado el ${x.fecha}` : x.fecha);

const NB = ' ';
const seccion = filas => Object.freeze(filas.map(([id, respalda]) => Object.freeze({ id, respalda })));
const UNIDADES_Y_NUMEROS = ['nom-008', 'Unidades oficiales y forma de escribir los números'];

/**
 * The sources listed at the end of each tab, for reference, with what each one backs in that tab.
 * tests/calc-fuentes.test.js checks that every source a tab cites is here and that none is left out.
 */
export const FUENTES_SECCION = Object.freeze({
    electricidad: seccion([
        ['pladese', `Factor de planta de cada tecnología y consumo de un usuario residencial, 1${NB}885 kWh al año`],
        ['global-solar-atlas', 'Producción de paneles solares en 10 ciudades'],
        ['aviso-semarnat-2026', 'Emisiones de la red eléctrica, 0.444 t de CO₂e por MWh (dato de 2024)'],
        ['acuerdo-cne-2026', 'Horarios y temporadas de la tarifa GDMTH, y horas punta de las tarifas DIST y DIT'],
        ['cenace-precio-neto-2025', 'Precio Neto de la Potencia de 2025 de cada sistema'],
        ['acuerdo-cel-2026', 'Certificados de Energías Limpias (CEL) que se piden: 13.9 % del consumo en 2025 y 2026'],
        ['lse', 'Permiso según los MW de la central, con cortes en 0.7 y 20 MW'],
        ['convocatoria-sae', 'Sistema de Almacenamiento de Energía (SAE) de 30 % de la capacidad y 3 horas'],
        ['codigo-red', 'Factor de potencia de 0.97 desde el 8 de abril de 2026'],
        ['acuerdo-shcp-2000', 'Umbral de 90 % de factor de potencia del recibo, una regla heredada'],
        ['copar-2012', 'Fórmulas de potencia del viento y del agua'],
        ['bme-2015', 'Explicación de los servicios conexos y del Precio Marginal Local (PML)'],
        ['nist-811', 'Equivalencias exactas entre watts, watts-hora, joules y caballos de fuerza'],
        UNIDADES_Y_NUMEROS,
    ]),
    petroliferos: seccion([
        ['lista-2026', `Poder calorífico de gasolinas, diésel, turbosina, combustóleo, coque y crudo, y los 6${NB}347 MJ del barril equivalente de petróleo`],
        ['acuerdo-rene-2015', 'Emisiones de CO₂ de cada combustible'],
        ['nom-016', 'Densidad de gasolinas, turbosina y combustóleo. La del diésel, 0.84 kg/L, no tiene fuente oficial'],
        ['pemex-crudos', 'Grados API de los crudos Maya, Istmo y Olmeca'],
        ['anexo-21', 'Condiciones de referencia de los petrolíferos y grados API'],
        ['vcf', 'Corrección del volumen por temperatura, orientativa'],
        ['ipcc-2006', 'Poder calorífico físico por kilo, para la referencia física'],
        ['nist-811', 'Equivalencias exactas entre litros, barriles, galones y unidades de energía'],
        UNIDADES_Y_NUMEROS,
    ]),
    'gas-natural': seccion([
        ['nom-001', 'Condición estándar del gas y rango del poder calorífico, de 37.30 a 43.60 MJ por metro cúbico'],
        ['eia-gas', 'Poder calorífico típico, 38.64 MJ por metro cúbico, y gas natural licuado'],
        ['lista-2026', 'Gas seco, para pasar a barriles equivalentes de petróleo'],
        ['acuerdo-rene-2015', 'Emisiones de CO₂ del gas natural'],
        ['gpsa', 'Factor de compresibilidad Z, orientativo'],
        ['nws-altitud', 'Presión de la atmósfera según la altitud'],
        ['nom-213', 'Cilindro de 20 kg de gas LP, para comparar'],
        ['nist-811', 'Equivalencias exactas entre pies cúbicos, metros cúbicos y unidades de energía'],
        UNIDADES_Y_NUMEROS,
    ]),
    'gas-lp': seccion([
        ['lista-2026', 'Poder calorífico del gas licuado'],
        ['cne-precios-lp', 'Convención de 0.54 kg por litro de las tablas de precios'],
        ['nist-webbook', 'Densidad del gas LP según la temperatura y la mezcla'],
        ['nom-009', 'Tanque lleno al 85 %'],
        ['nom-213', 'Cilindros portátiles de gas LP, como el de 20 kg'],
        ['acuerdo-rene-2015', 'Emisiones de CO₂ del gas LP'],
        ['nws-altitud', 'Presión de la atmósfera según la altitud, para el quemador'],
        ['ipcc-2006', 'Poder calorífico físico por kilo, para la referencia física'],
        ['nist-811', 'Equivalencias exactas entre litros, kilos y unidades de energía'],
        UNIDADES_Y_NUMEROS,
    ]),
    otras: seccion([
        ['nist-811', 'Equivalencias exactas entre unidades'],
        ['nom-008', 'Unidades oficiales, forma de escribir los números y por qué aquí no se usa «billón»'],
        ['nws-altitud', 'Presión de la atmósfera según la altitud, para pasar de presión manométrica a absoluta'],
    ]),
});

const MESES_VIGENCIA = 14;

/** Each source with what is wrong with it today: 'pendiente', 'vencida' or null. */
export function auditarFuentes(hoy = new Date(), fuentes = Object.values(FUENTES)) {
    return fuentes.map(({ id, fecha, revisado, cotejo }) => {
        const limite = new Date(`${revisado}T00:00:00Z`);
        limite.setUTCMonth(limite.getUTCMonth() + MESES_VIGENCIA);
        const problema = cotejo === 'pendiente' ? 'pendiente' : (hoy > limite ? 'vencida' : null);
        return { id, fecha, revisado, cotejo, problema };
    });
}
