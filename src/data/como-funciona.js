/**
 * "¿Cómo funciona?": plain-language explainers of energy installations, each built around an
 * interactive isometric figure (scripts/conceptos/*.mjs → public/conceptos/*.html).
 *
 * Content rules (agreed with the site owner, who reviews every entry before it is marked reviewed):
 * - only claims backed by the cited public sources; general, conservative explanations;
 * - "Qué dice la ley" links to the acervo and names the authority, without paraphrasing obligations;
 * - `revisado` stays null until the owner approves the text; the page then shows the date.
 */
/** The learning route: from the basic ideas up to whole power plants and market operations. */
export const SECTORES = [
    { id: 'electricidad', titulo: 'Mercado Eléctrico', icono: 'electricidad', color: '#1E5B4F', desc: 'Generación, transmisión, redes de distribución y el Mercado Eléctrico Mayorista (MEM).' },
    { id: 'hidrocarburos', titulo: 'Mercado de Hidrocarburos', icono: 'hidrocarburos', color: '#A57F2C', desc: 'Petróleo crudo, gas natural, refinación, ductos, almacenamiento y estaciones de servicio.' },
];

export const NIVELES = [
    { id: 1, titulo: 'Fundamentos y Física', texto: 'Las ideas físicas y químicas que sustentan el sector.' },
    { id: 2, titulo: 'Redes y Logística', texto: 'Cómo viaja la energía: líneas de transmisión, subestaciones y ductos.' },
    { id: 3, titulo: 'Las Instalaciones', texto: 'Cómo operan las centrales eléctricas, refinerías y terminales de almacenamiento.' },
    { id: 4, titulo: 'Mercados, Regulación y Desarrollo Mixto', texto: 'Despacho CENACE/CENAGAS, planeación vinculante, prevalencia estatal y esquemas de participación.' },
];

/** Ejes rectores del paradigma regulatorio vigente (Reforma Constitucional y Decreto del 18 de marzo de 2025). */
export const EJES_RECTORES = [
    {
        id: 'empresas-publicas',
        titulo: '1. Empresas Públicas del Estado (CFE y PEMEX)',
        texto: 'Dejan de ser «Empresas Productivas» bajo lógica mercantil estricta y pasan a ser Empresas Públicas del Estado con mandato de soberanía, justicia energética, continuidad y servicio público sin afán preponderante de lucro (arts. 25, 27 y 28 CPEUM; LEPE-CFE y LEPE-PEMEX).',
        siglas: ['LEPE-CFE', 'LEPE-PEMEX'],
    },
    {
        id: 'planeacion-vinculante',
        titulo: '2. Planeación Vinculante (SENER)',
        texto: 'La SENER conduce la planeación obligatoria del sector mediante instrumentos vinculantes (PROSENER, PLATEASE, PLADESE y PLADESHi) a los que se sujetan permisos, adiciones de capacidad, CENACE, CENAGAS y la CNE (LPTE, arts. 2 y 21; LSE, art. 12; LSH, arts. 7 y 8).',
        siglas: ['LPTE', 'LSE', 'LSH'],
    },
    {
        id: 'cne-autoridad',
        titulo: '3. Comisión Nacional de Energía (CNE)',
        texto: 'Órgano administrativo desconcentrado sectorizado a la SENER con independencia técnica y operativa que asume el otorgamiento de permisos, metodologías tarifarias y regulación técnica del sector eléctrico y de hidrocarburos (LCNE, arts. 2 y 7).',
        siglas: ['LCNE'],
    },
    {
        id: 'prevalencia-soberania',
        titulo: '4. Prevalencia Estatal (54 % / 46 %) y Soberanía',
        texto: 'En electricidad, el Estado mantiene al menos el 54 % del promedio de la energía inyectada a la red en un año calendario y los particulares participan hasta en el 46 % (LSE, arts. 1 y 36). En hidrocarburos se prioriza la refinación nacional (~1.8 Mbd) y la restitución de reservas 3P.',
        siglas: ['LSE', 'LSH'],
    },
    {
        id: 'desarrollo-mixto',
        titulo: '5. Esquemas de Desarrollo Mixto',
        texto: 'Nuevas figuras de asociación público-privada: en electricidad mediante Producción de Largo Plazo e Inversión Mixta con CFE ≥ 54 % (LSE, arts. 38–40; RLSE, arts. 68 y 84–87), y en hidrocarburos mediante Asignaciones para Desarrollo Mixto con PEMEX ≥ 40 % (LSH, arts. 24–36).',
        siglas: ['LSE', 'RLSE', 'LSH'],
    },
];

/** Glosario regulatorio integrado con enlace directo al concepto interactivo y al acervo legal. */
export const GLOSARIO_REGULATORIO = [
    {
        termino: 'Empresa Pública del Estado',
        sector: 'electricidad',
        definicion: 'Naturaleza jurídica de CFE y PEMEX tras la reforma constitucional: entidades sectorizadas a SENER orientadas a preservar la soberanía, autosuficiencia y justicia energética, cuyas actividades no constituyen monopolios (art. 28 CPEUM; LEPE-CFE, arts. 2 y 4; LEPE-PEMEX, arts. 2 y 4).',
        conceptoId: 'planeacion-desarrollo-mixto',
        siglas: ['LEPE-CFE', 'LEPE-PEMEX'],
        articulos: 'Arts. 2 y 4 LEPE-CFE · Arts. 2 y 4 LEPE-PEMEX',
    },
    {
        termino: 'Planeación Vinculante',
        sector: 'electricidad',
        definicion: 'Rectoría obligatoria de la SENER sobre el desarrollo del sector energético a través de la Estrategia, el PROSENER, el PLATEASE, el PLADESE y el PLADESHi. Todo permiso e interconexión debe alinearse a sus metas y convocatorias.',
        conceptoId: 'planeacion-desarrollo-mixto',
        siglas: ['LPTE', 'LSE', 'LSH'],
        articulos: 'Arts. 2 y 21 LPTE · Art. 12 LSE · Arts. 7 y 8 LSH',
    },
    {
        termino: 'Esquema de Inversión Mixta (CFE ≥ 54 %)',
        sector: 'electricidad',
        definicion: 'Esquema de Desarrollo Mixto para centrales eléctricas donde CFE participa de forma directa o indirecta con al menos el 54 % del capital social común o mecanismos de control del vehículo jurídico o financiero.',
        conceptoId: 'planeacion-desarrollo-mixto',
        siglas: ['LSE', 'RLSE'],
        articulos: 'Arts. 38 fr. II y 40 LSE · Arts. 84 a 87 RLSE',
    },
    {
        termino: 'Producción de Largo Plazo (PLP)',
        sector: 'electricidad',
        definicion: 'Esquema de Desarrollo Mixto donde el particular financia, construye y opera la central sin aportación presupuestaria de CFE, vendiendo el 100 % de la energía y productos asociados de forma exclusiva a CFE.',
        conceptoId: 'planeacion-desarrollo-mixto',
        siglas: ['LSE', 'RLSE'],
        articulos: 'Arts. 38 fr. I y 39 LSE · Art. 68 RLSE',
    },
    {
        termino: 'Asignaciones para Desarrollo Mixto (PEMEX ≥ 40 %)',
        sector: 'hidrocarburos',
        definicion: 'Modalidad en que SENER otorga una Asignación a PEMEX y esta complementa sus capacidades técnicas, operativas o financieras con particulares, conservando la propiedad exclusiva estatal de la Asignación y un interés de participación no menor al 40 %.',
        conceptoId: 'asignaciones-hidrocarburos',
        siglas: ['LSH', 'RLSH'],
        articulos: 'Arts. 10, 11 y 24 a 36 LSH (Art. 31: ≥ 40 %)',
    },
    {
        termino: 'Comisión Nacional de Energía (CNE)',
        sector: 'electricidad',
        definicion: 'Órgano desconcentrado de la SENER con independencia técnica y operativa encargado de expedir permisos de generación, almacenamiento, transporte, distribución y expendio, así como metodologías tarifarias y reglas técnicas.',
        conceptoId: 'planeacion-desarrollo-mixto',
        siglas: ['LCNE', 'LSE', 'LSH'],
        articulos: 'Arts. 1, 2 y 7 LCNE · Art. 11 LSE · Art. 80 LSH',
    },
    {
        termino: 'Despacho Económico con Restricciones de Seguridad',
        sector: 'electricidad',
        definicion: 'Asignación y despacho de centrales que ejecuta el CENACE para satisfacer la demanda al menor costo variable respetando la Confiabilidad, Seguridad de Despacho, el despacho obligado de cogeneración y la prevalencia estatal.',
        conceptoId: 'mercado-cenace',
        siglas: ['LSE'],
        articulos: 'Arts. 43, 111, 117 y 124 LSE',
    },
    {
        termino: 'Código de Red y Confiabilidad',
        sector: 'electricidad',
        definicion: 'Disposiciones técnicas obligatorias emitidas por la CNE para que centrales eléctricas, centros de carga, transportistas y distribuidores mantengan la frecuencia (60 Hz), tensión, calidad y seguridad operativa del SEN.',
        conceptoId: 'mercado-cenace',
        siglas: ['LSE', 'LCNE'],
        articulos: 'Arts. 45, 46 y 124 LSE',
    },
    {
        termino: 'Sistemas de Almacenamiento (SAEE)',
        sector: 'electricidad',
        definicion: 'Bancos de baterías u otras tecnologías reguladas por SENER y CNE (asociados a una central, a un centro de carga o autónomos en red) para aportar potencia firme, servicios conexos y flexibilidad al Sistema Eléctrico Nacional.',
        conceptoId: 'planeacion-desarrollo-mixto',
        siglas: ['LSE', 'RLSE'],
        articulos: 'Arts. 2, 82, 83, 84 y 85 LSE',
    },
    {
        termino: 'ASEA y Seguridad Industrial (RENAGAS)',
        sector: 'hidrocarburos',
        definicion: 'Supervisión de seguridad industrial, seguridad operativa y protección al medio ambiente en ductos, terminales TAR, refinerías y estaciones de servicio a cargo de la ASEA.',
        conceptoId: 'almacenamiento-tar',
        siglas: ['LSH', 'RLSH'],
        articulos: 'Art. 5 fr. I LSH · LASEA',
    },
    {
        termino: 'Justicia Energética',
        sector: 'electricidad',
        definicion: 'Acciones y políticas orientadas a reducir la pobreza energética y las desigualdades sociales, regionales y de género en el acceso y uso de energía limpia, confiable y asequible.',
        conceptoId: 'planeacion-desarrollo-mixto',
        siglas: ['LSE', 'LPTE'],
        articulos: 'Art. 1 fr. VII y Art. 3 fr. XXVIII LSE · Art. 2 LPTE',
    },
];

// References shared by several concepts.
const consulta = '13 de octubre de 2026';
const openstax = (seccion, titulo, slug) => ({ autor: 'Urone, P. P. y Hinrichs, R.', fecha: '2022', titulo: `College Physics 2e, sección ${seccion}: ${titulo}`, editorial: 'OpenStax', url: `https://openstax.org/books/college-physics-2e/pages/${slug}`, consulta });
const eia = (titulo, slug, fecha = 's. f.') => ({ autor: 'U.S. Energy Information Administration', fecha, titulo, url: `https://www.eia.gov/energyexplained/electricity/${slug}`, consulta });
const LSE = { autor: 'Ley del Sector Eléctrico', titulo: 'Diario Oficial de la Federación', fecha: '18 de marzo de 2025', acervo: 'LSE' };
const RLSE = { autor: 'Reglamento de la Ley del Sector Eléctrico', titulo: 'Diario Oficial de la Federación', fecha: '3 de octubre de 2025', acervo: 'RLSE' };
const LCNE = { autor: 'Ley de la Comisión Nacional de Energía', titulo: 'Diario Oficial de la Federación', fecha: '18 de marzo de 2025', acervo: 'LCNE' };
const LSH = { autor: 'Ley del Sector Hidrocarburos', titulo: 'Diario Oficial de la Federación', fecha: '18 de marzo de 2025', acervo: 'LSH' };
const RLSH = { autor: 'Reglamento de la Ley del Sector Hidrocarburos', titulo: 'Diario Oficial de la Federación', fecha: '3 de octubre de 2025', acervo: 'RLSH' };
const LPTE = { autor: 'Ley de Planeación y Transición Energética', titulo: 'Diario Oficial de la Federación', fecha: '18 de marzo de 2025', acervo: 'LPTE' };
const LEPE_CFE = { autor: 'Ley de la Empresa Pública del Estado, Comisión Federal de Electricidad', titulo: 'Diario Oficial de la Federación', fecha: '18 de marzo de 2025', acervo: 'LEPE-CFE' };
const LEPE_PEMEX = { autor: 'Ley de la Empresa Pública del Estado, Petróleos Mexicanos', titulo: 'Diario Oficial de la Federación', fecha: '18 de marzo de 2025', acervo: 'LEPE-PEMEX' };
const LASEA = { autor: 'Ley de la Agencia Nacional de Seguridad Industrial y de Protección al Medio Ambiente del Sector Hidrocarburos', titulo: 'Diario Oficial de la Federación', fecha: '11 de agosto de 2014', acervo: 'LASEA' };
const CEPAL = { autor: 'Comisión Económica para América Latina y el Caribe (CEPAL)', fecha: '2021', titulo: 'Síntesis de definiciones clave para la transición energética en México', url: 'https://repositorio.cepal.org/bitstream/handle/11362/47656/6/S2100521_Mexico_es.pdf', consulta };
const CENACE = { autor: 'Centro Nacional de Control de Energía (CENACE)', fecha: '2024', titulo: 'Manual del Mercado del Día en Adelanto y Mercado en Tiempo Real', url: 'https://www.cenace.gob.mx', consulta };
const CENAGAS = { autor: 'Centro Nacional de Control del Gas Natural (CENAGAS)', fecha: '2024', titulo: 'Términos y Condiciones Generales para el Servicio de Transporte en el SISTRANGAS', url: 'https://www.gob.mx/cenagas', consulta };
const IEA_OIL = { autor: 'International Energy Agency (IEA)', fecha: '2024', titulo: 'Oil & Gas Supply and Refining', url: 'https://www.iea.org/energy-system/fossil-fuels', consulta };

