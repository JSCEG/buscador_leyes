/**
 * «Otras cuentas»: small calculations that open in place inside each tab, plus the ones that live in
 * a «Para entender» card (paraEntender: true). This file only wires fields to formulas: every formula
 * lives in energeticos, ajustes, electricidad or mercado.
 * calcularCuenta(id, valores) reads numbers with leerNumero; a missing field takes its default, an
 * explicit '' counts as empty.
 */
import { BARRIL_L, ENERGETICOS, GAS, cadena, co2Kg, gnl } from './energeticos.js';
import { CIUDADES, RANGO_ALTITUD, RANGO_T_LIQUIDOS, corregirGas, densidadDeApi, factorQuemador, factorTemperatura, gravedadDeApi } from './ajustes.js';
import { FACTOR_PLANTA, FACTOR_SEN, NOMBRES_TECNOLOGIA, SITIOS_SOLARES, compensacion, corrienteTrifasica, energiaMWh, hidro, sae, solar, spq, viento } from './electricidad.js';
import { LEYENDA_MERCADO, PRECIO_NETO_2025, REQUISITO_CEL, SISTEMAS, celGenerados, celRequeridos, figuraPermiso, kwMes, pagoPotencia, periodoGDMTH } from './mercado.js';
import { FUENTES } from './fuentes.js';
import { formatoClase, leerNumero } from './formato.js';

const MENSAJE_NUMERO = 'Escribe un número, como 1 234.5';
const MJ_POR_MMBTU = 1055.05585262;
const KPA_POR_KGF_CM2 = 98.0665;

// ── Fields ───────────────────────────────────────────────────────────────────
const num = (id, etiqueta, porDefecto, unidad, opciones = {}) => ({ id, etiqueta, tipo: 'numero', porDefecto, unidad, obligatorio: true, positivo: false, negativo: false, max: null, sugerencia: null, opciones: null, ...opciones });
// A temperature in °C: negative is fine, absolute zero or below is not.
const temperatura = (id, etiqueta, porDefecto) => num(id, etiqueta, porDefecto, '°C', { negativo: true, sobreCeroAbsoluto: true });
const opc = (id, etiqueta, opciones, porDefecto) => ({ id, etiqueta, tipo: 'opcion', porDefecto, opciones, obligatorio: true });
const casilla = (id, etiqueta, porDefecto = false) => ({ id, etiqueta, tipo: 'casilla', porDefecto, obligatorio: false });
const fecha = (id, etiqueta) => ({ id, etiqueta, tipo: 'fecha', porDefecto: null, obligatorio: true });
const hora = (id, etiqueta) => ({ id, etiqueta, tipo: 'hora', porDefecto: null, obligatorio: true });

const TECNOLOGIAS = Object.keys(FACTOR_PLANTA).map(id => ({ id, nombre: NOMBRES_TECNOLOGIA[id] }));
const SITIOS = SITIOS_SOLARES.map(({ id, nombre }) => ({ id, nombre }));
const OPC_SISTEMAS = Object.entries(SISTEMAS).map(([id, nombre]) => ({ id, nombre }));
const LIQUIDOS = ['gasolina', 'diesel', 'turbosina', 'combustoleo', 'maya', 'istmo', 'olmeca'].map(id => ({ id, nombre: ENERGETICOS[id].nombre }));

// ── Lines ───────────────────────────────────────────────────────────────────
const EX = { clase: 'exacto', fuente: 'nist-811', anio: null };
// `decimales` fixes the precision of lines that are compared with each other, so they add up on screen.
const linea = (id, texto, valor, unidad, proc = EX, extra = {}) => ({ id, texto, valor, unidad, clase: proc.clase, fuente: proc.fuente, anio: proc.anio ?? null, ...extra });
const textoSolo = (id, texto, proc = EX) => ({ id, texto, valor: null, unidad: null, clase: proc.clase, fuente: proc.fuente, anio: proc.anio ?? null });

