/**
 * Calculadora de energía (#calculadora, #calculadora=<pestaña>&…): the screen. Every number comes
 * from src/lib/calc/motor.js; this file paints it and keeps the text of the fields.
 * Typing repaints only the result and the formula, never the field, so the cursor stays put.
 * Changing a select or a segmented control repaints the panel and gives the focus back.
 */
import '../styles/calculadora.css';
import { calcular, equivalenteOficial, normalizarEstado } from '../lib/calc/motor.js';
import {
    ALTITUDES, ATAJOS, MAGNITUDES, OPCIONES_CONDICION, OPCIONES_MEZCLA, PESTANA, PESTANAS, PRODUCTOS_PETROLIFEROS,
    magnitudUnidad, nombreUnidadEn, simboloUnidad, temperaturaReferencia, unidadesValidas,
} from '../lib/calc/pestanas.js';
import { calcHash } from '../lib/calc/ruta.js';
import { formatoClase, formatoDinero, formatoFijo, leerNumero, rotulo, textoFrente } from '../lib/calc/formato.js';
import { NOTA_PIE, PARA_ENTENDER, SUBTITULO, TITULO } from '../lib/calc/textos.js';
import { CUENTAS, SIMBOLO_LINEA, calcularCuenta, cuentasDe } from '../lib/calc/cuentas.js';
import { PUNTAS_DIST_DIT, ahoraEnSistema } from '../lib/calc/mercado.js';
import { FUENTES, fechaFuente } from '../lib/calc/fuentes.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plano = s => String(s).replaceAll(' ', ' ');

const NOMBRE_MAGNITUD = { energia: 'Energía', potencia: 'Potencia', presion: 'Presión', temperatura: 'Temperatura', masa: 'Masa', volumen: 'Volumen', flujo: 'Flujo', velocidad: 'Velocidad', area: 'Área' };
const BASES = [{ id: 'oficial', nombre: 'Valor publicado' }, { id: 'fisica', nombre: 'Referencia física' }];
const leer = v => (typeof v === 'number' ? { ok: Number.isFinite(v), valor: v } : leerNumero(v));

const opciones = (lista, actual) => lista.map(o => `<option value="${esc(o.id)}"${o.id === actual ? ' selected' : ''}>${esc(o.nombre)}</option>`).join('');
// A radio group: only the checked option (or the first, when none is) takes a Tab stop; the arrows move inside.
function seg(clave, etiqueta, lista, actual, atributo = `data-seg="${clave}"`) {
    const parada = lista.some(o => o.id === actual) ? actual : lista[0]?.id;
    return `<div class="bu-seg ce-seg" role="radiogroup" aria-label="${esc(etiqueta)}" ${atributo}>${lista.map(o => `<button type="button" role="radio" aria-checked="${o.id === actual}" tabindex="${o.id === parada ? 0 : -1}" data-valor="${esc(o.id)}" data-foco="${clave}-${esc(o.id)}">${esc(o.nombre)}</button>`).join('')}</div>`;
}
const campo = (etiqueta, control, { clase = '', ayuda = '' } = {}) => `<label class="ce-campo ${clase}"><span class="ce-etq">${esc(etiqueta)}</span><span class="bu-campo">${control}</span>${ayuda ? `<span class="ce-ayuda">${esc(ayuda)}</span>` : ''}</label>`;
const entrada = (atributos, valor, placeholder = '') => `<input type="text" inputmode="decimal" autocomplete="off" ${atributos} value="${esc(valor)}" placeholder="${esc(placeholder)}">`;
const enlaceFuente = f => (/^https?:/.test(f.url) ? `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titulo)}</a>` : `<a href="${esc(f.url)}">${esc(f.titulo)}</a>`);

/** A line of a small calculation: fixed decimals when it says so, pesos with two decimals, the rest by class. */
function valorLinea(l) {
    const simbolo = SIMBOLO_LINEA[l.unidad] ?? '';
    const numero = l.decimales != null ? formatoFijo(l.valor, l.decimales)
        : l.unidad?.startsWith('mxn') ? formatoDinero(l.valor) : formatoClase(l.valor, l.clase);
    return `${numero} ${simbolo}`.trim();
}
const oracion = s => (s ? `${s[0].toUpperCase()}${s.slice(1)}` : s);
/** The origin of a figure; its note is added as its own sentence unless the label already holds it. */
const origenCifra = c => `${rotulo(c)}${c.nota && !['convencion', 'calculado'].includes(c.clase) ? `. ${oracion(c.nota)}` : ''}`;
const lineaFuentes = fuentes => (fuentes.length
    ? `<p class="ce-nota">Fuente: ${fuentes.map(f => `${enlaceFuente(f)}. ${esc(f.emisor)}, ${esc(fechaFuente(f))}`).join('; ')}.</p>` : '');
