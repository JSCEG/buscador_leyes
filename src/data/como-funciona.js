/**
 * "¿Cómo funciona?": plain-language explainers of energy installations, each built around an
 * interactive isometric figure (scripts/conceptos/*.mjs → public/conceptos/*.html).
 *
 * Content rules (agreed with the site owner, who reviews every entry before it is marked reviewed):
 * - only claims backed by the cited public sources; general, conservative explanations;
 * - "Qué dice la ley" links to the acervo and names the authority, without paraphrasing obligations;
 * - `revisado` stays null until the owner approves the text; the page then shows the date.
 */
/** The learning route: from the basic ideas up to whole power plants. */
export const NIVELES = [
    { id: 1, titulo: 'Lo básico', texto: 'Las ideas que se usan en todo lo demás.' },
    { id: 2, titulo: 'La red eléctrica', texto: 'Cómo viaja la electricidad de la central a tu casa.' },
    { id: 3, titulo: 'Las centrales', texto: 'Cómo produce electricidad cada tipo de central.' },
];

// References shared by several concepts.
const consulta = '13 de octubre de 2026';
const openstax = (seccion, titulo, slug) => ({ autor: 'Urone, P. P. y Hinrichs, R.', fecha: '2022', titulo: `College Physics 2e, sección ${seccion}: ${titulo}`, editorial: 'OpenStax', url: `https://openstax.org/books/college-physics-2e/pages/${slug}`, consulta });
const LSE = { autor: 'Ley del Sector Eléctrico', titulo: 'Diario Oficial de la Federación', fecha: '18 de marzo de 2025', acervo: 'LSE' };
const LCNE = { autor: 'Ley de la Comisión Nacional de Energía', titulo: 'Diario Oficial de la Federación', fecha: '18 de marzo de 2025', acervo: 'LCNE' };

