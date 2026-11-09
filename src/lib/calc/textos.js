/**
 * Public copy of the energy calculator: title, foot note and the «Para entender» cards of each tab.
 * Plain Spanish for the general public; every acronym is spelled out the first time in each card;
 * no «error» for official values. Draft until the user approves it (Task 14 of the plan).
 * Facts come from docs/calculadora/informe.md.
 */
import { LEYENDA_MERCADO } from './mercado.js';

export const TITULO = 'Calculadora de energía';
export const SUBTITULO = 'Escribe un número y te decimos cuánto es y qué significa.';
export const NOTA_PIE = 'Cálculo orientativo. No sirve para medir ni facturar.';

// Thousands keep a no-break space so «90 543» never splits across lines.
const nb = s => s.replace(/(\d) (\d)/g, '$1 $2');
const LEYENDA = `${LEYENDA_MERCADO}.`;

// Articles open at #art-<Supabase id>. `ref` is the id in public/data, which the tests check offline;
// the UUIDs were read from `articulos` by law and number on 2026-11-09 and their text matched.
const ARTICULO = {
    'LSE-Art-019': '07b3add5-c54c-401a-8332-1941d39b0b70',
    'LSE-Art-025': 'bf41e0f7-29df-4935-b6db-241e72e0644d',
    'LSE-Art-030': 'edb39cdd-7287-47b2-80ae-cae16548ef6c',
    'LSE-Art-032': '8832fe98-64a2-4d74-940a-6e6588e920c4',
    'LSE-Art-112': 'd97ee72c-d7ad-4e0c-b44e-a2fbc1784f74',
    'LSE-Art-115': 'fc2f1aa7-cd74-43c1-aaaa-a1aa4347fa4c',
    'LSE-Art-143': '743708b1-32e9-4448-9ddc-dec029a054d4',
    'LSE-Art-144': '8a751121-c54b-49e9-ad9a-2219b4ae2025',
    'LSE-Art-145': '265501b0-5347-45ce-9c4d-0ad2e824514b',
    'LSE-Trans-03': 'ca928c82-61cd-435c-baaa-989fc8795670',
    'RLSE-Art-002': 'b305cd86-0ace-4160-bfae-dfca7796cc46',
    'RLSE-Art-191': '3ac19827-1561-4986-9bac-a33770b24274',
    'RLPTE-Art-075': '76ee9daa-cfc6-4ec0-82fd-19d3b189e90f',
};
export const idArticulo = ref => ARTICULO[ref];
const art = (ref, texto) => ({ id: ARTICULO[ref], ref, texto });
const LSE = n => `Ley del Sector Eléctrico, artículo ${n}`;

const tarjeta = (id, titulo, parrafos, { articulos = [], fuente = null, cuenta = null } = {}) => Object.freeze({ id, titulo, parrafos: parrafos.map(nb), articulos, fuente, cuenta });