const rotuloLinea = l => rotulo({ clase: l.clase, anio: l.anio, emisor: FUENTES[l.fuente]?.emisor, nota: l.clase === 'convencion' ? 'las tablas de precios' : undefined });

// Date and time fields start on the clock of the chosen system (see ponerReloj).
const esReloj = f => f.tipo === 'fecha' || f.tipo === 'hora';
function valorInicial(f) {
    if (esReloj(f)) return '';
    if (f.tipo === 'casilla') return Boolean(f.porDefecto);
    return f.porDefecto == null ? '' : String(f.porDefecto);
}

const tablaPuntas = () => `<table class="ce-cifras ce-puntas"><caption>Punta en DIST y DIT, Sistema Interconectado Nacional</caption>
    <thead><tr><th>Temporada</th><th>DIST, lunes a viernes</th><th>DIT, lunes a viernes</th><th>Sábado</th></tr></thead>
    <tbody>${PUNTAS_DIST_DIT.map(f => `<tr><td data-etq="Temporada">${esc(f.temporada)}</td><td data-etq="DIST, lunes a viernes">${esc(f.dist)}</td><td data-etq="DIT, lunes a viernes">${esc(f.dit)}</td><td data-etq="Sábado">${esc(f.sabado)}</td></tr>`).join('')}</tbody></table>`;