export const CONCEPTOS = [
    {
        id: 'voltaje',
        nivel: 1,
        titulo: 'Voltaje, corriente y potencia',
        sector: 'electricidad',
        resumen: 'Las tres palabras que más se oyen al hablar de electricidad: el voltaje empuja, la corriente fluye y la potencia dice cuánta energía se usa cada segundo.',
        figura: 'voltaje',
        claves: [
            'El voltaje es el empuje que hace moverse a la electricidad. Se mide en volts (V).',
            'La corriente es cuánta electricidad pasa por el cable. Se mide en amperes (A).',
            'La potencia es cuánta energía se usa o se produce cada segundo. Se mide en watts (W): watts = volts × amperes.',
            'Con más voltaje pasa más corriente por el mismo foco: en un foco sencillo como el de la figura, la corriente es el voltaje entre su resistencia (ley de Ohm).',
            'Las centrales eléctricas se describen por su potencia: un megawatt (MW) es un millón de watts.',
        ],
        partes: [
            { nombre: 'Fuente de poder', texto: 'Da el voltaje; con la perilla se sube o se baja.' },
            { nombre: 'Voltímetro (V)', texto: 'Mide el voltaje, en volts.' },
            { nombre: 'Amperímetro (A)', texto: 'Mide la corriente, en amperes.' },
            { nombre: 'Perilla de voltaje', texto: 'Cambia el empuje que da la fuente.' },
            { nombre: 'Cables', texto: 'Cierran el circuito: la electricidad sale por uno y regresa por el otro.' },
            { nombre: 'Foco', texto: 'Convierte la energía eléctrica en luz y calor; brilla más con más potencia.' },
        ],
        tramites: [],
        preguntas: [
            { pregunta: '¿En qué unidad se mide la potencia?', opciones: ['En watts (W)', 'En volts (V)', 'En amperes (A)'], correcta: 0 },
            { pregunta: 'Si un foco recibe 12 volts y pasan 2 amperes, ¿cuánta potencia usa?', opciones: ['24 watts', '6 watts', '14 watts'], correcta: 0 },
            { pregunta: '¿Qué pasa con la corriente en el foco si subes el voltaje?', opciones: ['Aumenta', 'Disminuye', 'No cambia'], correcta: 0 },
        ],
        fuentes: [
            { autor: 'Bureau International des Poids et Mesures', fecha: '2019', titulo: 'The International System of Units (SI), 9.ª edición', url: 'https://www.bipm.org/en/publications/si-brochure', consulta },
            openstax('20.2', "Ohm's Law: Resistance and Simple Circuits", '20-2-ohms-law-resistance-and-simple-circuits'),
            openstax('20.4', 'Electric Power and Energy', '20-4-electric-power-and-energy'),
        ],
        revisado: null,
    },
    {
        id: 'cd-ca',
        nivel: 1,
        antes: ['voltaje'],
        titulo: 'Corriente directa y corriente alterna',
        sector: 'electricidad',
        resumen: 'Una pila da corriente directa, que siempre va en el mismo sentido. El contacto de tu casa da corriente alterna, que cambia de sentido muchas veces por segundo.',
        figura: 'cd-ca',
        claves: [
            'En la corriente directa la electricidad fluye siempre en un solo sentido. La dan las pilas, las baterías y los paneles solares.',
            'En la corriente alterna la electricidad cambia de sentido una y otra vez. Es la que llega por la red a las casas y las fábricas.',
            'En México la corriente alterna completa 60 ciclos por segundo: su frecuencia es de 60 hertz (Hz).',
            'Un osciloscopio dibuja el voltaje en el tiempo: la directa se ve como una línea plana; la alterna, como una ola.',
            'La red usa corriente alterna porque con un transformador es fácil subirle o bajarle el voltaje.',
        ],
        partes: [
            { nombre: 'Pila (corriente directa)', texto: 'Da un voltaje fijo, siempre en el mismo sentido.' },
            { nombre: 'Contacto (corriente alterna)', texto: 'Da un voltaje que sube, baja y cambia de sentido.' },
            { nombre: 'Osciloscopio', texto: 'Instrumento que dibuja cómo cambia el voltaje con el tiempo.' },
            { nombre: 'Pantalla', texto: 'Muestra el voltaje (de arriba abajo) contra el tiempo (de izquierda a derecha).' },
            { nombre: 'Cable de medición', texto: 'Conecta el osciloscopio a la pila o al contacto.' },
        ],
        tramites: [],
        preguntas: [
            { pregunta: '¿Qué tipo de corriente da una pila?', opciones: ['Directa', 'Alterna', 'Las dos'], correcta: 0 },
            { pregunta: '¿Cómo se ve la corriente alterna en un osciloscopio?', opciones: ['Como una ola que sube y baja', 'Como una línea plana', 'Como puntos sueltos'], correcta: 0 },
            { pregunta: '¿Por qué la red eléctrica usa corriente alterna?', opciones: ['Porque con un transformador es fácil cambiarle el voltaje', 'Porque se guarda más fácil en pilas', 'Porque no necesita cables'], correcta: 0 },
        ],
        fuentes: [
            openstax('20.5', 'Alternating Current versus Direct Current', '20-5-alternating-current-versus-direct-current'),
            { autor: 'Lantero, A.', fecha: '18 de noviembre de 2014', titulo: 'The War of the Currents: AC vs. DC Power', editorial: 'U.S. Department of Energy', url: 'https://www.energy.gov/articles/war-currents-ac-vs-dc-power', consulta },
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
        claves: [
            'Cuando pasa corriente por una bobina de cobre enrollada en hierro, la bobina se vuelve un imán: un electroimán. Si la corriente cambia de sentido, sus polos norte y sur se invierten.',
            'En el eje del motor hay un imán (el rotor). Su polo norte es jalado por el polo sur de las bobinas y empujado por su polo norte, y así gira.',
            'Para que siga girando, la corriente de las bobinas tiene que invertirse cada media vuelta.',
            'Con corriente directa, eso lo hace un control electrónico o, en motores sencillos, unas escobillas que rozan el eje.',
            'Con corriente alterna, la corriente se invierte sola. Un motor síncrono gira al ritmo de la red; los motores de alterna más comunes son de inducción: su rotor no lleva imán y la corriente aparece en él por inducción.',
            'Un motor es un generador al revés: uno convierte electricidad en movimiento y el otro, movimiento en electricidad.',
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
        claves: [
            'Cuando un imán se mueve cerca de una bobina de cobre, aparece una corriente eléctrica en la bobina. Es la inducción electromagnética, que descubrió Michael Faraday en 1831.',
            'En un generador, la parte que gira (rotor) es un imán y las bobinas quietas que lo rodean forman el estator.',
            'En cada vuelta el imán cambia de posición frente a las bobinas y la corriente cambia de sentido: el generador produce corriente alterna.',
            'Entre más rápido gira, más voltaje produce y más alta es la frecuencia.',
            'Una turbina hace girar el eje. La mueve el agua en una hidroeléctrica, el viento en una eólica o el vapor en una central de combustibles o nuclear.',
        ],
        partes: [
            { nombre: 'Turbina', texto: 'Rueda que el agua, el viento o el vapor hacen girar.' },
            { nombre: 'Eje', texto: 'Transmite el giro de la turbina al imán.' },
            { nombre: 'Imán que gira (rotor)', texto: 'Su campo magnético pasa por las bobinas en cada vuelta.' },
            { nombre: 'Bobinas de cobre (estator)', texto: 'Alambre enrollado donde aparece la corriente.' },
            { nombre: 'Voltímetro', texto: 'Su aguja va y viene: muestra que la corriente es alterna.' },
            { nombre: 'Foco', texto: 'Brilla más cuanto más rápido gira el generador.' },
        ],
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
            { autor: 'U.S. Energy Information Administration', fecha: '31 de octubre de 2023', titulo: 'How electricity is generated', url: 'https://www.eia.gov/energyexplained/electricity/how-electricity-is-generated.php', consulta },
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
        claves: [
            'Un transformador tiene dos bobinas de cobre enrolladas en un mismo núcleo de hierro.',
            'La corriente alterna de una bobina magnetiza el núcleo, y el núcleo induce corriente en la otra bobina. Por eso solo funciona con corriente alterna.',
            'El voltaje cambia en la misma proporción que el número de vueltas: la bobina con más vueltas tiene más voltaje.',
            'La potencia que entra es casi igual a la que sale. Si el voltaje sube, la corriente baja en la misma proporción.',
            'Con menos corriente se pierde menos energía en los cables. Por eso las centrales elevan el voltaje para enviar la energía lejos, y cerca de las casas otro transformador lo baja para usarla con seguridad.',
        ],
        partes: [
            { nombre: 'Núcleo de hierro', texto: 'Lleva el magnetismo de una bobina a la otra.' },
            { nombre: 'Bobina de pocas vueltas', texto: 'Lado de bajo voltaje y mucha corriente.' },
            { nombre: 'Bobina de muchas vueltas', texto: 'Lado de alto voltaje y poca corriente.' },
            { nombre: 'Lado de bajo voltaje', texto: 'Aquí se conecta, por ejemplo, el generador de una central.' },
            { nombre: 'Lado de alto voltaje', texto: 'Aquí se conecta la línea de transmisión.' },
        ],
        ley: {
            texto: 'Las líneas de transmisión y distribución, con sus subestaciones y transformadores, forman parte del Sistema Eléctrico Nacional, que regula la Ley del Sector Eléctrico.',
            siglas: ['LSE'],
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
            { autor: 'U.S. Energy Information Administration', fecha: 's. f.', titulo: 'Delivery to consumers', url: 'https://www.eia.gov/energyexplained/electricity/delivery-to-consumers.php', consulta },
            { autor: 'U.S. Energy Information Administration', fecha: 's. f.', titulo: 'Batteries, circuits, and transformers', url: 'https://www.eia.gov/energyexplained/electricity/batteries-circuits-and-transformers.php', consulta },
            LSE,
        ],
        revisado: null,
    },
    {
        id: 'fotovoltaica',
        nivel: 3,
        antes: ['cd-ca', 'transformador'],
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

/** The next concept on the route, or null at the end. */
export function siguienteConcepto(id) {
    const i = CONCEPTOS.findIndex(c => c.id === id);
    return i >= 0 ? CONCEPTOS[i + 1] || null : null;
}

export const CONCEPTO = Object.fromEntries(CONCEPTOS.map(item => [item.id, item]));

/** Route of the section: '#como-funciona' (list) or '#como-funciona=<id>' (one explainer). */
export function comoFuncionaRoute(hash = '') {
    if (hash === '#como-funciona') return { id: null };
    const match = /^#como-funciona=([a-z0-9-]+)$/.exec(hash);
    return match ? { id: match[1] } : null;
}
