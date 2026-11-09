/**
 * The energy calculator engine: calcular(estado) turns what the person typed into figures, each
 * with its class (exacto, oficial, tipico, convencion), source and year. Pure: no network, no DOM.
 * One closed chain per base, so going through litres, kilos or energy gives the same answer.
 * normalizarEstado(parcial) drops whatever does not fit the tab (a shared link can carry anything).
 */
import { BARRIL_L, BEP_MJ, ENERGETICOS, GAS, cadena, cadenaGas, co2Kg } from './energeticos.js';
import { CONDICIONES, MEZCLAS_LP, RANGO_ALTITUD, RANGO_T_LIQUIDOS, RANGO_T_LP, aEstandar, densidadLP, factorTemperatura, presionAtm } from './ajustes.js';
import { formatoClase, formatoComparacion, leerNumero, rotulo } from './formato.js';
import { FUENTES } from './fuentes.js';
import { MAGNITUDES, UNIDADES, bajoCeroAbsoluto, convertir, convertirTemperatura, unidadesDe } from './unidades.js';
import { PESTANA, PESTANAS, UNIDADES_PESTANA, infoUnidad, simboloUnidad, unidadesValidas } from './pestanas.js';

const NB = ' ';
const MENSAJE_NUMERO = 'Escribe un número, como 1 234.5';
const USUARIO_KWH_ANIO = 1885;
const TANQUE_COCHE_L = 50;
const CILINDRO_KG = 20;
const RANGO_PCS = [37.30, 43.60];
const PC_M3 = 0.028316846592;
const CON_TANQUE = ['gasolina', 'diesel', 'turbosina'];
const AVISO_LISTA = ['gasolina', 'maya', 'istmo', 'olmeca'];

// Where a figure comes from.
const P = {
    exacto: { clase: 'exacto', fuente: 'nist-811' },
    lista: { clase: 'oficial', fuente: 'lista-2026', anio: 2026, emisor: 'SENER' },
    ipcc: { clase: 'tipico', fuente: 'ipcc-2006', anio: 2006 },
    rene: { clase: 'oficial', fuente: 'acuerdo-rene-2015', anio: 2015, emisor: 'Semarnat' },
    gas: { clase: 'tipico', fuente: 'eia-gas', anio: 2026 },
    condicion: { clase: 'exacto', fuente: 'nom-001' },
    convencionLP: { clase: 'convencion', fuente: 'cne-precios-lp', anio: 2026, nota: 'las tablas de precios' },
    nistLP: { clase: 'tipico', fuente: 'nist-webbook', anio: 2026 },
    vcf: { clase: 'tipico', fuente: 'vcf', anio: 2026, nota: 'orientativo' },
    atmosfera: { clase: 'tipico', fuente: 'nws-altitud', anio: 2026 },
};

const DENSIDAD = {
    gasolina: { clase: 'tipico', fuente: 'nom-016', anio: 2016 },
    diesel: { clase: 'tipico', fuente: 'nom-016', anio: 2016, nota: 'densidad de trabajo sin fuente oficial' },
    turbosina: { clase: 'tipico', fuente: 'nom-016', anio: 2016 },
    combustoleo: { clase: 'tipico', fuente: 'nom-016', anio: 2016 },
    maya: { clase: 'tipico', fuente: 'pemex-crudos', anio: 2026 },
    istmo: { clase: 'tipico', fuente: 'pemex-crudos', anio: 2026 },
    olmeca: { clase: 'tipico', fuente: 'pemex-crudos', anio: 2026 },
};

const SINGULAR = {
    mj: 'megajoule', gj: 'gigajoule', tj: 'terajoule', pj: 'petajoule', kwh: 'kilowatt-hora', mwh: 'megawatt-hora', gwh: 'gigawatt-hora', twh: 'terawatt-hora',
    l: 'litro', bl: 'barril', m3: 'metro cúbico', gal: 'galón', kg: 'kilo', t: 'tonelada', pc: 'pie cúbico', w: 'watt', kw: 'kilowatt', mw: 'megawatt', gw: 'gigawatt', tw: 'terawatt',
    hp: 'caballo de fuerza', kgco2: 'kilo de CO₂', tco2: 'tonelada de CO₂', bep: 'barril equivalente de petróleo', mmbtu: 'millón de Btu (MMBtu)', therm: 'therm', kpa: 'kilopascal', bar: 'bar',
};

const nombre = id => infoUnidad(id)?.nombre ?? id;
const fmt = v => formatoClase(v, 'exacto');
const dentro = (v, [a, b]) => v >= a && v <= b;