const PROC = {
    pladese: { clase: 'tipico', fuente: 'pladese', anio: 2024 },
    solar: { clase: 'tipico', fuente: 'global-solar-atlas', anio: 2026 },
    sen: { clase: 'oficial', fuente: FACTOR_SEN.fuente, anio: FACTOR_SEN.anio },
    potencia: { clase: 'oficial', fuente: PRECIO_NETO_2025.fuente, anio: 2026 },
    cel: { clase: 'oficial', fuente: 'acuerdo-cel-2026', anio: 2026 },
    lse: { clase: 'oficial', fuente: 'lse', anio: 2025 },
    tarifa: { clase: 'oficial', fuente: 'acuerdo-cne-2026', anio: 2026 },
    lista: { clase: 'oficial', fuente: 'lista-2026', anio: 2026 },
    ipcc: { clase: 'tipico', fuente: 'ipcc-2006', anio: 2006 },
    vcf: { clase: 'tipico', fuente: 'vcf', anio: 2026 },
    api: { clase: 'exacto', fuente: 'anexo-21', anio: 2026 },
    atmosfera: { clase: 'tipico', fuente: 'nws-altitud', anio: 2026 },
    gpsa: { clase: 'tipico', fuente: 'gpsa', anio: 2026 },
    gas: { clase: 'tipico', fuente: 'eia-gas', anio: 2026 },
    lng: { clase: 'tipico', fuente: 'eia-gas', anio: 2026 },
    lp: { clase: 'convencion', fuente: 'cne-precios-lp', anio: 2026 },
    nom009: { clase: 'oficial', fuente: 'nom-009', anio: 2011 },
    rene: { clase: 'oficial', fuente: 'acuerdo-rene-2015', anio: 2015 },
    sae: { clase: 'oficial', fuente: 'convocatoria-sae', anio: 2026 },
};

/** Symbols for the units of each line. */
export const SIMBOLO_LINEA = Object.freeze({
    mwh: 'MWh', mw: 'MW', 'mw-pico': 'MW pico', pct: '%', c: 'C', mva: 'MVA', mvar: 'MVAr', a: 'A', 'mxn-mwh': '$/MWh', mxn: '$', tco2e: 't de CO₂e',
    'mxn-kw-mes': '$/kW-mes', 'mxn-mw-anio': '$/MW-año', cel: 'CEL', 'mxn-bl': '$/bl', 'mxn-gj': '$/GJ', l: 'L', sg: '', 'kg-m3': 'kg/m³', 'kg-bl': 'kg/bl',
    'bl-t': 'bl/t', 'm-s': 'm/s', sm3: 'm³ estándar', z: '', gj: 'GJ', 'gj-d': 'GJ al día', mmpcd: 'MMpcd', kg: 'kg', mmbtu: 'MMBtu', mj: 'MJ', 'mxn-l': '$/L',
    'mxn-kwh': '$/kWh', kgco2: 'kg de CO₂', kpa: 'kPa',
});

