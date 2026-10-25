/**
 * Soberanía, PLADESHi y Orden de Prelación de Asignaciones en Hidrocarburos (LSH 2025):
 * Subsuelo de la Nación (Reservas 3P), 1.ª Prelación Desarrollo Propio (100 % PEMEX),
 * 2.ª Prelación Desarrollo Mixto (PEMEX >= 40 %), permisos SENER/CNE/ASEA y abasto nacional.
 * Construido con visual-explainer.
 */
import { themeOf, writeVeFigure } from "./_ve-shared.mjs";

const theme = themeOf();

const body = `
  <header>
    <p class="eyebrow">Exploración, Extracción y Soberanía · LSH y RLSH (2025)</p>
    <h1>Prelación de PEMEX y mínimo del <span class="num">40&nbsp;%</span> en Asignaciones de Desarrollo Mixto</h1>
    <p class="lead">El subsuelo es propiedad inalienable de la Nación (art.&nbsp;27 CPEUM). La <b>SENER</b> privilegia primero el <b>Desarrollo Propio de PEMEX</b> y en segundo lugar el <b>Desarrollo Mixto</b>, orientando la extracción al abasto de las refinerías nacionales.</p>
  </header>

  <section class="kpis" aria-label="Indicadores clave de la Ley del Sector Hidrocarburos 2025">
    <div class="kpi">
      <span class="ve-label">Desarrollo Mixto (LSH arts. 24 y 31)</span>
      <span class="val"><span data-count="40">40</span><span class="unit">% mín. PEMEX</span></span>
      <ve-waffle value="40" note="≤ 60 % socio privado" label="En toda Asignación para Desarrollo Mixto, PEMEX conserva al menos 40 de cada 100 partes de interés de participación"></ve-waffle>
    </div>
    <div class="kpi">
      <span class="ve-label">Orden de prelación legal (LSH art. 11)</span>
      <span class="val"><span data-count="100">100</span><span class="unit">% prop. Nación</span></span>
      <ve-bars unit="%" label="Participación de PEMEX según modalidad de extracción">
        <ve-bar value="100" hot>1° Des. Propio</ve-bar>
        <ve-bar value="40" hot>2° Des. Mixto</ve-bar>
      </ve-bars>
    </div>
    <div class="kpi">
      <span class="ve-label">Soberanía de refinación (PLADESHi)</span>
      <span class="val"><span data-count="1.8">1.8</span><span class="unit">Mbd meta</span></span>
      <ve-bars unit="Mbd" label="Destino prioritario del crudo extraído hacia el Sistema Nacional de Refinación">
        <ve-bar value="1.8" hot>SNR (7 ref.)</ve-bar>
        <ve-bar value="1.0">Restit. 3P</ve-bar>
      </ve-bars>
    </div>
  </section>

  <figure class="ve-steps" id="lsh-stepper">
    <div class="ve-controls-bar" role="group" aria-label="Filtrar modalidad en hidrocarburos">
      <div class="ve-chips">
        <button type="button" data-mode="all" aria-pressed="true">Cadena integral LSH</button>
        <button type="button" data-mode="sub" aria-pressed="false" data-ref="sub">① Subsuelo 3P</button>
        <button type="button" data-mode="propio" aria-pressed="false" data-ref="propio">② 1° Desarrollo Propio</button>
        <button type="button" data-mode="mixto" aria-pressed="false" data-ref="mixto">③ 2° Desarrollo Mixto (≥40%)</button>
        <button type="button" data-mode="abasto" aria-pressed="false" data-ref="abasto">⑤ Refinación y Abasto</button>
      </div>
      <span class="meta">Haz clic en cualquier bloque numerado ①–⑤ para ver su detalle</span>
    </div>

    <div class="frame">
      <svg class="ve-svg" viewBox="0 0 960 490" role="img" aria-label="Diagrama de la Ley del Sector Hidrocarburos 2025: Rectoría SENER (PLADESHi), CNE y ASEA arriba; a la izquierda el Subsuelo de la Nación con reservas 1P, 2P y 3P; al centro el orden de prelación (1° Asignación de Desarrollo Propio 100% PEMEX y 2° Asignación de Desarrollo Mixto con PEMEX >= 40%); a la derecha el destino prioritario en el Sistema Nacional de Refinación y el abasto interno.">
        <!-- Zonas de jurisdicción con margen amplio -->
        <rect class="ve-zone" x="16" y="12" width="928" height="106" rx="10" data-s="1 2 3 4 5"/>
        <text class="ve-zone-title" x="32" y="31" data-s="1 2 3 4 5">GOBERNANZA SECTORIAL · SENER (PLADESHi) · CNE (PERMISOS) · ASEA Y SHCP</text>

        <rect class="ve-zone" x="16" y="164" width="222" height="310" rx="10" data-s="1 2 3 4 5"/>
        <text class="ve-zone-title" x="32" y="185" data-s="1 2 3 4 5">ART. 27 CPEUM · SUBSUELO</text>

        <rect class="ve-zone" x="262" y="164" width="404" height="310" rx="10" data-s="2 3 4 5"/>
        <text class="ve-zone-title" x="278" y="185" data-s="2 3 4 5">UPSTREAM · PRELACIÓN OBLIGATORIA (LSH ART. 11)</text>

        <rect class="ve-zone" x="690" y="164" width="254" height="310" rx="10" data-s="4 5"/>
        <text class="ve-zone-title" x="706" y="185" data-s="4 5">MID/DOWNSTREAM · SOBERANÍA</text>

        <!-- Rutas animadas de flujo de hidrocarburos -->
        <path data-flow="hit" data-every="420" d="M128 265H320V250H720"/>
        <path data-flow="hit" data-every="650" d="M128 365H320V365H720"/>

        <!-- Flechas de gobernanza en canal libre (y=106 a y=200) -->
        <path class="ve-e is-async" data-s="1 2 3" data-ref="gob propio mixto" d="M176 106V200"/>
        <text class="ve-el r" data-s="1 2 3" x="184" y="146">Otorga Asignación</text>

        <path class="ve-e is-async" data-s="4 5" data-ref="gob abasto" d="M480 106V146H816V200"/>
        <text class="ve-el r" data-s="4 5" x="490" y="138">Permisos art. 76</text>

        <!-- Flechas desde Subsuelo hacia Prelación -->
        <path class="ve-e is-hot" data-s="2 3 4 5" data-ref="sub propio" d="M220 252H284"/>
        <text class="ve-el" data-s="2 3 4 5" x="252" y="242">1°</text>

        <path class="ve-e is-hot" data-s="3 4 5" data-ref="sub mixto" d="M220 368H284"/>
        <text class="ve-el" data-s="3 4 5" x="252" y="358">2°</text>

        <!-- Flechas hacia Refinación y Abasto -->
        <path class="ve-e is-hot" data-s="2 5" data-ref="propio abasto" d="M644 252H708"/>
        <path class="ve-e is-hot" data-s="3 5" data-ref="mixto abasto" d="M644 368H708"/>

        <g class="ve-dots" aria-hidden="true"></g>

        <!-- Nodos de Gobernanza (4) -->
        <g class="ve-n is-key" data-n="4" data-s="1 4" data-ref="gob" tabindex="0" role="button" aria-label="4. SENER: PLADESHi vinculante, Asignaciones y permisos de refinación" transform="translate(32 44)">
          <rect class="sh" width="288" height="62" rx="8"/>
          <text class="ve-kind" x="144" y="17">RECTORÍA · LSH ARTS. 7, 11 Y 76-I</text>
          <text x="144" y="36">SENER (PLADESHi)</text>
          <text class="sub" x="144" y="52">Asignaciones, Refinación y Com. Ext.</text>
        </g>
        <g class="ve-co" data-n="4" data-s="1 4" transform="translate(304 60)"><circle r="10"/><text>4</text></g>

        <g class="ve-n" data-n="4" data-s="4" data-ref="gob abasto" tabindex="0" role="button" aria-label="4. CNE: Permisos de transporte, almacenamiento y expendio" transform="translate(336 44)">
          <rect class="sh" width="288" height="62" rx="8"/>
          <text class="ve-kind" x="144" y="17">REGULADOR · LSH ART. 76 FR. II</text>
          <text x="144" y="36">CNE + CENAGAS</text>
          <text class="sub" x="144" y="52">Ductos, TAR, Distribución y Expendio</text>
        </g>

        <g class="ve-n" data-n="4" data-s="4" data-ref="gob" tabindex="0" role="button" aria-label="4. ASEA y SHCP: Seguridad industrial y fiscalización" transform="translate(640 44)">
          <rect class="sh" width="288" height="62" rx="8"/>
          <text class="ve-kind" x="144" y="17">SEGURIDAD Y FISCALIZACIÓN</text>
          <text x="144" y="36">ASEA + SHCP (Art. 32)</text>
          <text class="sub" x="144" y="52">Seguridad operativa y costos mixtos</text>
        </g>

        <!-- Nodo 1: Subsuelo de la Nación (Datastore / Yacimiento 3P) -->
        <g class="ve-n is-key" data-n="1" data-s="1" data-ref="sub" tabindex="0" role="button" aria-label="1. Subsuelo de la Nación: Reservas 1P, 2P y 3P" transform="translate(34 202)">
          <path class="sh" d="M0 16V232A93 14 0 0 0 186 232V16"/>
          <ellipse class="sh lid" cx="93" cy="16" rx="93" ry="14"/>
          <text class="ve-kind" x="93" y="48">DOMINIO DIRECTO</text>
          <text x="93" y="72">Subsuelo Nacional</text>
          <text class="sub" x="93" y="102">• 1P Probadas (90 %)</text>
          <text class="sub" x="93" y="126">• 2P Probables (50 %)</text>
          <text class="sub" x="93" y="150">• 3P Posibles (10 %)</text>
          <text class="sub" x="93" y="192">Restitución obligatoria</text>
        </g>
        <g class="ve-co" data-n="1" data-s="1" transform="translate(204 222)"><circle r="10"/><text>1</text></g>

        <!-- Nodo 2: 1.ª Prelación Asignación para Desarrollo Propio -->
        <g class="ve-n is-key" data-n="2" data-s="2" data-ref="propio" tabindex="0" role="button" aria-label="2. Primera prelación: Asignación para Desarrollo Propio PEMEX" transform="translate(284 200)">
          <rect class="sh" width="360" height="98" rx="8"/>
          <text class="ve-kind" x="180" y="20">1.ª PRELACIÓN · LSH ARTS. 11, 13 Y 17</text>
          <text x="180" y="43">Asignación para Desarrollo Propio</text>
          <text class="sub" x="180" y="65">• Titular y operador 100 % PEMEX</text>
          <text class="sub" x="180" y="83">• Contratos de servicios solo en efectivo</text>
        </g>
        <g class="ve-co" data-n="2" data-s="2" transform="translate(628 216)"><circle r="10"/><text>2</text></g>

        <!-- Nodo 3: 2.ª Prelación Asignación para Desarrollo Mixto -->
        <g class="ve-n is-key" data-n="3" data-s="3" data-ref="mixto" tabindex="0" role="button" aria-label="3. Segunda prelación: Asignación para Desarrollo Mixto con PEMEX >= 40%" transform="translate(284 316)">
          <rect class="sh" width="360" height="102" rx="8"/>
          <text class="ve-kind" x="180" y="20">2.ª PRELACIÓN · LSH ARTS. 24–36 (≥ 40 %)</text>
          <text x="180" y="43">Asignación para Desarrollo Mixto</text>
          <text class="sub" x="180" y="65">• Asignación exclusiva estatal (art. 26)</text>
          <text class="sub" x="180" y="83">• PEMEX ≥ 40 % + Participante privado</text>
        </g>
        <g class="ve-co" data-n="3" data-s="3" transform="translate(628 332)"><circle r="10"/><text>3</text></g>

        <!-- Cota de participación mínima en Desarrollo Mixto -->
        <g class="ve-dim is-key" data-s="3 4 5">
          <path class="ext" d="M284 426V452M644 426V452"/>
          <path class="ln" d="M284 446H644M280 450l8-8M640 450l8-8"/>
          <text x="464" y="440">Participación mínima PEMEX ≥ 40 % (LSH art. 31)</text>
        </g>

        <!-- Nodo 5: Refinación y Abasto Nacional -->
        <g class="ve-n is-key" data-n="5" data-s="5" data-ref="abasto" tabindex="0" role="button" aria-label="5. Sistema Nacional de Refinación (~1.8 Mbd) y Abasto Interno" transform="translate(708 200)">
          <rect class="sh" width="220" height="106" rx="8"/>
          <text class="ve-kind" x="110" y="20">PERMISO SENER · ART. 76-I</text>
          <text x="110" y="43">Refinación (~1.8 Mbd)</text>
          <text class="sub" x="110" y="65">7 Refinerías del SNR</text>
          <text class="sub" x="110" y="84">Abasto interno prioritario</text>
        </g>
        <g class="ve-co" data-n="5" data-s="5" transform="translate(912 216)"><circle r="10"/><text>5</text></g>

        <g class="ve-n" data-n="5" data-s="4 5" data-ref="abasto" tabindex="0" role="button" aria-label="5. Transporte por ducto, TAR y Expendio al público (Permiso CNE)" transform="translate(708 324)">
          <rect class="sh" width="220" height="106" rx="8"/>
          <text class="ve-kind" x="110" y="20">PERMISO CNE · ART. 76-II</text>
          <text x="110" y="43">Logística y Expendio</text>
          <text class="sub" x="110" y="65">Ductos y TAR (5 días)</text>
          <text class="sub" x="110" y="84">Estaciones y trazabilidad</text>
        </g>
      </svg>
    </div>

    <div class="ve-player">
      <ol class="ve-cap">
        <li data-n="1/5"><b>① Subsuelo de la Nación (Art. 27 CPEUM):</b> Todos los hidrocarburos en el subsuelo son propiedad inalienable e imprescriptible de la Nación. El PLADESHi exige restituir las reservas 1P, 2P y 3P.</li>
        <li data-n="2/5"><b>② 1.ª Prelación — Asignación para Desarrollo Propio (LSH arts. 11 y 13):</b> La SENER privilegia primero asignar áreas a PEMEX para que explore y extraiga al 100 %, contratando servicios solo en efectivo (art. 17).</li>
        <li data-n="3/5"><b>③ 2.ª Prelación — Asignación para Desarrollo Mixto (LSH arts. 24–36):</b> Cuando PEMEX requiere complementar capacidades técnicas o financieras, celebra un Contrato Mixto manteniendo la titularidad de la Asignación (art. 26) y al menos <b>40 % de participación</b> (art. 31).</li>
        <li data-n="4/5"><b>④ División de Facultades (SENER, CNE y ASEA):</b> SENER otorga Asignaciones y permisos de refinación e importación/exportación (art. 76 fr. I); CNE permisiona transporte, almacenamiento y expendio (art. 76 fr. II); ASEA regula seguridad y ambiente.</li>
        <li data-n="5/5"><b>⑤ Soberanía y Abasto Interno (~1.8 Mbd):</b> La producción nacional se orienta prioritariamente a abastecer las 7 refinerías del Sistema Nacional de Refinación y la petroquímica nacional.</li>
      </ol>
      <button type="button" data-go="-1">← Anterior</button>
      <button type="button" data-play>▶ Paso a paso</button>
      <input type="range" min="0" max="4" value="4" aria-label="Paso de la explicación">
      <button type="button" data-go="1">Siguiente →</button>
    </div>
  </figure>

  <section aria-labelledby="lsh-cases-title">
    <div class="sec-head">
      <p class="ve-label caps">Reglas de operación y permisos (LSH 2025)</p>
      <h2 id="lsh-cases-title">Comparativa de figuras en Exploración, Extracción y Refinación</h2>
    </div>
    <div class="cases">
      <article class="case" data-st="ok" data-n="2" data-ref="propio" tabindex="0" role="button">
        <span class="chip ok">② 1.ª Prelación · Art. 13 LSH</span>
        <h3>Asignación de Desarrollo Propio</h3>
        <svg class="ve-mini" viewBox="0 0 260 76" role="img" aria-label="SENER asigna a PEMEX al 100% y terceros solo prestan servicios en efectivo">
          <path class="ve-e is-st" d="M116 38H144"/>
          <g class="ve-n is-st" transform="translate(6 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">PEMEX 100 %</text><text class="sub" x="55" y="41">Asignatario</text></g>
          <g class="ve-n" transform="translate(144 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">Servicios</text><text class="sub" x="55" y="41">Pago en efectivo</text></g>
        </svg>
        <p class="ve-label">PEMEX ejecuta con capacidades propias; los contratos de obra o servicios se pagan exclusivamente en efectivo (art. 17).</p>
      </article>

      <article class="case" data-st="warn" data-n="3" data-ref="mixto" tabindex="0" role="button">
        <span class="chip warn">③ 2.ª Prelación · Arts. 24–36 LSH</span>
        <h3>Asignación de Desarrollo Mixto</h3>
        <svg class="ve-mini" viewBox="0 0 260 76" role="img" aria-label="PEMEX conserva al menos 40% y el participante hasta 60% bajo Contrato Mixto">
          <path class="ve-e is-st" d="M116 38H144"/>
          <g class="ve-n is-st" transform="translate(6 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">PEMEX ≥ 40 %</text><text class="sub" x="55" y="41">Titular único</text></g>
          <g class="ve-n" transform="translate(144 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">Socio ≤ 60 %</text><text class="sub" x="55" y="41">Capital / Tecnol.</text></g>
        </svg>
        <p class="ve-label">PEMEX no puede ceder ni gravar la Asignación (art. 26), mantiene ≥ 40 % (art. 31) y SENER/SHCP fiscalizan costos (art. 32).</p>
      </article>

      <article class="case" data-st="ok" data-n="4" data-ref="gob abasto" tabindex="0" role="button">
        <span class="chip ok">④ y ⑤ Permisos · Art. 76 LSH</span>
        <h3>Ventanilla SENER vs. Ventanilla CNE</h3>
        <svg class="ve-mini" viewBox="0 0 260 76" role="img" aria-label="SENER permisiona refinación e importación; CNE permisiona transporte, almacenamiento y expendio">
          <path class="ve-e is-st" d="M116 38H144"/>
          <g class="ve-n is-st" transform="translate(6 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">SENER</text><text class="sub" x="55" y="41">Refin. y Com. Ext.</text></g>
          <g class="ve-n is-st" transform="translate(144 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">CNE</text><text class="sub" x="55" y="41">Ductos y Expendio</text></g>
        </svg>
        <p class="ve-label">SENER permisiona tratamiento, refinación, procesamiento de gas e importación/exportación; CNE regula transporte, TAR y gasolineras.</p>
      </article>
    </div>
  </section>
`;