function cifra(valor, unidad, etiqueta, { clase = 'exacto', fuente = null, anio = null, emisor = null, nota = null, frente = false, etiquetaUna = null } = {}) {
    return { valor, unidad, clase, fuente, anio, emisor, etiqueta, etiquetaUna, frente, nota };
}

/** A figure labelled with its unit name: «litros», «barriles al día». */
function deUnidad(valor, unidad, proc, { sufijo = '', extra = '', frente = false } = {}) {
    const una = SINGULAR[unidad] ? `${SINGULAR[unidad]}${extra}${sufijo}` : null;
    return cifra(valor, unidad, `${nombre(unidad)}${extra}${sufijo}`, { ...proc, frente, etiquetaUna: una });
}

const ESCALA_MJ = [['pj', 1e9], ['tj', 1e6], ['gj', 1e3], ['mj', 1]];
const ESCALA_KWH = [['twh', 1e9], ['gwh', 1e6], ['mwh', 1e3], ['kwh', 1]];
function escalar(valor, escala) {
    const abs = Math.abs(valor);
    const [u, f] = escala.find(([, f]) => abs >= f) ?? escala.at(-1);
    return [u, valor / f];
}
/** Energy of a fuel in MJ, GJ, TJ or PJ, «… de energía». */
function energiaCombustible(mj, proc, opciones = {}) {
    const [u, v] = escalar(mj, ESCALA_MJ);
    return deUnidad(v, u, proc, { ...opciones, extra: ' de energía' });
}
function co2(kg, opciones = {}) {
    return kg < 1000 ? deUnidad(kg, 'kgco2', P.rene, opciones) : deUnidad(kg / 1000, 'tco2', P.rene, opciones);
}

/** «unos 320 mil tanques…», or below one, «el 53 % de un tanque…». `plural` gets the number already written. */
function comparar(n, plural, singular, rotuloTexto, fuente) {
    if (!(n > 0)) return null;
    if (n < 0.995) return { texto: `el ${formatoComparacion(n * 100)}${NB}% de ${singular}`, rotulo: rotuloTexto, fuente };
    const f = formatoComparacion(n);
    return { texto: f === '1' ? singular : plural(f), rotulo: rotuloTexto, fuente };
}
const tanques = litros => comparar(litros / TANQUE_COCHE_L, f => `unos ${f} tanques de coche de 50 L`, 'un tanque de coche de 50 L', 'Ilustrativo', null);
const cilindros = n => comparar(n, f => `unos ${f} cilindros de 20 kg`, 'un cilindro de 20 kg', 'NOM-213', 'nom-213');
const usuarios = kwh => comparar(kwh / USUARIO_KWH_ANIO, f => `la energía de un año de unos ${f} usuarios residenciales`, 'la energía de un año de un usuario residencial', 'Derivado del PLADESE; energía anual, no cobertura hora por hora', 'pladese');
const cilindroMJ = () => CILINDRO_KG * cadena('gas-lp').mjPorKg;

const leer = v => (typeof v === 'number'
    ? (Number.isFinite(v) ? { vacio: false, ok: true, valor: v, aviso: null } : { vacio: false, ok: false, valor: null, aviso: null })
    : leerNumero(v));
function numeroAjuste(v) {
    if (v === undefined || v === null || v === '') return undefined;
    const r = leer(v);
    return r.ok ? r.valor : NaN;
}

function unidadPorDefecto(tab, magnitud, producto, validas) {
    if (tab.id === 'otras') return magnitud === tab.ejemplo.magnitud ? tab.ejemplo.unidad : (validas[1] ?? validas[0]);
    if (producto === 'coque') return 't';
    return validas.includes(tab.ejemplo.unidad) ? tab.ejemplo.unidad : validas[0];
}

function filtrarAjustes(pestana, magnitud, producto, a = {}) {
    const out = {};
    const num = k => { const v = numeroAjuste(a[k]); if (v !== undefined) out[k] = v; };
    if (pestana === 'petroliferos' && producto !== 'coque') { num('t'); if (producto === 'diesel') num('d'); }
    if (pestana === 'gas-lp') { num('t'); if (MEZCLAS_LP[a.m]) out.m = a.m; }
    if (pestana === 'gas-natural') {
        if (CONDICIONES[a.c]) out.c = a.c;
        num('pc');
        if (a.k === 'superior' || a.k === 'inferior') out.k = a.k;
    }
    if (pestana === 'otras' && magnitud === 'presion') {
        if (a.pm === 'man' || a.pm === 'abs') out.pm = a.pm;
        if (out.pm === 'man') num('a');
    }
    if (pestana === 'otras' && magnitud === 'temperatura' && a.dt === true) out.dt = true;
    return out;
}