// ── Small calculations ───────────────────────────────────────────────────────
const LISTA = [
    {
        id: 'central', pestana: 'electricidad', titulo: 'Energía de una central',
        nota: 'Usa el factor de planta observado en México, promedio de 2022 a 2024. Para un año completo deja 8 760 horas.',
        campos: [num('mw', 'Potencia', 100, 'MW', { positivo: true }), num('horas', 'Horas', 8760, 'h', { positivo: true }), opc('tecnologia', 'Tecnología', TECNOLOGIAS, 'ciclo-combinado')],
        calcular: v => {
            const fp = FACTOR_PLANTA[v.tecnologia];
            return { lineas: [linea('energia', 'Energía', energiaMWh(v.mw, v.horas) * fp, 'mwh', PROC.pladese), linea('factor', 'Factor de planta', fp * 100, 'pct', PROC.pladese)] };
        },
    },
    {
        id: 'solar', pestana: 'electricidad', titulo: 'Paneles solares',
        nota: 'Los MW pico son la suma de los paneles (lado DC); el permiso pide también los MW del inversor (lado AC). No hay relación DC/AC oficial en México.',
        campos: [num('mwAc', 'Potencia del inversor', 100, 'MW AC', { positivo: true }), num('ilr', 'Relación DC/AC', null, '', { positivo: true, sugerencia: '1.3, EE. UU., sin dato mexicano' }), opc('sitio', 'Ciudad', SITIOS, 'hermosillo')],
        calcular: v => {
            const sitio = SITIOS_SOLARES.find(s => s.id === v.sitio);
            const r = solar({ mwAc: v.mwAc, ilr: v.ilr, pvout: sitio.pvout });
            const avisos = v.ilr > 1.3 ? ['Con una relación DC/AC mayor que 1.3 el inversor recorta energía en las horas de más sol; estas fórmulas no incluyen ese recorte.'] : [];
            return {
                avisos,
                lineas: [
                    linea('mw-pico', 'Paneles', r.mwDc, 'mw-pico'),
                    linea('energia', 'Energía al año', r.mwhAnio, 'mwh', PROC.solar),
                    linea('factor-ac', 'Factor de planta sobre AC', r.factorAc * 100, 'pct', PROC.solar),
                    linea('factor-dc', 'Factor de planta sobre DC', r.factorDc * 100, 'pct', PROC.solar),
                ],
            };
        },
    },
    {
        id: 'sae', pestana: 'electricidad', titulo: 'Almacenamiento',
        nota: 'Hoy una convocatoria de SENER pide un Sistema de Almacenamiento de Energía (SAE) de 30 % de la capacidad y 3 horas. No es una regla de la ley para todas las plantas.',
        campos: [num('mw', 'Potencia', 30, 'MW', { positivo: true }), num('horas', 'Horas', 3, 'h', { positivo: true }), num('eficiencia', 'Eficiencia de ida y vuelta', 85, '%', { positivo: true, max: 100 })],
        calcular: v => {
            const r = sae({ mw: v.mw, horas: v.horas, eficiencia: v.eficiencia / 100 });
            return { lineas: [linea('energia', 'Energía almacenada', r.mwh, 'mwh'), linea('c', 'Tasa de descarga', r.cRate, 'c'), linea('carga', 'Energía para cargarlo', r.carga, 'mwh')] };
        },
    },
    {
        id: 'factor-potencia', pestana: 'electricidad', titulo: 'Factor de potencia y corriente',
        nota: 'Desde el 8 de abril de 2026, el Código de Red pide factor de potencia de 0.97 a centros de carga en alta tensión, y en media tensión con 1 MW o más. El recibo usa otro umbral, 90 %, una regla heredada que aquí no se suma a nada. La Red Nacional de Transmisión (RNT) empieza en 69 kV; las Redes Generales de Distribución (RGD) van por debajo. Escribe la tensión entre fases.',
        campos: [num('p', 'Potencia real', 90, 'MW', { positivo: true }), num('fdp', 'Factor de potencia', 0.9, '', { positivo: true, max: 1 }), num('kv', 'Tensión entre fases', 230, 'kV', { positivo: true }), num('objetivo', 'Factor de potencia que quieres', 0.97, '', { positivo: true, max: 1 })],
        calcular: v => {
            const { s, q } = spq({ p: v.p, fdp: v.fdp });
            const lineas = [linea('s', 'Potencia aparente', s, 'mva'), linea('q', 'Potencia reactiva', q, 'mvar'), linea('corriente', 'Corriente', corrienteTrifasica(s, v.kv), 'a')];
            const avisos = [];
            if (v.objetivo > v.fdp) lineas.push(linea('compensacion', `Compensación para llegar a ${v.objetivo}`, compensacion(v.p, v.fdp, v.objetivo), 'mvar'));
            else avisos.push('Ya llegas al factor de potencia que quieres: no hace falta compensar.');
            return { lineas, avisos };
        },
    },
    {
        id: 'viento-agua', pestana: 'electricidad', titulo: 'Viento y agua',
        nota: 'Usa la velocidad del viento de cada hora: elevar al cubo la velocidad media subestima la energía.',
        campos: [
            opc('tipo', 'Fuente', [{ id: 'viento', nombre: 'Viento' }, { id: 'agua', nombre: 'Agua' }], 'viento'),
            num('rotor', 'Diámetro del rotor', 150, 'm', { positivo: true }), num('v', 'Velocidad del viento', 8, 'm/s'), num('cp', 'Coeficiente de potencia', 0.45, '', { positivo: true }),
            num('nominal', 'Potencia nominal de la turbina', null, 'MW', { obligatorio: false, positivo: true }),
            num('q', 'Caudal', 100, 'm³/s', { positivo: true }), num('h', 'Caída', 100, 'm', { positivo: true }), num('eta', 'Eficiencia', 0.88, '', { positivo: true, max: 1 }),
        ],
        calcular: v => {
            if (v.tipo === 'agua') return { lineas: [linea('potencia', 'Potencia', hidro({ q: v.q, h: v.h, eta: v.eta }), 'mw')] };
            const r = viento({ rotorM: v.rotor, v: v.v, cp: v.cp, nominalMw: v.nominal });
            const avisos = [];
            if (r.sobreBetz) avisos.push('Un coeficiente mayor que 16/27 (0.593) no es posible: es el límite de Betz.');
            if (r.topado) avisos.push('El resultado se topó en la potencia nominal de la turbina.');
            return { lineas: [linea('potencia', 'Potencia', r.mw, 'mw')], avisos };
        },
    },
    {
        id: 'costo-electricidad', pestana: 'electricidad', titulo: 'Costo con tu precio',
        nota: 'Escribe el precio que pagas o cobras por kWh. No es una tarifa de CFE.',
        campos: [num('mwh', 'Energía', 1, 'MWh'), num('precio', 'Precio', null, '$/kWh')],
        calcular: v => ({ lineas: [linea('por-mwh', 'Precio por MWh', v.precio * 1000, 'mxn-mwh'), linea('total', 'Costo', v.precio * 1000 * v.mwh, 'mxn')] }),
    },
    {
        id: 'emisiones-electricidad', pestana: 'electricidad', titulo: 'Emisiones',
        nota: 'Factor del sistema eléctrico de 2024, 0.444 t de CO₂e por MWh. Sirve para lo que consumes de la red, no para una central concreta.',
        campos: [num('mwh', 'Energía consumida', 1, 'MWh')],
        calcular: v => ({ lineas: [linea('emisiones', 'Emisiones', v.mwh * FACTOR_SEN.valor, 'tco2e', PROC.sen)] }),
    },
    {
        id: 'periodo', pestana: 'electricidad', paraEntender: true, titulo: '¿En qué periodo estoy?',
        nota: `Solo para la tarifa GDMTH. ${LEYENDA_MERCADO}.`,
        campos: [opc('sistema', 'Sistema', OPC_SISTEMAS, 'sin'), fecha('fecha', 'Fecha'), hora('hora', 'Hora'), casilla('festivo', 'Es día festivo')],
        calcular: v => {
            const r = periodoGDMTH(v);
            if (!r.ok) return { errores: r.errores };
            const DIA = { habil: 'día hábil', sabado: 'sábado', domingo: 'domingo o festivo' };
            return { lineas: [textoSolo('periodo', `Estás en horario ${r.periodo}. Temporada de ${r.temporada}, ${DIA[r.dia]}.`, PROC.tarifa)] };
        },
    },
    {
        id: 'precio-potencia', pestana: 'electricidad', paraEntender: true, titulo: 'Precio de la Potencia',
        nota: `Precio Neto de la Potencia de 2025, versión del 3 de septiembre de 2026. ${LEYENDA_MERCADO}.`,
        campos: [opc('sistema', 'Sistema', OPC_SISTEMAS, 'sin'), num('mwAnio', 'Potencia comprometida', null, 'MW-año', { obligatorio: false })],
        calcular: v => {
            const precio = PRECIO_NETO_2025[v.sistema];
            const lineas = [linea('mw-anio', 'Precio Neto', precio, 'mxn-mw-anio', PROC.potencia), linea('kw-mes', 'Lo mismo por kW al mes', kwMes(precio), 'mxn-kw-mes', PROC.potencia)];
            if (v.mwAnio != null) lineas.push(linea('pago', 'Pago', pagoPotencia(v.mwAnio, v.sistema), 'mxn', PROC.potencia));
            return { lineas };
        },
    },
    {
        id: 'cel', pestana: 'electricidad', paraEntender: true, titulo: 'CEL',
        nota: `Los Certificados de Energías Limpias (CEL) solo tienen requisito publicado para 2025 y 2026, de 13.9 % del consumo. Se genera un CEL por cada MWh limpio. ${LEYENDA_MERCADO}.`,
        campos: [num('mwh', 'Energía consumida', 1000, 'MWh'), num('anio', 'Año', 2026, ''), num('generados', 'Energía limpia que generas', null, 'MWh', { obligatorio: false }), num('limpia', 'Parte limpia (cogeneración)', 100, '%', { max: 100 })],
        calcular: v => {
            const lineas = [];
            const avisos = [];
            const req = celRequeridos(v.mwh, v.anio);
            if (req == null) avisos.push(`Para ${v.anio} no hay requisito de CEL publicado; solo hay para 2025 y 2026.`);
            else lineas.push(linea('requeridos', `CEL que debes tener (${formatoClase(REQUISITO_CEL[v.anio] * 100, 'oficial')} %)`, req, 'cel', PROC.cel));
            if (v.generados != null) lineas.push(linea('generados', 'CEL que generas', celGenerados(v.generados, v.limpia / 100), 'cel', PROC.cel));
            return { lineas, avisos };
        },
    },
    {
        id: 'permiso', pestana: 'electricidad', paraEntender: true, titulo: 'Permiso según MW',
        nota: 'Es orientación, no asesoría legal. La ley no aclara aquí si los 0.7 MW se miden en el lado de corriente alterna o directa.',
        campos: [num('mw', 'Capacidad de la central', 0.5, 'MW'), casilla('autoconsumo', 'Es autoconsumo interconectado')],
        calcular: v => {
            const TEXTO = {
                exenta: 'Menos de 0.7 MW: Generadora Exenta, sin permiso de generación.',
                permiso: '0.7 MW o más: necesita permiso de generación.',
                simplificado: 'De 0.7 a 20 MW en autoconsumo interconectado: puede usar el trámite simplificado.',
            };
            return { lineas: [textoSolo('figura', TEXTO[figuraPermiso(v.mw, { autoconsumo: v.autoconsumo })], PROC.lse)] };
        },
    },
    {
        id: 'costo-petroliferos', pestana: 'petroliferos', titulo: 'Costo con tu precio',
        nota: 'Escribe el precio por litro. El costo por energía cambia según el valor que uses: el publicado o la referencia física.',
        campos: [num('precio', 'Precio', null, '$/L'), opc('producto', 'Producto', LIQUIDOS, 'gasolina')],
        calcular: v => ({
            lineas: [
                linea('por-barril', 'Por barril', v.precio * BARRIL_L, 'mxn-bl'),
                linea('por-gj', 'Por energía, valor publicado', v.precio / cadena(v.producto).mjPorL * 1000, 'mxn-gj', PROC.lista),
                linea('por-gj-fisica', 'Por energía, referencia física', v.precio / cadena(v.producto, 'fisica').mjPorL * 1000, 'mxn-gj', PROC.ipcc),
            ],
        }),
    },
    {
        id: 'dilatacion', pestana: 'petroliferos', titulo: 'Dilatación por calor',
        nota: 'No es fraude: el mismo combustible ocupa más litros cuando está caliente. Es un cálculo orientativo.',
        campos: [num('litros', 'Litros', 20000, 'L'), temperatura('t', 'Temperatura del combustible', 35), temperatura('tRef', 'Temperatura de referencia', 20), opc('producto', 'Producto', LIQUIDOS, 'gasolina')],
        calcular: v => {
            if (![v.t, v.tRef].every(t => t >= RANGO_T_LIQUIDOS[0] && t <= RANGO_T_LIQUIDOS[1])) return { errores: [{ campo: 't', mensaje: 'Usa temperaturas de −10 a 60 °C' }] };
            const e = ENERGETICOS[v.producto];
            const litros = v.litros * factorTemperatura(v.t, { kgPorL: e.densidadKgL, tRef: v.tRef, crudo: e.crudo });
            const entero = { decimales: 0 };
            return { lineas: [linea('litros', `Litros a ${v.tRef} °C`, litros, 'l', PROC.vcf, entero), linea('diferencia', 'Diferencia', litros - v.litros, 'l', PROC.vcf, entero)] };
        },
    },
    {
        id: 'api', pestana: 'petroliferos', titulo: '°API y densidad',
        nota: 'Los grados API se miden a 60 °F. Una densidad medida a 20 °C no va en esta fórmula.',
        campos: [num('api', 'Grados API', 22, '°API', { negativo: true })],
        calcular: v => {
            if (v.api <= -131.5) return { errores: [{ campo: 'api', mensaje: 'Escribe grados API mayores que −131.5' }] };
            const rho = densidadDeApi(v.api);
            return {
                lineas: [
                    linea('gravedad', 'Gravedad específica', gravedadDeApi(v.api), 'sg', PROC.api),
                    linea('densidad', 'Densidad', rho, 'kg-m3', PROC.api),
                    linea('kg-barril', 'Kilos por barril', rho * BARRIL_L / 1000, 'kg-bl', PROC.api),
                    linea('barriles-tonelada', 'Barriles por tonelada', 1000 / (rho * BARRIL_L / 1000), 'bl-t', PROC.api),
                ],
            };
        },
    },
    {
        id: 'velocidad-ducto', pestana: 'petroliferos', titulo: 'Velocidad en un ducto',
        nota: 'Usa el diámetro interior. No hay un rango oficial de velocidad recomendada.',
        campos: [num('mbd', 'Flujo', 100, 'miles de barriles diarios (Mbd)'), num('diametro', 'Diámetro interior', 0.3048, 'm', { positivo: true })],
        calcular: v => {
            const m3s = v.mbd * 1000 * BARRIL_L / 1000 / 86400;
            return { lineas: [linea('velocidad', 'Velocidad', m3s / (Math.PI / 4 * v.diametro ** 2), 'm-s')] };
        },
    },
    {
        id: 'medidor-altitud', pestana: 'gas-natural', titulo: 'Medidor y altitud',
        nota: `Un medidor de casa marca metros cúbicos a la presión del lugar. A más altura, el mismo gas ocupa más. Altitudes de ejemplo: ${Object.values(CIUDADES).map(c => `${c.nombre} ${c.altitud} m`).join(', ')}.`,
        campos: [num('volumen', 'Lo que marca el medidor', 100, 'm³'), num('presion', 'Presión de servicio', 2, 'kPa manométricos'), temperatura('t', 'Temperatura del gas', 20), num('altitud', 'Altitud', 2240, 'm', { max: RANGO_ALTITUD[1] })],
        calcular: v => ({ lineas: [linea('estandar', 'Gas en condición estándar', corregirGas({ volumen: v.volumen, pManKpa: v.presion, tC: v.t, altitud: v.altitud }).sm3SinZ, 'sm3', PROC.atmosfera)] }),
    },
    {
        id: 'presion-z', pestana: 'gas-natural', titulo: 'Presión, temperatura y Z',
        nota: 'Cálculo orientativo con la correlación de GPSA: no sirve para medir ni facturar.',
        campos: [num('volumen', 'Volumen en la línea', 1000, 'm³'), num('presion', 'Presión', 50, 'kg/cm² manométricos'), temperatura('t', 'Temperatura', 20)],
        calcular: v => {
            const r = corregirGas({ volumen: v.volumen, pManKpa: v.presion * KPA_POR_KGF_CM2, tC: v.t });
            const avisos = [];
            if (r.avisoZ === 'tres') avisos.push('Entre 28 y 85 kg/cm² la correlación puede desviarse ±3 %.');
            if (r.avisoZ === 'fuera') avisos.push('Por encima de 85 kg/cm² no se calcula Z: el resultado va sin Z.');
            const lineas = [linea('estandar', 'Gas en condición estándar', r.sm3ConZ, 'sm3', PROC.gpsa)];
            if (r.z != null) lineas.push(linea('z', 'Factor de compresibilidad Z', r.z, 'z', PROC.gpsa));
            lineas.push(linea('energia', 'Energía', r.sm3ConZ * GAS.pcs / 1000, 'gj', PROC.gas));
            return { lineas, avisos };
        },
    },
    {
        id: 'gas-central', pestana: 'gas-natural', titulo: 'Gas de una central',
        nota: 'Un ciclo combinado moderno usa unos 7 GJ por MWh; uno viejo, más.',
        campos: [num('mw', 'Potencia', 1000, 'MW', { positivo: true }), num('hr', 'Consumo de calor', 7, 'GJ/MWh', { positivo: true }), num('pcs', 'Poder calorífico', GAS.pcs, 'MJ/m³', { positivo: true })],
        calcular: v => {
            const gjDia = v.mw * v.hr * 24;
            return { lineas: [linea('energia', 'Energía', gjDia, 'gj-d'), linea('flujo', 'Gas', gjDia / (v.pcs * 28316.846592 / 1000), 'mmpcd', PROC.gas)] };
        },
    },
    {
        id: 'gnl', pestana: 'gas-natural', titulo: 'GNL',
        nota: 'Contado por masa, 1 m³ de gas natural licuado da unos 639 m³ de gas. También circulan 585, 600 y 615: cada fuente mide el gas en otra condición y con otro gas.',
        campos: [num('m3', 'Gas natural licuado', 1, 'm³')],
        calcular: v => {
            const r = gnl(v.m3);
            return { lineas: [linea('masa', 'Masa', r.kg, 'kg', PROC.lng), linea('mmbtu', 'Energía', r.mmbtu, 'mmbtu', PROC.lng), linea('energia', 'Energía', r.mj, 'mj', PROC.lng), linea('gas', 'Gas natural', r.sm3, 'sm3', PROC.lng)] };
        },
    },
    {
        id: 'costo-gas', pestana: 'gas-natural', titulo: 'Costo con tu precio',
        nota: 'Escribe el tipo de cambio que quieras usar. Un precio de contrato por MMBtu suele ir en poder calorífico superior.',
        campos: [num('precio', 'Precio', null, 'USD/MMBtu'), num('cambio', 'Tipo de cambio', null, 'MXN por USD', { positivo: true })],
        calcular: v => {
            const mxnGj = v.precio * v.cambio / (MJ_POR_MMBTU / 1000);
            return { lineas: [linea('por-gj', 'Precio por GJ', mxnGj, 'mxn-gj'), linea('por-kwh', 'Precio por kWh térmico', mxnGj * 0.0036, 'mxn-kwh')] };
        },
    },
    {
        id: 'tanque', pestana: 'gas-lp', titulo: 'Cuánto carga un tanque',
        nota: 'Un tanque «de 300 litros» se mide en litros de agua y la NOM-009 lo llena al 85 %.',
        campos: [num('litros', 'Tamaño del tanque', 300, 'L de agua'), num('llenado', 'Llenado', 85, '%', { max: 100, positivo: true })],
        calcular: v => {
            const litros = v.litros * v.llenado / 100;
            return { lineas: [linea('litros', 'Gas líquido', litros, 'l', PROC.nom009), linea('kilos', 'Kilos', litros * 0.54, 'kg', PROC.lp)] };
        },
    },
    {
        id: 'quemador', pestana: 'gas-lp', titulo: 'Altitud y quemador',
        nota: 'Física simple con un orificio fijo, no una norma: a más altura entra menos gas al quemador.',
        campos: [num('altitud', 'Altitud', 2240, 'm', { max: RANGO_ALTITUD[1] })],
        calcular: v => ({ lineas: [linea('potencia', 'Potencia comparada con el nivel del mar', factorQuemador(v.altitud) * 100, 'pct', PROC.atmosfera)] }),
    },
    {
        id: 'costo-lp', pestana: 'gas-lp', titulo: 'Costo con tu precio',
        nota: 'Pasa de precio por kilo a precio por litro con 0.54 kg/L, la convención de las tablas de precios.',
        campos: [num('precio', 'Precio', null, '$/kg')],
        calcular: v => ({ lineas: [linea('por-litro', 'Precio por litro', v.precio * 0.54, 'mxn-l', PROC.lp), linea('por-gj', 'Precio por GJ', v.precio / cadena('gas-lp').mjPorKg * 1000, 'mxn-gj', PROC.lista)] }),
    },
    {
        id: 'emisiones-lp', pestana: 'gas-lp', titulo: 'Emisiones',
        nota: 'Con los valores publicados: 48.37 MJ por kilo y 63.1 g de CO₂ por MJ.',
        campos: [num('kg', 'Gas', 20, 'kg')],
        calcular: v => ({ lineas: [linea('emisiones', 'Emisiones', co2Kg(v.kg * cadena('gas-lp').mjPorKg, 'gas-lp'), 'kgco2', PROC.rene)] }),
    },
];