export const CONCEPTOS = [
    {
        id: 'electricidad',
        nivel: 1,
        titulo: '¿Qué es la electricidad?',
        sector: 'electricidad',
        resumen: 'Todo está hecho de átomos, y los átomos tienen cargas eléctricas. Cuando los electrones se mueven por un camino cerrado, hay corriente eléctrica: eso es lo que enciende un foco.',
        figura: 'electricidad',
        definiciones: [
            { termino: 'Carga eléctrica', unidad: 'coulomb (C)', texto: 'Propiedad de las partículas de los átomos: los protones tienen carga positiva y los electrones, negativa. Las cargas iguales se repelen y las opuestas se atraen. Un electrón tiene una carga de apenas 0.00000000000000000016 coulomb (1.6 × 10⁻¹⁹ C).' },
            { termino: 'Electricidad', texto: 'Los fenómenos producidos por las cargas eléctricas; en la vida diaria, sobre todo la energía que llevan las cargas cuando se mueven por un cable.' },
            { termino: 'Conductor y aislante', texto: 'Un conductor tiene electrones libres que pueden moverse por él, como los metales. Un aislante no deja moverse a las cargas con facilidad, como el plástico, el hule o el vidrio.' },
            { termino: 'Circuito eléctrico', texto: 'Camino cerrado por el que circulan las cargas: sale de la fuente, pasa por el aparato y regresa a la fuente.' },
        ],
        claves: [
            'Todo está hecho de átomos. En el centro de cada átomo hay protones (con carga positiva) y alrededor se mueven electrones (con carga negativa).',
            'En los metales, como el cobre de los cables, algunos electrones están sueltos y pueden pasar de un átomo a otro. Por eso los metales conducen la electricidad.',
            'Los cables van forrados de plástico, que es aislante: así la electricidad no se sale del cable ni nos da toques.',
            'Una pila empuja a los electrones, pero solo hay corriente si el camino está cerrado: de la pila al foco y de regreso a la pila. Un interruptor abre o cierra ese camino.',
            'La electricidad es una fuente de energía secundaria: no se extrae de la naturaleza, se produce a partir de otras fuentes como el gas, el agua, el viento o el sol.',
        ],
        formulas: [
            { expresion: 'I = Q ÷ t', lectura: 'corriente (amperes) = carga que pasa (coulombs) ÷ tiempo (segundos)', ejemplo: 'si por un cable pasan 10 coulombs en 5 segundos, la corriente es 10 ÷ 5 = 2 amperes.' },
        ],
        errores: [
            { idea: 'El foco se "come" la corriente y por eso brilla.', realidad: 'La misma cantidad de carga que entra al foco sale de él: la carga no se crea ni se destruye. Lo que el foco convierte en luz y calor es energía, no carga.' },
            { idea: 'Basta un cable de la pila al foco para que encienda.', realidad: 'Hace falta un circuito cerrado: un camino de ida y otro de regreso a la pila.' },
            { idea: 'Los electrones corren por el cable a la velocidad de la luz.', realidad: 'Avanzan muy despacio, menos de un milímetro por segundo. El foco enciende al instante porque cada electrón empuja al siguiente en todo el cable a la vez.' },
        ],
        partesTitulo: 'Lo que ves en la figura',
        partes: [
            { nombre: 'Pila', texto: 'Empuja a los electrones por el circuito.' },
            { nombre: 'Interruptor', texto: 'Abre o cierra el camino; abierto, no hay corriente.' },
            { nombre: 'Cable de cobre', texto: 'Conductor: sus electrones libres pueden moverse.' },
            { nombre: 'Forro de plástico', texto: 'Aislante: mantiene la electricidad dentro del cable.' },
            { nombre: 'Lupa', texto: 'Muestra los electrones dentro del cable, que avanzan lento y todos a la vez.' },
            { nombre: 'Foco', texto: 'Convierte en luz y calor la energía que llevan las cargas.' },
        ],
        dato: 'En un cable de cobre por el que pasan 20 amperes, los electrones avanzan menos de medio milímetro por segundo. Si viajaran solos, tardarían más de media hora en recorrer un metro.',
        tramites: [],
        preguntas: [
            { pregunta: '¿Qué partícula del átomo se mueve por los cables de cobre?', opciones: ['El electrón', 'El protón', 'El neutrón'], correcta: 0 },
            { pregunta: '¿Por qué los cables van forrados de plástico?', opciones: ['Porque el plástico es aislante', 'Porque el plástico conduce mejor que el cobre', 'Solo por el color'], correcta: 0 },
            { pregunta: '¿Qué pasa si abres el interruptor de un circuito?', opciones: ['Se corta el camino y deja de haber corriente', 'La corriente sigue igual', 'La pila se descarga más rápido'], correcta: 0 },
        ],
        fuentes: [
            eia('Electricity explained', ''),
            eia('The science of electricity', 'the-science-of-electricity.php'),
            eia('Batteries, circuits, and transformers', 'batteries-circuits-and-transformers.php'),
            openstax('18.1', 'Static Electricity and Charge: Conservation of Charge', '18-1-static-electricity-and-charge-conservation-of-charge'),
            openstax('18.2', 'Conductors and Insulators', '18-2-conductors-and-insulators'),
            openstax('20.1', 'Current', '20-1-current'),
        ],
        revisado: null,
    },
    {
        id: 'voltaje',
        nivel: 1,
        antes: ['electricidad'],
        titulo: 'Voltaje, corriente y potencia',
        sector: 'electricidad',
        resumen: 'Las tres medidas básicas de la electricidad: el voltaje es el empuje, la corriente es cuánta carga pasa y la potencia es cuánta energía se usa cada segundo.',
        figura: 'voltaje',
        definiciones: [
            { termino: 'Voltaje o tensión eléctrica', unidad: 'volt (V)', texto: 'Energía que recibe cada unidad de carga al pasar entre dos puntos. Un volt es un joule de energía por cada coulomb de carga. La ley mexicana usa la palabra «tensión».' },
            { termino: 'Corriente eléctrica', unidad: 'ampere (A)', texto: 'Cantidad de carga que pasa por un punto del circuito cada segundo. Un ampere es un coulomb por segundo.' },
            { termino: 'Potencia eléctrica', unidad: 'watt (W)', texto: 'Energía que se entrega o se usa cada segundo. Un watt es un joule por segundo, y es igual a un volt por un ampere.' },
            { termino: 'Resistencia', unidad: 'ohm (Ω)', texto: 'Qué tanto se opone un material o un aparato al paso de la corriente.' },
        ],
        claves: [
            'El voltaje es el empuje que pone a moverse a las cargas. La batería de un coche, por ejemplo, da 12 volts.',
            'La corriente es cuánta carga pasa cada segundo. Se mide con un amperímetro, conectado en el camino de la corriente.',
            'La potencia dice qué tan rápido se usa la energía: un foco de 100 watts usa más energía cada segundo que uno de 10.',
            'Con el mismo foco, más voltaje significa más corriente y más potencia: por eso brilla más (ley de Ohm).',
            'La ley llama «baja tensión» a la de 1,000 volts o menos (la de las casas) y «alta tensión» a la de más de 35,000 volts (la de las líneas de transmisión).',
        ],
        formulas: [
            { expresion: 'P = V × I', lectura: 'potencia (watts) = voltaje (volts) × corriente (amperes)', ejemplo: 'un foco que recibe 12 volts y deja pasar 2 amperes usa 12 × 2 = 24 watts.' },
            { expresion: 'I = V ÷ R', lectura: 'corriente (amperes) = voltaje (volts) ÷ resistencia (ohms) · ley de Ohm', ejemplo: 'el foco de la figura tiene unos 6 ohms; con 12 volts pasan 12 ÷ 6 = 2 amperes.' },
            { expresion: 'E = P × t', lectura: 'energía = potencia × tiempo · en el recibo de luz se cobra en kilowatt-hora (kWh)', ejemplo: 'un aparato de 1,000 watts (1 kW) encendido 3 horas usa 1 × 3 = 3 kWh.' },
        ],
        errores: [
            { idea: 'Voltaje y energía son lo mismo.', realidad: 'El voltaje es energía por cada unidad de carga. Las baterías de una moto y de un coche tienen 12 volts, pero la del coche guarda mucha más energía porque puede mover mucha más carga.' },
            { idea: 'Una pila da siempre la misma corriente.', realidad: 'La pila da un voltaje; la corriente depende de lo que conectes. Un foco con menos resistencia deja pasar más corriente (I = V ÷ R).' },
            { idea: 'Del foco sale menos corriente de la que entra.', realidad: 'En la figura, el amperímetro del cable de regreso marca lo mismo que el de la fuente. Lo que se queda en el foco es energía, no corriente.' },
        ],
        partes: [
            { nombre: 'Fuente de poder', texto: 'Da el voltaje; con la perilla se sube o se baja.' },
            { nombre: 'Voltímetro (V)', texto: 'Mide el voltaje entre dos puntos, en volts.' },
            { nombre: 'Amperímetro (A)', texto: 'Mide la corriente que pasa por el circuito, en amperes.' },
            { nombre: 'Perilla de voltaje', texto: 'Cambia el empuje que da la fuente.' },
            { nombre: 'Cables', texto: 'Cierran el circuito: la corriente sale por uno y regresa por el otro.' },
            { nombre: 'Foco', texto: 'Su resistencia limita la corriente; convierte la energía en luz y calor.' },
            { nombre: 'Amperímetro de regreso', texto: 'Mide la corriente después del foco: marca lo mismo que el de la fuente, porque la corriente no se gasta.' },
        ],
        dato: 'Las unidades llevan el nombre de científicos: el volt por Alessandro Volta, que inventó la pila; el ampere por André-Marie Ampère, y el watt por James Watt, el de la máquina de vapor.',
        tramites: [],
        preguntas: [
            { pregunta: '¿En qué unidad se mide la potencia?', opciones: ['En watts (W)', 'En volts (V)', 'En amperes (A)'], correcta: 0 },
            { pregunta: 'Si un foco recibe 12 volts y pasan 2 amperes, ¿cuánta potencia usa?', opciones: ['24 watts', '6 watts', '14 watts'], correcta: 0 },
            { pregunta: '¿Qué cobra el recibo de luz?', opciones: ['La energía usada, en kilowatt-hora', 'El voltaje de la casa', 'La cantidad de focos'], correcta: 0 },
        ],
        fuentes: [
            { autor: 'Bureau International des Poids et Mesures', fecha: '2019', titulo: 'The International System of Units (SI), 9.ª edición', url: 'https://www.bipm.org/en/publications/si-brochure', consulta },
            openstax('19.1', 'Electric Potential Energy: Potential Difference', '19-1-electric-potential-energy-potential-difference'),
            openstax('20.1', 'Current', '20-1-current'),
            openstax('20.2', "Ohm's Law: Resistance and Simple Circuits", '20-2-ohms-law-resistance-and-simple-circuits'),
            openstax('20.4', 'Electric Power and Energy', '20-4-electric-power-and-energy'),
            RLSE,
        ],
        revisado: null,
    },
    {
        id: 'cd-ca',
        nivel: 1,
        antes: ['voltaje'],
        titulo: 'Corriente directa y corriente alterna',
        sector: 'electricidad',
        resumen: 'Una pila da corriente directa, que siempre va en el mismo sentido. La red eléctrica da corriente alterna, que cambia de sentido una y otra vez: en México, 60 ciclos por segundo.',
        figura: 'cd-ca',
        definiciones: [
            { termino: 'Corriente directa (CD)', texto: 'La carga fluye en un solo sentido. La dan las pilas, las baterías y los paneles solares.' },
            { termino: 'Corriente alterna (CA)', texto: 'La carga cambia de sentido periódicamente: el voltaje sube, baja, se vuelve negativo y regresa, una y otra vez.' },
            { termino: 'Frecuencia', unidad: 'hertz (Hz)', texto: 'Cuántos ciclos completos da la corriente alterna en un segundo. Un hertz es un ciclo por segundo.' },
        ],
        claves: [
            'En la corriente directa el voltaje es constante y la corriente va siempre en el mismo sentido.',
            'En la corriente alterna el voltaje sube y baja como una ola, y la corriente cambia de sentido dos veces en cada ciclo.',
            'La frecuencia del Sistema Eléctrico Nacional es de 60 hertz: 60 ciclos por segundo. En operación normal debe mantenerse entre 59.8 y 60.2 Hz.',
            'Un osciloscopio dibuja el voltaje en el tiempo: la directa se ve como una línea plana; la alterna, como una ola.',
            'La red usa corriente alterna porque con un transformador es fácil subir o bajar su voltaje, y así la electricidad viaja lejos con pocas pérdidas.',
        ],
        formulas: [
            { expresion: 'T = 1 ÷ f', lectura: 'duración de un ciclo (segundos) = 1 ÷ frecuencia (hertz)', ejemplo: 'a 60 Hz, cada ciclo dura 1 ÷ 60 = 0.0167 segundos, unos 17 milésimos.' },
        ],
        errores: [
            { idea: 'Como la corriente alterna va y viene, no lleva energía.', realidad: 'Sí la lleva: la energía fluye hacia el aparato en los dos sentidos de la corriente. Por eso un foco enciende igual con alterna que con directa.' },
            { idea: 'Los paneles solares dan corriente alterna, como el contacto.', realidad: 'Dan corriente directa; un inversor la convierte en alterna para la red.' },
        ],
        partes: [
            { nombre: 'Pila (corriente directa)', texto: 'Da un voltaje fijo, siempre en el mismo sentido.' },
            { nombre: 'Contacto (corriente alterna)', texto: 'Da un voltaje que sube, baja y cambia de sentido 60 ciclos por segundo.' },
            { nombre: 'Osciloscopio', texto: 'Instrumento que dibuja cómo cambia el voltaje con el tiempo.' },
            { nombre: 'Pantalla', texto: 'Muestra el voltaje (de arriba abajo) contra el tiempo (de izquierda a derecha).' },
            { nombre: 'Cable de medición', texto: 'Conecta el osciloscopio a la pila o al contacto.' },
        ],
        dato: 'A fines del siglo XIX hubo una «guerra de las corrientes»: Edison defendía la directa y Westinghouse la alterna. Ganó la alterna porque se puede transformar; en 1896 llevó la electricidad de las cataratas del Niágara a la ciudad de Buffalo.',
        tramites: [],
        preguntas: [
            { pregunta: '¿Qué tipo de corriente da una pila?', opciones: ['Directa', 'Alterna', 'Las dos'], correcta: 0 },
            { pregunta: '¿Cuál es la frecuencia de la red eléctrica en México?', opciones: ['60 hertz', '50 hertz', '127 hertz'], correcta: 0 },
            { pregunta: '¿Por qué la red eléctrica usa corriente alterna?', opciones: ['Porque con un transformador es fácil cambiarle el voltaje', 'Porque se guarda más fácil en pilas', 'Porque no necesita cables'], correcta: 0 },
        ],
        fuentes: [
            openstax('20.5', 'Alternating Current versus Direct Current', '20-5-alternating-current-versus-direct-current'),
            { autor: 'Lantero, A.', fecha: '18 de noviembre de 2014', titulo: 'The War of the Currents: AC vs. DC Power', editorial: 'U.S. Department of Energy', url: 'https://www.energy.gov/articles/war-currents-ac-vs-dc-power', consulta },
            CEPAL,
        ],
        revisado: null,
    },
    {
        id: 'motor',
        nivel: 1,
        antes: ['cd-ca'],
        titulo: 'Motor eléctrico',
        sector: 'electricidad',
        resumen: 'Convierte la electricidad en movimiento. La corriente vuelve imanes a sus bobinas, y esos imanes jalan y empujan al imán del eje para hacerlo girar.',
        figura: 'motor',
        definiciones: [
            { termino: 'Motor eléctrico', texto: 'Máquina que convierte energía eléctrica en energía de movimiento (energía mecánica).' },
            { termino: 'Electroimán', texto: 'Bobina de alambre por la que pasa corriente: produce un campo magnético parecido al de un imán, más fuerte cuanto más corriente y más vueltas tiene, y más todavía con un núcleo de hierro.' },
            { termino: 'Rotor y estator', texto: 'El rotor es la parte que gira, montada en el eje. El estator es la parte fija que lo rodea.' },
        ],
        claves: [
            'Cuando pasa corriente por una bobina de cobre, la bobina se vuelve un imán: un electroimán. Si la corriente cambia de sentido, sus polos norte y sur se invierten.',
            'En el eje del motor hay un imán (el rotor). Su polo norte es jalado por el polo sur de las bobinas y empujado por su polo norte, y eso lo hace girar.',
            'Para que siga girando, la corriente de las bobinas tiene que invertirse cada media vuelta.',
            'Con corriente directa, eso lo hace un control electrónico o, en motores sencillos, unas escobillas que rozan el eje.',
            'Con corriente alterna, la corriente se invierte sola. Un motor síncrono gira al ritmo de la red; los motores de alterna más comunes son de inducción: su rotor no lleva imán y la corriente aparece en él por inducción.',
        ],
        errores: [
            { idea: 'Un motor y un generador son máquinas distintas.', realidad: 'Usan el mismo principio y casi las mismas piezas: el motor convierte electricidad en movimiento y el generador, movimiento en electricidad.' },
            { idea: 'El motor gira porque la corriente empuja al eje.', realidad: 'Lo que gira el eje es la fuerza entre imanes: los electroimanes de las bobinas y el imán del rotor.' },
        ],
        partes: [
            { nombre: 'Ventilador', texto: 'Lo que mueve el motor; podría ser una bomba, una banda o una rueda.' },
            { nombre: 'Imán que gira (rotor)', texto: 'Va montado en el eje; las bobinas lo jalan y lo empujan.' },
            { nombre: 'Bobinas: electroimanes (estator)', texto: 'Se vuelven imanes cuando pasa corriente; su color muestra cuál es norte y cuál sur.' },
            { nombre: 'Control', texto: 'Con corriente directa, invierte la corriente de las bobinas cada media vuelta.' },
            { nombre: 'Pila (corriente directa)', texto: 'Da corriente siempre en el mismo sentido.' },
            { nombre: 'Contacto (corriente alterna)', texto: 'Da corriente que se invierte sola: 60 ciclos por segundo.' },
        ],
        tramites: [],
        preguntas: [
            { pregunta: '¿Qué pasa con una bobina de cobre cuando pasa corriente por ella?', opciones: ['Se vuelve un imán', 'Se vuelve una pila', 'Deja de conducir'], correcta: 0 },
            { pregunta: '¿Qué tiene que pasar cada media vuelta para que el motor siga girando?', opciones: ['La corriente de las bobinas se invierte', 'El imán se apaga', 'El eje se detiene'], correcta: 0 },
            { pregunta: '¿Qué diferencia hay entre un motor y un generador?', opciones: ['El motor convierte electricidad en movimiento; el generador, movimiento en electricidad', 'Ninguna, son lo mismo', 'El motor solo funciona con pilas'], correcta: 0 },
        ],
        fuentes: [
            openstax('22.8', 'Torque on a Current Loop: Motors and Meters', '22-8-torque-on-a-current-loop-motors-and-meters'),
            openstax('22.9', "Magnetic Fields Produced by Currents: Ampere's Law", '22-9-magnetic-fields-produced-by-currents-amperes-law'),
            { autor: 'Nave, R.', fecha: 's. f.', titulo: 'AC Motors and Generators', editorial: 'HyperPhysics, Georgia State University', url: 'https://hyperphysics.gsu.edu/hbase/magnetic/motorac.html', consulta },
        ],
        revisado: null,
    },
    {
        id: 'generador',
        nivel: 1,
        antes: ['motor'],
        titulo: 'Cómo se genera la electricidad',
        sector: 'electricidad',
        resumen: 'Casi toda la electricidad sale de un generador: un imán que gira junto a bobinas de cobre. Lo que cambia de una central a otra es qué lo hace girar.',
        figura: 'generador',
        definiciones: [
            { termino: 'Inducción electromagnética', texto: 'Cuando un imán se mueve cerca de una bobina (o la bobina cerca del imán), aparece un voltaje en la bobina. La descubrió Michael Faraday en 1831.' },
            { termino: 'Generador eléctrico', texto: 'Máquina que convierte energía de movimiento (energía mecánica) en energía eléctrica por inducción electromagnética.' },
            { termino: 'Turbina', texto: 'Rueda con aspas o álabes que el agua, el viento, el vapor o los gases calientes hacen girar, y que a su vez hace girar el generador.' },
        ],
        claves: [
            'En un generador, la parte que gira (rotor) es un imán, y las bobinas quietas que lo rodean forman el estator.',
            'Cada vez que el imán pasa frente a una bobina, induce en ella un voltaje. Como el imán gira, el voltaje sube, baja y cambia de signo: el generador produce corriente alterna.',
            'Entre más rápido gira, más voltaje produce y más alta es la frecuencia. Con dos polos, cada vuelta es un ciclo: 3,600 vueltas por minuto dan 60 Hz.',
            'Una turbina hace girar el eje. La mueve el agua en una hidroeléctrica, el viento en una eólica o el vapor en una central de combustibles o nuclear.',
            'Los paneles solares son la gran excepción: producen electricidad sin piezas que giren.',
        ],
        formulas: [
            { expresion: 'V máx = N · A · B · ω', lectura: 'el voltaje máximo crece con el número de vueltas de la bobina (N), su área (A), la fuerza del imán (B) y la velocidad de giro (ω)', ejemplo: 'si el generador gira el doble de rápido, el voltaje máximo se duplica.' },
            { expresion: 'f = vueltas por minuto ÷ 60', lectura: 'frecuencia (Hz) de un generador de dos polos', ejemplo: '3,600 vueltas por minuto ÷ 60 = 60 Hz, la frecuencia de la red mexicana.' },
        ],
        errores: [
            { idea: 'El generador crea energía.', realidad: 'La convierte: transforma la energía de movimiento de la turbina en energía eléctrica. Si no gira, no produce nada.' },
            { idea: 'Cada tipo de central produce la electricidad de una forma distinta.', realidad: 'Casi todas usan el mismo generador; lo que cambia es qué mueve la turbina. La fotovoltaica es la excepción.' },
        ],
        partes: [
            { nombre: 'Turbina', texto: 'Rueda que el agua, el viento o el vapor hacen girar.' },
            { nombre: 'Eje', texto: 'Transmite el giro de la turbina al imán.' },
            { nombre: 'Imán que gira (rotor)', texto: 'Su campo magnético pasa por las bobinas en cada vuelta.' },
            { nombre: 'Bobinas de cobre (estator)', texto: 'Alambre enrollado donde aparece el voltaje.' },
            { nombre: 'Voltímetro', texto: 'Su aguja va y viene: muestra que la corriente es alterna.' },
            { nombre: 'Foco', texto: 'Brilla más cuanto más rápido gira el generador.' },
        ],
        dato: 'El principio del generador lo descubrió Michael Faraday en 1831 moviendo un imán dentro de una bobina de alambre. Casi toda la electricidad del mundo se sigue produciendo así.',
        ley: {
            texto: 'La generación de electricidad en centrales con capacidad igual o mayor a 0.7 MW requiere permiso de la Comisión Nacional de Energía (CNE) alineado a la planeación vinculante de la SENER.',
            siglas: ['LSE', 'RLSE', 'LCNE'],
            ficha: {
                elQue: 'Toda central eléctrica con capacidad igual o mayor a 0.7 MW requiere permiso de generación de la CNE (LSE, art. 19). Las centrales menores a 0.7 MW se consideran generación distribuida o exenta.',
                elComo: 'La persona interesada presenta su solicitud ante la CNE conforme a las convocatorias y criterios del Plan de Desarrollo del Sector Eléctrico (PLADESE) emitidos por la SENER, además de tramitar los estudios de interconexión ante el CENACE.',
                articulos: [
                    { siglas: 'LSE', refs: 'Arts. 11, 12, 19, 35 y 36', nota: 'Permisos de generación ≥ 0.7 MW y sujeción a la planeación vinculante.' },
                    { siglas: 'LCNE', refs: 'Arts. 2 y 7', nota: 'Facultad de la CNE para otorgar permisos de generación eléctrica.' },
                ],
            },
        },
        tramites: ['generacion'],
        mapa: { texto: 'Ver las centrales de generación en el mapa de permisos', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: 'En una hidroeléctrica, ¿qué hace girar al generador?', opciones: ['El agua que mueve la turbina', 'La luz del sol', 'Una pila'], correcta: 0 },
            { pregunta: '¿Qué tipo de corriente produce el generador de la figura?', opciones: ['Alterna', 'Directa', 'Ninguna'], correcta: 0 },
            { pregunta: 'Si el generador gira más rápido, ¿qué pasa con el voltaje?', opciones: ['Sube', 'Baja', 'No cambia'], correcta: 0 },
        ],
        fuentes: [
            eia('How electricity is generated', 'how-electricity-is-generated.php', '31 de octubre de 2023'),
            openstax('23.5', 'Electric Generators', '23-5-electric-generators'),
            LSE,
            LCNE,
        ],
        revisado: null,
    },
    {
        id: 'transformador',
        nivel: 2,
        antes: ['cd-ca', 'generador'],
        titulo: 'Transformador',
        sector: 'electricidad',
        resumen: 'Sube o baja el voltaje de la corriente alterna. Con voltaje alto, la misma energía viaja con menos corriente y se pierde menos en las líneas.',
        figura: 'transformador',
        definiciones: [
            { termino: 'Transformador', texto: 'Máquina sin piezas móviles que cambia el voltaje de la corriente alterna por inducción: dos bobinas enrolladas en un mismo núcleo de hierro.' },
            { termino: 'Elevador y reductor', texto: 'Un transformador elevador sube el voltaje (y baja la corriente); uno reductor lo baja (y sube la corriente).' },
            { termino: 'Alta y baja tensión', texto: 'El Reglamento de la Ley del Sector Eléctrico llama alta tensión a la de más de 35 kilovolts, y baja tensión a la de un kilovolt o menos.' },
        ],
        claves: [
            'La corriente alterna de una bobina magnetiza el núcleo de hierro, y el núcleo induce voltaje en la otra bobina. Por eso solo funciona con corriente alterna.',
            'El voltaje cambia en la misma proporción que el número de vueltas: la bobina con más vueltas tiene más voltaje.',
            'La potencia que entra es casi igual a la que sale. Si el voltaje sube, la corriente baja en la misma proporción.',
            'Las pérdidas en los cables crecen con el cuadrado de la corriente: con la mitad de corriente, se pierde la cuarta parte.',
            'Por eso las centrales elevan el voltaje para enviar la energía lejos, y cerca de las casas otro transformador lo baja para usarla con seguridad.',
        ],
        formulas: [
            { expresion: 'Vs ÷ Vp = Ns ÷ Np', lectura: 'el voltaje de salida entre el de entrada es igual a las vueltas de salida entre las de entrada', ejemplo: 'con 3 vueltas de entrada y 25 de salida, 13.8 kV × 25 ÷ 3 = 115 kV.' },
            { expresion: 'Vp × Ip ≈ Vs × Is', lectura: 'la potencia de entrada es casi igual a la de salida', ejemplo: '30 MW a 13.8 kV son unos 2,170 A; a 115 kV, solo unos 260 A.' },
            { expresion: 'P pérdida = I² × R', lectura: 'la energía que se pierde en un cable crece con el cuadrado de la corriente', ejemplo: 'con 8 veces menos corriente, se pierde unas 64 veces menos.' },
        ],
        errores: [
            { idea: 'El transformador funciona con cualquier corriente.', realidad: 'Solo con corriente alterna: necesita que el magnetismo del núcleo cambie todo el tiempo.' },
            { idea: 'Al subir el voltaje, el transformador da más energía.', realidad: 'La potencia sale casi igual a como entra (a menudo con más del 99 % de eficiencia); lo que cambia es el reparto entre voltaje y corriente.' },
        ],
        partes: [
            { nombre: 'Núcleo de hierro', texto: 'Lleva el magnetismo de una bobina a la otra.' },
            { nombre: 'Bobina de pocas vueltas', texto: 'Lado de bajo voltaje y mucha corriente.' },
            { nombre: 'Bobina de muchas vueltas', texto: 'Lado de alto voltaje y poca corriente.' },
            { nombre: 'Lado de bajo voltaje', texto: 'Aquí se conecta, por ejemplo, el generador de una central.' },
            { nombre: 'Lado de alto voltaje', texto: 'Aquí se conecta la línea de transmisión.' },
        ],
        dato: 'Los transformadores grandes son de las máquinas más eficientes que existen: a menudo pierden menos del 1 % de la energía que pasa por ellos.',
        ley: {
            texto: 'El Servicio Público de Transmisión y Distribución de Energía Eléctrica (RNT y RGD) es un área estratégica exclusiva del Estado operada por CFE, con acceso abierto no indebidamente discriminatorio sujeto a factibilidad técnica.',
            siglas: ['LSE', 'RLSE', 'LCNE'],
            ficha: {
                elQue: 'La Red Nacional de Transmisión (RNT) y las Redes Generales de Distribución (RGD) son áreas estratégicas reservadas en exclusiva al Estado a través de CFE (arts. 27 y 28 CPEUM; LSE, art. 57).',
                elComo: 'La interconexión de centrales y conexión de centros de carga se tramita ante el CENACE sujeto a capacidad de alojamiento y a los programas vinculantes de ampliación y modernización (LSE, arts. 13 y 50). La CNE expide las tarifas reguladas de transmisión y distribución (LSE, art. 160).',
                articulos: [
                    { siglas: 'LSE', refs: 'Arts. 13, 45, 46, 50, 57 y 160', nota: 'Exclusividad estatal en RNT/RGD, condiciones de acceso abierto y tarifas reguladas.' },
                    { siglas: 'RLSE', refs: 'Disposiciones de transmisión y distribución', nota: 'Niveles de tensión (baja, media y alta tensión) e interconexión.' },
                ],
            },
        },
        tramites: [],
        mapa: { texto: 'Ver las líneas de transmisión en el mapa de permisos', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: '¿Con qué tipo de corriente funciona un transformador?', opciones: ['Con corriente alterna', 'Con corriente directa', 'Con las dos por igual'], correcta: 0 },
            { pregunta: 'Si un transformador sube el voltaje, ¿qué pasa con la corriente?', opciones: ['Baja', 'Sube', 'No cambia'], correcta: 0 },
            { pregunta: '¿Por qué se transmite la electricidad con voltaje alto?', opciones: ['Porque con menos corriente se pierde menos energía en las líneas', 'Porque así llega más rápido', 'Porque las casas usan voltaje alto'], correcta: 0 },
        ],
        fuentes: [
            openstax('23.7', 'Transformers', '23-7-transformers'),
            openstax('20.4', 'Electric Power and Energy', '20-4-electric-power-and-energy'),
            eia('Delivery to consumers', 'delivery-to-consumers.php'),
            eia('Batteries, circuits, and transformers', 'batteries-circuits-and-transformers.php'),
            LSE,
            RLSE,
        ],
        revisado: null,
    },
    {
        id: 'fotovoltaica',
        nivel: 3,
        antes: ['cd-ca', 'generador', 'transformador'],
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
            texto: 'La generación fotovoltaica puede realizarse para el Mercado Eléctrico Mayorista (≥ 0.7 MW), para autoconsumo o como generación distribuida, conforme a la Ley del Sector Eléctrico y su reglamento.',
            siglas: ['LSE', 'RLSE', 'LCNE'],
            ficha: {
                elQue: 'Las centrales solares fotovoltaicas ≥ 0.7 MW requieren permiso de la CNE (para el MEM o autoconsumo interconectado/aislado) y pueden incorporar Sistemas de Almacenamiento de Energía Eléctrica (SAEE) para aportar firmeza.',
                elComo: 'Para venta al MEM deben alinearse a las convocatorias vinculantes del PLADESE o desarrollarse en esquemas mixtos con CFE; para autoconsumo (0.7 a 20 MW) cuentan con trámite simplificado mediante ventanilla digital.',
                articulos: [
                    { siglas: 'LSE', refs: 'Arts. 19, 32, 35, 36 y 82–85', nota: 'Permisos de generación, autoconsumo interconectado y almacenamiento SAEE asociado.' },
                    { siglas: 'RLSE', refs: 'Arts. 68 a 88', nota: 'Reglas para proyectos de generación y esquemas de desarrollo mixto.' },
                ],
            },
        },
        tramites: ['generacion', 'autoconsumo', 'almacenamiento'],
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
    {
        id: 'ciclo-combinado',
        nivel: 3,
        antes: ['generador', 'transformador'],
        titulo: 'Central de ciclo combinado',
        sector: 'electricidad',
        resumen: 'La tecnología más eficiente para generar con gas natural: quema gas en una turbina de combustión y aprovecha los gases calientes para producir vapor y mover una segunda turbina.',
        figura: 'ciclo-combinado',
        definiciones: [
            { termino: 'Ciclo combinado', texto: 'Combinación de dos ciclos termodinámicos: un ciclo Brayton (turbina de gas) y un ciclo Rankine (turbina de vapor), logrando eficiencias cercanas al 60 %.' },
            { termino: 'HRSG (Generador de vapor)', texto: 'Caldera de recuperación de calor que aprovecha los gases de escape calientes (>500 °C) de la turbina de gas para generar vapor a alta presión.' },
            { termino: 'Generación firme', texto: 'Electricidad constante y despachable en cualquier hora del día que respalda la confiabilidad y el control de frecuencia (60 Hz) del Sistema Eléctrico Nacional.' },
        ],
        claves: [
            'El gas natural se mezcla con aire comprimido y se quema para mover una turbina de gas a alta temperatura (primer generador).',
            'Los gases de escape salen a más de 500 °C. En lugar de desperdiciarlos, pasan por un recuperador de calor (HRSG) que hierve agua hasta convertirla en vapor de alta presión.',
            'Ese vapor impulsa una segunda turbina (de vapor), produciendo hasta un 50 % más de electricidad con el mismo combustible.',
            'Aportan más de la mitad de la generación eléctrica de México y dan el soporte de potencia firme cuando baja el sol o el viento.',
            'Su operación requiere coordinación entre el despacho eléctrico del CENACE y la disponibilidad de gas por ducto en el SISTRANGAS (CENAGAS).',
        ],
        partes: [
            { nombre: 'Entrada de gas natural', texto: 'Suministro de combustible a alta presión desde el gasoducto.' },
            { nombre: 'Compresor y cámara de combustión', texto: 'Comprime el aire y quema el gas natural.' },
            { nombre: 'Turbina de gas', texto: 'Gira con la fuerza de los gases ardientes y mueve el primer generador.' },
            { nombre: 'Recuperador de calor (HRSG)', texto: 'Aprovecha los gases de escape para producir vapor de agua.' },
            { nombre: 'Turbina de vapor', texto: 'Gira impulsada por el vapor a presión y mueve el segundo generador.' },
            { nombre: 'Torre de enfriamiento / Condensador', texto: 'Enfría el vapor para volverlo agua líquida y recircularlo en circuito cerrado.' },
        ],
        ley: {
            texto: 'Las centrales de ciclo combinado requieren permiso de generación de la CNE, interconexión con el CENACE y suministro de gas natural coordinado conforme a la planeación vinculante del sector.',
            siglas: ['LSE', 'RLSE', 'LCNE'],
            ficha: {
                elQue: 'Son centrales térmicas de alta eficiencia y potencia firme que participan en el Mercado Eléctrico Mayorista por medio de CFE, esquemas de Desarrollo Mixto (Inversión Mixta o Producción de Largo Plazo) o permisionarios privados.',
                elComo: 'Requieren permiso de generación de la CNE (LSE, art. 19), contrato de interconexión y de Participante del Mercado con el CENACE (LSE, art. 114) y contrato de transporte de gas natural en acceso abierto.',
                articulos: [
                    { siglas: 'LSE', refs: 'Arts. 19, 35, 36, 38–40 y 114', nota: 'Permiso de generación, esquemas de desarrollo mixto y participación en el MEM.' },
                    { siglas: 'RLSE', refs: 'Arts. 68 y 84–87', nota: 'Condiciones de planeación vinculante y asociación con CFE.' },
                ],
            },
        },
        tramites: ['generacion', 'cogeneracion'],
        mapa: { texto: 'Ver centrales de ciclo combinado en el mapa de permisos', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: '¿Por qué se llama ciclo combinado?', opciones: ['Porque combina una turbina de gas y una de vapor', 'Porque usa carbón y agua', 'Porque se conecta a dos redes distintas'], correcta: 0 },
            { pregunta: '¿Qué hace el generador de vapor por recuperación de calor (HRSG)?', opciones: ['Aprovecha los gases calientes de escape para hervir agua', 'Produce gas natural', 'Enfría los cables eléctricos'], correcta: 0 },
            { pregunta: '¿Qué combustible usan principalmente los ciclos combinados en México?', opciones: ['Gas natural', 'Diésel marino', 'Carbón mineral'], correcta: 0 },
        ],
        fuentes: [
            eia('Electricity explained', 'how-electricity-is-generated.php'),
            LSE,
            RLSE,
            LCNE,
        ],
        revisado: null,
    },
    {
        id: 'mercado-cenace',
        nivel: 4,
        antes: ['transformador', 'ciclo-combinado', 'fotovoltaica'],
        titulo: 'CENACE y el despacho eléctrico (MEM)',
        sector: 'electricidad',
        resumen: 'La electricidad debe producirse en el mismo instante en que se consume. El CENACE ejerce el control operativo del SEN y despacha las centrales por orden de mérito con restricciones de seguridad.',
        figura: 'mercado-cenace',
        definiciones: [
            { termino: 'CENACE', texto: 'Centro Nacional de Control de Energía: organismo público descentralizado encargado del Control Operativo del Sistema Eléctrico Nacional y de operar el Mercado Eléctrico Mayorista (LSE, arts. 111 y 124).' },
            { termino: 'Despacho económico con restricciones de seguridad', texto: 'Asignación de centrales de menor a mayor costo variable respetando la Confiabilidad, Seguridad de Despacho, el despacho obligado de cogeneración (art. 43) y la prevalencia estatal (art. 117).' },
            { termino: 'Precio Marginal Local (PML)', unidad: '$/MWh', texto: 'Costo de suministrar el siguiente megawatt-hora en un nodo de la red: Costo de Energía + Pérdidas Marginales de Transmisión + Costo de Congestión.' },
            { termino: 'Mercados del MEM', texto: 'Integra el Mercado de Energía de Corto Plazo (Día en Adelanto MDA y Tiempo Real MTR), el Mercado para el Balance de Potencia, los Certificados de Energías Limpias (CEL) y los Servicios Conexos (LSE, art. 112).' },
        ],
        claves: [
            'En una red eléctrica la generación y la demanda deben equilibrarse cada segundo para mantener la frecuencia nacional en 60 Hz y cumplir el Código de Red.',
            'En el orden de mérito económico entran primero las centrales de menor costo variable (solar, eólica, hidroeléctrica y cogeneración con despacho obligado) y después las de ciclo combinado y turbogás.',
            'La última central necesaria para cubrir la demanda en cada hora fija el Precio Marginal Local (PML) en su nodo.',
            'Cuando una línea de la Red Nacional de Transmisión se satura (congestión), el CENACE despacha generación local de mayor costo para proteger la seguridad de la red, elevando el PML de esa zona.',
            'Además de la energía diaria (MDA y MTR), el MEM liquida Potencia firme anual, Servicios Conexos (reservas rodantes, regulación de frecuencia y tensión) y Certificados de Energías Limpias (CEL).',
        ],
        partes: [
            { nombre: 'Consumo nacional (Demanda)', texto: 'Millones de hogares, comercios e industrias recibiendo energía a 60 Hz.' },
            { nombre: 'Despacho base (Renovables e Hidro)', texto: 'Costo variable mínimo ($0/MWh): entran primero en el orden de mérito.' },
            { nombre: 'Despacho intermedio (Ciclo combinado)', texto: 'Generación firme y flexible que acompaña la curva de demanda.' },
            { nombre: 'Pico y reserva (Turbogás)', texto: 'Unidades de arranque rápido para las horas punta y reservas operativas.' },
            { nombre: 'Fijación de PML', texto: 'Consola del CENACE donde la unidad marginal y las restricciones de red determinan el PML nodal.' },
        ],
        ley: {
            texto: 'La Ley del Sector Eléctrico faculta exclusivamente al CENACE para ejercer el Control Operativo del Sistema Eléctrico Nacional y operar el Mercado Eléctrico Mayorista bajo principios de Confiabilidad, Seguridad de Despacho y eficiencia.',
            siglas: ['LSE', 'RLSE', 'LCNE'],
            ficha: {
                elQue: 'El CENACE mantiene la seguridad operativa de la red (Código de Red) y administra las transacciones del MEM: energía de corto plazo (MDA/MTR), balance de potencia, servicios conexos y CEL (LSE, arts. 111 y 112).',
                elComo: 'Las Generadoras, Comercializadoras y Usuarios Calificados celebran contrato de Participante del Mercado con el CENACE (art. 114). El CENACE ejecuta el despacho económico con restricciones de seguridad preservando la confiabilidad y la prevalencia del Estado (arts. 117 y 124).',
                articulos: [
                    { siglas: 'LSE', refs: 'Arts. 21, 43, 111, 112, 114, 117 y 124', nota: 'Control operativo del CENACE, transacciones del MEM y despacho con restricciones de seguridad.' },
                    { siglas: 'LCNE', refs: 'Art. 7', nota: 'Expedición y vigilancia de Reglas del Mercado y disposiciones técnicas (Código de Red).' },
                ],
            },
        },
        tramites: ['generacion', 'almacenamiento'],
        mapa: { texto: 'Ver regiones del sistema eléctrico en el mapa', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: '¿Qué central fija el Precio Marginal Local (PML)?', opciones: ['La última central necesaria para cubrir la demanda', 'La central más barata del país', 'El promedio de todas las centrales'], correcta: 0 },
            { pregunta: '¿Cuáles son los 3 componentes del Precio Marginal Local?', opciones: ['Energía, pérdidas de transmisión y congestión', 'Voltaje, corriente y resistencia', 'IVA, ISR e IEPS'], correcta: 0 },
            { pregunta: '¿Quién ejerce el Control Operativo del Sistema Eléctrico Nacional en México?', opciones: ['El CENACE', 'Cada municipio', 'Las empresas privadas'], correcta: 0 },
        ],
        fuentes: [
            CENACE,
            LSE,
            RLSE,
            LCNE,
        ],
        revisado: null,
    },
    {
        id: 'planeacion-desarrollo-mixto',
        nivel: 4,
        antes: ['transformador', 'fotovoltaica', 'ciclo-combinado', 'mercado-cenace'],
        titulo: 'Planeación vinculante, regla 54/46 y Desarrollo Mixto',
        sector: 'electricidad',
        resumen: 'Cómo se organiza el sector eléctrico tras la reforma de 2025: rectoría vinculante de SENER (PLADESE), prevalencia estatal mínima del 54 % (CFE), esquemas de Desarrollo Mixto, baterías (SAEE) y redes exclusivas del Estado.',
        figura: 'desarrollo-mixto-sen',
        definiciones: [
            { termino: 'Prevalencia del Estado (≥ 54 %)', texto: 'Mandato legal por el cual el Estado mantiene al menos el 54 % del promedio de la energía inyectada a la red en un año calendario, garantizando la confiabilidad y evitando lucro en el Suministro Básico (LSE, arts. 1, 6 y 36).' },
            { termino: 'Planeación vinculante (PLADESE)', texto: 'Conducción obligatoria de la SENER sobre las adiciones y retiros de capacidad del Sistema Eléctrico Nacional a través del Plan de Desarrollo del Sector Eléctrico y sus convocatorias (LPTE, arts. 2 y 21; LSE, art. 12).' },
            { termino: 'Producción de Largo Plazo (PLP)', texto: 'Esquema de Desarrollo Mixto donde el particular financia, construye y opera la central, vendiendo el 100 % de su energía y productos asociados en exclusiva a CFE (LSE, arts. 38 fr. I y 39).' },
            { termino: 'Inversión Mixta (CFE ≥ 54 %)', texto: 'Esquema de Desarrollo Mixto donde CFE se asocia con particulares manteniendo directa o indirectamente al menos el 54 % del capital social común o control del proyecto (LSE, art. 40; RLSE, arts. 84–87).' },
        ],
        claves: [
            'La CFE es ahora una Empresa Pública del Estado con mandato de servicio público, soberanía y justicia energética (LEPE-CFE, arts. 2 y 4).',
            'Ya no existe interconexión libre sin planeación: todo nuevo proyecto de generación para el mercado debe alinearse al PLADESE vinculante de la SENER y obtener permiso de la CNE.',
            'Para desarrollar centrales conjuntas entre CFE y particulares, la Ley del Sector Eléctrico (art. 38) establece los Esquemas para el Desarrollo Mixto: Producción de Largo Plazo (PLP) e Inversión Mixta (con ≥ 54 % de participación estatal).',
            'La Red Nacional de Transmisión (RNT) y las Redes Generales de Distribución (RGD) están reservadas en exclusiva al Estado (LSE, art. 57).',
            'La ley incorpora la regulación de los Sistemas de Almacenamiento de Energía Eléctrica (SAEE / baterías, arts. 82–85) y el régimen de migración para permisos legados de autoabastecimiento y cogeneración (Transitorios Sexto a Octavo).',
        ],
        partes: [
            { nombre: 'Rectoría SENER y permisos CNE', texto: 'SENER emite la planeación vinculante (PLADESE) y las convocatorias; la CNE otorga los permisos y regula tarifas.' },
            { nombre: 'Generación estatal (CFE ≥ 54 %)', texto: 'La Empresa Pública del Estado aporta como mínimo el 54 % de la energía inyectada a la red en el año.' },
            { nombre: 'Esquemas de Desarrollo Mixto', texto: 'Asociaciones CFE + particulares bajo Inversión Mixta (CFE ≥ 54 % capital) o Producción de Largo Plazo (venta 100 % a CFE).' },
            { nombre: 'Generación privada (≤ 46 %)', texto: 'Permisionarios privados que participan en el MEM sujetos a la planeación vinculante del sector.' },
            { nombre: 'Almacenamiento en baterías (SAEE)', texto: 'Sistemas de almacenamiento regulados (LSE arts. 82–85) que dan firmeza, potencia y servicios conexos.' },
            { nombre: 'RNT y RGD (Exclusivas del Estado)', texto: 'Redes de transmisión y distribución estratégicas operadas por el Estado con acceso abierto sujeto a factibilidad técnica.' },
        ],
        ley: {
            texto: 'La reforma constitucional y la Ley del Sector Eléctrico establecen la planeación vinculante de la SENER, la prevalencia del Estado (≥ 54 %), los Esquemas para el Desarrollo Mixto con CFE, la regulación de baterías (SAEE) y la migración de permisos legados.',
            siglas: ['LSE', 'RLSE', 'LPTE', 'LCNE', 'LEPE-CFE'],
            ficha: {
                elQue: 'Define la arquitectura institucional del sector eléctrico: SENER planea de forma vinculante (PLADESE), la CNE otorga permisos y regula tarifas, CFE garantiza al menos el 54 % de inyección anual y opera en exclusiva las redes (RNT/RGD), y los particulares participan hasta en el 46 % o en Esquemas de Desarrollo Mixto.',
                elComo: '1) SENER publica necesidades de capacidad y convocatorias conforme al PLADESE; 2) CFE selecciona socios en Desarrollo Mixto conforme a sus Lineamientos (DOF 28/01/2026) o el particular solicita permiso ante la CNE; 3) Los permisos legados de autoabastecimiento pueden migrar a las figuras de la LSE (Transitorios Sexto a Octavo).',
                articulos: [
                    { siglas: 'LSE', refs: 'Arts. 1, 6, 10, 11, 12, 35, 36, 38, 39, 40, 57 y 82–85', nota: 'Prevalencia ≥ 54 %, planeación vinculante, Desarrollo Mixto (PLP e Inversión Mixta), exclusividad RNT/RGD y almacenamiento SAEE.' },
                    { siglas: 'RLSE', refs: 'Arts. 68 y 84 a 88', nota: 'Reglas de los esquemas de Desarrollo Mixto y participación mínima del 54 % de CFE.' },
                    { siglas: 'LPTE', refs: 'Arts. 2, 21 y 23', nota: 'Instrumentos de planeación vinculante (PROSENER, PLATEASE y PLADESE).' },
                    { siglas: 'LEPE-CFE', refs: 'Arts. 1, 2 y 4', nota: 'Transformación de CFE en Empresa Pública del Estado sin afán preponderante de lucro.' },
                ],
            },
        },
        tramites: ['generacion', 'almacenamiento', 'autoconsumo', 'migracion'],
        mapa: { texto: 'Ver centrales y redes eléctricas en el mapa de permisos', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: '¿Cuál es el porcentaje mínimo de energía inyectada a la red que debe mantener el Estado en un año calendario?', opciones: ['Al menos el 54 %', 'El 10 %', 'El 100 % sin participación privada'], correcta: 0 },
            { pregunta: 'En el esquema de Inversión Mixta con CFE, ¿qué participación mínima debe conservar la Empresa Pública del Estado?', opciones: ['Al menos el 54 % del capital social común o control', 'Menos del 20 %', 'No participa en el capital'], correcta: 0 },
            { pregunta: '¿Qué caracteriza al esquema de Producción de Largo Plazo (PLP)?', opciones: ['El particular financia y opera la central y vende el 100 % de la energía y productos en exclusiva a CFE', 'La central vende libremente a cualquier usuario en el extranjero', 'No requiere permiso de la CNE'], correcta: 0 },
        ],
        fuentes: [
            LSE,
            RLSE,
            LPTE,
            LCNE,
            LEPE_CFE,
        ],
        revisado: null,
    },
    {
        id: 'hidrocarburos-moleculas',
        nivel: 1,
        titulo: '¿Qué son los hidrocarburos?',
        sector: 'hidrocarburos',
        resumen: 'Compuestos químicos de carbono e hidrógeno formados hace millones de años. De ellos obtenemos gas natural, gas LP, gasolinas, diésel, turbosina y materias primas para plásticos.',
        figura: 'hidrocarburos',
        definiciones: [
            { termino: 'Hidrocarburo', texto: 'Compuesto orgánico cuyas moléculas están formadas exclusivamente por átomos de carbono (C) e hidrógeno (H).' },
            { termino: 'Petróleo crudo', texto: 'Mezcla líquida natural de miles de hidrocarburos diferentes, clasificado en México en crudo pesado (Maya), ligero (Istmo) y superligero (Olmeca).' },
            { termino: 'Gas natural', texto: 'Mezcla gaseosa compuesta principalmente por metano (CH₄, 80-95 %). Es el combustible fósil más limpio y el que más energía genera en el país.' },
            { termino: 'Gas LP (Licuado de Petróleo)', texto: 'Mezcla de propano (C₃H₈) y butano (C₄H₁₀) que se licúa a presiones moderadas para distribuirse en cilindros y tanques estacionarios.' },
        ],
        claves: [
            'El petróleo y el gas se originaron por restos de plancton y microorganismos marinos enterrados bajo sedimentos durante millones de años a gran presión y calor.',
            'La molécula más pequeña y ligera es el metano ($CH_4$), que es gaseoso a temperatura ambiente. Conforme la cadena de carbonos crece, los hidrocarburos se vuelven líquidos y luego sólidos.',
            'La energía se almacena en los enlaces químicos entre el carbono y el hidrógeno, y se libera al combinarse con oxígeno en una reacción de combustión.',
            'México produce petróleo crudo en yacimientos terrestres y marinos (como la Sonda de Campeche).',
            'Además de combustibles, los hidrocarburos son la base de la petroquímica para fabricar plásticos, fertilizantes, medicinas y textiles.',
        ],
        formulas: [
            { expresion: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O + calor', lectura: 'metano + oxígeno producen dióxido de carbono, agua y energía calorífica', ejemplo: 'al encender una hornilla de gas natural se libera calor; lo que sale es CO₂ y vapor de agua.' },
        ],
        errores: [
            { idea: 'El petróleo se encuentra en ríos o cavernas subterráneas.', realidad: 'Está atrapado en los poros microscópicos de rocas permeables (como areniscas o calizas), igual que el agua en una esponja.' },
            { idea: 'El gas natural y el gas LP son el mismo gas.', realidad: 'El gas natural es metano (CH₄) y se distribuye por tuberías; el gas LP es propano/butano y se vende en pipas, cilindros o tanques estacionarios.' },
        ],
        partes: [
            { nombre: 'Metano (CH₄)', texto: '1 carbono y 4 hidrógenos: gas natural de red.' },
            { nombre: 'Propano y Butano', texto: '3 y 4 carbonos: gas LP doméstico.' },
            { nombre: 'Octano (C₈H₁₈)', texto: '8 carbonos: base representativa de las gasolinas de motor.' },
            { nombre: 'Hidrocarburos pesados', texto: 'Más de 20 carbonos: combustóleo, ceras y asfalto para pavimentación.' },
        ],
        dato: 'El crudo mexicano de exportación de referencia mundial se llama crudo Maya: es denso, pesado y con alto contenido de azufre, extraído principalmente costa afuera en Campeche.',
        ley: {
            texto: 'La Nación tiene el dominio directo, inalienable e imprescriptible de todos los hidrocarburos en el subsuelo conforme al artículo 27 constitucional y la Ley del Sector Hidrocarburos.',
            siglas: ['LSH', 'RLSH', 'LCNE'],
            ficha: {
                elQue: 'Los hidrocarburos en el subsuelo (petróleo, gas natural, condensados e hidratos de metano) son propiedad exclusiva e inalienable de la Nación (art. 27 CPEUM; LSH, arts. 1 y 3).',
                elComo: 'Su exploración y extracción constituye un área estratégica que el Estado realiza por conducto de Petróleos Mexicanos (Empresa Pública del Estado) mediante Asignaciones para Desarrollo Propio o para Desarrollo Mixto otorgadas por la SENER.',
                articulos: [
                    { siglas: 'LSH', refs: 'Arts. 1, 3, 5, 7 y 8', nota: 'Propiedad nacional de los hidrocarburos en el subsuelo y planeación vinculante.' },
                    { siglas: 'LEPE-PEMEX', refs: 'Arts. 2 y 4', nota: 'Naturaleza de PEMEX como Empresa Pública del Estado.' },
                ],
            },
        },
        tramites: ['gasnatural', 'gaslp'],
        mapa: { texto: 'Ver asignaciones y contratos de hidrocarburos en el mapa', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: '¿Cuáles son los dos elementos químicos que forman a los hidrocarburos?', opciones: ['Carbono e hidrógeno', 'Oxígeno y nitrógeno', 'Hierro y cobre'], correcta: 0 },
            { pregunta: '¿Qué gas compone principalmente al gas natural de tubería?', opciones: ['Metano (CH₄)', 'Propano (C₃H₈)', 'Oxígeno (O₂)'], correcta: 0 },
            { pregunta: '¿En qué tipo de formación se encuentra el petróleo bajo tierra?', opciones: ['En los poros microscópicos de las rocas', 'En lagos y ríos subterráneos abiertos', 'En el núcleo de la Tierra'], correcta: 0 },
        ],
        fuentes: [
            LSH,
            RLSH,
            CEPAL,
            IEA_OIL,
        ],
        revisado: null,
    },
    {
        id: 'gasoductos',
        nivel: 2,
        antes: ['hidrocarburos-moleculas'],
        titulo: 'Transporte por ducto y gasoductos',
        sector: 'hidrocarburos',
        resumen: 'El gas natural y los combustibles líquidos viajan miles de kilómetros por tuberías de acero bajo tierra, impulsados por estaciones de compresión y de bombeo.',
        figura: 'gasoductos',
        definiciones: [
            { termino: 'Gasoducto', texto: 'Tubería de acero al carbono de alta resistencia diseñada para transportar gas natural comprimido a presiones típicas de 50 a 90 bar.' },
            { termino: 'Poliducto', texto: 'Tubería que transporta diferentes petrolíferos líquidos en tandas secuenciales (gasolina regular, premium y diésel) sin mezclarse.' },
            { termino: 'Estación de compresión', texto: 'Instalación con compresores mecánicos colocada cada 100 a 150 km para elevar la presión del gas que se pierde por fricción.' },
            { termino: 'Acceso abierto no discriminatorio', texto: 'Obligación legal de los permisionarios de transporte por ducto de permitir el uso de capacidad disponible a terceros que cubran la tarifa regulada aprobada por la CNE.' },
        ],
        claves: [
            'El transporte por ducto es la forma más segura, económica y con menor huella de carbono para mover grandes volúmenes de energía en distancias continentales.',
            'El gas natural no tiene olor por naturaleza: antes de distribuirse a los hogares se le agrega una sustancia química llamada mercaptano para que cualquier fuga se detecte al instante.',
            'México cuenta con el SISTRANGAS (Sistema de Transporte y Almacenamiento Nacional Integrado de Gas Natural), cuya gestión técnica e independiente está a cargo del CENAGAS.',
            'Gran parte del gas que consume México para generar electricidad y en la industria proviene de producción nacional y de importaciones por gasoducto desde Texas, con coordinación operativa entre CENAGAS y CENACE.',
            'Para inspeccionar las tuberías sin suspender el servicio, se introducen robots inteligentes llamados «diablos» (scrapers) que revisan espesor de metal y corrosión.',
        ],
        partes: [
            { nombre: 'Tubería enterrada', texto: 'Tubos soldados de hasta 48 pulgadas de diámetro con recubrimiento anticorrosivo.' },
            { nombre: 'Estación de compresión', texto: 'Compresores centrífugos, movidos por turbinas de gas o motores eléctricos, que restauran la presión del gas natural a lo largo de la ruta.' },
            { nombre: 'Válvula de seccionamiento', texto: 'Permite aislar tramos del ducto en minutos ante cualquier emergencia o mantenimiento.' },
            { nombre: 'Trampa de diablos', texto: 'Lugar donde se insertan y extraen herramientas de limpieza e inspección magnética o ultrasónica.' },
            { nombre: 'Estación de regulación y medición (City Gate)', texto: 'Reduce la presión del gas antes de entregarlo a la red urbana o a la central eléctrica.' },
        ],
        ley: {
            texto: 'El transporte y la distribución por medio de ductos requieren permiso de la Comisión Nacional de Energía (CNE). La gestión independiente del SISTRANGAS corresponde al CENAGAS.',
            siglas: ['LSH', 'RLSH', 'LCNE'],
            ficha: {
                elQue: 'El transporte por ducto de gas natural, petrolíferos y petroquímicos es una actividad regulada sujeta a permiso de la CNE y al principio de acceso abierto no indebidamente discriminatorio.',
                elComo: 'Los permisionarios asignan capacidad disponible mediante temporadas abiertas supervisadas por la CNE; en el SISTRANGAS, el CENAGAS gestiona la capacidad y coordina con el CENACE el abasto a las centrales eléctricas.',
                articulos: [
                    { siglas: 'LSH', refs: 'Arts. 76 fr. II, 80, 81 y 83', nota: 'Permisos de transporte y distribución por ducto otorgados por la CNE.' },
                    { siglas: 'LCNE', refs: 'Arts. 2 y 7', nota: 'Regulación tarifaria y de acceso abierto en transporte y distribución por ducto.' },
                ],
            },
        },
        tramites: ['gasnatural'],
        mapa: { texto: 'Ver la red de gasoductos en el mapa de permisos', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: '¿Para qué sirve una estación de compresión en un gasoducto?', opciones: ['Para recuperar la presión perdida por fricción durante el viaje', 'Para quemar el gas sobrante', 'Para enfriar el terreno'], correcta: 0 },
            { pregunta: '¿Qué es el principio de «acceso abierto» en los ductos?', opciones: ['Cualquiera con permiso puede usar capacidad disponible pagando la tarifa regulada', 'Los ductos están abiertos al aire libre', 'No se cobra por transportar gas'], correcta: 0 },
            { pregunta: '¿Quién es el gestor independiente del sistema nacional de gas natural (SISTRANGAS)?', opciones: ['El CENAGAS', 'Cada gasolinera', 'Protección Civil'], correcta: 0 },
        ],
        fuentes: [
            CENAGAS,
            LSH,
            RLSH,
            LCNE,
        ],
        revisado: null,
    },
    {
        id: 'almacenamiento-tar',
        nivel: 2,
        antes: ['hidrocarburos-moleculas', 'gasoductos'],
        titulo: 'Almacenamiento de petrolíferos (TAR)',
        sector: 'hidrocarburos',
        resumen: 'Grandes tanques de almacenamiento que guardan combustibles de reserva para asegurar que las ciudades y carreteras nunca se queden sin gasolina ni diésel.',
        figura: 'almacenamiento-tar',
        definiciones: [
            { termino: 'Terminal de Almacenamiento y Reparto (TAR)', texto: 'Instalación industrial que recibe combustibles por poliducto, buque o carrotanque, los guarda en tanques verticales y los despacha a camiones pipa.' },
            { termino: 'Tanque de techo flotante', texto: 'Tanque cilíndrico donde el techo flota directamente sobre la gasolina, reduciendo casi por completo el espacio de vapor para evitar evaporación y riesgo de ignición. Puede ser externo o interno (bajo un techo fijo).' },
            { termino: 'Inventario mínimo de seguridad', texto: 'Días de reserva de combustible que la política pública de SENER exige mantener para resistir eventualidades climáticas o de suministro.' },
        ],
        claves: [
            'Los combustibles no se pueden almacenar en cualquier sitio: requieren terminales con sistemas avanzados de control de derrames y prevención de incendios.',
            'En las TAR se mezclan los aditivos finales y detergentes antes de cargar los camiones cisterna que van a las gasolineras.',
            'La Política Pública de Almacenamiento Mínimo de Petrolíferos de la SENER (2017, modificada en 2019) pide a comercializadores y distribuidores inventarios mínimos de 5 días de venta promedio de gasolina y diésel, y de 1.5 días de turbosina; el reglamento de la LSH exige acreditarlos (art. 109).',
            'La Agencia Nacional de Seguridad Industrial y de Protección al Medio Ambiente del Sector Hidrocarburos (ASEA) supervisa las medidas de seguridad industrial y protección ambiental en cada terminal.',
        ],
        partes: [
            { nombre: 'Tanques verticales', texto: 'Estructuras de acero de hasta 100,000 barriles de capacidad con techo flotante.' },
            { nombre: 'Dique de contención', texto: 'Muro de concreto alrededor de los tanques capaz de retener el 100 % del líquido en caso de fuga.' },
            { nombre: 'Isleta de llenado de pipas', texto: 'Brazos de carga herméticos con medición fiscal de volumen y temperatura.' },
            { nombre: 'Sistema contra incendios', texto: 'Red de agua y espuma formadora de película acuosa (AFFF) con monitores automáticos.' },
        ],
        ley: {
            texto: 'El almacenamiento de petrolíferos requiere permiso de la Comisión Nacional de Energía (CNE) y autorización en materia de seguridad industrial, operativa y protección ambiental de la ASEA.',
            siglas: ['LSH', 'RLSH', 'LCNE'],
            ficha: {
                elQue: 'Las Terminales de Almacenamiento y Reparto (TAR) resguardan inventarios estratégicos y operativos de gasolinas, diésel y turbosina bajo permiso de la CNE y supervisión técnica y ambiental de la ASEA.',
                elComo: 'El interesado solicita el permiso de almacenamiento ante la CNE (LSH, arts. 76 fr. II y 80), acredita el cumplimiento de inventarios mínimos conforme a la política de SENER (RLSH, art. 109) y registra sus sistemas de administración de seguridad industrial ante la ASEA.',
                articulos: [
                    { siglas: 'LSH', refs: 'Arts. 5 fr. I, 76 fr. II, 80 y 81', nota: 'Permisos de almacenamiento de petrolíferos y atribuciones de CNE y ASEA.' },
                    { siglas: 'RLSH', refs: 'Art. 109 fr. III', nota: 'El comercializador debe acreditar con contratos su inventario y el Almacenamiento mínimo que determine la Secretaría.' },
                ],
            },
        },
        tramites: ['petroliferos'],
        mapa: { texto: 'Ver terminales de almacenamiento en el mapa de permisos', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: '¿Para qué sirve el techo flotante en un tanque de gasolina?', opciones: ['Para evitar que se acumulen vapores inflamables al subir y bajar con el líquido', 'Para que entre luz solar al tanque', 'Solo por estética'], correcta: 0 },
            { pregunta: '¿Qué autoridad mexicana supervisa la seguridad industrial y ambiental de las terminales petroleras?', opciones: ['La ASEA', 'El Servicio Meteorológico Nacional', 'La Secretaría de Hacienda'], correcta: 0 },
            { pregunta: '¿Cuál es el objetivo de la política de almacenamiento mínimo de petrolíferos?', opciones: ['Tener días de reserva para garantizar abasto ante emergencias', 'Aumentar los impuestos', 'Prohibir la venta de diésel'], correcta: 0 },
        ],
        fuentes: [
            LSH,
            LASEA,
            RLSH,
            LCNE,
        ],
        revisado: null,
    },
    {
        id: 'refinacion',
        nivel: 3,
        antes: ['hidrocarburos-moleculas'],
        titulo: 'Refinación: Torre de destilación',
        sector: 'hidrocarburos',
        resumen: 'El petróleo crudo se calienta y entra a una torre donde el vapor sube y se separa por puntos de ebullición en gasolinas, turbosina, diésel, combustóleo y asfalto.',
        figura: 'refinacion',
        definiciones: [
            { termino: 'Destilación fraccionada', texto: 'Proceso físico que separa una mezcla de líquidos aprovechando que cada sustancia hierve y se condensa a una temperatura diferente.' },
            { termino: 'Cortes ligeros e intermedios', texto: 'Fracciones con moléculas de menor peso que hierven a menor temperatura: gas licuado, naftas, gasolinas, turbosina y diésel.' },
            { termino: 'Fondo de barril (Residuo)', texto: 'Fracciones pesadas que no se evaporan en la torre atmosférica. Pasan a la torre de vacío; su residuo va a coquización o se aprovecha como combustóleo y asfalto.' },
            { termino: 'Sistema Nacional de Refinación', texto: 'Conjunto de 7 refinerías en México: Cadereyta, Madero, Minatitlán, Salamanca, Salina Cruz, Tula y Olmeca (Dos Bocas).' },
        ],
        claves: [
            'El petróleo crudo en su estado natural no sirve directamente para motores: contiene miles de hidrocarburos mezclados con azufre, agua y sales.',
            'Primero se desala el crudo y pasa por un horno que lo calienta a cerca de 370 °C.',
            'Al entrar a la torre atmosférica, los hidrocarburos se vaporizan y empiezan a subir a través de charolas o platos perforados.',
            'Conforme suben, la temperatura dentro de la torre baja: los componentes más pesados se condensan primero en los platos inferiores, y los más ligeros llegan hasta arriba.',
            'Las gasolinas crudas pasan a plantas de hidrodesulfuración y reformación para quitarles el azufre y elevar el octanaje (NOM-016-CRE).',
        ],
        partes: [
            { nombre: 'Horno de carga', texto: 'Calentador a fuego directo que lleva el crudo desalado a unos 350–370 °C.' },
            { nombre: 'Zona de vaporización (Flash)', texto: 'Entrada del crudo a la base de la torre fraccionadora.' },
            { nombre: 'Gas y GLP (domo, <40 °C)', texto: 'Lo más ligero sale por el domo como vapor y se separa después de condensar.' },
            { nombre: 'Nafta (≈40–200 °C)', texto: 'Moléculas de 5 a 12 carbonos que salen por el domo y se condensan fuera de la torre; son la base de la gasolina.' },
            { nombre: 'Corte de turbosina y queroseno (medio, ~180-250 °C)', texto: 'Combustible de alta pureza para aviones a reacción.' },
            { nombre: 'Corte de diésel (medio-bajo, ~250-340 °C)', texto: 'Combustible para transporte de carga pesada, autobuses y ferrocarriles.' },
            { nombre: 'Residuo atmosférico (fondo, >350 °C)', texto: 'Líquido espeso que se envía a la torre de vacío o a plantas de coquización.' },
        ],
        ley: {
            texto: 'El tratamiento y la refinación de petróleo requieren permiso de la Secretaría de Energía (LSH, arts. 76 fr. I y 115); el transporte, almacenamiento y expendio de los petrolíferos los permisiona la CNE.',
            siglas: ['LSH', 'RLSH', 'LCNE'],
            ficha: {
                elQue: 'El tratamiento y refinación de petróleo, el procesamiento de gas natural y la importación/exportación de hidrocarburos y petrolíferos son actividades permisionadas directamente por la SENER bajo criterios de soberanía energética (LSH, art. 76 fr. I).',
                elComo: 'La SENER evalúa las solicitudes conforme al Plan de Desarrollo del Sector Hidrocarburos (PLADESHi), mientras que la ASEA regula la seguridad industrial y ambiental y la CNE supervisa las especificaciones de calidad de los petrolíferos.',
                articulos: [
                    { siglas: 'LSH', refs: 'Arts. 76 fr. I, 80, 81, 84 y 115', nota: 'Facultad exclusiva de SENER para permisos de refinación y tratamiento de petróleo.' },
                    { siglas: 'RLSH', refs: 'Art. 336', nota: 'Criterios de eficiencia, seguridad y mejores prácticas en las actividades reguladas.' },
                ],
            },
        },
        tramites: [],
        mapa: { texto: 'Ver refinerías del país en el mapa de permisos', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: '¿En qué principio físico se basa la torre de destilación de una refinería?', opciones: ['En que cada compuesto hierve a una temperatura diferente', 'En la atracción de imanes', 'En la velocidad del viento'], correcta: 0 },
            { pregunta: '¿En qué parte de la torre de destilación se obtienen las gasolinas?', opciones: ['En la parte superior (donde la temperatura es menor)', 'En el fondo caliente', 'En el horno'], correcta: 0 },
            { pregunta: '¿Qué norma oficial mexicana regula la calidad y el octanaje de las gasolinas en México?', opciones: ['NOM-016-CRE', 'NOM-001-SEDE', 'NOM-008-SCFI'], correcta: 0 },
        ],
        fuentes: [
            IEA_OIL,
            LSH,
            RLSH,
            LASEA,
        ],
        revisado: null,
    },
    {
        id: 'asignaciones-hidrocarburos',
        nivel: 4,
        antes: ['hidrocarburos-moleculas', 'gasoductos', 'almacenamiento-tar', 'refinacion'],
        titulo: 'Soberanía, PLADESHi y Asignaciones (Desarrollo Propio vs. Mixto)',
        sector: 'hidrocarburos',
        resumen: 'Cómo se explora y extrae el petróleo y gas de la Nación tras la reforma de 2025: planeación vinculante (PLADESHi), prelación de PEMEX en Desarrollo Propio y nuevas Asignaciones para Desarrollo Mixto (PEMEX ≥ 40 %).',
        figura: 'cadena-hidrocarburos',
        definiciones: [
            { termino: 'Orden de prelación (LSH, art. 11)', texto: 'Regla obligatoria por la cual la SENER privilegia primero las Asignaciones para Desarrollo Propio de PEMEX, en segundo lugar las Asignaciones para Desarrollo Mixto y solo de forma excepcional los Contratos.' },
            { termino: 'Asignación para Desarrollo Propio', texto: 'Título que otorga la SENER a Petróleos Mexicanos para explorar y extraer hidrocarburos con sus propias capacidades; PEMEX solo puede celebrar con particulares contratos de obra o servicios pagaderos en efectivo (LSH, arts. 13 y 17).' },
            { termino: 'Asignación para Desarrollo Mixto', texto: 'Modalidad en que SENER otorga la Asignación a PEMEX (manteniendo la propiedad exclusiva estatal de la Asignación, art. 26) y PEMEX firma un Contrato Mixto con particulares conservando al menos el 40 % de interés de participación (LSH, arts. 24–36).' },
            { termino: 'PLADESHi vinculante', texto: 'Plan de Desarrollo del Sector Hidrocarburos emitido por la SENER (LSH, arts. 7 y 8; LPTE, art. 21) orientado a la autosuficiencia nacional (~1.8 Mbd de crudo), abasto a refinerías y restitución de reservas 3P.' },
        ],
        claves: [
            'Petróleos Mexicanos (PEMEX) opera como Empresa Pública del Estado sectorizada a la SENER, con mandato de soberanía y autosuficiencia energética (LEPE-PEMEX, arts. 2 y 4).',
            'La planeación del sector hidrocarburos tiene carácter vinculante (LSH, art. 8): prioriza el abasto interno para las refinerías nacionales y la petroquímica antes que la exportación indiscriminada.',
            'En las Asignaciones para Desarrollo Propio (1.ª prelación), PEMEX ejecuta directamente la exploración y extracción.',
            'Cuando PEMEX requiere complementar capacidades técnicas, operativas o financieras (por ejemplo, en aguas profundas o campos complejos), solicita a la SENER una Asignación para Desarrollo Mixto (2.ª prelación, LSH, art. 24).',
            'En todo Contrato Mixto derivado de una Asignación para Desarrollo Mixto, PEMEX debe conservar al menos el 40 % de participación (LSH, art. 31), y las Secretarías de Energía y de Hacienda fiscalizan la recuperación de costos (art. 32).',
        ],
        partes: [
            { nombre: 'Subsuelo de la Nación (Reservas 3P)', texto: 'Propiedad directa, inalienable e imprescriptible de la Nación (art. 27 CPEUM); la planeación exige restituir reservas probadas, probables y posibles.' },
            { nombre: 'Asignación de Desarrollo Propio (PEMEX)', texto: 'Primera prelación (LSH, arts. 11 y 13): PEMEX explora y extrae al 100 % y solo contrata servicios en efectivo.' },
            { nombre: 'Asignación de Desarrollo Mixto (PEMEX ≥ 40 %)', texto: 'Segunda prelación (LSH, arts. 24–36): PEMEX conserva la titularidad de la Asignación y al menos 40 % de participación junto a un socio técnico o financiero.' },
            { nombre: 'Rectoría SENER (PLADESHi), CNE y ASEA', texto: 'SENER otorga las Asignaciones y conduce el PLADESHi; CNE regula el midstream/downstream y ASEA supervisa seguridad y medio ambiente.' },
            { nombre: 'Refinación y abasto nacional (~1.8 Mbd)', texto: 'Destino prioritario de la producción nacional de crudo y gas para asegurar la soberanía energética.' },
        ],
        ley: {
            texto: 'La Ley del Sector Hidrocarburos (2025) establece la planeación vinculante mediante el PLADESHi y el orden de prelación para las Asignaciones a Petróleos Mexicanos en sus modalidades de Desarrollo Propio y Desarrollo Mixto.',
            siglas: ['LSH', 'RLSH', 'LPTE', 'LEPE-PEMEX', 'LCNE'],
            ficha: {
                elQue: 'Regula el régimen de exploración y extracción (Upstream) bajo rectoría de la SENER y prevalencia de PEMEX como Empresa Pública del Estado, articulado con la soberanía en refinación y petroquímica.',
                elComo: '1) SENER determina el área y otorga a PEMEX Asignación para Desarrollo Propio (arts. 12–13); 2) Si PEMEX requiere complementar capacidades, su Consejo solicita a SENER autorizar una Asignación para Desarrollo Mixto (arts. 22 y 24); 3) PEMEX licita el Contrato Mixto manteniendo ≥ 40 % de participación (art. 31).',
                articulos: [
                    { siglas: 'LSH', refs: 'Arts. 7, 8, 10, 11, 13, 17 y 24 a 36', nota: 'Planeación vinculante (PLADESHi), prelación de Asignaciones, Desarrollo Propio y Desarrollo Mixto (PEMEX ≥ 40 %).' },
                    { siglas: 'LPTE', refs: 'Arts. 2, 21 fr. V y 23', nota: 'Carácter vinculante del Plan de Desarrollo del Sector Hidrocarburos (PLADESHi).' },
                    { siglas: 'LEPE-PEMEX', refs: 'Arts. 1, 2, 4 y 5', nota: 'Transformación de Petróleos Mexicanos en Empresa Pública del Estado.' },
                ],
            },
        },
        tramites: ['gasnatural', 'petroliferos'],
        mapa: { texto: 'Ver asignaciones, ductos y refinerías en el mapa', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: 'Según el artículo 11 de la Ley del Sector Hidrocarburos, ¿qué modalidad tiene el primer lugar en el orden de prelación?', opciones: ['La Asignación para Desarrollo Propio a PEMEX', 'Los contratos privados libres', 'La importación extranjera'], correcta: 0 },
            { pregunta: 'En los Contratos Mixtos de una Asignación para Desarrollo Mixto, ¿qué porcentaje mínimo de participación debe mantener PEMEX?', opciones: ['No menor al 40 % (art. 31 LSH)', 'El 5 %', 'No tiene mínimo legal'], correcta: 0 },
            { pregunta: '¿Qué instrumento de planeación vinculante emite la SENER para el sector hidrocarburos?', opciones: ['El Plan de Desarrollo del Sector Hidrocarburos (PLADESHi)', 'El Código de Red Eléctrico', 'El reglamento municipal'], correcta: 0 },
        ],
        fuentes: [
            LSH,
            RLSH,
            LPTE,
            LEPE_PEMEX,
            LCNE,
        ],
        revisado: null,
    },
    {
        id: 'mercado-hidrocarburos',
        nivel: 4,
        antes: ['refinacion', 'almacenamiento-tar', 'gasoductos', 'asignaciones-hidrocarburos'],
        titulo: 'Precios, expendio y mercado de combustibles',
        sector: 'hidrocarburos',
        resumen: 'Cómo se forma el precio de un litro de gasolina o diésel en la estación de servicio y cómo se regulan los permisos de expendio ante la CNE y la seguridad ante la ASEA.',
        figura: 'mercado-hidrocarburos',
        definiciones: [
            { termino: 'Precio de paridad de importación', texto: 'Costo que tendría traer el combustible desde el mercado internacional de referencia (la Costa del Golfo de EE. UU. / Houston) hasta México.' },
            { termino: 'IEPS a combustibles', texto: 'Impuesto Especial sobre Producción y Servicios: una cuota fija en pesos por litro que se actualiza cada año. Lo que cambia cada semana es el estímulo fiscal, un porcentaje que la reduce para evitar fluctuaciones bruscas.' },
            { termino: 'Margen de estación de servicio', texto: 'Diferencia entre el precio mayorista que paga la gasolinera y el precio final de venta al automovilista, con el que cubre costos operativos y utilidad.' },
        ],
        claves: [
            'México complementa su refinación nacional con importaciones, por lo que el precio mayorista guarda relación con la referencia internacional de la Costa del Golfo de Estados Unidos.',
            'Un litro de gasolina en la bomba se desglosa aproximadamente en: ~50 % costo de la molécula, ~5–10 % transporte y almacenamiento, ~8–10 % margen comercial y el resto impuestos (IEPS e IVA). Las proporciones cambian cada semana.',
            'Cuando el petróleo sube a nivel mundial, Hacienda aumenta el estímulo al IEPS (cobra menos impuesto) para que el precio en la gasolinera no se dispare. El porcentaje se publica cada semana en el DOF, puede llegar al 100 % y no toca el IVA.',
            'Para abrir y operar una estación de servicio se requiere permiso de expendio al público de la CNE (LSH, arts. 76 fr. II y 80–81), controles volumétricos para trazabilidad contra el mercado ilícito y autorizaciones ambientales y de seguridad operativa ante la ASEA (incluyendo registro en RENAGAS cuando aplica).',
            'Los precios al público se reportan a la CNE y son vigilados por Profeco; desde 2025 opera además la estrategia nacional para estabilizar el precio de la gasolina regular alrededor de 24 pesos por litro.',
        ],
        partes: [
            { nombre: 'Costo de referencia internacional', texto: 'Precio de la gasolina terminada en refinerías de Texas / Louisiana.' },
            { nombre: 'Flete marítimo e internación', texto: 'Traslado en buquetanque hasta puertos como Tuxpan, Coatzacoalcos o Altamira.' },
            { nombre: 'Logística interna (Ducto / Pipa)', texto: 'Tarifas reguladas de transporte y almacenaje en terminales TAR.' },
            { nombre: 'Carga impositiva (IEPS + IVA)', texto: 'Impuestos federales con estímulo contracíclico de la SHCP.' },
            { nombre: 'Precio en dispensario', texto: 'Lo que paga el usuario final por litro en la estación de servicio.' },
        ],
        ley: {
            texto: 'La comercialización y el expendio al público de petrolíferos, gas natural y gas LP requieren permiso de la Comisión Nacional de Energía (CNE), cumplimiento de controles volumétricos y registro de seguridad ante la ASEA.',
            siglas: ['LSH', 'RLSH', 'LCNE'],
            ficha: {
                elQue: 'El expendio al público en estaciones de servicio y bodegas de distribución es el eslabón final (Downstream) regulado por la CNE en permisos y reportes de precios, y por la ASEA en seguridad industrial y ambiental.',
                elComo: 'El solicitante tramita su permiso de expendio ante la CNE (acreditando localización, capacidad, procedencia lícita y balance de mercado conforme al art. 81 LSH), cumple dictámenes técnicos de diseño y operación ante la ASEA y mantiene controles volumétricos vigentes.',
                articulos: [
                    { siglas: 'LSH', refs: 'Arts. 76 fr. II, 80, 81, 82 y 89', nota: 'Permisos de comercialización y expendio al público, evaluación de impacto y causales de revocación por hidrocarburos ilícitos.' },
                    { siglas: 'RLSH', refs: 'Art. 109 y Art. 336', nota: 'Obligaciones de los permisionarios de comercialización y expendio.' },
                    { siglas: 'LCNE', refs: 'Arts. 2 y 7', nota: 'Atribuciones de la CNE para otorgar permisos y supervisar el expendio.' },
                ],
            },
        },
        tramites: ['petroliferos', 'gaslp'],
        mapa: { texto: 'Ver estaciones de servicio y permisos en el mapa', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: '¿Qué mecanismo utiliza el gobierno federal para evitar variaciones bruscas en el precio de la gasolina?', opciones: ['El estímulo fiscal al IEPS', 'Fijar el precio por decreto', 'Prohibir la importación'], correcta: 0 },
            { pregunta: '¿Aproximadamente qué porcentaje del costo de la gasolina corresponde al valor internacional de la molécula?', opciones: ['Alrededor del 45-55 %', 'El 100 %', 'Menos del 5 %'], correcta: 0 },
            { pregunta: '¿Qué mercado internacional de combustibles es la referencia directa para los precios en México?', opciones: ['La Costa del Golfo de EE. UU. (US Gulf Coast)', 'El Mar del Norte (Brent)', 'El Golfo Pérsico'], correcta: 0 },
        ],
        fuentes: [
            LSH,
            RLSH,
            LCNE,
            IEA_OIL,
        ],
        revisado: null,
    },
];