/** A state that only holds what fits the tab. */
export function normalizarEstado(parcial = {}) {
    const tab = PESTANA[parcial.pestana] ?? PESTANAS[0];
    const pestana = tab.id;
    const magnitud = pestana === 'otras' ? (MAGNITUDES.includes(parcial.magnitud) ? parcial.magnitud : tab.ejemplo.magnitud) : null;
    const producto = pestana === 'petroliferos' ? (tab.productos.includes(parcial.producto) ? parcial.producto : tab.ejemplo.producto) : null;
    const base = tab.tieneBase ? (parcial.base === 'fisica' ? 'fisica' : 'oficial') : null;
    const validas = unidadesValidas({ pestana, magnitud, producto });
    const unidad = validas.includes(parcial.unidad) ? parcial.unidad : unidadPorDefecto(tab, magnitud, producto, validas);
    const esPotencia = pestana === 'electricidad' && UNIDADES[unidad]?.magnitud === 'potencia';
    const horas = esPotencia ? (parcial.horas === undefined || parcial.horas === null ? 1 : parcial.horas) : null;
    return {
        pestana, magnitud, unidad, producto, base, horas,
        valor: parcial.valor === undefined ? null : parcial.valor,
        ajustes: filtrarAjustes(pestana, magnitud, producto, parcial.ajustes),
    };
}

// ── Electricidad ─────────────────────────────────────────────────────────────

function electricidad(e, s) {
    const u = e.unidad;
    const v = e.valor;
    const sim = simboloUnidad(u);
    if (UNIDADES[u].magnitud === 'potencia') {
        const kw = convertir(v, u, 'kw');
        if (e.horas == null) {
            s.principal = u === 'kw' ? deUnidad(kw / 1000, 'mw', P.exacto) : deUnidad(kw, 'kw', P.exacto);
            s.otras = ['w', 'kw', 'mw', 'gw', 'hp'].filter(x => x !== s.principal.unidad).map(x => deUnidad(convertir(v, u, x), x, P.exacto));
            s.pasos.push(`${fmt(v)} ${sim} = ${fmt(s.principal.valor)} ${simboloUnidad(s.principal.unidad)}`);
            s.avisos.push('Sin horas no hay energía que calcular: escribe cuántas horas para saber los kWh.');
            return;
        }
        const kwh = kw * e.horas;
        s.pasos.push(`${fmt(v)} ${sim} × ${fmt(e.horas)} h = ${fmt(kwh)} kWh`);
        const [ue, ve] = escalar(kwh, ESCALA_KWH);
        s.principal = deUnidad(ve, ue, P.exacto);
        const [um, vm] = escalar(kwh * 3.6, ESCALA_MJ);
        s.otras.push(deUnidad(vm, um, P.exacto, { frente: true }));
        s.pasos.push(`${fmt(kwh)} kWh × 3.6 MJ/kWh = ${fmt(kwh * 3.6)} MJ`);
        s.otras.push(...['kwh', 'mwh', 'gwh', 'gj', 'mmbtu'].filter(x => x !== ue).map(x => deUnidad(convertir(kwh, 'kwh', x), x, P.exacto)));
        s.comparacion = usuarios(kwh);
        return;
    }
    const kwh = convertir(v, u, 'kwh');
    const mj = kwh * 3.6;
    if (u === 'tj' || u === 'pj') {
        const [ue, ve] = escalar(kwh, ESCALA_KWH);
        s.principal = deUnidad(ve, ue, P.exacto);
    } else {
        const [um, vm] = escalar(mj, ESCALA_MJ);
        s.principal = deUnidad(vm, um, P.exacto);
    }
    s.pasos.push(`${fmt(v)} ${sim} = ${fmt(kwh)} kWh = ${fmt(mj)} MJ (1 kWh = 3.6 MJ)`);
    s.otras.push(...['kwh', 'mwh', 'gwh', 'twh', 'gj', 'tj', 'mmbtu'].filter(x => x !== s.principal.unidad).map(x => deUnidad(convertir(kwh, 'kwh', x), x, P.exacto)));
    s.comparacion = usuarios(kwh);
}

// ── Gasolinas y diésel ───────────────────────────────────────────────────────

const aMJ = (v, u) => (u === 'bep' ? v * BEP_MJ : convertir(v, u, 'mj'));
const aLitros = (v, u) => (UNIDADES[u].magnitud === 'flujo' ? v * UNIDADES[u].factor[0] / UNIDADES[u].factor[1] : convertir(v, u, 'l'));

