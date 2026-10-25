/**
 * CENACE y el despacho eléctrico en el Mercado Eléctrico Mayorista (MEM):
 * Curva interactiva de orden de mérito con restricciones de seguridad, fijación del
 * Precio Marginal Local (PML), frecuencia a 60 Hz y liquidación MDA/MTR.
 * Construido con visual-explainer.
 */
import { themeOf, writeVeFigure } from "./_ve-shared.mjs";

const theme = themeOf();

const body = `
  <header>
    <p class="eyebrow">Control Operativo del SEN · LSE Arts. 111–124</p>
    <h1>La última central necesaria para cubrir la demanda fija el <span class="num">PML</span></h1>
    <p class="lead">El <b>CENACE</b> equilibra generación y consumo cada segundo a <b>60&nbsp;Hz</b> mediante el <b>despacho económico con restricciones de seguridad</b>, respetando la Confiabilidad y la prevalencia estatal.</p>
  </header>

  <section class="kpis" aria-label="Parámetros clave del despacho del CENACE">
    <div class="kpi">
      <span class="ve-label">Equilibrio instantáneo (Código de Red)</span>
      <span class="val"><span data-count="60">60</span><span class="unit">Hz síncronos</span></span>
      <ve-bars unit="GW" label="Capacidad ilustrativa por escalón de despacho">
        <ve-bar value="18" hot>② Base</ve-bar>
        <ve-bar value="22" hot>③ Ciclos</ve-bar>
        <ve-bar value="14">④ Punta</ve-bar>
      </ve-bars>
    </div>
    <div class="kpi">
      <span class="ve-label">Costo variable ilustrativo (Orden de mérito)</span>
      <span class="val"><span data-count="880">880</span><span class="unit">$/MWh ciclo</span></span>
      <ve-bars unit="$/MWh" label="Costo variable marginal por tecnología">
        <ve-bar value="120">② Renov/Hidro</ve-bar>
        <ve-bar value="880" hot>③ Ciclo comb.</ve-bar>
        <ve-bar value="2150">④ Turbogás</ve-bar>
      </ve-bars>
    </div>
    <div class="kpi">
      <span class="ve-label">Fórmula del Precio Marginal Local (PML)</span>
      <span class="val">3<span class="unit"> componentes</span></span>
      <ve-stack unit="%" label="Proporción ilustrativa de los componentes del PML en un nodo con congestión moderada">
        <ve-bar value="78" hot>Energía</ve-bar>
        <ve-bar value="8">Pérdidas</ve-bar>
        <ve-bar value="14">Congestión</ve-bar>
      </ve-stack>
    </div>
  </section>

  <figure class="ve-steps" id="cenace-stepper">
    <div class="ve-controls-bar">
      <div class="ve-slider-box">
        <label for="demanda-range">① Demanda nacional del SEN:</label>
        <input id="demanda-range" type="range" min="12" max="50" value="34" step="1">
        <span id="demanda-val">34 GW</span>
      </div>
      <span class="meta">Mueve la demanda para ver qué escalón fija el PML o haz clic en ①–⑤</span>
    </div>

    <div class="frame">
      <svg class="ve-svg" viewBox="0 0 960 440" role="img" aria-label="Curva de despacho por orden de mérito del CENACE a la izquierda (escalón 2 Base, escalón 3 Ciclo Combinado, escalón 4 Turbogás) cruzada por la línea de Demanda Nacional (1), y a la derecha la consola del CENACE (5) que calcula el Precio Marginal Local y despacha hacia la red a 60 Hz.">
        <!-- Panel izquierdo: Curva de Orden de Mérito -->
        <rect class="ve-zone" x="16" y="14" width="568" height="404" rx="10" data-s="1 2 3 4 5"/>
        <text class="ve-zone-title" x="32" y="34" data-s="1 2 3 4 5">CURVA DE DESPACHO POR ORDEN DE MÉRITO ($/MWh VS CAPACIDAD GW)</text>

        <!-- Ejes del gráfico -->
        <path class="ann" d="M68 68V352H556"/>
        <text class="ve-label" x="60" y="352" text-anchor="end">$0</text>
        <text class="ve-label" x="60" y="260" text-anchor="end">$900</text>
        <text class="ve-label" x="60" y="138" text-anchor="end">$2,200</text>
        <text class="ve-label" x="68" y="374">0 GW</text>
        <text class="ve-label" x="230" y="374">18 GW</text>
        <text class="ve-label" x="428" y="374">40 GW</text>
        <text class="ve-label" x="528" y="374">54 GW</text>

        <!-- Escalón 2: Despacho Base (0 a 18 GW) -->
        <g class="ve-n is-key" id="tier-base" data-n="2" data-s="2 3 4 5" data-ref="base" tabindex="0" role="button" aria-label="2. Despacho base: Renovables, Hidroeléctrica, Nuclear y Cogeneración obligada" transform="translate(68 296)">
          <rect class="sh" width="162" height="56" rx="4"/>
          <text class="ve-kind" x="81" y="16">ESCALÓN 1 · 0–18 GW</text>
          <text x="81" y="33">② Base y Limpias</text>
          <text class="sub" x="81" y="48">~$0–$180 / MWh</text>
        </g>
        <g class="ve-co" data-n="2" data-s="2 3 4 5" transform="translate(216 310)"><circle r="10"/><text>2</text></g>

        <!-- Escalón 3: Despacho Intermedio Ciclo Combinado (18 a 40 GW) -->
        <g class="ve-n is-key" id="tier-cc" data-n="3" data-s="3 4 5" data-ref="cc" tabindex="0" role="button" aria-label="3. Despacho intermedio: Ciclo combinado de gas natural" transform="translate(230 226)">
          <rect class="sh" width="198" height="126" rx="4"/>
          <text class="ve-kind" x="99" y="24">ESCALÓN 2 · 18–40 GW</text>
          <text x="99" y="54">③ Ciclo Combinado</text>
          <text class="sub" x="99" y="78">Gas natural · Firme</text>
          <text class="sub" x="99" y="100">~$850–$950 / MWh</text>
        </g>
        <g class="ve-co" data-n="3" data-s="3 4 5" transform="translate(414 240)"><circle r="10"/><text>3</text></g>

        <!-- Escalón 4: Pico y Reserva Turbogás (40 a 54 GW) -->
        <g class="ve-n" id="tier-peak" data-n="4" data-s="4 5" data-ref="peak" tabindex="0" role="button" aria-label="4. Pico y reserva: Turbogás y combustión interna de arranque rápido" transform="translate(428 116)">
          <rect class="sh" width="122" height="236" rx="4"/>
          <text class="ve-kind" x="61" y="30">ESCALÓN 3</text>
          <text x="61" y="68">④ Punta</text>
          <text class="sub" x="61" y="96">Turbogás</text>
          <text class="sub" x="61" y="120">Arranque</text>
          <text class="sub" x="61" y="140">rápido</text>
          <text class="sub" x="61" y="176">~$2,150/MWh</text>
        </g>
        <g class="ve-co" data-n="4" data-s="4 5" transform="translate(536 130)"><circle r="10"/><text>4</text></g>

        <!-- Línea horizontal de PML vigente -->
        <path id="pml-hline" class="ve-e is-hot" d="M68 226H564"/>
        <text id="pml-tag" class="ve-el" x="155" y="212">PML fijado por unidad marginal: $880/MWh</text>

        <!-- Línea vertical móvil de Demanda Nacional (1) -->
        <g id="demand-line-group" data-n="1" data-s="1 2 3 4 5" tabindex="0" role="button" aria-label="1. Consumo nacional (Demanda instantánea)" transform="translate(374 0)">
          <path class="ve-e is-hot" d="M0 68V352"/>
          <circle id="marginal-dot" cx="0" cy="226" r="7" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>
          <rect x="-72" y="46" width="144" height="26" rx="6" fill="var(--accent)"/>
          <text id="demand-svg-label" x="0" y="63" fill="#fff" font-size="11.5" font-weight="700" text-anchor="middle">① Demanda: 34 GW</text>
        </g>

        <!-- Panel derecho: Consola CENACE y Mercados del MEM (5) -->
        <rect class="ve-zone" x="604" y="14" width="340" height="404" rx="10" data-s="1 2 3 4 5"/>
        <text class="ve-zone-title" x="620" y="34" data-s="1 2 3 4 5">CONSOLA CENACE Y LIQUIDACIÓN MEM</text>

        <path data-flow="hit" data-every="550" d="M564 226H774V354"/>
        <g class="ve-dots" aria-hidden="true"></g>

        <g class="ve-n is-key" data-n="5" data-s="5" data-ref="pml" tabindex="0" role="button" aria-label="5. Fijación de PML nodal y despacho con restricciones de seguridad" transform="translate(624 52)">
          <rect class="sh" width="300" height="128" rx="8"/>
          <text class="ve-kind" x="150" y="20">FIJACIÓN DE PML NODAL · ART. 117 LSE</text>
          <text id="console-pml" x="150" y="48">$880 / MWh</text>
          <text id="console-unit" class="sub" x="150" y="74">Unidad marginal: ③ Ciclo Combinado</text>
          <text class="sub" x="150" y="96">PML = Energía + Pérdidas + Congestión</text>
          <text class="sub" x="150" y="114">Prevalencia estatal ≥ 54 %</text>
        </g>
        <g class="ve-co" data-n="5" data-s="5" transform="translate(908 68)"><circle r="10"/><text>5</text></g>

        <g class="ve-n" data-s="1 5" transform="translate(624 198)">
          <rect class="sh" width="300" height="92" rx="8"/>
          <text class="ve-kind" x="150" y="20">PRODUCTOS DEL MEM · ART. 112 LSE</text>
          <text x="150" y="42">MDA + MTR + Potencia + CEL</text>
          <text class="sub" x="150" y="63">• Día en Adelanto y Tiempo Real</text>
          <text class="sub" x="150" y="81">• Servicios Conexos (reservas 60 Hz)</text>
        </g>

        <g class="ve-n is-key" data-n="1" data-s="1 5" tabindex="0" role="button" aria-label="1. Consumo nacional: hogares, comercios e industria a 60 Hz" transform="translate(624 308)">
          <rect class="sh" width="300" height="88" rx="8"/>
          <text class="ve-kind" x="150" y="20">CONSUMO NACIONAL · 60 HZ</text>
          <text x="150" y="44">Suministro Básico y Calificado</text>
          <text id="console-load" class="sub" x="150" y="68">Carga atendida: 34,000 MW en tiempo real</text>
        </g>
        <g class="ve-co" data-n="1" data-s="1 5" transform="translate(908 324)"><circle r="10"/><text>1</text></g>
      </svg>
    </div>

    <div id="cenace-readout" class="ve-readout" aria-live="polite">
      Con <b>34 GW de demanda</b>, entran todas las centrales de <b>② Base</b> (18 GW) y 16 GW de <b>③ Ciclo Combinado</b>. La última unidad de ciclo combinado fija el <b>PML en ~$880/MWh</b>.
    </div>

    <div class="ve-player">
      <ol class="ve-cap">
        <li data-n="1/5"><b>① Consumo nacional (Demanda instantánea):</b> Hogares, comercios e industrias demandan electricidad segundo a segundo; el CENACE debe igualar la inyección a la carga para sostener exactamente 60 Hz.</li>
        <li data-n="2/5"><b>② Escalón 1 — Despacho Base y Obligado:</b> Entran primero las centrales con menor costo variable (solar, eólica, hidroeléctrica, nuclear y cogeneración con despacho obligado conforme al art. 43 de la LSE).</li>
        <li data-n="3/5"><b>③ Escalón 2 — Despacho Intermedio (Ciclo Combinado):</b> Las centrales térmicas de ciclo combinado a gas natural aportan potencia firme y flexible para acompañar la rampa diaria de demanda.</li>
        <li data-n="4/5"><b>④ Escalón 3 — Pico y Reserva (Turbogás):</b> En las horas punta de la tarde-noche o ante contingencias de red, el CENACE despacha unidades turbogás de arranque rápido y mayor costo variable.</li>
        <li data-n="5/5"><b>⑤ Fijación del PML y Restricciones de Seguridad:</b> La última central despachada fija el Precio Marginal Local (PML) de su nodo. Si una línea de transmisión se satura (congestión), se despacha generación local para proteger la red.</li>
      </ol>
      <button type="button" data-go="-1">← Anterior</button>
      <button type="button" data-play>▶ Paso a paso</button>
      <input type="range" min="0" max="4" value="4" aria-label="Paso de la explicación">
      <button type="button" data-go="1">Siguiente →</button>
    </div>
  </figure>
`;

