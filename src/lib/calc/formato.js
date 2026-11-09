/**
 * Numbers for the energy calculator, written the NOM-008 way: decimal point, a no-break space
 * every three digits, no «billón». Intl.NumberFormat('es-MX') groups with commas, so this is by hand.
 * Values are computed with full precision elsewhere and rounded only here.
 */

const NB = ' ';
const MENOS = '−';
const SUPER = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
const CIFRAS = { exacto: 7, oficial: 4, tipico: 3, convencion: 3 };

const agrupar = digitos => digitos.replace(/\B(?=(\d{3})+(?!\d))/g, NB);

/** `valor` rounded to `cifras` significant digits, grouped, without trailing zeros. */
function numero(valor, cifras) {
    if (valor === 0 || Object.is(valor, -0)) return '0';
    const abs = Math.abs(valor);
    const signo = valor < 0 ? MENOS : '';
    const redondo = Number(abs.toPrecision(cifras));
    if (redondo >= 1e15 || redondo < 1e-3) {
        const [mantisa, exp] = abs.toExponential(cifras - 1).split('e');
        const m = String(Number(mantisa));
        const e = String(Number(exp)).replace(/./g, ch => SUPER[ch]);
        return `${signo}${m}×10${e}`;
    }
    const [entero, decimales] = String(redondo).split('.');
    return `${signo}${agrupar(entero)}${decimales ? `.${decimales}` : ''}`;
}

/** A big number with its Spanish scale word: millón, mil millones, millones de millones. */
function conEscala(valor, cifras) {
    if (!Number.isFinite(valor)) return '';
    const redondo = valor === 0 ? 0 : Number(valor.toPrecision(cifras));
    const abs = Math.abs(redondo);
    if (abs < 1e6 || abs >= 1e15) return numero(redondo, cifras);
    const signo = redondo < 0 ? MENOS : '';
    if (abs < 1e9) {
        const m = abs / 1e6;
        return `${signo}${numero(m, cifras)} ${m === 1 ? 'millón' : 'millones'}`;
    }
    if (abs < 1e12) {
        const m = abs / 1e9;
        return m === 1 ? `${signo}mil millones` : `${signo}${numero(m, cifras)} mil millones`;
    }
    const m = abs / 1e12;
    return `${signo}${numero(m, cifras)} ${m === 1 ? 'millón' : 'millones'} de millones`;
}

export const formatoClase = (valor, clase) => numero(valor, CIFRAS[clase] ?? 3);

export const formatoFrente = valor => conEscala(valor, 3);

/** Number plus label: «15.9 millones de litros», «159 litros», «1 megawatt-hora». */
export function textoFrente({ valor, etiqueta, etiquetaUna }) {
    const n = formatoFrente(valor);
    if (/(millón|millones)$/.test(n)) return `${n} de ${etiqueta}`;
    if (n === '1' && etiquetaUna) return `1 ${etiquetaUna}`;
    return `${n} ${etiqueta}`;
}

/** Two significant digits; between ten thousand and a million it says «mil». */
export function formatoComparacion(valor) {
    const redondo = valor === 0 ? 0 : Number(valor.toPrecision(2));
    const abs = Math.abs(redondo);
    if (abs >= 1e4 && abs < 1e6) return `${numero(redondo / 1e3, 2)} mil`;
    return conEscala(redondo, 2);
}

/** A fixed number of decimals, grouped: figures that are compared with each other (litres and their difference). */
export function formatoFijo(valor, decimales) {
    if (!Number.isFinite(valor)) return '';
    const [entero, fraccion] = Math.abs(valor).toFixed(decimales).split('.');
    const signo = valor < 0 && Number(`${entero}.${fraccion ?? 0}`) !== 0 ? MENOS : '';
    return `${signo}${agrupar(entero)}${fraccion ? `.${fraccion}` : ''}`;
}

/** Pesos: two decimals from one peso up; below one, three significant digits («0.254»). */
export function formatoDinero(valor) {
    if (!Number.isFinite(valor)) return '';
    const abs = Math.abs(valor);
    if (abs > 0 && abs < 1) return numero(valor, 3);
    return formatoFijo(valor, 2);
}

/** The line that says where a figure comes from. */
export function rotulo({ clase, anio, nota, emisor } = {}) {
    if (clase === 'exacto') return 'Exacto por definición';
    if (clase === 'oficial') return `Valor publicado por ${emisor || 'SENER'}${anio ? `, ${anio}` : ''}`;
    if (clase === 'tipico') return 'Valor típico, puede variar';
    if (clase === 'convencion') return nota ? `Convención usada en ${nota}` : 'Convención';
    return '';
}

const MALO = { vacio: false, ok: false, valor: null, aviso: null };
const ENTERO_AGRUPADO = /^(\d{1,3}( \d{3})+|\d+)$/;

/**
 * Reads what a person types: «1 234.5», «1,234.5» and «1234.5» are the same number. «1,234» is read
 * as one thousand two hundred thirty-four and «1,5» as one point five; both say so in `aviso`.
 */
export function leerNumero(texto) {
    const t = String(texto ?? '').replace(/[   ]/g, ' ').replace(/−/g, '-').trim();
    if (!t) return { vacio: true, ok: false, valor: null, aviso: null };
    if (!/^-?[\d ,.]+$/.test(t) || !/\d/.test(t)) return MALO;
    const signo = t.startsWith('-') ? '-' : '';
    const cuerpo = signo ? t.slice(1) : t;
    if (cuerpo.includes('-')) return MALO;

    let entero = cuerpo;
    let decimales = '';
    let avisar = false;
    const comas = (cuerpo.match(/,/g) || []).length;
    const puntos = (cuerpo.match(/\./g) || []).length;

    if (comas && puntos) {
        // «1,234.5»: commas group thousands. Any other mix is too ambiguous to guess.
        if (puntos > 1 || cuerpo.lastIndexOf('.') < cuerpo.lastIndexOf(',')) return MALO;
        [entero, decimales] = cuerpo.split('.');
        if (!/^\d{1,3}(,\d{3})+$/.test(entero)) return MALO;
        entero = entero.replace(/,/g, '');
    } else if (comas) {
        if (/^\d{1,3}(,\d{3}){2,}$/.test(cuerpo)) entero = cuerpo.replace(/,/g, '');
        else if (/^\d{1,3},\d{3}$/.test(cuerpo)) { entero = cuerpo.replace(',', ''); avisar = true; }
        else if (comas === 1) { [entero, decimales] = cuerpo.split(','); avisar = true; if (!decimales) return MALO; }
        else return MALO;
    } else if (puntos) {
        if (puntos > 1) return MALO;
        [entero, decimales] = cuerpo.split('.');
    }

    if (entero && !ENTERO_AGRUPADO.test(entero)) return MALO;
    if (!/^\d*$/.test(decimales)) return MALO;
    const digitos = entero.replace(/ /g, '');
    if (!digitos && !decimales) return MALO;
    const valor = Number(`${signo}${digitos || '0'}.${decimales || '0'}`);
    if (!Number.isFinite(valor)) return MALO;
    const eco = `${signo ? MENOS : ''}${agrupar(digitos || '0')}${decimales ? `.${decimales}` : ''}`;
    return { vacio: false, ok: true, valor, aviso: avisar ? `Lo leímos como ${eco}.` : null };
}