function petroliferos(e, s) {
    const p = ENERGETICOS[e.producto];
    const a = e.ajustes ?? {};
    if (a.d !== undefined && !(a.d > 0)) { s.errores.push({ campo: 'd', mensaje: 'Escribe una densidad mayor que cero' }); return; }
    const ch = cadena(e.producto, e.base, { densidad: a.d });
    const proc = e.base === 'fisica' ? P.ipcc : P.lista;
    const procKg = a.d !== undefined ? { clase: 'tipico', fuente: 'nom-016', anio: 2016, nota: 'densidad que escribiste' } : DENSIDAD[e.producto];
    const u = e.unidad;
    const v = e.valor;
    const info = infoUnidad(u);
    const sufijo = info.magnitud === 'flujo' ? ' al día' : '';
    const mag = info.magnitud === 'flujo' ? 'volumen' : (u === 'bep' ? 'energia' : info.magnitud);
    const op = { sufijo };

    if (AVISO_LISTA.includes(e.producto)) s.avisos.push('La Lista no separa Magna y Premium ni los tipos de crudo.');

    if (p.soloMasa) {
        const kg = mag === 'masa' ? convertir(v, u, 'kg') : aMJ(v, u) / ch.mjPorKg;
        const mj = mag === 'masa' ? kg * ch.mjPorKg : aMJ(v, u);
        s.principal = mag === 'masa' ? energiaCombustible(mj, proc, op) : deUnidad(kg / 1000, 't', proc, op);
        s.otras.push(co2(co2Kg(mj, e.producto), { ...op, frente: true }));
        s.otras.push(deUnidad(kg, 'kg', mag === 'masa' ? P.exacto : proc, op), deUnidad(kg / 1000, 't', mag === 'masa' ? P.exacto : proc, op));
        s.otras.push(...['gj', 'kwh', 'mmbtu'].map(x => deUnidad(convertir(mj, 'mj', x), x, mag === 'masa' ? proc : P.exacto, op)));
        s.otras.push(deUnidad(mj / BEP_MJ, 'bep', P.lista, op));
        s.pasos.push(`${fmt(kg)} kg × ${formatoClase(ch.mjPorKg, 'oficial')} MJ/kg = ${fmt(mj)} MJ`);
        s.pasos.push(`${fmt(mj)} MJ × ${p.co2TJ} g de CO₂ por MJ = ${fmt(co2Kg(mj, e.producto))} kg de CO₂`);
        return;
    }

    let factor = 1;
    if (a.t !== undefined) {
        if (dentro(a.t, RANGO_T_LIQUIDOS)) factor = factorTemperatura(a.t, { kgPorL: ch.kgPorL, tRef: p.tRef, crudo: p.crudo });
        else s.avisos.push(`La temperatura de ${fmt(a.t)} °C está fuera del rango del ajuste (−10 a 60 °C); se calculó sin ajuste.`);
    }
    let litros; let refL; let kg; let mj; let procL;
    if (mag === 'volumen') {
        litros = aLitros(v, u); refL = litros * factor; kg = refL * ch.kgPorL; mj = refL * ch.mjPorL; procL = P.exacto;
        s.pasos.push(`${fmt(v)} ${simboloUnidad(u)} = ${fmt(litros)} L${sufijo}`);
    } else if (mag === 'masa') {
        kg = convertir(v, u, 'kg'); refL = kg / ch.kgPorL; litros = refL / factor; mj = kg * ch.mjPorKg; procL = procKg;
        s.pasos.push(`${fmt(kg)} kg ÷ ${formatoClase(ch.kgPorL, 'tipico')} kg/L = ${fmt(refL)} L`);
    } else {
        mj = aMJ(v, u); refL = mj / ch.mjPorL; kg = refL * ch.kgPorL; litros = refL / factor; procL = proc;
        s.pasos.push(`${fmt(mj)} MJ ÷ ${formatoClase(ch.mjPorL, 'oficial')} MJ/L = ${fmt(refL)} L`);
    }
    if (factor !== 1) s.pasos.push(`Corrección por temperatura de ${fmt(a.t)} °C a ${p.tRef} °C: × ${formatoClase(factor, 'exacto')} = ${fmt(refL)} L`);
    if (mag !== 'energia') s.pasos.push(`${fmt(refL)} L × ${formatoClase(ch.mjPorL, 'oficial')} MJ/L = ${fmt(mj)} MJ`);
    if (mag === 'volumen' || mag === 'energia') s.pasos.push(`${fmt(refL)} L × ${formatoClase(ch.kgPorL, 'tipico')} kg/L = ${fmt(kg)} kg`);
    const kgCo2 = co2Kg(mj, e.producto);
    s.pasos.push(`${fmt(mj)} MJ × ${p.co2TJ} g de CO₂ por MJ = ${fmt(kgCo2)} kg de CO₂`);
    s.pasos.push(`${fmt(mj)} MJ ÷ 6${NB}347 MJ por barril equivalente = ${fmt(mj / BEP_MJ)} bep`);

    const litrosC = deUnidad(litros, 'l', procL, op);
    const barrilesC = deUnidad(litros / BARRIL_L, 'bl', procL, op);
    const refC = factor !== 1 ? cifra(refL, 'l', `litros a ${p.tRef} °C${sufijo}`, { ...P.vcf, frente: true, etiquetaUna: `litro a ${p.tRef} °C${sufijo}` }) : null;
    // Energy typed in MJ is exact; energy from barrels of oil equivalent carries the 2026 list's 6 347 MJ.
    const procEnergia = mag === 'energia' ? (u === 'bep' ? P.lista : P.exacto) : proc;
    const energiaC = energiaCombustible(mj, procEnergia, op);
    const co2C = co2(kgCo2, { ...op, frente: true });
    const kgProc = mag === 'masa' ? P.exacto : (mag === 'energia' ? proc : procKg);

    if (mag === 'energia') {
        s.principal = litrosC;
        barrilesC.frente = true;
        s.otras.push(...[refC, barrilesC, co2C].filter(Boolean), energiaC);
    } else {
        s.principal = mag === 'volumen' && (u === 'l' || u === 'm3') ? barrilesC : litrosC;
        energiaC.frente = true;
        s.otras.push(...[refC, energiaC, co2C].filter(Boolean), s.principal === litrosC ? barrilesC : litrosC);
    }
    s.otras.push(
        deUnidad(litros / 1000, 'm3', procL, op), deUnidad(convertir(litros, 'l', 'gal'), 'gal', procL, op),
        deUnidad(kg, 'kg', kgProc, op), deUnidad(kg / 1000, 't', kgProc, op),
        ...['gj', 'kwh', 'mmbtu'].map(x => deUnidad(convertir(mj, 'mj', x), x, procEnergia, op)),
        deUnidad(mj / BEP_MJ, 'bep', P.lista, op),
    );
    if (CON_TANQUE.includes(e.producto)) s.comparacion = tanques(litros);
    if (e.producto === 'diesel' && a.d === undefined) s.avisos.push('La densidad de 0.84 kg/L no tiene fuente oficial; puedes cambiarla en «Ajustar».');
}