export const CUENTAS = Object.freeze(Object.fromEntries(LISTA.map(c => [c.id, Object.freeze({ paraEntender: false, ...c })])));

export const cuentasDe = pestana => Object.values(CUENTAS).filter(c => c.pestana === pestana && !c.paraEntender);

function leerCampo(campo, crudo) {
    if (campo.tipo === 'casilla') return { valor: crudo === true || crudo === 'true' };
    if (campo.tipo === 'opcion') return { valor: campo.opciones.some(o => o.id === crudo) ? crudo : campo.porDefecto };
    if (campo.tipo === 'fecha' || campo.tipo === 'hora') return { valor: crudo ?? '' };
    const vacio = crudo === null || crudo === undefined || crudo === '';
    if (vacio) return campo.obligatorio ? { error: MENSAJE_NUMERO } : { valor: null };
    const r = typeof crudo === 'number' ? { ok: Number.isFinite(crudo), valor: crudo } : leerNumero(crudo);
    if (!r.ok) return { error: MENSAJE_NUMERO };
    if (campo.positivo && !(r.valor > 0)) return { error: 'Escribe un número mayor que cero' };
    if (!campo.negativo && r.valor < 0) return { error: 'Este valor no puede ser negativo' };
    if (campo.sobreCeroAbsoluto && !(r.valor > -273.15)) return { error: 'Esa temperatura está en el cero absoluto o por debajo' };
    if (campo.max != null && r.valor > campo.max) return { error: `Escribe un número de hasta ${campo.max}` };
    return { valor: r.valor };
}