export function renderCalculadoraView(container, { ruta = null, onRoute = () => {} } = {}) {
    const ac = new AbortController();
    let estado;
    let resultado;
    let textoValor = '';
    // null until there are hours to keep: a power unit then starts at one hour. '' is power without hours.
    // The text stays while the unit is energy, so MW → MWh → MW gives the hours back.
    let textoHoras = null;
    let textoAjustes = {};
    // What the person typed in each small calculation, kept while they move around the page.
    const valoresCuenta = {};
    // Date and time fields the person changed; the rest follow the clock of the chosen system.
    const relojTocado = new Set();

    function cargar(r) {
        estado = normalizarEstado(r ?? {});
        textoValor = estado.valor == null ? '' : String(estado.valor);
        textoHoras = estado.horas == null ? null : String(estado.horas);
        textoAjustes = Object.fromEntries(Object.entries(estado.ajustes).map(([k, v]) => [k, typeof v === 'boolean' ? v : String(v)]));
    }

    const esPotencia = u => estado.pestana === 'electricidad' && magnitudUnidad(u) === 'potencia';
    const ajustesCrudos = () => Object.fromEntries(Object.entries(textoAjustes).filter(([, v]) => v !== '' && v !== false && v != null));
    const crudo = () => ({ ...estado, valor: textoValor, horas: textoHoras ?? undefined, ajustes: ajustesCrudos() });

    function actualizar(cambios = {}) {
        estado = normalizarEstado({ ...crudo(), ...cambios });
        if (estado.horas != null) textoHoras = String(estado.horas);
        resultado = calcular(estado);
    }

    /** The state for a link: only values that read as numbers; cleared hours stay cleared. */
    function estadoEnlace() {
        const v = leer(textoValor);
        const h = textoHoras == null ? null : leer(textoHoras);
        const horas = !esPotencia(estado.unidad) ? null : h?.ok ? h.valor : (textoHoras === '' ? '' : null);
        const ajustes = Object.fromEntries(Object.entries(estado.ajustes).filter(([, x]) => typeof x !== 'number' || Number.isFinite(x)));
        return { ...estado, valor: v.ok ? v.valor : null, horas, ajustes };
    }
    const enlace = () => `${location.origin}${location.pathname}${calcHash(estadoEnlace())}`;

    // ── Painting ────────────────────────────────────────────────────────────
    const tabsHtml = () => PESTANAS.map(p => {
        const activa = p.id === estado.pestana;
        return `<button type="button" role="tab" class="ce-tab" id="ce-tab-${p.id}" aria-controls="ce-panel" aria-selected="${activa}" tabindex="${activa ? 0 : -1}" data-ce="tab" data-pestana="${p.id}">${esc(p.titulo)}</button>`;
    }).join('');

    const textoOficial = () => equivalenteOficial({ ...estado, valor: textoValor });

    function conversorHtml() {
        const tab = PESTANA[estado.pestana];
        const unidades = unidadesValidas(estado).map(id => ({ id, nombre: nombreUnidadEn(estado.pestana, id) }));
        const oficial = textoOficial();
        const partes = [];
        if (estado.pestana === 'otras') partes.push(campo('Qué quieres convertir', `<select data-ce="magnitud" data-foco="magnitud">${opciones(MAGNITUDES.map(id => ({ id, nombre: NOMBRE_MAGNITUD[id] })), estado.magnitud)}</select>`, { clase: 'ce-campo--magnitud' }));
        partes.push(campo('Cantidad', entrada('data-ce="valor" data-foco="valor" aria-describedby="ce-aviso-valor"', textoValor, String(tab.ejemplo.valor)), { clase: 'ce-campo--valor' }));
        partes.push(`<div class="ce-campo ce-campo--unidad"><label class="ce-campo"><span class="ce-etq">Unidad</span><span class="bu-campo"><select data-ce="unidad" data-foco="unidad">${opciones(unidades, estado.unidad)}</select></span></label>${oficial === null ? '' : `<span class="ce-oficial" data-ce="oficial">${esc(oficial)}</span>`}</div>`);
        if (estado.pestana === 'petroliferos') partes.push(campo('Producto', `<select data-ce="producto" data-foco="producto">${opciones(PRODUCTOS_PETROLIFEROS, estado.producto)}</select>`, { clase: 'ce-campo--producto' }));
        if (esPotencia(estado.unidad)) partes.push(campo('Horas', entrada('data-ce="horas" data-foco="horas"', textoHoras ?? '', '1'), { clase: 'ce-campo--horas', ayuda: 'Para pasar de potencia a energía' }));
        return `<div class="ce-conversor" data-ce="conversor">${partes.join('')}</div><p class="ce-aviso-campo" id="ce-aviso-valor" data-ce="aviso-valor"></p>`;
    }

    const textoCifra = c => (estado.pestana === 'otras' ? `${formatoClase(c.valor, c.clase)} ${c.etiqueta}` : textoFrente(c));

    function resultadoHtml() {
        const r = resultado;
        if (!r.ok) {
            const otros = r.errores.filter(e => e.campo !== 'valor');
            return otros.map(e => `<p class="ce-error">${esc(e.mensaje)}</p>`).join('');
        }
        const frente = r.otras.filter(c => c.frente);
        return `${r.ejemplo ? '<span class="bu-insignia ce-ejemplo">Ejemplo</span>' : ''}
            <p class="ce-principal" data-ce="principal">${esc(textoCifra(r.principal))}</p>
            ${frente.length ? `<ul class="ce-frente" data-ce="frente">${frente.map(c => `<li>${esc(textoCifra(c))}</li>`).join('')}</ul>` : ''}
            ${r.comparacion ? `<p class="ce-idea" data-ce="comparacion"><span>Para darte idea:</span> ${esc(r.comparacion.texto)}. <small>${esc(r.comparacion.rotulo)}</small></p>` : ''}
            <p class="ce-origen" data-ce="origen">${esc(r.origen)}</p>
            ${r.avisos.length ? `<ul class="ce-avisos">${r.avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`;
    }

    function ajustarHtml() {
        const a = textoAjustes;
        const p = estado.pestana;
        let cuerpo = '';
        if (p === 'petroliferos' && estado.producto !== 'coque') {
            const tRef = temperaturaReferencia(estado.producto);
            cuerpo = campo('Temperatura del combustible', entrada('data-ajuste="t" data-foco="aj-t"', a.t ?? '', String(tRef)), { ayuda: `En °C. Sin dato se usa la de referencia, ${tRef} °C. Válido de −10 a 60 °C.` });
            if (estado.producto === 'diesel') cuerpo += campo('Densidad', entrada('data-ajuste="d" data-foco="aj-d"', a.d ?? '', '0.84'), { ayuda: 'En kg/L. 0.84 no tiene fuente oficial.' });
        } else if (p === 'gas-lp') {
            cuerpo = campo('Temperatura del gas', entrada('data-ajuste="t" data-foco="aj-t"', a.t ?? '', '15.56'), { ayuda: 'En °C, de −10 a 50.' })
                + campo('Mezcla', `<select data-ajuste="m" data-foco="aj-m">${opciones([{ id: '', nombre: 'Sin ajuste (0.54 kg/L)' }, ...OPCIONES_MEZCLA], a.m ?? '')}</select>`);
        } else if (p === 'gas-natural') {
            cuerpo = campo('Condición de referencia', `<select data-ajuste="c" data-foco="aj-c">${opciones(OPCIONES_CONDICION, a.c ?? 'estandar')}</select>`)
                + campo('Poder calorífico', entrada('data-ajuste="pc" data-foco="aj-pc"', a.pc ?? '', '38.64'), { ayuda: 'MJ por metro cúbico estándar. Rango de la NOM-001: 37.30 a 43.60.' })
                + `<div class="ce-campo"><span class="ce-etq">Base</span>${seg('k', 'Poder calorífico', [{ id: 'superior', nombre: 'Superior' }, { id: 'inferior', nombre: 'Inferior' }], a.k ?? 'superior')}</div>`;
        } else if (p === 'otras' && estado.magnitud === 'presion') {
            cuerpo = `<div class="ce-campo"><span class="ce-etq">La presión es</span>${seg('pm', 'Tipo de presión', [{ id: 'man', nombre: 'Manométrica' }, { id: 'abs', nombre: 'Absoluta' }], a.pm ?? '')}</div>`;
            if (a.pm === 'man') cuerpo += campo('Altitud', entrada('data-ajuste="a" data-foco="aj-a"', a.a ?? '', '0'), { ayuda: `En metros. ${ALTITUDES.map(c => `${c.nombre}: ${c.altitud}`).join('; ')}.` });
        } else if (p === 'otras' && estado.magnitud === 'temperatura') {
            cuerpo = `<div class="ce-campo"><span class="ce-etq">Es</span>${seg('dt', 'Temperatura o diferencia', [{ id: 'no', nombre: 'Una temperatura' }, { id: 'si', nombre: 'Una diferencia' }], a.dt === true ? 'si' : 'no')}</div>`;
        }
        if (!cuerpo) return '';
        return `<details class="ce-desplegable" data-ce="ajustar" data-abre="ajustar"><summary>Ajustar</summary><div class="ce-ajustes">${cuerpo}</div></details>`;
    }

    function formulaHtml() {
        const r = resultado;
        const base = PESTANA[estado.pestana].tieneBase
            ? `<div class="ce-base"><span class="ce-etq">Valor que se usa</span>${seg('base', 'Valor que se usa', BASES, estado.base, 'data-ce="base"')}</div>`
            : '';
        if (!r.ok) return `${base}<p class="ce-nota">Escribe un número para ver la fórmula.</p>`;
        const filas = [r.principal, ...r.otras].map(c => `<tr><td class="ce-num">${esc(formatoClase(c.valor, c.clase))} ${esc(simboloUnidad(c.unidad))}</td><td>${esc(c.etiqueta)}</td><td class="ce-rotulo">${esc(origenCifra(c))}</td></tr>`).join('');
        const fuentes = r.fuentes.map(f => {
            const externo = /^https?:/.test(f.url);
            return `<li><a href="${esc(f.url)}"${externo ? ' target="_blank" rel="noopener"' : ''}>${esc(f.titulo)}</a>. ${esc(f.emisor)}, ${esc(fechaFuente(f))}.</li>`;
        }).join('');
        return `${base}<ol class="ce-pasos">${r.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>
            <table class="ce-cifras"><caption>Todas las cifras</caption><tbody>${filas}</tbody></table>
            ${fuentes ? `<h3 class="ce-h3">Fuentes</h3><ul class="ce-fuentes">${fuentes}</ul>` : ''}`;
    }

    // ── Cards ───────────────────────────────────────────────────────────────
    function campoCuenta(c, f) {
        const v = valoresCuenta[c.id][f.id];
        const atributos = `data-cuenta-campo="${esc(f.id)}" data-foco="cu-${esc(c.id)}-${esc(f.id)}"`;
        if (f.tipo === 'casilla') return `<label class="ce-casilla"><input type="checkbox" ${atributos}${v ? ' checked' : ''}><span>${esc(f.etiqueta)}</span></label>`;
        if (f.tipo === 'opcion') return campo(f.etiqueta, `<select ${atributos}>${opciones(f.opciones, v)}</select>`);
        if (f.tipo === 'fecha') return campo(f.etiqueta, `<input type="date" ${atributos} value="${esc(v)}">`);
        if (f.tipo === 'hora') return campo(f.etiqueta, `<input type="time" ${atributos} value="${esc(v)}">`);
        return campo(`${f.etiqueta}${f.unidad ? ` (${f.unidad})` : ''}`, entrada(atributos, v), { ayuda: f.sugerencia ? `Sugerencia: ${f.sugerencia}` : '' });
    }

    /**
     * Date and time on the clock of the chosen system (Baja California is an hour or more behind the
     * centre), again each time the card opens or the system changes, until the person edits either.
     */
    function ponerReloj(c) {
        const v = valoresCuenta[c.id];
        const reloj = c.campos.filter(esReloj);
        if (!reloj.length || reloj.some(f => relojTocado.has(`${c.id}.${f.id}`))) return false;
        const ahora = ahoraEnSistema(v.sistema);
        for (const f of reloj) v[f.id] = f.tipo === 'fecha' ? ahora.fecha : ahora.hora;
        return true;
    }
    function refrescarReloj(caja) {
        const c = CUENTAS[caja.dataset.cuenta];
        if (!ponerReloj(c)) return;
        for (const f of c.campos.filter(esReloj)) {
            const el = caja.querySelector(`[data-cuenta-campo="${f.id}"]`);
            if (el) el.value = valoresCuenta[c.id][f.id];
        }
        pintarCuenta(caja);
    }

    function cuentaHtml(c) {
        if (!valoresCuenta[c.id]) {
            valoresCuenta[c.id] = Object.fromEntries(c.campos.map(f => [f.id, valorInicial(f)]));
            ponerReloj(c);
        }
        return `<div class="ce-cuenta" data-cuenta="${esc(c.id)}">
            ${c.nota ? `<p class="ce-nota">${esc(c.nota)}</p>` : ''}
            <div class="ce-cuenta-campos">${c.campos.map(f => campoCuenta(c, f)).join('')}</div>
            <div class="ce-cuenta-resultado" data-ce="cuenta-resultado" aria-live="polite"></div>
        </div>`;
    }

    function pintarCuenta(caja) {
        const c = CUENTAS[caja.dataset.cuenta];
        const r = calcularCuenta(c.id, valoresCuenta[c.id]);
        const salida = caja.querySelector('[data-ce="cuenta-resultado"]');
        if (!r.ok) {
            const etiqueta = id => c.campos.find(f => f.id === id)?.etiqueta;
            salida.innerHTML = r.errores.map(e => `<p class="ce-error">${esc(etiqueta(e.campo) ? `${etiqueta(e.campo)}: ${e.mensaje}` : e.mensaje)}</p>`).join('');
            return;
        }
        salida.innerHTML = `<ul class="ce-lineas">${r.lineas.map(l => (l.valor == null
            ? `<li class="ce-linea-texto">${esc(l.texto)}</li>`
            : `<li><span>${esc(l.texto)}</span> <b>${esc(valorLinea(l))}</b>${l.clase !== 'exacto' ? `<small>${esc(rotuloLinea(l))}</small>` : ''}</li>`)).join('')}</ul>
            ${r.avisos.length ? `<ul class="ce-avisos">${r.avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
            ${lineaFuentes(r.fuentes)}`;
    }

    function entenderHtml(t) {
        const fuente = t.fuente && FUENTES[t.fuente];
        return `${t.parrafos.map(p => `<p>${esc(p)}</p>`).join('')}
            ${t.id === 'hora-pico' ? tablaPuntas() : ''}
            ${t.cuenta ? cuentaHtml(CUENTAS[t.cuenta]) : ''}
            ${t.articulos.length ? `<ul class="ce-articulos">${t.articulos.map(a => `<li><a href="#art-${esc(a.id)}">${esc(a.texto)}</a></li>`).join('')}</ul>` : ''}
            ${fuente ? `<p class="ce-nota">Fuente: ${enlaceFuente(fuente)}. ${esc(fuente.emisor)}, ${esc(fechaFuente(fuente))}.</p>` : ''}`;
    }

    function llenarTarjeta(d) {
        const cuerpo = d.querySelector('[data-cuerpo]');
        if (!cuerpo || cuerpo.dataset.lleno) return;
        cuerpo.dataset.lleno = '1';
        cuerpo.innerHTML = d.dataset.ce === 'cuenta'
            ? cuentaHtml(CUENTAS[d.dataset.id])
            : entenderHtml(PARA_ENTENDER[estado.pestana].find(t => t.id === d.dataset.id));
        for (const caja of cuerpo.querySelectorAll('[data-cuenta]')) pintarCuenta(caja);
    }

    function tarjetasHtml() {
        const tarjeta = (tipo, id, titulo) => `<details class="ce-tarjeta" data-ce="${tipo}" data-id="${esc(id)}" data-abre="${tipo}-${esc(id)}"><summary>${esc(titulo)}</summary><div class="ce-tarjeta-cuerpo" data-cuerpo></div></details>`;
        const cuentas = cuentasDe(estado.pestana);
        const entender = PARA_ENTENDER[estado.pestana] ?? [];
        return `${cuentas.length ? `<section class="ce-seccion" aria-labelledby="ce-h-cuentas"><h2 class="ce-h2" id="ce-h-cuentas">Otras cuentas</h2><div class="ce-tarjetas">${cuentas.map(c => tarjeta('cuenta', c.id, c.titulo)).join('')}</div></section>` : ''}
            ${entender.length ? `<section class="ce-seccion" aria-labelledby="ce-h-entender"><h2 class="ce-h2" id="ce-h-entender">Para entender</h2><div class="ce-tarjetas">${entender.map(t => tarjeta('entender', t.id, t.titulo)).join('')}</div></section>` : ''}`;
    }

    const panelHtml = () => `
        <div class="ce-calculo bu-cristal">${conversorHtml()}<div class="ce-resultado" data-ce="resultado" aria-live="polite">${resultadoHtml()}</div></div>
        ${ajustarHtml()}
        <details class="ce-desplegable" data-ce="formula" data-abre="formula"><summary>Ver fórmula y fuente</summary><div class="ce-formula" data-ce="formula-cuerpo">${formulaHtml()}</div></details>
        <div class="ce-acciones"><button type="button" class="bu-btn bu-btn-contorno bu-btn-sm" data-ce="copiar" data-foco="copiar">Copiar</button><button type="button" class="bu-btn bu-btn-fantasma bu-btn-sm" data-ce="compartir" data-foco="compartir">Compartir</button><span class="ce-estado" role="status" data-ce="estado"></span></div>
        <div data-ce="manual-caja"></div>
        ${tarjetasHtml()}`;

    const $ = s => container.querySelector(`[data-ce="${s}"]`);

    function pintarResultado() {
        $('resultado').innerHTML = resultadoHtml();
        $('formula-cuerpo').innerHTML = formulaHtml();
        const errorValor = resultado.errores.find(e => e.campo === 'valor');
        $('aviso-valor').textContent = errorValor?.mensaje ?? resultado.avisoValor ?? '';
        const oficial = $('oficial');
        if (oficial) oficial.textContent = textoOficial() ?? '';
    }

    function pintarPanel() {
        const activo = document.activeElement?.closest?.('[data-foco]');
        const foco = activo && container.contains(activo) ? activo.dataset.foco : null;
        const abiertos = new Set([...container.querySelectorAll('details[open][data-abre]')].map(d => d.dataset.abre));
        resultado = calcular(estado);
        const panel = $('panel');
        panel.setAttribute('aria-labelledby', `ce-tab-${estado.pestana}`);
        panel.innerHTML = panelHtml();
        for (const d of panel.querySelectorAll('details[data-abre]')) {
            if (!abiertos.has(d.dataset.abre)) continue;
            d.open = true;
            if (d.matches('.ce-tarjeta')) llenarTarjeta(d);
        }
        pintarResultado();
        if (foco) container.querySelector(`[data-foco="${foco}"]`)?.focus();
    }

    function pintarPestanas() {
        for (const t of container.querySelectorAll('[data-ce="tab"]')) {
            const activa = t.dataset.pestana === estado.pestana;
            t.setAttribute('aria-selected', String(activa));
            t.tabIndex = activa ? 0 : -1;
        }
    }

    function pintarTodo() {
        resultado = calcular(estado);
        container.innerHTML = `<section class="ce-view">
            <header class="ce-cab"><h1 class="ce-titulo">${esc(TITULO)}</h1><p class="ce-sub">${esc(SUBTITULO)}</p></header>
            <div class="ce-atajos">${ATAJOS.map((a, i) => `<button type="button" class="bu-chip" data-atajo="${i}">${esc(a.titulo)}</button>`).join('')}</div>
            <div class="ce-tabs" role="tablist" aria-label="Energético">${tabsHtml()}</div>
            <div class="ce-panel" id="ce-panel" role="tabpanel" aria-labelledby="ce-tab-${estado.pestana}" data-ce="panel"></div>
            <p class="ce-pie">${esc(NOTA_PIE)}</p>
        </section>`;
        pintarPanel();
    }

    // ── Copy and share ──────────────────────────────────────────────────────
    function textoCopiar() {
        const r = resultado;
        if (!r.ok) return enlace();
        const tab = PESTANA[estado.pestana];
        const valor = r.ejemplo ? tab.ejemplo.valor : textoValor.trim();
        const una = (r.ejemplo ? tab.ejemplo.valor : leer(textoValor).valor) === 1;
        const producto = estado.producto ? ` de ${PRODUCTOS_PETROLIFEROS.find(p => p.id === estado.producto).nombre}` : '';
        const lineas = [`${valor} ${nombreUnidadEn(estado.pestana, estado.unidad, { una })}${producto}`, `= ${textoCifra(r.principal)}`, ...r.otras.filter(c => c.frente).map(c => `= ${textoCifra(c)}`), r.origen];
        if (r.fuentes.length) lineas.push(`Fuente: ${r.fuentes.map(f => `${f.titulo} (${f.emisor}, ${fechaFuente(f)})`).join('; ')}`);
        lineas.push(enlace());
        return plano(lineas.join('\n'));
    }

    function mostrarManual(texto) {
        const caja = $('manual-caja');
        caja.innerHTML = '<p class="ce-nota">Tu navegador no dejó copiar. Selecciona el texto y cópialo:</p><textarea class="ce-manual" data-ce="manual" readonly rows="5" aria-label="Texto para copiar"></textarea>';
        const area = $('manual');
        area.value = texto;
        area.focus();
        area.select?.();
    }

    function copiar(texto, mensaje) {
        const clip = globalThis.navigator?.clipboard;
        if (!clip?.writeText) { mostrarManual(texto); return; }
        clip.writeText(texto).then(() => { const e = $('estado'); if (e) e.textContent = mensaje; }, () => mostrarManual(texto));
    }

    function compartir() {
        const url = enlace();
        const nav = globalThis.navigator;
        if (typeof nav?.share === 'function') nav.share({ title: TITULO, text: plano(textoCifra(resultado.principal ?? { valor: 0, etiqueta: '' })), url }).catch(() => {});
        else copiar(url, 'Enlace copiado');
    }

    // ── Events ──────────────────────────────────────────────────────────────
    function irPestana(id, { foco = false } = {}) {
        cargar({ pestana: id });
        onRoute(calcHash({ pestana: id }));
        pintarPestanas();
        pintarPanel();
        if (foco) container.querySelector(`#ce-tab-${id}`)?.focus();
    }

    container.addEventListener('click', e => {
        const t = e.target.closest?.('[data-atajo], [data-ce="tab"], [data-ce="copiar"], [data-ce="compartir"], [data-ce="base"] button, [data-seg] button');
        if (!t || !container.contains(t)) return;
        if (t.dataset.atajo !== undefined) {
            cargar(ATAJOS[Number(t.dataset.atajo)].ruta);
            onRoute(calcHash(estadoEnlace()));
            pintarPestanas();
            pintarPanel();
        } else if (t.dataset.ce === 'tab') {
            if (t.dataset.pestana !== estado.pestana) irPestana(t.dataset.pestana);
        } else if (t.dataset.ce === 'copiar') {
            copiar(textoCopiar(), 'Copiado');
        } else if (t.dataset.ce === 'compartir') {
            compartir();
        } else if (t.closest('[data-ce="base"]')) {
            actualizar({ base: t.dataset.valor });
            pintarResultado();
            // The selector lives inside the repainted formula: give the keyboard focus back to the same button.
            container.querySelector(`[data-ce="base"] [data-valor="${t.dataset.valor}"]`)?.focus();
        } else {
            const clave = t.closest('[data-seg]').dataset.seg;
            textoAjustes[clave] = clave === 'dt' ? t.dataset.valor === 'si' : t.dataset.valor;
            actualizar();
            pintarPanel();
        }
    }, { signal: ac.signal });

    // Opening a card fills it the first time; toggle does not bubble, so listen while capturing.
    container.addEventListener('toggle', e => {
        const d = e.target;
        if (!d.matches?.('details.ce-tarjeta') || !d.open) return;
        llenarTarjeta(d);
        for (const caja of d.querySelectorAll('[data-cuenta]')) refrescarReloj(caja);
    }, { capture: true, signal: ac.signal });

    const campoDeCuenta = t => {
        const caja = t.closest('[data-cuenta]');
        const campoId = t.dataset.cuentaCampo;
        valoresCuenta[caja.dataset.cuenta][campoId] = t.type === 'checkbox' ? t.checked : t.value;
        if (t.type === 'date' || t.type === 'time') relojTocado.add(`${caja.dataset.cuenta}.${campoId}`);
        if (campoId === 'sistema') refrescarReloj(caja);
        pintarCuenta(caja);
    };

    container.addEventListener('input', e => {
        const t = e.target;
        if (t.tagName !== 'INPUT' || t.type === 'checkbox') return;
        if (t.dataset.cuentaCampo) { campoDeCuenta(t); return; }
        if (t.dataset.ce === 'valor') textoValor = t.value;
        else if (t.dataset.ce === 'horas') textoHoras = t.value;
        else if (t.dataset.ajuste) textoAjustes[t.dataset.ajuste] = t.value;
        else return;
        actualizar();
        pintarResultado();
    }, { signal: ac.signal });

    container.addEventListener('change', e => {
        const t = e.target;
        if (t.dataset.cuentaCampo && (t.tagName === 'SELECT' || t.type === 'checkbox')) { campoDeCuenta(t); return; }
        if (t.tagName !== 'SELECT') return;
        if (t.dataset.ce === 'unidad') actualizar({ unidad: t.value });
        else if (t.dataset.ce === 'producto') actualizar({ producto: t.value });
        else if (t.dataset.ce === 'magnitud') { textoAjustes = {}; actualizar({ magnitud: t.value, unidad: null }); }
        else if (t.dataset.ajuste) { textoAjustes[t.dataset.ajuste] = t.value; actualizar(); }
        else return;
        pintarPanel();
    }, { signal: ac.signal });

    container.addEventListener('keydown', e => {
        const t = e.target;
        if (t.getAttribute?.('role') === 'radio') {
            const botones = [...t.closest('[role="radiogroup"]').querySelectorAll('[role="radio"]')];
            const i = botones.indexOf(t);
            const paso = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: botones.length - 1 }[e.key];
            if (paso === undefined) return;
            e.preventDefault();
            const destino = botones[(paso + botones.length) % botones.length];
            // Focus first: the repaint gives the focus back to whatever held it.
            destino.focus();
            destino.click();
            return;
        }
        if (t.dataset?.ce !== 'tab') return;
        const ids = PESTANAS.map(p => p.id);
        const i = ids.indexOf(t.dataset.pestana);
        const destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[e.key];
        if (destino === undefined) return;
        e.preventDefault();
        irPestana(ids[(destino + ids.length) % ids.length], { foco: true });
    }, { signal: ac.signal });

    cargar(ruta);
    pintarTodo();

    return {
        show(nueva) {
            cargar(nueva);
            pintarPestanas();
            pintarPanel();
        },
        destroy() {
            ac.abort();
            container.innerHTML = '';
        },
    };
}