// ── Gas natural ─────────────────────────────────────────────────────────────

function gasNatural(e, s) {
    const a = e.ajustes ?? {};
    const pcs = a.pc ?? GAS.pcs;
    if (!(pcs > 0)) { s.errores.push({ campo: 'pc', mensaje: 'Escribe un poder calorífico mayor que cero' }); return; }
    if (a.pc === undefined) s.avisos.push('Usamos 38.64 MJ por metro cúbico estándar: es un valor típico, no oficial. Puedes cambiarlo en «Ajustar».');
    else if (!dentro(pcs, RANGO_PCS)) s.avisos.push(`Ese poder calorífico está fuera del rango de la NOM-001, de 37.30 a 43.60 MJ por metro cúbico. Se calculó con el que escribiste.`);
    const inferior = a.k === 'inferior';
    const g = cadenaGas({ pcs, inferior });
    const cond = a.c ?? 'estandar';
    const u = e.unidad;
    const v = e.valor;
    const info = infoUnidad(u);
    const sufijo = info.magnitud === 'flujo' ? ' al día' : '';
    const op = { sufijo };
    const procE = a.pc === undefined ? P.gas : { ...P.gas, nota: 'poder calorífico que escribiste' };
    const mag = info.magnitud === 'flujo' ? 'volumen' : (u === 'bep' ? 'energia' : info.magnitud);

    let sm3;
    if (mag === 'volumen') {
        const m3 = info.magnitud === 'flujo' ? v * info.factor[0] / info.factor[1] / 1000 : convertir(v, u, 'm3');
        sm3 = aEstandar(m3, cond);
        s.pasos.push(`${fmt(v)} ${simboloUnidad(u)} = ${fmt(m3)} m³ en ${CONDICIONES[cond].nombre} = ${fmt(sm3)} m³ estándar${sufijo}`);
    } else if (mag === 'masa') {
        sm3 = convertir(v, u, 'kg') / g.kgPorSm3;
        s.pasos.push(`${fmt(v)} ${simboloUnidad(u)} ÷ ${GAS.kgSm3} kg por m³ estándar = ${fmt(sm3)} m³ estándar`);
    } else if (u === 'bep') {
        sm3 = v / g.bepPorSm3;
        s.avisos.push('Pemex usa otra equivalencia para reservas; aquí se usa la del gas seco de la Lista.');
    } else {
        sm3 = convertir(v, u, 'mj') / g.mjPorSm3;
    }
    const mj = sm3 * g.mjPorSm3;
    s.pasos.push(`${fmt(sm3)} m³ estándar × ${formatoClase(g.mjPorSm3, 'tipico')} MJ/m³ (${inferior ? 'poder calorífico inferior' : 'poder calorífico superior'}) = ${fmt(mj)} MJ`);
    s.pasos.push(`${fmt(sm3)} m³ estándar × ${formatoClase(g.co2KgPorSm3, 'oficial')} kg de CO₂ por m³ = ${fmt(sm3 * g.co2KgPorSm3)} kg de CO₂`);

    // From bep the volume comes from the list's dry gas and the energy from the typical heating value.
    const desdeBep = u === 'bep';
    const procVolumen = mag === 'volumen' ? P.condicion : (desdeBep ? P.lista : procE);
    const procEnergia = mag === 'energia' && !desdeBep ? P.exacto : procE;
    const m3C = cifra(sm3, 'm3', `metros cúbicos estándar${sufijo}`, { ...procVolumen, etiquetaUna: `metro cúbico estándar${sufijo}` });
    const pcC = cifra(sm3 / PC_M3, 'pc', `pies cúbicos estándar${sufijo}`, { ...procVolumen, etiquetaUna: `pie cúbico estándar${sufijo}` });
    const co2C = co2(sm3 * g.co2KgPorSm3, { ...op, frente: true });
    const energiaC = energiaCombustible(mj, procEnergia, op);
    const resto = [
        ...['gj', 'mmbtu', 'therm', 'kwh'].map(x => deUnidad(convertir(mj, 'mj', x), x, procEnergia, op)),
        deUnidad(sm3 * g.kgPorSm3, 'kg', P.gas, op),
        { ...deUnidad(sm3 * g.bepPorSm3, 'bep', P.lista, op), nota: 'Pemex usa otra equivalencia para reservas' },
    ];
    if (mag === 'energia') {
        s.principal = m3C;
        pcC.frente = true;
        s.otras.push(pcC, co2C, energiaC, ...resto);
    } else {
        s.principal = energiaC;
        (u === 'm3' ? pcC : m3C).frente = true;
        s.otras.push(m3C, pcC, co2C, ...resto);
    }
    s.comparacion = cilindros(mj / cilindroMJ());
}