/** One small calculation. Missing fields take their default; an explicit '' is empty. */
export function calcularCuenta(id, valores = {}) {
    const cuenta = CUENTAS[id];
    const vacia = { ok: false, lineas: [], avisos: [], errores: [], fuentes: [] };
    if (!cuenta) return { ...vacia, errores: [{ campo: null, mensaje: 'Cuenta desconocida' }] };
    const v = {};
    const errores = [];
    for (const campo of cuenta.campos) {
        const crudo = Object.prototype.hasOwnProperty.call(valores, campo.id) ? valores[campo.id] : campo.porDefecto;
        const r = leerCampo(campo, crudo);
        if (r.error) errores.push({ campo: campo.id, mensaje: r.error });
        else v[campo.id] = r.valor;
    }
    if (errores.length) return { ...vacia, errores };
    const r = cuenta.calcular(v);
    if (r.errores?.length) return { ...vacia, errores: r.errores };
    const lineas = r.lineas ?? [];
    if (lineas.some(l => l.valor != null && !Number.isFinite(l.valor))) {
        return { ...vacia, errores: [{ campo: null, mensaje: 'El número es demasiado grande para calcularlo' }] };
    }
    const fuentes = [...new Set(lineas.map(l => l.fuente).filter(Boolean))].map(f => FUENTES[f]).filter(Boolean);
    return { ok: true, lineas, avisos: r.avisos ?? [], errores: [], fuentes };
}
