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
    { id: 4, titulo: 'Mercados y Operación', texto: 'Cómo se despacha la energía, quién fija los precios y cómo operan CENACE y CENAGAS.' },
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
            texto: 'La generación de electricidad está regulada por la Ley del Sector Eléctrico y su reglamento. La Comisión Nacional de Energía (CNE) otorga los permisos de generación.',
            siglas: ['LSE', 'LCNE'],
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
            texto: 'Las líneas de transmisión y distribución, con sus subestaciones y transformadores, forman parte del Sistema Eléctrico Nacional, que regulan la Ley del Sector Eléctrico y su reglamento.',
            siglas: ['LSE', 'RLSE'],
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
    {
        id: 'ciclo-combinado',
        nivel: 3,
        antes: ['generador', 'transformador'],
        titulo: 'Central de ciclo combinado',
        sector: 'electricidad',
        resumen: 'La tecnología más eficiente para generar con gas natural: quema gas en una turbina de combustión y aprovecha los gases calientes para producir vapor y mover una segunda turbina.',
        figura: 'generador',
        definiciones: [
            { termino: 'Ciclo combinado', texto: 'Combinación de dos ciclos termodinámicos: un ciclo Brayton (turbina de gas) y un ciclo Rankine (turbina de vapor), logrando eficiencias superiores al 55 % o 60 %.' },
            { termino: 'HRSG (Generador de vapor)', texto: 'Caldera de recuperación de calor que aprovecha los gases de escape calientes de la turbina de gas para generar vapor a alta presión.' },
            { termino: 'Generación firme', texto: 'Electricidad constante y predecible que puede despacharse en cualquier momento para respaldar la estabilidad del sistema.' },
        ],
        claves: [
            'El gas natural se mezcla con aire y se quema para mover una turbina de gas a alta temperatura.',
            'Los gases de escape salen a más de 500 °C. En lugar de desperdiciarlos, pasan por un recuperador de calor (HRSG) que calienta agua hasta convertirla en vapor.',
            'Ese vapor impulsa una segunda turbina (de vapor), produciendo electricidad adicional con el mismo combustible.',
            'Aportan más del 50 % de la electricidad que consume México y son el principal soporte de estabilidad de la red.',
            'Su combustible principal es el gas natural, que llega por gasoductos coordinados por el CENAGAS.',
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
            texto: 'Las centrales de ciclo combinado requieren permisos de generación otorgados por la Comisión Nacional de Energía (CNE) y deben coordinar su interconexión y despacho con el CENACE.',
            siglas: ['LSE', 'RLSE', 'LCNE'],
        },
        tramites: ['generacion'],
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
        titulo: 'CENACE y el despacho eléctrico',
        sector: 'electricidad',
        resumen: 'La electricidad debe producirse en el mismo instante en que se consume. El CENACE ordena a las centrales encenderse de menor a mayor costo para garantizar abasto al precio más eficiente.',
        figura: 'cd-ca',
        definiciones: [
            { termino: 'CENACE', texto: 'Centro Nacional de Control de Energía: organismo público descentralizado que opera el Sistema Eléctrico Nacional y administra el Mercado Eléctrico Mayorista.' },
            { termino: 'Orden de mérito económico', texto: 'Regla de despacho que enciende primero las centrales de menor costo variable (solar, eólica, hidro) y luego las de mayor costo (gas, diésel).' },
            { termino: 'Precio Marginal Local (PML)', unidad: '$/MWh', texto: 'Costo de suministrar el siguiente megawatt-hora en un nodo de la red. Se compone de: Costo de Energía + Pérdidas de Transmisión + Congestión en Líneas.' },
            { termino: 'Mercado del Día en Adelanto (MDA)', texto: 'Mercado donde se programan las compras y ventas de energía para las 24 horas del día siguiente.' },
        ],
        claves: [
            'En una red eléctrica no hay grandes bodegas de electricidad: lo que los focos y fábricas consumen cada segundo debe inyectarse en ese mismo instante en las centrales.',
            'Si la frecuencia baja de 60 Hz, el CENACE pide más energía; si sube, pide reducir generación.',
            'En el despacho económico, las energías renovables entran primero porque su costo variable de combustible es cero ($0/MWh).',
            'La última central que entra para satisfacer el consumo fija el precio marginal que reciben todas las generadoras despachadas en ese nodo.',
            'Cuando una línea de transmisión se congestiona (se satura), el CENACE tiene que encender una central local más cara, aumentando el PML en esa zona.',
        ],
        partes: [
            { nombre: 'Consumo nacional (Demanda)', texto: 'Millones de hogares, comercios e industrias prendiendo aparatos a la vez.' },
            { nombre: 'Despacho base (Renovables e Hidro)', texto: 'Costo marginal mínimo: entran primero en el orden de mérito.' },
            { nombre: 'Despacho intermedio (Ciclo combinado)', texto: 'Generación flexible que sigue las variaciones de la curva de demanda.' },
            { nombre: 'Pico y reserva (Turbogás)', texto: 'Plantas rápidas de encender para los momentos de máxima demanda del día.' },
            { nombre: 'Fijación de PML', texto: 'La última unidad requerida determina el precio marginal en el nodo.' },
        ],
        ley: {
            texto: 'La Ley del Sector Eléctrico establece que el control operativo del Sistema Eléctrico Nacional corresponde exclusivamente al CENACE con base en principios de eficiencia y confiabilidad.',
            siglas: ['LSE', 'RLSE'],
        },
        tramites: [],
        mapa: { texto: 'Ver regiones del sistema eléctrico en el mapa', hash: '#mapa-permisos' },
        preguntas: [
            { pregunta: '¿Qué central fija el Precio Marginal Local (PML)?', opciones: ['La última central necesaria para cubrir la demanda', 'La central más barata del país', 'El promedio de todas las centrales'], correcta: 0 },
            { pregunta: '¿Cuáles son los 3 componentes del Precio Marginal Local?', opciones: ['Energía, pérdidas de transmisión y congestión', 'Voltaje, corriente y resistencia', 'IVA, ISR e IEPS'], correcta: 0 },
            { pregunta: '¿Quién opera de manera independiente el Sistema Eléctrico Nacional en México?', opciones: ['El CENACE', 'Cada municipio', 'Las empresas privadas'], correcta: 0 },
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
            texto: 'La nación tiene el dominio directo, inalienable e imprescriptible de todos los hidrocarburos en el subsuelo conforme al artículo 27 constitucional y la Ley del Sector Hidrocarburos.',
            siglas: ['LSH', 'RLSH', 'LCNE'],
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
            { termino: 'Acceso abierto no discriminatorio', texto: 'Obligación legal de los dueños de ductos de permitir el transporte a cualquier tercero que pague la tarifa regulada, si existe capacidad disponible.' },
        ],
        claves: [
            'El transporte por ducto es la forma más segura, económica y con menor huella de carbono para mover grandes volúmenes de energía en distancias continentales.',
            'El gas natural no tiene olor por naturaleza: antes de distribuirse a los hogares se le agrega una sustancia química llamada mercaptano para que cualquier fuga se detecte al instante.',
            'México cuenta con el SISTRANGAS (Sistema de Transporte y Almacenamiento Nacional Integrado de Gas Natural), coordinado técnicamente por el CENAGAS.',
            'Gran parte del gas que consume México para generar electricidad y en la industria proviene de importaciones por gasoducto desde Texas (cuenca Pérmica), con precios referidos a índices como Waha y Henry Hub.',
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
            texto: 'El servicio de transporte por ducto requiere permiso de la Comisión Nacional de Energía (CNE). La gestión independiente del SISTRANGAS corresponde al CENAGAS.',
            siglas: ['LSH', 'RLSH', 'LCNE'],
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
            texto: 'El almacenamiento de petrolíferos requiere permiso de la Comisión Nacional de Energía y autorización de impacto ambiental y seguridad operativa de la ASEA.',
            siglas: ['LSH', 'RLSH', 'LCNE'],
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
            texto: 'La refinación de petróleo requiere permiso de la Secretaría de Energía (LSH, arts. 76 y 115); el transporte, almacenamiento y expendio de los petrolíferos que produce los permisiona la Comisión Nacional de Energía. Los combustibles deben cumplir la norma de calidad NOM-016-CRE.',
            siglas: ['LSH', 'RLSH', 'LCNE'],
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
        id: 'mercado-hidrocarburos',
        nivel: 4,
        antes: ['refinacion', 'almacenamiento-tar', 'gasoductos'],
        titulo: 'Precios y mercado de combustibles',
        sector: 'hidrocarburos',
        resumen: 'Cómo se forma el precio de un litro de gasolina o diésel en la estación de servicio: costo internacional de la molécula, logística, impuestos (IEPS e IVA) y margen comercial.',
        figura: 'mercado-hidrocarburos',
        definiciones: [
            { termino: 'Precio de paridad de importación', texto: 'Costo que tendría traer el combustible desde el mercado internacional de referencia (la Costa del Golfo de EE. UU. / Houston) hasta México.' },
            { termino: 'IEPS a combustibles', texto: 'Impuesto Especial sobre Producción y Servicios: una cuota fija en pesos por litro que se actualiza cada año. Lo que cambia cada semana es el estímulo fiscal, un porcentaje que la reduce para evitar fluctuaciones bruscas.' },
            { termino: 'Margen de estación de servicio', texto: 'Diferencia entre el precio mayorista que paga la gasolinera y el precio final de venta al automovilista, con el que cubre costos operativos y utilidad.' },
        ],
        claves: [
            'México consume más gasolinas de las que refina internamente, por lo que el precio nacional está ligado al mercado internacional de la Costa del Golfo de Estados Unidos.',
            'Un litro de gasolina en la bomba se desglosa aproximadamente en: ~50 % costo de la molécula, ~5–10 % transporte y almacenamiento, ~8–10 % margen comercial y el resto impuestos (IEPS e IVA). Las proporciones cambian cada semana.',
            'Cuando el petróleo sube a nivel mundial, Hacienda aumenta el estímulo al IEPS (cobra menos impuesto) para que el precio en la gasolinera no se dispare. El porcentaje se publica cada semana en el DOF, puede llegar al 100 % y no toca el IVA.',
            'En gas natural, los usuarios industriales contratan suministro a precios basados en índices como Henry Hub o Houston Ship Channel más la tarifa de transporte de CENAGAS.',
            'Los precios al público son libres desde 2017–2018: la Comisión Nacional de Energía otorga los permisos y recibe información de los permisionarios, y Profeco vigila los precios en las estaciones. Desde 2025 existe un acuerdo voluntario para mantener la gasolina regular cerca de 24 pesos por litro.',
        ],
        partes: [
            { nombre: 'Costo de referencia internacional', texto: 'Precio de la gasolina terminada en refinerías de Texas / Louisiana.' },
            { nombre: 'Flete marítimo e internación', texto: 'Traslado en buquetanque hasta puertos como Tuxpan, Coatzacoalcos o Altamira.' },
            { nombre: 'Logística interna (Ducto / Pipa)', texto: 'Tarifas reguladas de transporte y almacenaje en terminales TAR.' },
            { nombre: 'Carga impositiva (IEPS + IVA)', texto: 'Impuestos federales con estímulo contracíclico de la SHCP.' },
            { nombre: 'Precio en dispensario', texto: 'Lo que paga el usuario final por litro en la estación de servicio.' },
        ],
        ley: {
            texto: 'La comercialización y el expendio al público de petrolíferos requieren permiso de la Comisión Nacional de Energía (CNE) y deben reportar sus precios vigentes al público.',
            siglas: ['LSH', 'RLSH', 'LCNE'],
        },
        tramites: ['petroliferos'],
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

/** The next concept on the route within the same sector, or null at the end. */
export function siguienteConcepto(id) {
    const current = CONCEPTO[id];
    if (!current) return null;
    const sameSector = CONCEPTOS.filter(c => c.sector === current.sector);
    const i = sameSector.findIndex(c => c.id === id);
    return i >= 0 ? sameSector[i + 1] || null : null;
}

export const CONCEPTO = Object.fromEntries(CONCEPTOS.map(item => [item.id, item]));

/** Route of the section: '#como-funciona' (list) or '#como-funciona=<id>' (one explainer). */
export function comoFuncionaRoute(hash = '') {
    if (hash === '#como-funciona') return { id: null };
    const match = /^#como-funciona=([a-z0-9-]+)$/.exec(hash);
    return match ? { id: match[1] } : null;
}