// ── Gas LP ──────────────────────────────────────────────────────────────────

function gasLP(e, s) {
    const a = e.ajustes ?? {};
    // A temperature outside the table is ignored entirely, so «se calculó sin ajuste» stays true.
    const tValida = a.t !== undefined && dentro(a.t, RANGO_T_LP);
    const usaTabla = tValida || a.m !== undefined;
    const mezcla = a.m ?? '60-40';
    const ch = cadena('gas-lp', e.base, { densidad: usaTabla ? densidadLP(15.56, mezcla) : undefined });
    const proc = e.base === 'fisica' ? P.ipcc : P.lista;
    const procKg = e.base !== 'fisica' && !usaTabla ? P.convencionLP : P.nistLP;
    let factor = 1;
    if (tValida) factor = densidadLP(a.t, mezcla) / densidadLP(15.56, mezcla);
    else if (a.t !== undefined) s.avisos.push(`La temperatura de ${fmt(a.t)} °C está fuera del rango del ajuste (−10 a 50 °C); se calculó sin ajuste.`);
    const u = e.unidad;
    const v = e.valor;
    const info = infoUnidad(u);
    const mag = info.magnitud;
    let litros; let refL; let kg; let mj;
    if (mag === 'volumen') {
        litros = u === 'tanque-agua' ? v * info.llenado : convertir(v, u, 'l');
        refL = litros * factor; kg = refL * ch.kgPorL; mj = refL * ch.mjPorL;
        if (u === 'tanque-agua') s.pasos.push(`${fmt(v)} L de agua × 85 % de llenado = ${fmt(litros)} L de gas líquido`);
    } else if (mag === 'masa') {
        kg = info.kg ? v * info.kg : convertir(v, u, 'kg');
        refL = kg / ch.kgPorL; litros = refL / factor; mj = kg * ch.mjPorKg;
    } else {
        mj = convertir(v, u, 'mj'); kg = mj / ch.mjPorKg; refL = kg / ch.kgPorL; litros = refL / factor;
    }
    if (factor !== 1) s.pasos.push(`Corrección por temperatura de ${fmt(a.t)} °C a 15.56 °C, mezcla ${MEZCLAS_LP[mezcla].nombre}: × ${formatoClase(factor, 'exacto')}`);
    s.pasos.push(`${fmt(refL)} L × ${formatoClase(ch.kgPorL, 'tipico')} kg/L = ${fmt(kg)} kg`);
    s.pasos.push(`${fmt(refL)} L × ${formatoClase(ch.mjPorL, 'oficial')} MJ/L = ${fmt(mj)} MJ`);
    const kgCo2 = co2Kg(mj, 'gas-lp');
    s.pasos.push(`${fmt(mj)} MJ × 63.1 g de CO₂ por MJ = ${fmt(kgCo2)} kg de CO₂`);

    const kgC = deUnidad(kg, 'kg', mag === 'masa' ? P.exacto : (mag === 'energia' ? proc : procKg));
    const litrosC = deUnidad(litros, 'l', mag === 'volumen' ? P.exacto : procKg);
    const refC = factor !== 1 ? cifra(refL, 'l', 'litros a 15.56 °C', { ...P.nistLP, frente: true, etiquetaUna: 'litro a 15.56 °C' }) : null;
    const energiaC = energiaCombustible(mj, mag === 'energia' ? P.exacto : proc);
    const co2C = co2(kgCo2, { frente: true });
    if (mag === 'energia') {
        s.principal = kgC;
        litrosC.frente = true;
        s.otras.push(litrosC, co2C, energiaC);
    } else {
        s.principal = mag === 'volumen' ? kgC : litrosC;
        energiaC.frente = true;
        s.otras.push(...[refC, energiaC, co2C].filter(Boolean), mag === 'volumen' ? litrosC : kgC);
    }
    s.otras.push(
        // Liquid, never vapour: one liquid m³ holds about 290 times the energy of one m³ of vapour.
        deUnidad(litros / 1000, 'm3', mag === 'volumen' ? P.exacto : procKg, { extra: ' de gas líquido' }), deUnidad(litros / BARRIL_L, 'bl', mag === 'volumen' ? P.exacto : procKg),
        deUnidad(kg / 1000, 't', mag === 'masa' ? P.exacto : procKg),
        ...['gj', 'kwh', 'mmbtu'].map(x => deUnidad(convertir(mj, 'mj', x), x, mag === 'energia' ? P.exacto : proc)),
    );
    s.comparacion = cilindros(kg / CILINDRO_KG);
    if (e.base !== 'fisica' && !usaTabla) {
        s.avisos.push('0.54 kg/L es la convención de las tablas de precios. Con los 26.12 MJ/L de la Lista implica 48.37 MJ/kg; es el valor publicado, y la referencia física está en «Ver fórmula y fuente».');
    }
}

