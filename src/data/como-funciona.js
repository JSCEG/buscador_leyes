/**
 * "¿Cómo funciona?": plain-language explainers of energy installations, each built around an
 * interactive isometric figure (scripts/conceptos/*.mjs → public/conceptos/*.html).
 *
 * Content rules (agreed with the site owner, who reviews every entry before it is marked reviewed):
 * - only claims backed by the cited public sources; general, conservative explanations;
 * - "Qué dice la ley" links to the acervo and names the authority, without paraphrasing obligations;
 * - `revisado` stays null until the owner approves the text; the page then shows the date.
 */
export const CONCEPTOS = [
    {
        id: 'fotovoltaica',
        titulo: 'Central fotovoltaica',
        sector: 'electricidad',
        resumen: 'Convierte la luz del sol en electricidad. Los módulos solares producen corriente directa, un inversor la convierte en corriente alterna y un transformador eleva la tensión para entregarla a la red.',
        figura: 'fotovoltaica',
        claves: [
            'Los módulos solares están hechos de celdas, casi siempre de silicio. Cuando la luz les llega, producen corriente directa: es el efecto fotovoltaico.',
            'En las centrales grandes los módulos van montados en seguidores de un eje, que giran de este a oeste durante el día para mirar al sol y captar más luz.',
            'Los cables de cada fila llevan la corriente directa a cajas de conexiones y de ahí al inversor.',
            'El inversor convierte la corriente directa en corriente alterna, que es la que usa la red eléctrica.',
            'Un transformador eleva la tensión y la energía sale por una línea hacia la red.',
            'Solo produce de día y baja con las nubes. Por eso se combina con otras centrales o con almacenamiento.',
        ],
        partes: [
            { nombre: 'Módulo solar', texto: 'Panel de celdas que convierte la luz en corriente directa.' },
            { nombre: 'Seguidor solar', texto: 'Estructura con un motor que gira los módulos para seguir al sol.' },
            { nombre: 'Caja de conexiones', texto: 'Reúne los cables de una fila de módulos y los protege.' },
            { nombre: 'Inversor', texto: 'Convierte la corriente directa en corriente alterna.' },
            { nombre: 'Transformador', texto: 'Eleva la tensión para conectarse a la red.' },
            { nombre: 'Línea a la red', texto: 'Lleva la energía de la central hacia la red eléctrica.' },
            { nombre: 'Piranómetro', texto: 'Mide cuánta luz del sol llega; sirve para comparar lo que la central produce con lo que debería producir.' },
        ],
        ley: {
            texto: 'La generación de electricidad está regulada por la Ley del Sector Eléctrico y su reglamento. La Comisión Nacional de Energía (CNE) otorga los permisos de generación.',
            siglas: ['LSE', 'RLSE', 'LCNE'],
        },
        tramites: ['generacion', 'autoconsumo'],
        mapa: { texto: 'Ver las centrales de generación en el mapa de permisos', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: '¿Qué equipo convierte la corriente directa de los módulos en corriente alterna?', opciones: ['El inversor', 'El transformador', 'El seguidor solar'], correcta: 0 },
            { pregunta: '¿Para qué gira un seguidor solar?', opciones: ['Para que los módulos miren al sol durante el día', 'Para limpiar los módulos', 'Para enfriar el inversor'], correcta: 0 },
            { pregunta: '¿Quién otorga los permisos de generación eléctrica en México?', opciones: ['La Comisión Nacional de Energía (CNE)', 'El municipio', 'Cada empresa generadora'], correcta: 0 },
        ],
        // Formal references: author, year, title, publisher, and (for web pages) the consultation date.
        fuentes: [
            { autor: 'Ley del Sector Eléctrico', titulo: 'Diario Oficial de la Federación', fecha: '18 de marzo de 2025', acervo: 'LSE' },
            { autor: 'Reglamento de la Ley del Sector Eléctrico', titulo: 'Diario Oficial de la Federación', fecha: '3 de octubre de 2025', acervo: 'RLSE' },
            { autor: 'Ley de la Comisión Nacional de Energía', titulo: 'Diario Oficial de la Federación', fecha: '18 de marzo de 2025', acervo: 'LCNE' },
            { autor: 'U.S. Department of Energy, Office of Energy Efficiency and Renewable Energy', fecha: 's. f.', titulo: 'How Does Solar Work?', url: 'https://www.energy.gov/eere/solar/how-does-solar-work', consulta: '12 de octubre de 2026' },
            { autor: 'International Energy Agency', fecha: 's. f.', titulo: 'Solar PV', url: 'https://www.iea.org/energy-system/renewables/solar-pv', consulta: '12 de octubre de 2026' },
        ],
        revisado: '12 de octubre de 2026',
    },
];

export const CONCEPTO = Object.fromEntries(CONCEPTOS.map(item => [item.id, item]));

/** Route of the section: '#como-funciona' (list) or '#como-funciona=<id>' (one explainer). */
export function comoFuncionaRoute(hash = '') {
    if (hash === '#como-funciona') return { id: null };
    const match = /^#como-funciona=([a-z0-9-]+)$/.exec(hash);
    return match ? { id: match[1] } : null;
}