/** Hilo conductor por sector: cómo se conectan los 4 niveles en una sola historia física y regulatoria. */
export const HILO_SECTOR = {
    electricidad: {
        subtitulo: 'Del movimiento de electrones a 60 Hz hasta la Planeación Vinculante (54 % / 46 %) y el despacho del CENACE',
        resumen: 'La electricidad no se almacena a gran escala en los cables: se genera, transforma, transmite y consume en el mismo instante. Sigue los 4 eslabones para ver cómo cada fenómeno físico explica una máquina y una regla de la Ley del Sector Eléctrico.',
        etapas: [
            {
                num: 'I',
                titulo: 'Fenómeno Físico (60 Hz)',
                desc: 'Qué es la corriente, por qué el voltaje la empuja y por qué la red alterna 60 veces por segundo.',
                ids: ['electricidad', 'voltaje', 'cd-ca'],
            },
            {
                num: 'II',
                titulo: 'Máquinas y Conversión',
                desc: 'Cómo el magnetismo mueve motores, genera corriente en turbinas y eleva el voltaje a 400 kV.',
                ids: ['motor', 'generador', 'transformador'],
            },
            {
                num: 'III',
                titulo: 'Centrales de Generación',
                desc: 'Dónde nace la energía a gran escala: paneles solares (CD a CA) y ciclos combinados de gas y vapor.',
                ids: ['fotovoltaica', 'ciclo-combinado'],
            },
            {
                num: 'IV',
                titulo: 'Mercado, Despacho y Ley',
                desc: 'Cómo el CENACE equilibra la red cada segundo (PML) y cómo la SENER, CNE y CFE aplican la regla 54 / 46.',
                ids: ['mercado-cenace', 'planeacion-desarrollo-mixto'],
            },
        ],
    },
    hidrocarburos: {
        subtitulo: 'De las moléculas del subsuelo (Reservas 3P) a las refinerías, los ductos, las TAR y el precio en la gasolinera',
        resumen: 'Todos los hidrocarburos en el subsuelo pertenecen a la Nación (art. 27 CPEUM). Sigue la cadena completa desde el yacimiento hasta el dispensario para entender qué regula SENER, qué permisiona la CNE y cómo interviene Hacienda.',
        etapas: [
            {
                num: 'I',
                titulo: 'Subsuelo y Moléculas',
                desc: 'Qué son los alcanos, cómo se clasifican los crudos (°API) y el gas natural en el yacimiento.',
                ids: ['hidrocarburos'],
            },
            {
                num: 'II',
                titulo: 'Transporte por Ducto',
                desc: 'Cómo viaja el gas a 70 bar por el SISTRANGAS bajo acceso abierto y control del CENAGAS.',
                ids: ['gasoductos'],
            },
            {
                num: 'III',
                titulo: 'Refinación y Almacenaje TAR',
                desc: 'Cómo se destila el crudo a 400 °C en gasolinas/diésel y se resguardan 5 días de reserva estratégica.',
                ids: ['almacenamiento-tar', 'refinacion'],
            },
            {
                num: 'IV',
                titulo: 'Asignaciones y Precio Final',
                desc: 'Prelación de PEMEX (Desarrollo Propio vs. Mixto ≥ 40 %) y cómo el estímulo al IEPS amortigua la gasolina.',
                ids: ['asignaciones-hidrocarburos', 'mercado-hidrocarburos'],
            },
        ],
    },
};