// ── Otras ───────────────────────────────────────────────────────────────────

function otras(e, s) {
    const { magnitud, unidad: u, valor: v } = e;
    const a = e.ajustes ?? {};
    const lista = unidadesDe(magnitud);
    const principalId = lista[0].id !== u ? lista[0].id : lista[1].id;
    // A convention on either side (the oil-equivalent tonne) makes the whole conversion a convention.
    const convencion = [u].concat(lista.map(x => x.id)).find(id => UNIDADES[id].clase === 'convencion');
    const procDe = id => (UNIDADES[id].clase === 'convencion' || UNIDADES[u].clase === 'convencion'
        ? { clase: 'convencion', fuente: 'nist-811', anio: 2008, nota: UNIDADES[convencion].nota }
        : P.exacto);
    let valorEn;
    let extra = '';
    if (magnitud === 'temperatura') {
        const dif = a.dt === true;
        if (!dif && bajoCeroAbsoluto(v, u)) { s.errores.push({ campo: 'valor', mensaje: 'Esa temperatura está por debajo del cero absoluto' }); return; }
        valorEn = id => convertirTemperatura(v, u, id, { diferencia: dif });
        if (dif) extra = ' de diferencia';
    } else {
        valorEn = id => convertir(v, u, id);
    }
    const hacer = (id, frente) => cifra(valorEn(id), id, `${UNIDADES[id].nombre}${extra}`, {
        ...procDe(id), frente, etiquetaUna: SINGULAR[id] ? `${SINGULAR[id]}${extra}` : null,
    });
    s.principal = hacer(principalId, false);
    s.otras = lista.filter(x => x.id !== principalId && x.id !== u).map(x => hacer(x.id, true));
    s.pasos.push(`${fmt(v)} ${UNIDADES[u].simbolo} = ${fmt(s.principal.valor)} ${UNIDADES[principalId].simbolo}`);

    if (magnitud === 'presion' && a.pm) {
        const kpa = convertir(v, u, 'kpa');
        if (a.pm === 'abs' && kpa < 0) { s.errores.push({ campo: 'valor', mensaje: 'Una presión absoluta no puede ser negativa' }); return; }
        if (a.pm === 'man') {
            let altitud = a.a ?? 0;
            if (!dentro(altitud, RANGO_ALTITUD)) {
                s.avisos.push('La altitud está fuera del rango del ajuste (0 a 4 000 m); se calculó sin ajuste, al nivel del mar.');
                altitud = 0;
            }
            const patm = presionAtm(altitud);
            const abs = kpa + patm;
            if (abs < 0) { s.errores.push({ campo: 'valor', mensaje: 'Esa presión manométrica da una presión absoluta menor que cero' }); return; }
            s.otras.unshift(cifra(abs, 'kpa', 'kilopascales de presión absoluta', { ...P.atmosfera, frente: true, etiquetaUna: 'kilopascal de presión absoluta' }));
            s.pasos.push(`${fmt(kpa)} kPa manométricos + ${formatoClase(patm, 'tipico')} kPa de la atmósfera a ${fmt(altitud)} m = ${fmt(abs)} kPa absolutos`);
        }
    }
}