const live = `
{
  const chips = [...document.querySelectorAll(".ve-chips [data-mode]")];
  const mapPart = { sub: 1, propio: 2, mixto: 3, abasto: 5 };
  chips.forEach((btn) => {
    btn.addEventListener("click", () => {
      chips.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      const mode = btn.dataset.mode;
      const svg = document.querySelector(".ve-steps svg");
      const allRef = [...document.querySelectorAll("[data-ref]")];
      if (mode === "all") {
        svg?.classList.remove("has-lit");
        allRef.forEach((el) => el.classList.remove("is-lit"));
      } else {
        svg?.classList.add("has-lit");
        allRef.forEach((el) => {
          const refs = (el.dataset.ref || "").split(" ");
          el.classList.toggle("is-lit", refs.includes(mode));
        });
        if (mapPart[mode] && parent !== window) {
          parent.postMessage({ type: "concepto-part", id: "cadena-hidrocarburos", figura: "cadena-hidrocarburos", n: mapPart[mode] }, location.origin);
        }
      }
    });
  });
}
`;

writeVeFigure({
  id: "cadena-hidrocarburos",
  title: "Soberanía, PLADESHi y Asignaciones (Desarrollo Propio vs. Mixto)",
  theme,
  register: "blueprint",
  body,
  live,
});