export const PARA_ENTENDER = Object.freeze({
    electricidad: [
        tarjeta('potencia-energia', 'Potencia y energía', [
            'Los megawatts (MW) dicen qué tan fuerte sale la electricidad en un momento. Los megawatts-hora (MWh) dicen cuánta salió en total. Es como la velocidad de un coche y los kilómetros que recorre.',
            'En 2024 México tenía 90 543 MW instalados y produjo 352 305 GWh. En promedio funcionó a 40 108 MW, el 44 % de lo instalado.',
        ], { fuente: 'pladese' }),
        tarjeta('hora-pico', 'Hora pico, horario punta y horas críticas', [
            'Son tres cosas distintas. La hora pico es cuando el país consume más: sucede, se mide después y no la define la ley. En julio de 2026 fue de unos 54 mil MW.',
            'El horario punta es un periodo fijo en que la electricidad cuesta más en las tarifas GDMTH, DIST y DIT. Lo fija la Comisión Nacional de Energía (CNE) y se conoce todo el año.',
            'Las horas críticas son las 100 horas del año con menos reserva. CENACE las publica al terminar el año y sirven para pagar la Potencia de las centrales.',
            LEYENDA,
        ], { fuente: 'acuerdo-cne-2026', cuenta: 'periodo' }),
        tarjeta('servicios-conexos', 'Servicios conexos', [
            'Son lo que mantiene estable la red además de la energía: reservas que responden en segundos o minutos, control de voltaje y arranque de emergencia.',
            'Las reservas se ofrecen en MW y se pagan en pesos por MWh por cada hora que el MW está listo. Ese precio no se suma al Precio Marginal Local (PML), porque paga estar disponible, no energía entregada. El control de voltaje y el arranque de emergencia van por tarifa regulada.',
            LEYENDA,
        ], { articulos: [art('LSE-Art-115', LSE(115))], fuente: 'bme-2015' }),
        tarjeta('precio-potencia', 'Precio de la Potencia', [
            'La Potencia, con mayúscula, es el compromiso de tener una central lista para cuando se necesite. Se paga en pesos por MW-año. Un MW-año no es energía: es tener un MW comprometido todo el año.',
            'El Precio Neto de 2025 se publicó en 2026, al terminar el año, y CENACE lo recalcula. Por eso conviene citar la versión.',
            LEYENDA,
        ], { articulos: [art('LSE-Art-112', LSE(112)), art('LSE-Trans-03', 'Ley del Sector Eléctrico, transitorio tercero')], fuente: 'cenace-precio-neto-2025', cuenta: 'precio-potencia' }),
        tarjeta('pml', 'Precio Marginal Local (PML)', [
            'Es el precio de la energía en un punto de la red y en una hora. Suma tres partes: la energía, las pérdidas y la congestión.',
            'Por ejemplo, 900 de energía, más 40 de pérdidas, menos 15 de congestión dan 925 pesos por MWh. El ejemplo es ilustrativo: el precio real cambia cada hora y en cada punto.',
            LEYENDA,
        ], { fuente: 'bme-2015' }),
        tarjeta('cel', 'CEL', [
            'Los Certificados de Energías Limpias (CEL) prueban que se produjo energía limpia. Quienes suministran o compran electricidad en el mercado deben cubrir con CEL una parte de su consumo.',
            'Solo hay requisito publicado para 2025 y 2026: 13.9 %. Se genera un CEL por cada MWh limpio; en cogeneración, solo por la parte limpia.',
            LEYENDA,
        ], { articulos: [art('LSE-Art-143', LSE(143)), art('LSE-Art-144', LSE(144)), art('LSE-Art-145', LSE(145)), art('RLSE-Art-191', 'Reglamento de la Ley del Sector Eléctrico, artículo 191')], fuente: 'acuerdo-cel-2026', cuenta: 'cel' }),
        tarjeta('permiso', 'Permiso según MW', [
            'Una central de menos de 0.7 MW es Generadora Exenta y no necesita permiso de generación. Con 0.7 MW o más necesita permiso. De 0.7 a 20 MW en autoconsumo interconectado puede haber trámite simplificado.',
            'Es orientación, no asesoría legal: revisa los artículos y tu caso.',
        ], { articulos: [art('LSE-Art-019', LSE(19)), art('LSE-Art-025', LSE(25)), art('LSE-Art-030', LSE(30)), art('LSE-Art-032', LSE(32)), art('RLSE-Art-002', 'Reglamento de la Ley del Sector Eléctrico, artículo 2')], fuente: 'lse', cuenta: 'permiso' }),
    ],
    petroliferos: [
        tarjeta('barril', 'Qué es un barril', [
            'Un barril de petróleo son 42 galones de Estados Unidos: 158.987 litros. Hoy nadie usa ese recipiente; es una medida para contar petróleo y combustibles.',
            'Para comparar combustibles que tienen distinta energía se usa el barril equivalente.',
        ], { fuente: 'nist-811' }),
        tarjeta('m-y-mm', 'M y MM no son mega', [
            'En petróleo y gas, M quiere decir miles y MM millones: 1 Mbd son mil barriles diarios, no un millón. En las unidades de medida, M es mega, un millón. Leer una por otra cambia el resultado mil veces.',
            'Por eso aquí siempre se escribe completo: miles de barriles diarios (Mbd).',
        ]),
        tarjeta('bep', 'Barril equivalente', [
            'El barril equivalente de petróleo sirve para comparar combustibles por su energía. En la Lista de combustibles de 2026, un barril equivalente tiene 6 347 MJ, la energía de un barril de crudo promedio.',
            'El valor cambia cada año, así que siempre hay que decir de qué año es. Aquí se calcula dividiendo la energía entre 6 347 MJ.',
        ], { articulos: [art('RLPTE-Art-075', 'Reglamento de la Ley de Planeación y Transición Energética, artículo 75')], fuente: 'lista-2026' }),
    ],
    'gas-natural': [
        tarjeta('condicion', 'Condición base y estándar', [
            'Un metro cúbico de gas cambia de tamaño con la presión y la temperatura. Por eso siempre se dice a qué condición está medido.',
            'La NOM-001 define la condición estándar, 15 °C y 101.325 kPa, y la base, 20 °C y 98.07 kPa. Un metro cúbico base son 0.95137 estándar: 5 % de diferencia. Los informes al público van en estándar.',
        ], { fuente: 'nom-001' }),
        tarjeta('poder-calorifico', 'Poder calorífico superior e inferior', [
            'El poder calorífico superior cuenta también el calor del vapor de agua que sale al quemar; el inferior no. En gas natural, el inferior es 10 % menor.',
            'Aquí usamos 38.64 MJ por metro cúbico estándar como superior: es un valor típico, no oficial. La NOM-001 permite de 37.30 a 43.60.',
        ], { fuente: 'eia-gas' }),
        tarjeta('mbtu', 'MBtu significa cosas distintas', [
            'En un documento oficial MBtu quiere decir millón de Btu, y en otro, mil Btu. Por eso aquí se escribe MMBtu para millón.',
            'Un millón de Btu (MMBtu) son 1.055 GJ.',
        ], { fuente: 'nist-811' }),
    ],
    'gas-lp': [
        tarjeta('convencion-054', 'Por qué 0.54 kg/L es convención', [
            'Las tablas de precios del gas LP pasan de kilos a litros con 0.54 kg por litro. No encontramos un documento que fije ese número.',
            'La densidad real depende de la mezcla y de la temperatura: 100 litros a 30 °C pesan de 50 a 52 kilos, no 54. Por eso puedes ajustar mezcla y temperatura.',
        ], { fuente: 'cne-precios-lp' }),
        tarjeta('litros-agua', 'Litros de agua y litros de gas', [
            'Un tanque «de 300 litros» mide su tamaño en litros de agua. Se llena al 85 %, así que carga 255 litros de gas, unos 138 kilos.',
            'Un cilindro de 20 kg trae 20 kilos de gas, unos 37 litros.',
        ], { fuente: 'nom-009' }),
        tarjeta('vapor', '1 litro líquido en vapor', [
            'El gas LP viaja líquido y se quema como vapor. Un litro líquido da unos 250 litros de vapor al nivel del mar, y más en lugares altos.',
            'El famoso «1 a 270» es para propano casi puro.',
        ], { fuente: 'nist-webbook' }),
    ],
    otras: [
        tarjeta('kw-h', 'kW/h no es kWh', [
            'Un kilowatt-hora (kWh) es energía: un kilowatt durante una hora. «kW/h» serían kilowatts entre horas, algo que casi nunca se quiere decir.',
            'Para energía se escribe kWh.',
        ], { fuente: 'nist-811' }),
        tarjeta('billon', '«Billón» en español y en inglés', [
            'En español, un billón es un millón de millones. En inglés, billion es mil millones.',
            'Para no confundir, la NOM-008 pide no usar billón ni trillón. Aquí se escribe «mil millones» o «millones de millones».',
        ], { fuente: 'nom-008' }),
        tarjeta('kg-cm2', 'kg/cm² no es bar', [
            'Un kilogramo fuerza por centímetro cuadrado son 98.07 kPa; un bar son 100 kPa. Se parecen, pero difieren casi 2 %.',
            'En México muchos manómetros dicen kg/cm².',
        ], { fuente: 'nist-811' }),
        tarjeta('m-mm-mega', 'M, MM y mega', [
            'En el sector, M son miles y MM millones: 1 MMpc es un millón de pies cúbicos. En las unidades de medida, M es mega: 1 MW es un millón de watts.',
            'Aquí nunca se escribe M sola.',
        ]),
    ],
});