const live = `
{
  const slider = document.getElementById("demanda-range");
  const valSpan = document.getElementById("demanda-val");
  const lineGroup = document.getElementById("demand-line-group");
  const dot = document.getElementById("marginal-dot");
  const svgLabel = document.getElementById("demand-svg-label");
  const hline = document.getElementById("pml-hline");
  const pmlTag = document.getElementById("pml-tag");
  const consolePml = document.getElementById("console-pml");
  const consoleUnit = document.getElementById("console-unit");
  const consoleLoad = document.getElementById("console-load");
  const readout = document.getElementById("cenace-readout");
  const tierBase = document.getElementById("tier-base");
  const tierCc = document.getElementById("tier-cc");
  const tierPeak = document.getElementById("tier-peak");

  function updateDemand() {
    const gw = Number(slider.value);
    valSpan.textContent = gw + " GW";
    // Map 0..54 GW to x = 68..540
    const x = Math.round(68 + (gw / 54) * 472);
    lineGroup.setAttribute("transform", "translate(" + x + " 0)");
    svgLabel.textContent = "① Demanda: " + gw + " GW";
    consoleLoad.textContent = "Carga atendida: " + (gw * 1000).toLocaleString("es-MX") + " MW en tiempo real";

    let y = 226, pml = 880, unitName = "③ Ciclo Combinado", msg = "";
    tierBase.classList.remove("is-key");
    tierCc.classList.remove("is-key");
    tierPeak.classList.remove("is-key");

    if (gw <= 18) {
      y = 296;
      pml = Math.round(140 + gw * 3);
      unitName = "② Base (Renovable / Hidro)";
      tierBase.classList.add("is-key");
      msg = "Con <b>" + gw + " GW de demanda baja</b>, basta el escalón <b>② Base</b> (renovables, hidroeléctrica y nuclear). El PML baja a <b>~$" + pml + "/MWh</b>.";
    } else if (gw <= 40) {
      y = 226;
      pml = Math.round(780 + (gw - 18) * 7);
      unitName = "③ Ciclo Combinado";
      tierBase.classList.add("is-key");
      tierCc.classList.add("is-key");
      msg = "Con <b>" + gw + " GW de demanda media</b>, operan toda la <b>② Base</b> (18 GW) y " + (gw - 18) + " GW de <b>③ Ciclo Combinado</b>, que fija el PML en <b>~$" + pml.toLocaleString("es-MX") + "/MWh</b>.";
    } else {
      y = 116;
      pml = Math.round(1850 + (gw - 40) * 45);
      unitName = "④ Turbogás (Hora Punta)";
      tierBase.classList.add("is-key");
      tierCc.classList.add("is-key");
      tierPeak.classList.add("is-key");
      msg = "Con <b>" + gw + " GW de demanda en hora punta</b>, entran los 3 escalones incluyendo <b>④ Turbogás de arranque rápido</b> (" + (gw - 40) + " GW), elevando el PML marginal a <b>~$" + pml.toLocaleString("es-MX") + "/MWh</b>.";
    }

    dot.setAttribute("cy", String(y));
    hline.setAttribute("d", "M68 " + y + "H564");
    pmlTag.setAttribute("y", String(y - 12));
    pmlTag.textContent = "PML fijado por unidad marginal: $" + pml.toLocaleString("es-MX") + "/MWh";
    consolePml.textContent = "$" + pml.toLocaleString("es-MX") + " / MWh";
    consoleUnit.textContent = "Unidad marginal: " + unitName;
    readout.innerHTML = msg;
  }

  slider?.addEventListener("input", updateDemand);
  updateDemand();
}
`;

writeVeFigure({
  id: "mercado-cenace",
  title: "CENACE y el despacho eléctrico (MEM)",
  theme,
  register: "blueprint",
  body,
  live,
});
