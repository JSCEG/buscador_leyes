/**
 * Every source the energy calculator cites. Dated values live only here, in energeticos.js and in
 * mercado.js; they are reviewed each February, when SENER publishes the fuel list.
 * `cotejo` is 'pendiente' until a person has checked the value against the document and the user
 * approved it; `node scripts/audit-calc-fuentes.mjs --strict` fails while any is pending or a review
 * is older than 14 months.
 */

const REVISADO = '2026-11-08';
const f = (id, titulo, emisor, url, fecha) => ({ id, titulo, emisor, url, fecha, revisado: REVISADO, cotejo: 'pendiente' });

const LISTA = [
    f('lista-2026', 'Lista de combustibles y sus poderes caloríficos 2026', 'SENER', 'https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf', '2026-02-12'),
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
    f('acuerdo-cel-2026', 'Requisitos de Certificados de Energías Limpias para 2025 y 2026 (leído en despachos; falta el Diario Oficial)', 'SENER', 'https://www.cuatrecasas.com/es/spain/publico/art/sener-cels-requisitos-2025-2026', '2026-08-17'),
    f('bme-2015', 'Bases del Mercado Eléctrico', 'SENER', 'http://www.dof.gob.mx/nota_detalle.php?codigo=5407715&fecha=08/09/2015', '2015-09-08'),
    // Article 19 of the LSE on this site (Supabase id; the LSE-Art-019 chunk id does not open).
    f('lse', 'Ley del Sector Eléctrico', 'Congreso de la Unión', '#art-07b3add5-c54c-401a-8332-1941d39b0b70', '2025-03-18'),
    f('pladese', 'Plan de Desarrollo del Sector Eléctrico', 'SENER', 'https://sidof.segob.gob.mx/notas/docFuente/5770297', '2025'),
    f('global-solar-atlas', 'Global Solar Atlas', 'Banco Mundial', 'https://globalsolaratlas.info', REVISADO),
    f('copar-2012', 'Costos y parámetros de referencia (COPAR) 2012', 'CFE', 'https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf', '2012'),
    f('codigo-red', 'Código de Red', 'CRE', 'https://sidof.segob.gob.mx/notas/5639920', '2021'),
    f('acuerdo-shcp-2000', 'Acuerdo de tarifas con cargo por factor de potencia', 'SHCP', 'https://sidof.segob.gob.mx/notas/docFuente/2062903', '2000'),
    f('convocatoria-sae', 'Segunda Convocatoria de SENER, numeral 1.2.1', 'SENER', 'https://sidof.segob.gob.mx/notas/5787117', '2026-05-11'),
    f('gpsa', 'Correlación de compresibilidad de GPSA', 'Technical Toolboxes', 'https://help.technicaltoolboxes.com/knowledge-base/compressibility/', REVISADO),
    f('vcf', 'Corrección de volumen por temperatura (API MPMS 11.1)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Volume_correction_factor', REVISADO),
    f('nist-webbook', 'NIST Chemistry WebBook, propano y n-butano', 'NIST', 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C74986&Mask=1', REVISADO),
    f('nws-altitud', 'Pressure altitude', 'Servicio Meteorológico de EE. UU.', 'https://www.weather.gov/media/epz/wxcalc/pressureAltitude.pdf', REVISADO),
    f('eia-gas', 'Contenido de energía del gas natural', 'EIA', 'https://www.eia.gov/tools/faqs/faq.php?id=45&t=8', REVISADO),
    f('pemex-crudos', 'Hojas de datos de crudos Maya, Istmo y Olmeca', 'Pemex', 'https://www.pemex.com/comercializacion/productos/HDS/petroleo/HDS_Crudo_Maya.pdf', REVISADO),
    f('anexo-21', 'Anexo 21 de la Resolución Miscelánea Fiscal 2026', 'SAT', 'https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_21_RMF2026-13012026.pdf', '2026-01-13'),
];

export const FUENTES = Object.freeze(Object.fromEntries(LISTA.map(x => [x.id, Object.freeze(x)])));

const MESES_VIGENCIA = 14;

/** Each source with what is wrong with it today: 'pendiente', 'vencida' or null. */
export function auditarFuentes(hoy = new Date()) {
    return Object.values(FUENTES).map(({ id, fecha, revisado, cotejo }) => {
        const limite = new Date(`${revisado}T00:00:00Z`);
        limite.setUTCMonth(limite.getUTCMonth() + MESES_VIGENCIA);
        const problema = cotejo === 'pendiente' ? 'pendiente' : (hoy > limite ? 'vencida' : null);
        return { id, fecha, revisado, cotejo, problema };
    });
}