const CALCULOS = { electricidad, petroliferos, 'gas-natural': gasNatural, 'gas-lp': gasLP, otras };

function origenDe(s) {
    const alFrente = [s.principal, ...s.otras.filter(x => x.frente)];
    const primera = alFrente.find(x => x.clase !== 'exacto');
    return primera ? rotulo(primera) : 'Exacto por definición';
}

/** Every figure for one state; see the module comment. */
export function calcular(estado) {
    const s = { ok: false, principal: null, otras: [], comparacion: null, pasos: [], fuentes: [], avisos: [], errores: [], ejemplo: false, origen: '', avisoValor: null };
    const tab = PESTANA[estado?.pestana] ?? PESTANAS[0];
    const e = { ...estado, ajustes: estado?.ajustes ?? {} };
    const fallar = () => { s.principal = null; s.otras = []; s.comparacion = null; s.pasos = []; return s; };

    const lectura = leer(e.valor ?? '');
    if (lectura.vacio) { e.valor = tab.ejemplo.valor; s.ejemplo = true; }
    else if (!lectura.ok) { s.errores.push({ campo: 'valor', mensaje: MENSAJE_NUMERO }); return fallar(); }
    else { e.valor = lectura.valor; s.avisoValor = lectura.aviso; }

    for (const [k, v] of Object.entries(e.ajustes)) {
        if (typeof v === 'number' && !Number.isFinite(v)) s.errores.push({ campo: k, mensaje: MENSAJE_NUMERO });
    }
    const negativoPermitido = tab.id === 'otras' && (e.magnitud === 'temperatura' || (e.magnitud === 'presion' && e.ajustes.pm === 'man'));
    if (e.valor < 0 && !negativoPermitido) s.errores.push({ campo: 'valor', mensaje: 'Este valor no puede ser negativo' });

    if (e.horas === '' || e.horas === undefined) e.horas = null;
    if (e.horas !== null) {
        const h = leer(e.horas);
        if (!h.ok) s.errores.push({ campo: 'horas', mensaje: 'Escribe las horas, como 8' });
        else if (h.valor <= 0) s.errores.push({ campo: 'horas', mensaje: 'Las horas deben ser más de cero' });
        else e.horas = h.valor;
    }
    if (s.errores.length) return fallar();

    CALCULOS[tab.id](e, s);
    if (s.errores.length) return fallar();
    if ([s.principal, ...s.otras].some(x => !Number.isFinite(x.valor))) {
        s.errores.push({ campo: 'valor', mensaje: 'El número es demasiado grande para calcularlo' });
        return fallar();
    }
    // A figure that only repeats the input is left out.
    s.otras = s.otras.filter(x => !(x.unidad === e.unidad && Math.abs(x.valor - e.valor) <= 1e-12 * Math.max(1, Math.abs(e.valor))));

    s.ok = true;
    s.origen = origenDe(s);
    const ids = new Set([s.principal, ...s.otras].map(x => x.fuente).filter(Boolean));
    if (s.comparacion?.fuente) ids.add(s.comparacion.fuente);
    s.fuentes = [...ids].map(id => FUENTES[id]).filter(Boolean);
    return s;
}

export { UNIDADES_PESTANA };