/** Puente narrativo por concepto: eslabón en la cadena, puente Físico -> Jurídico y transición al siguiente paso. */
export const PUENTE_HILO = {
    electricidad: {
        eslabon: 'Eslabón 1 · Fundamento físico del flujo eléctrico',
        fisica: 'Los electrones se mueven casi al instante al cerrar el circuito, pero las redes de transmisión no almacenan electricidad por sí solas.',
        regulacion: 'Por esa instantaneidad física, la LSE declara el suministro como servicio de interés social y exige equilibrio continuo entre generación y demanda a 60 Hz.',
        transicion: 'Ya sabes qué es el flujo de electrones (amperes). El siguiente paso es entender qué fuerza los empuja por los cables y por qué las torres de transmisión usan hasta 400,000 volts.',
    },
    voltaje: {
        eslabon: 'Eslabón 1 · Tensión eléctrica y transporte eficiente',
        fisica: 'Para transportar la misma potencia (P = V × I), elevar el voltaje reduce proporcionalmente la corriente y las pérdidas por calor (I²R) en los cables.',
        regulacion: 'Por eso la regulación clasifica la red en Alta Tensión (RNT), Media y Baja Tensión (RGD), aplicando tarifas y reglas del Código de Red distintas según el nivel de tensión.',
        transicion: 'Ahora que conoces la diferencia entre volts y amperes, veamos las dos formas en que viaja la corriente: continua (baterías y paneles) y alterna (la red nacional a 60 Hz).',
    },
    'cd-ca': {
        eslabon: 'Eslabón 1 · Corriente Continua (CD) vs. Corriente Alterna (CA)',
        fisica: 'Los paneles solares y las baterías operan en Corriente Continua (CD), mientras que las turbinas y la red nacional operan en Corriente Alterna (CA) a 60 Hz.',
        regulacion: 'Cualquier central solar o sistema de baterías (SAEE) necesita inversores electrónicos certificados bajo el Código de Red para sincronizarse a los 60 Hz del SEN.',
        transicion: 'Con las bases de voltaje y corriente alterna listas, entramos a las tres máquinas electromagnéticas que sostienen toda la industria: empezando por el motor eléctrico.',
    },
    motor: {
        eslabon: 'Eslabón 2 · Conversión de electricidad en trabajo mecánico',
        fisica: 'Los motores eléctricos consumen más de la mitad de la electricidad industrial del país al convertir campos magnéticos rotatorios en par mecánico.',
        regulacion: 'Las Normas Oficiales Mexicanas (CONUEE/SENER) exigen eficiencias mínimas en motores y factor de potencia en industrias para no sobrecargar las redes de transmisión.',
        transicion: 'Si un motor usa electricidad para producir giro mecánico, ¿qué pasa si usamos vapor, agua o gas para hacer girar el eje al revés? Obtenemos el generador síncrono.',
    },
    generador: {
        eslabon: 'Eslabón 2 · Generación síncrona e inercia de la red',
        fisica: 'Por la ley de Faraday, el rotor magnético girando a velocidad síncrona induce corriente alterna a 60 Hz y aporta inercia física frente a fallas en la red.',
        regulacion: 'Toda central ≥ 0.7 MW requiere permiso de generación de la CNE (LSE art. 19) y seguir las instrucciones de despacho y control de frecuencia del CENACE.',
        transicion: 'El generador entrega electricidad a media tensión (13.8–24 kV). Para enviarla a cientos de kilómetros sin perderla en calor, necesitamos el transformador de potencia.',
    },
    transformador: {
        eslabon: 'Eslabón 2 · Subestaciones y redes exclusivas del Estado',
        fisica: 'Sin partes móviles, dos bobinas sobre un núcleo de acero laminado elevan el voltaje de la central a 230–400 kV para la transmisión y lo bajan a 127 V para tu hogar.',
        regulacion: 'Las subestaciones enlazan las centrales con la Red Nacional de Transmisión (RNT) y las Redes Generales de Distribución (RGD), áreas estratégicas exclusivas del Estado (art. 27 CPEUM y art. 57 LSE).',
        transicion: 'Ya vimos las piezas electromagnéticas. Ahora entremos a las grandes instalaciones completas de generación: primero una central solar fotovoltaica.',
    },
    fotovoltaica: {
        eslabon: 'Eslabón 3 · Generación renovable variable y distribuida',
        fisica: 'El silicio convierte fotones solares en CD sin combustión, los inversores la pasan a CA y la central inyecta energía limpia durante las horas de radiación solar.',
        regulacion: 'La LSE exime de permiso a la generación distribuida y al autoconsumo < 0.7 MW, ofrece trámite simplificado hasta 20 MW e impulsa baterías (SAEE) para dar firmeza a las renovables.',
        transicion: 'Cuando cae el sol, el país necesita centrales térmicas firmes y flexibles que sostengan la red las 24 horas: así funciona una central de ciclo combinado.',
    },
    'ciclo-combinado': {
        eslabon: 'Eslabón 3 · Generación térmica firme de alta eficiencia',
        fisica: 'Al aprovechar los gases de escape (~600 °C) de la turbina de gas en un recuperador HRSG para mover una segunda turbina de vapor, alcanza eficiencias del 55–62 %.',
        regulacion: 'Es la tecnología vertebral del SEN (> 50 % de la generación nacional) y el modelo principal para los nuevos proyectos de CFE y Esquemas de Desarrollo Mixto del PLADESE.',
        transicion: 'Con millones de kilowatts saliendo de centrales solares, hidroeléctricas y de ciclo combinado, ¿quién decide segundo a segundo qué planta entra y a qué precio? Entramos al Nivel 4: el despacho del CENACE.',
    },
    'mercado-cenace': {
        eslabon: 'Eslabón 4 · Despacho económico y Precio Marginal Local (PML)',
        fisica: 'Cualquier desbalance entre generación y demanda altera los 60 Hz de la red; además, las líneas de transmisión tienen límites térmicos que pueden saturarse (congestión).',
        regulacion: 'El CENACE (LSE arts. 111–124) despacha las centrales por orden de mérito con restricciones de seguridad y calcula el PML nodal (Energía + Pérdidas + Congestión) en el MEM.',
        transicion: 'El CENACE opera las centrales existentes cada segundo, pero ¿quién planea qué nuevas plantas se construyen y cómo se cumple el piso constitucional del 54 % estatal? Cierra la ruta con la arquitectura legal del SEN.',
    },
    'planeacion-desarrollo-mixto': {
        eslabon: 'Eslabón 4 · Rectoría SENER (PLADESE), regla 54/46 y Desarrollo Mixto',
        fisica: 'Expandir centrales y líneas de transmisión toma años de ingeniería; construir sin coordinación satura subestaciones o deja regiones sin confiabilidad eléctrica.',
        regulacion: 'Por eso la Reforma 2025 hace vinculante el PLADESE de SENER, garantiza ≥ 54 % de inyección estatal (CFE) y canaliza la inversión privada en Producción de Largo Plazo (PLP) e Inversión Mixta.',
        transicion: '¡Completaste toda la ruta del Mercado Eléctrico! Puedes explorar ahora la ruta del Mercado de Hidrocarburos o consultar directamente las leyes en el acervo.',
    },
    hidrocarburos: {
        eslabon: 'Eslabón 1 · Química del carbono y reservas del subsuelo',
        fisica: 'El petróleo crudo y el gas natural son mezclas de cadenas de carbono e hidrógeno formadas bajo presión y temperatura; su densidad (°API) y azufre determinan cómo deben procesarse.',
        regulacion: 'El artículo 27 constitucional y la LSH establecen que todos los hidrocarburos en el subsuelo son propiedad inalienable de la Nación y sujetan su extracción al PLADESHi de SENER.',
        transicion: 'Una vez extraídos del yacimiento, el gas natural y los líquidos deben viajar cientos de kilómetros hacia industrias, centrales eléctricas y terminales: veamos cómo opera la red de gasoductos.',
    },
    gasoductos: {
        eslabon: 'Eslabón 2 · Transporte por ducto a alta presión y CENAGAS',
        fisica: 'Para mover grandes volúmenes de gas natural por tuberías de acero enterradas, las estaciones de compresión elevan su presión entre 50 y 100 bar.',
        regulacion: 'Dado que tender ductos paralelos es inviable, la LSH (arts. 76 fr. II y 102–106) exige permiso de la CNE, tarifas reguladas, Acceso Abierto no discriminatorio y seguridad ASEA.',
        transicion: 'Mientras el gas viaja por gasoductos, los combustibles líquidos requieren grandes pulmones de resguardo regional antes de repartirse a las ciudades: conoce las Terminales de Almacenamiento (TAR).',
    },
    'almacenamiento-tar': {
        eslabon: 'Eslabón 3 · Seguridad energética e inventarios estratégicos',
        fisica: 'A diferencia de la electricidad, los petrolíferos líquidos sí pueden almacenarse en tanques atmosféricos de techo flotante o fijo con sistemas contra incendio y recuperación de vapores.',
        regulacion: 'Aprovechando esa capacidad física, la política de almacenamiento y el RLSH (art. 109) obligan a mantener inventarios mínimos estratégicos (p. ej. 5 días de gasolina y diésel) bajo permiso CNE.',
        transicion: '¿Y de dónde salen la gasolina, el diésel y la turbosina que llenan esas terminales TAR? Del proceso industrial de destilación y conversión en una refinería.',
    },
    refinacion: {
        eslabon: 'Eslabón 3 · Transformación industrial del crudo en combustibles',
        fisica: 'El petróleo crudo no puede usarse directo en un motor: debe calentarse a ~400 °C en una torre de destilación atmosférica para separar sus fracciones por punto de ebullición y desulfurarse.',
        regulacion: 'Por su carácter estratégico para la soberanía energética, la refinación y el procesamiento de gas son regulados y permisionados directamente por la SENER (LSH art. 76 fr. I) y vigilados por la ASEA.',
        transicion: 'Ya conoces las instalaciones físicas (pozos, ductos, TAR y refinerías). Ahora veamos en el Nivel 4 quién tiene derecho a extraer el crudo y cómo operan las Asignaciones de PEMEX.',
    },
    'asignaciones-hidrocarburos': {
        eslabon: 'Eslabón 4 · Soberanía del subsuelo y prelación de Asignaciones (LSH 2025)',
        fisica: 'Los yacimientos (reservas 1P, 2P y 3P) son recursos finitos cuya explotación exige inversión intensiva, sísmica avanzada y restitución continua de reservas.',
        regulacion: 'La LSH 2025 privilegia primero la Asignación para Desarrollo Propio (100 % PEMEX) y en segundo lugar el Desarrollo Mixto (donde PEMEX conserva la Asignación y al menos el 40 % de participación, art. 31).',
        transicion: 'Del subsuelo y la refinería llegamos al último eslabón de la cadena: ¿cómo se forma el precio del litro de gasolina en la estación de servicio y cómo funciona el estímulo al IEPS?',
    },
    'mercado-hidrocarburos': {
        eslabon: 'Eslabón 4 · Expendio al público y amortiguador fiscal (IEPS)',
        fisica: 'El combustible recorre refinerías, buquetanques, poliductos, terminales TAR y autotanques antes de despacharse litro por litro en los dispensarios de cada estación.',
        regulacion: 'Cada eslabón suma un costo regulado y se equilibra con el estímulo semanal de Hacienda al IEPS; la estación requiere permiso CNE (art. 80 LSH), controles volumétricos (art. 89) y vigilancia Profeco.',
        transicion: '¡Completaste toda la ruta del Mercado de Hidrocarburos! Puedes explorar ahora la ruta del Mercado Eléctrico o abrir directamente los artículos de la LSH y RLSH.',
    },
};

/** The next concept on the route within the same sector, or null at the end. */
export function siguienteConcepto(id) {
    const current = CONCEPTO[id];
    if (!current) return null;
    const sameSector = CONCEPTOS.filter(c => c.sector === current.sector);
    const i = sameSector.findIndex(c => c.id === id);
    return i >= 0 ? sameSector[i + 1] || null : null;
}

/** The previous concept on the route within the same sector, or null at the start. */
export function anteriorConcepto(id) {
    const current = CONCEPTO[id];
    if (!current) return null;
    const sameSector = CONCEPTOS.filter(c => c.sector === current.sector);
    const i = sameSector.findIndex(c => c.id === id);
    return i > 0 ? sameSector[i - 1] || null : null;
}

export const CONCEPTO = Object.fromEntries(CONCEPTOS.map(item => [item.id, item]));

/** Route of the section: '#como-funciona' (list) or '#como-funciona=<id>' (one explainer). */
export { comoFuncionaRoute } from '../lib/como-funciona-route.js';

