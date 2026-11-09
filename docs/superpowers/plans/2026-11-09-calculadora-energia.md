# Calculadora de energía: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sección `#calculadora` donde cualquiera escribe un número de energía en México y entiende cuánto es y qué significa, con fórmula, fuente y fecha a un toque.

**Architecture:** Motor puro en `src/lib/calc/`, sin red ni Supabase: `calcular(estado)` devuelve cifras con clase, fuente y año. `calculadora-view.js` solo las pinta. `ui.js` carga la vista con `import()` tardío, igual que Polos.

**Tech Stack:** JS sin framework, Vite, CSS con tokens Búho, Vitest (jsdom). Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-11-09-calculadora-energia-design.md`. Léelo antes de cada tarea. Datos y fórmulas: `docs/calculadora/informe.md` y `docs/calculadora/notas/`.

## Decisiones que este plan agrega al spec

Se presentan al usuario junto con el plan. Si alguna se rechaza, se corrige aquí antes de ejecutar.

1. **Dos módulos más.** `cuentas.js` (Otras cuentas) y `textos.js` (Para entender) salen de `pestanas.js`, que quedaría demasiado grande.
2. **Tipos ampliados.** Cifra suma `frente`, `nota`, `emisor` y `etiquetaUna` (singular). Salida suma `ejemplo` y `origen`, que es la línea «Valor publicado por SENER, 2026». El CO₂ usa unidades propias, `kgco2` y `tco2`, para no confundirse con la masa del combustible.
3. **Más parámetros de enlace.** Además de `v u p b t`: `h` horas, `mg` magnitud, `d` densidad, `c` condición, `pc` poder calorífico, `k` superior o inferior, `m` mezcla, `pm` manométrica o absoluta, `a` altitud, `dt` diferencia de temperatura.
4. **Comparación a 2 cifras, como dice el spec.** La maqueta decía «318 mil tanques»; sale «320 mil». Por debajo de 1 se da porcentaje: «el 53 % de la energía de un año de un usuario residencial».
5. **Poder calorífico fuera del rango de la NOM.** Calcula con lo escrito y avisa, porque la Zona Sur y gases reales pueden salir del rango. Cero o negativo da aviso y no calcula.
6. **`tests/shell-nav.test.js`.** Además de los dos ids, pasa de siete a ocho destinos.
7. **Posición en «Más».** Calculadora va antes de «Compartir la app».

## Global Constraints

- Rama `feat/calculadora-energia`, este worktree. Solo `git add` con rutas; nunca `git add .`. Todo mensaje de commit termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Mensajes en inglés, estilo `feat: …`.
- Sin push, PR ni merge hasta que el usuario lo pida. Un push a `main` publica en menos de un minuto.
- Pruebas con `npx vitest run` (nunca `npm test`, que se queda vigilando).
- Sin dependencias nuevas. Nada de `src/lib/calc/` ni de la vista usa red o Supabase.
- Se calcula con `Number` y se redondea solo al mostrar. Factores como fracción de enteros seguros.
- Ningún cálculo mezcla base oficial y física. Los valores por defecto son los del spec, sección «Valores por defecto»; no se recalculan ni se redondean.
- CSS solo con tokens: sin hex y sin `!important` en `calculadora.css`. `tests/design-leftovers.test.js` no sube sus topes (1170 y 398).
- Acción principal en tinta (`--accion`); pestaña activa y seleccionado en guinda (`--rojo`).
- Textos públicos en español llano, sin «acervo», «instrumento» ni «DOF» (se escribe «Diario Oficial»). «Error» no se usa para valores oficiales: se dice «valor publicado» y «referencia física». Sin «billón» ni «trillón». Nunca «M» sola ni «FP». La primera vez en cada tarjeta se desarrollan SAE (Sistema de Almacenamiento de Energía), RNT (Red Nacional de Transmisión), RGD (Redes Generales de Distribución), CEL (Certificados de Energías Limpias) y PML (Precio Marginal Local).
- Espacio de miles: `\u00A0`. Punto decimal. Signo menos en pantalla: `−` (U+2212).
- Todo texto de la persona o del enlace pasa por escape o `textContent`.
- Toda fuente nace con `cotejo: 'pendiente'`. Solo cambia a `'humano'` con aprobación del usuario en la Tarea 15.

## Review Focus

1. **Enlace compartido con datos que no van juntos** (`u=mw` en Gas LP, `p=gasolina` en Gas natural, `u=l` con coque, `c=zzz`): se ignora lo inválido y sale el valor por defecto, sin romperse. Prueba en Tareas 8 y 11.
2. **Número a medio escribir** (`1,`, `.`, `-`, `1 234,5`, pegado con espacios): no rompe, no da `NaN`, y el campo no pierde el foco al recalcular. Prueba en Tareas 1 y 11.
3. **Cero donde se divide** (relación DC/AC, factor de potencia, eficiencia, rotor, poder calorífico, diámetro en 0) y valor 0 en el conversor: da aviso o «0», nunca `Infinity` ni `NaN`, y sin comparación. Prueba en Tareas 8 y 9.
4. **Cambiar a coque teniendo litros, o volver**: la unidad pasa a una válida y el resultado sigue correcto. Prueba en Tareas 8 y 11.
5. **Fecha en frontera de temporada, zona horaria y fechas imposibles** en «¿En qué periodo estoy?»: `2026-04-05` es verano en cualquier zona; `2026-02-30` y `24:00` dan aviso. Prueba en Tarea 6.

---

### Task 1: Preparar la rama y dar formato a los números

**Files:** Create `src/lib/calc/formato.js`; Test `tests/calc-formato.test.js`.

**Interfaces — Produces:**
- `formatoClase(valor, clase) -> string`: cifras significativas por clase (`exacto` 7, `oficial` 4, `tipico` 3, `convencion` 3).
- `formatoFrente(valor) -> string`: 3 cifras con palabra de escala.
- `textoFrente(cifra) -> string`: número más `etiqueta`, con «de» solo tras palabra de escala, y `etiquetaUna` si se muestra «1» sin escala.
- `formatoComparacion(n) -> string`: 2 cifras; de 10 000 a un millón usa «mil» («320 mil»).
- `rotulo({ clase, anio, nota, emisor = 'SENER' }) -> string`.
- `leerNumero(texto) -> { vacio, ok, valor, aviso }`.

- [ ] **Step 1: Instalar y medir la línea base**

Run: `npm ci`, luego `npx vitest run` y `npm run lint`.
Expected: pasan. Si algo falla antes de tocar código, anotarlo y avisar al usuario; no se corrige aquí.

- [ ] **Step 2: Guardar spec, investigación y plan**

```bash
git add docs/superpowers/specs/2026-11-09-calculadora-energia-design.md docs/superpowers/plans/2026-11-09-calculadora-energia.md docs/calculadora
git commit -m "docs: add energy calculator spec, research and plan"
```

- [ ] **Step 3: Escribir las pruebas que fallan**

```js
const NB = '\u00A0';
it.each([[15898729.5, '15.9 millones'], [561.3, '561'], [38898, `38${NB}900`], [1, '1'], [0, '0'], [0.5388, '0.539'],
  [1e6, '1 millón'], [999999, '1 millón'], [1.5e9, '1.5 mil millones'], [1e9, 'mil millones'],
  [2.5e12, '2.5 millones de millones'], [1e15, '1×10¹⁵'], [1.23e-5, '1.23×10⁻⁵'], [-10, '−10']])('formatoFrente %s', (v, t) => expect(formatoFrente(v)).toBe(t));
it.each([[1234567.891, 'exacto', `1${NB}234${NB}568`], [3.6, 'exacto', '3.6'], [158.987294928, 'exacto', '158.9873'], [0.00662447, 'exacto', '0.00662447'],
  [38.148, 'oficial', '38.15'], [38.64, 'tipico', '38.6'], [0.54, 'convencion', '0.54'], [1e20, 'exacto', '1×10²⁰']])('formatoClase %s %s', (v, c, t) => expect(formatoClase(v, c)).toBe(t));
it('textoFrente', () => {
  expect(textoFrente({ valor: 15898729.5, etiqueta: 'litros al día' })).toBe('15.9 millones de litros al día');
  expect(textoFrente({ valor: 159, etiqueta: 'litros' })).toBe('159 litros');
  expect(textoFrente({ valor: 1, etiqueta: 'megawatts-hora', etiquetaUna: 'megawatt-hora' })).toBe('1 megawatt-hora');
});
it.each([[317975, '320 mil'], [1200, `1${NB}200`], [1.5e6, '1.5 millones'], [530, '530'], [12.4, '12']])('formatoComparacion %s', (v, t) => expect(formatoComparacion(v)).toBe(t));
it('rotulo', () => {
  expect(rotulo({ clase: 'oficial', anio: 2026 })).toBe('Valor publicado por SENER, 2026');
  expect(rotulo({ clase: 'oficial', anio: 2015, emisor: 'Semarnat' })).toBe('Valor publicado por Semarnat, 2015');
  expect(rotulo({ clase: 'exacto' })).toBe('Exacto por definición');
  expect(rotulo({ clase: 'tipico' })).toBe('Valor típico, puede variar');
  expect(rotulo({ clase: 'convencion', nota: 'las tablas de precios' })).toBe('Convención usada en las tablas de precios');
});
it.each([['1 234.5', 1234.5], ['1,234.5', 1234.5], ['1234.5', 1234.5], ['1.234', 1.234], ['-5', -5], ['−5', -5], ['.5', 0.5], ['1.', 1], [' 12 ', 12], ['1\u00A0234', 1234], ['1,234,567', 1234567]])('lee sin aviso %s', (t, v) => {
  expect(leerNumero(t)).toMatchObject({ ok: true, valor: v }); expect(leerNumero(t).aviso).toBeFalsy();
});
it.each([['1,234', 1234, '1 234'], ['1,5', 1.5, '1.5'], ['12,34', 12.34, '12.34'], ['1 234,5', 1234.5, '1 234.5']])('lee y avisa %s', (t, v, dice) => {
  const r = leerNumero(t); expect(r.valor).toBe(v); expect(r.aviso.replaceAll(NB, ' ')).toContain(dice);
});
it.each(['abc', '-', '.', ',', '1,', '1.234.567', '1e6', 'Infinity', 'NaN', '0x10', '<b>1</b>', '1'.repeat(400)])('rechaza %s', t => expect(leerNumero(t)).toMatchObject({ ok: false, vacio: false }));
it('vacío', () => expect(leerNumero('  ')).toMatchObject({ ok: false, vacio: true }));
```

- [ ] **Step 4: Verificar que fallan**

Run: `npx vitest run tests/calc-formato.test.js`
Expected: FAIL, el módulo no existe.

- [ ] **Step 5: Implementar `src/lib/calc/formato.js`**

Redondear primero y elegir escala después, para que 999 999 sea «1 millón». Notación ×10ⁿ para |v| ≥ 1e15 o 0 < |v| < 1e-3. Sin ceros finales. Sin `Intl`. El aviso de lectura es `Lo leímos como <número formateado>.`. Coma seguida de tres dígitos en grupos válidos es miles; una coma de otra forma es decimal con aviso. Un resultado no finito se rechaza.

- [ ] **Step 6: Verificar que pasan**

Run: `npx vitest run tests/calc-formato.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/calc/formato.js tests/calc-formato.test.js
git commit -m "feat: add number formatting and parsing for the energy calculator"
```

### Task 2: Unidades

**Files:** Create `src/lib/calc/unidades.js`; Test `tests/calc-unidades.test.js`.

**Interfaces — Produces:**
- `UNIDADES`: mapa `id -> { id, nombre, simbolo, magnitud, factor: [num, den], oficial, clase?, nota? }`. `clase` por defecto `exacto`.
- `MAGNITUDES`: `['energia','potencia','presion','temperatura','masa','volumen','flujo','velocidad','area']`.
- `unidadesDe(magnitud) -> Unidad[]`, `convertir(valor, desde, hacia) -> number` (lanza `RangeError` con magnitudes distintas o temperatura).
- `convertirTemperatura(valor, desde, hacia, { diferencia = false } = {}) -> number`, `bajoCeroAbsoluto(valor, unidad) -> boolean`.

Unidades base y ids:

| Magnitud (base) | Ids |
|---|---|
| energia (J) | `j kj mj gj tj pj wh kwh mwh gwh twh cal kcal btu mmbtu therm therm-us tep` |
| potencia (W) | `w kw mw gw tw hp hp-e cv kcal-h btu-h tr` |
| presion (Pa) | `pa kpa mpa bar atm kgf-cm2 psi inh2o mh2o torr` |
| temperatura | `c f k`, sin factor |
| masa (kg) | `kg t lb ton-corta ton-larga` |
| volumen (L) | `l m3 gal bl mmb pc mpc mmpc bcf` |
| flujo (L/d) | `l-min m3-h gpm bpd mbd mmpcd` |
| velocidad (m/s) | `m-s km-h mph nudo ft-s` |
| area (m²) | `m2 ha km2 ft2 acre` |

Definiciones de partida: ft 0.3048 m; in 0.0254 m; lb 0.45359237 kg; g₀ 9.80665; galón 231 in³; barril 42 galones; Btu 1 055.05585262 J; cal 4.1868 J. Fracciones que se desbordan si se arman sin simplificar: psi `[44482216152605, 6451600000]`, TR `[1055055852620, 300000000]`, inH₂O `[24908891, 100000]`. `therm` es EC, 105.506 MJ; `therm-us` 105.4804 MJ. `tep` lleva `clase: 'convencion'`, `nota: 'balances de energía'`. Los nombres de M y MM son literales: «miles de barriles diarios (Mbd)», «millones de barriles (MMb)», «miles de pies cúbicos (Mpc)», «millones de pies cúbicos (MMpc)», «millones de pies cúbicos diarios (MMpcd)», «miles de millones de pies cúbicos (Bcf)».

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
const near = (got, want, tol) => expect(Math.abs(got - want)).toBeLessThanOrEqual(tol);
it.each([
  ['gal', 'l', 3.785411784, 1e-12], ['bl', 'l', 158.987294928, 1e-12], ['m3', 'bl', 6.289811, 1e-6], ['pc', 'm3', 0.028316846592, 1e-15], ['m3', 'pc', 35.314667, 1e-6],
  ['gj', 'mmbtu', 0.947817, 1e-6], ['mwh', 'mmbtu', 3.412142, 1e-6], ['tep', 'gj', 41.868, 1e-9], ['tep', 'mwh', 11.63, 1e-9], ['tj', 'mwh', 277.78, 0.01], ['therm', 'mj', 105.506, 1e-9],
  ['hp', 'w', 745.699872, 1e-6], ['cv', 'w', 735.49875, 1e-9], ['kcal-h', 'w', 1.163, 1e-9], ['btu-h', 'w', 0.293071, 1e-6], ['tr', 'w', 3516.853, 1e-3],
  ['psi', 'kpa', 6.894757, 1e-6], ['kgf-cm2', 'kpa', 98.0665, 1e-9], ['inh2o', 'pa', 249.089, 1e-3], ['mh2o', 'kpa', 9.80665, 1e-9], ['bar', 'kpa', 100, 1e-12], ['atm', 'kpa', 101.325, 1e-12],
  ['nudo', 'm-s', 0.514444, 1e-6], ['mph', 'm-s', 0.44704, 1e-9], ['km-h', 'm-s', 1 / 3.6, 1e-12],
  ['bpd', 'm3-h', 0.00662447, 1e-8], ['bpd', 'l-min', 0.110408, 1e-6], ['mmpcd', 'm3-h', 1179.87, 0.01], ['lb', 'kg', 0.45359237, 1e-12], ['ton-corta', 'kg', 907.18474, 1e-9],
])('%s a %s', (a, b, want, tol) => near(convertir(1, a, b), want, tol));
it('todo factor es fracción de enteros seguros', () => {
  for (const u of Object.values(UNIDADES)) if (u.magnitud !== 'temperatura') { expect(Number.isSafeInteger(u.factor[0]), u.id).toBe(true); expect(Number.isSafeInteger(u.factor[1]), u.id).toBe(true); }
});
it('ida y vuelta', () => { for (const m of MAGNITUDES.filter(x => x !== 'temperatura')) for (const u of unidadesDe(m)) near(convertir(convertir(7.5, u.id, unidadesDe(m)[0].id), unidadesDe(m)[0].id, u.id), 7.5, 1e-9); });
it('marca lo que no está en la NOM-008', () => { for (const id of ['bar', 'kgf-cm2', 'psi', 'btu', 'cal', 'hp', 'bl', 'gal']) expect(UNIDADES[id].oficial, id).toBe(false); expect(UNIDADES.kpa.oficial).toBe(true); });
it('no mezcla magnitudes', () => expect(() => convertir(1, 'kg', 'l')).toThrow(RangeError));
it('temperatura', () => {
  expect(convertirTemperatura(0, 'c', 'f')).toBeCloseTo(32); expect(convertirTemperatura(0, 'c', 'k')).toBeCloseTo(273.15);
  expect(convertirTemperatura(10, 'c', 'f', { diferencia: true })).toBeCloseTo(18); expect(convertirTemperatura(10, 'c', 'k', { diferencia: true })).toBeCloseTo(10);
  expect(bajoCeroAbsoluto(-274, 'c')).toBe(true); expect(bajoCeroAbsoluto(-273, 'c')).toBe(false); expect(bajoCeroAbsoluto(-1, 'k')).toBe(true); expect(bajoCeroAbsoluto(-460, 'f')).toBe(true);
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/calc-unidades.test.js`
Expected: FAIL, el módulo no existe.

- [ ] **Step 3: Implementar `src/lib/calc/unidades.js`** con la tabla de arriba.

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run tests/calc-unidades.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc/unidades.js tests/calc-unidades.test.js
git commit -m "feat: add the energy calculator unit tables"
```

### Task 3: Fuentes, auditoría y energéticos

**Files:** Create `src/lib/calc/fuentes.js`, `src/lib/calc/energeticos.js`, `scripts/audit-calc-fuentes.mjs`; Test `tests/calc-energeticos.test.js`, `tests/calc-fuentes.test.js`.

**Interfaces — Consumes:** nada de tareas anteriores.

**Interfaces — Produces:**
- `FUENTES`: mapa `id -> { id, titulo, emisor, url, fecha, revisado, cotejo }`. Ids: `lista-2026 ipcc-2006 acuerdo-rene-2015 aviso-semarnat-2026 nist-811 nom-008 nom-001 nom-009 nom-016 nom-213 cenace-precio-neto-2025 acuerdo-cne-2026 acuerdo-cel-2026 bme-2015 lse pladese global-solar-atlas copar-2012 codigo-red acuerdo-shcp-2000 convocatoria-sae gpsa vcf nist-webbook nws-altitud eia-gas pemex-crudos anexo-21`. URLs en `docs/calculadora/informe.md`. `revisado: '2026-11-08'`. El título de `lista-2026` es «Lista de combustibles y sus poderes caloríficos 2026», con emisor `SENER`; `acuerdo-rene-2015` y `aviso-semarnat-2026` llevan emisor `Semarnat`.
- `auditarFuentes(hoy = new Date()) -> [{ id, fecha, revisado, cotejo, problema }]`: `problema` es `'pendiente'`, `'vencida'` (más de 14 meses desde `revisado`) o `null`.
- `BARRIL_L = 158.987294928`, `BEP_MJ = 6347`.
- `ENERGETICOS`: `gasolina diesel turbosina combustoleo coque maya istmo olmeca gas-lp`, cada uno `{ id, nombre, oficialMjBl, oficialMjKg?, fisicaMjKg, densidadKgL, api?, tRef, co2TJ, soloMasa? }`, con los valores del spec. Coque: `oficialMjKg: 34.518`, `soloMasa: true`. Crudos: `api` 21.5, 32.5, 38.5 y densidad `141.5 / (131.5 + api) × 0.999016`.
- `cadena(productoId, base = 'oficial', { densidad } = {}) -> { mjPorL, kgPorL, mjPorKg, clase, fuente, anio }`: una sola cadena cerrada por base. Gas LP en física usa `kgPorL: 0.5375`.
- `co2Kg(mj, productoId) -> number`, `bep(mj) -> number`.
- `GAS = { pcs: 38.64, factorPci: 0.9, kgSm3: 0.735, secoMjM3: 33.543, factorConuee: 0.97009, co2TJ: 56.1 }`.
- `cadenaGas({ pcs = GAS.pcs, inferior = false } = {}) -> { mjPorSm3, kgPorSm3, co2KgPorSm3, bepPorSm3 }`. El CO₂ siempre sale de `pcs × 0.9 × 56.1`, sea cual sea `inferior`.
- `gnl(m3) -> { kg, mj, mmbtu, sm3 }`, con 450 kg/m³ y 52 MMBtu/t; `sm3 = mj / GAS.pcs`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
// tests/calc-energeticos.test.js
const near = (g, w, t) => expect(Math.abs(g - w)).toBeLessThanOrEqual(t);
it.each([['gasolina', 35.30], ['diesel', 38.15], ['turbosina', 37.03], ['combustoleo', 41.87], ['gas-lp', 26.12], ['maya', 39.92]])('oficial MJ/L %s', (p, w) => near(cadena(p).mjPorL, w, 0.01));
it.each([['gasolina', 32.56], ['diesel', 36.12], ['turbosina', 35.48], ['combustoleo', 40.16], ['gas-lp', 24.76]])('física MJ/L %s', (p, w) => near(cadena(p, 'fisica').mjPorL, w, 0.01));
it('gas LP oficial implica 48.37 MJ/kg', () => near(cadena('gas-lp').mjPorKg, 48.37, 0.02));
it('coque va solo en masa', () => { expect(cadena('coque').kgPorL).toBeNull(); near(cadena('coque').mjPorKg, 34.518, 1e-9); near(cadena('coque', 'fisica').mjPorKg, 32.5, 1e-9); });
it('los crudos comparten valor oficial y cambian densidad', () => { expect(cadena('maya').mjPorL).toBe(cadena('olmeca').mjPorL); near(cadena('maya').kgPorL, 0.9239, 1e-4); near(cadena('istmo').kgPorL, 0.8620, 1e-4); near(cadena('olmeca').kgPorL, 0.8315, 1e-4); });
it.each([['gasolina', 0.8844], ['diesel', 0.9556], ['gas-lp', 0.6543]])('bep %s', (p, w) => near(bep(ENERGETICOS[p].oficialMjBl), w, 5e-5));
it.each([['gasolina', 2.447], ['diesel', 2.827], ['turbosina', 2.648], ['combustoleo', 3.240], ['gas-lp', 1.648]])('CO₂ por litro %s', (p, w) => near(co2Kg(cadena(p).mjPorL, p), w, 1e-3));
it('coque, CO₂ por tonelada', () => near(co2Kg(34518, 'coque') / 1000, 3.366, 1e-3));
it('100 Mbd de gasolina', () => { const mj = 100000 * ENERGETICOS.gasolina.oficialMjBl; near(mj / 1e6, 561.3, 0.01); near(bep(mj), 88435, 1); near(mj / 1e6 * 365 / 1000, 204.9, 0.05); });
it('la densidad editable cierra la cadena', () => { const c = cadena('diesel', 'fisica', { densidad: 0.85 }); near(c.mjPorL, 43 * 0.85, 1e-9); });
it('gas', () => { near(cadenaGas().co2KgPorSm3, 1.951, 1e-3); expect(cadenaGas({ inferior: true }).co2KgPorSm3).toBe(cadenaGas().co2KgPorSm3); near(cadenaGas({ inferior: true }).mjPorSm3, 34.776, 1e-9); near(cadenaGas().bepPorSm3 * 28316.846592, 154.3, 0.1); });
it('GNL cierra por energía', () => { const g = gnl(1); near(g.kg, 450, 1e-9); near(g.mmbtu, 23.4, 1e-9); near(g.sm3, 638.9, 0.1); near(g.sm3 * cadenaGas().mjPorSm3, g.mj, 1e-6); });
// tests/calc-fuentes.test.js (se amplía en la Tarea 10)
it('toda fuente está completa y nace pendiente', () => { for (const f of Object.values(FUENTES)) { for (const k of ['titulo', 'emisor', 'url', 'fecha', 'revisado']) expect(f[k], `${f.id}.${k}`).toBeTruthy(); expect(['humano', 'pendiente']).toContain(f.cotejo); } });
it('la auditoría marca pendientes y vencidas', () => {
  const hoy = new Date('2026-11-09T12:00:00Z'); const a = auditarFuentes(hoy);
  expect(a.find(x => x.id === 'lista-2026').problema).toBe('pendiente');
  expect(auditarFuentes(new Date('2028-03-01T12:00:00Z')).every(x => x.problema)).toBe(true);
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/calc-energeticos.test.js tests/calc-fuentes.test.js`
Expected: FAIL, los módulos no existen.

- [ ] **Step 3: Implementar `fuentes.js` y `energeticos.js`**

Oficial: `mjPorL = oficialMjBl / BARRIL_L`, `kgPorL = densidad`, `mjPorKg = mjPorL / kgPorL`. Física: `mjPorKg = fisicaMjKg`, `mjPorL = mjPorKg × kgPorL`. El bep nunca se copia de la Lista.

- [ ] **Step 4: Escribir `scripts/audit-calc-fuentes.mjs`**

Imprime una línea por fuente con `id`, `fecha`, `revisado`, `cotejo` y `problema`. Con `--strict`, sale con código 1 si alguna tiene `problema`. Modelo de encabezado: `scripts/audit-tables.mjs`.

- [ ] **Step 5: Verificar**

Run: `npx vitest run tests/calc-energeticos.test.js tests/calc-fuentes.test.js`
Expected: PASS.

Run: `node scripts/audit-calc-fuentes.mjs --strict`
Expected: lista todas las fuentes como `pendiente` y sale con código 1. Es lo correcto en esta etapa.

- [ ] **Step 6: Commit**

```bash
git add src/lib/calc/fuentes.js src/lib/calc/energeticos.js scripts/audit-calc-fuentes.mjs tests/calc-energeticos.test.js tests/calc-fuentes.test.js
git commit -m "feat: add energy values, their sources and the source audit"
```

### Task 4: Ajustes

**Files:** Create `src/lib/calc/ajustes.js`; Test `tests/calc-ajustes.test.js`.

**Interfaces — Produces:**
- `RANGO_T_LIQUIDOS = [-10, 60]`, `RANGO_T_LP = [-10, 50]`, `RANGO_ALTITUD = [0, 4000]`.
- `vcf(rhoKgM3, tC, { crudo = false } = {}) -> number`; `grupoVcf(rhoKgM3, crudo) -> { k0, k1, k2, nombre }`. Grupos: `docs/calculadora/informe.md:169-175`, elegidos por °API.
- `factorTemperatura(tC, { kgPorL, tRef, crudo }) -> number`: `vcf(ρ, tC) / vcf(ρ, tRef)`, con ρ = `kgPorL × 1000`. Litros a referencia = litros × factor.
- `MEZCLAS_LP`: `60-40 70-30 80-20 propano`, con densidades de `docs/calculadora/notas/gas_lp.md:134-144`; `densidadLP(tC, mezcla) -> kg/L` por interpolación lineal.
- `CONDICIONES`: los 7 renglones de `docs/calculadora/informe.md:84-92`, ids `base-nom estandar conuee produccion ee-uu texas normal`. `aEstandar(m3, id) -> Sm³`: `base-nom` usa 0.95137 de la norma; las demás `(P/101.325) × (288.15/T)`.
- `CIUDADES`: `mar` 0, `monterrey` 540, `guadalajara` 1566, `cdmx` 2240, `toluca` 2660. `presionAtm(h) -> kPa`.
- `zGpsa(pPsia, tRankine, sg = 0.6) -> number`.
- `corregirGas({ volumen, pManKpa, tC, altitud = 0, sg = 0.6 }) -> { sm3SinZ, sm3ConZ, z, avisoZ }`. `Zb = 0.997`. Tramos en kg/cm² manométricos: hasta 7, sin Z; 7 a 28, GPSA; 28 a 85, GPSA con `avisoZ: 'tres'`; más de 85, sin Z con `avisoZ: 'fuera'`.
- `factorQuemador(h) -> number`.
- `gravedadDeApi(api)`, `densidadDeApi(api) -> kg/m³`, `apiDeDensidad(kgM3)`, con agua a 999.016 kg/m³.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
const near = (g, w, t) => expect(Math.abs(g - w)).toBeLessThanOrEqual(t);
it('gasolina a 35 °C', () => near(20000 * factorTemperatura(35, { kgPorL: 0.735, tRef: 20 }), 19623, 1));
it('diésel usa refinados pesados', () => { expect(grupoVcf(840, false).k0).toBe(103.8720); near(factorTemperatura(25, { kgPorL: 0.84, tRef: 20 }), 0.99575, 1e-4); });
it('elige grupo por densidad', () => { expect(grupoVcf(735, false).k0).toBe(192.4571); expect(grupoVcf(804.5, false).k0).toBe(330.3010); expect(grupoVcf(780, false).k2).toBe(-0.0018684); expect(grupoVcf(920, true).k0).toBe(341.0957); });
it('a la referencia el factor es 1', () => near(factorTemperatura(20, { kgPorL: 0.735, tRef: 20 }), 1, 1e-12));
it('gas LP por temperatura y mezcla', () => { near(100 * densidadLP(30, '60-40'), 51.74, 0.01); near(100 * densidadLP(30, '80-20'), 50.09, 0.01); near(densidadLP(15.56, '60-40'), 0.5375, 1e-9); near(densidadLP(25, '60-40'), (0.5315 + 0.5174) / 2, 1e-9); });
it.each([['base-nom', 0.95137], ['estandar', 1], ['conuee', 0.97009], ['produccion', 0.99808], ['ee-uu', 1.00039], ['texas', 0.99495], ['normal', 1.05491]])('condición %s', (c, w) => near(aEstandar(1, c), w, 2e-5));
it.each([[0, 101.325], [540, 95.00], [1566, 83.87], [2240, 77.15], [2660, 73.18]])('atmósfera a %s m', (h, w) => near(presionAtm(h), w, 0.05));
it('medidor en altitud', () => { near(corregirGas({ volumen: 100, pManKpa: 2, tC: 20, altitud: 2240 }).sm3SinZ, 76.8, 0.1); near(corregirGas({ volumen: 100, pManKpa: 2, tC: 20, altitud: 0 }).sm3SinZ, 100.2, 0.1); });
it('Z en ducto', () => { const r = corregirGas({ volumen: 1000, pManKpa: 50 * 98.0665, tC: 20 }); near(r.z, 0.90, 0.005); near(r.sm3SinZ, 48550, 10); near(r.sm3ConZ, 53800, 20); expect(r.avisoZ).toBe('tres'); });
it('tramos de Z', () => { const p = k => corregirGas({ volumen: 1, pManKpa: k * 98.0665, tC: 20 }); expect(p(5).z).toBeNull(); expect(p(20).z).toBeGreaterThan(0.9); expect(p(20).avisoZ).toBeFalsy(); expect(p(90).z).toBeNull(); expect(p(90).avisoZ).toBe('fuera'); });
it('quemador en la Ciudad de México', () => near(1 - factorQuemador(2240), 0.127, 0.005));
it('°API', () => { near(gravedadDeApi(22), 0.9218, 1e-4); near(densidadDeApi(22), 920.9, 0.1); near(apiDeDensidad(densidadDeApi(22)), 22, 1e-9); });
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/calc-ajustes.test.js`
Expected: FAIL, el módulo no existe.

- [ ] **Step 3: Implementar `src/lib/calc/ajustes.js`** con las fórmulas de la sección «Ajustes» del spec. ΔT del VCF en °F desde 60 °F. GPSA: `docs/calculadora/informe.md:181`.

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run tests/calc-ajustes.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc/ajustes.js tests/calc-ajustes.test.js
git commit -m "feat: add temperature, gas and altitude adjustments"
```

### Task 5: Fórmulas eléctricas

**Files:** Create `src/lib/calc/electricidad.js`; Test `tests/calc-electricidad.test.js`.

**Interfaces — Produces:**
- `energiaMWh(mw, horas)`, `solar({ mwAc, ilr, pvout }) -> { mwDc, mwhAnio, factorAc, factorDc }`, `sae({ mw, horas, eficiencia }) -> { mwh, cRate, carga }`.
- `spq({ p, fdp }) -> { s, q }`, `corrienteTrifasica(mva, kV) -> A`, `compensacion(p, fdp1, fdp2) -> Q`.
- `viento({ rotorM, v, cp = 0.45, rho = 1.225, nominalMw = null }) -> { mw, topado, sobreBetz }`, `hidro({ q, h, eta }) -> mw`, `eficienciaHeatRate(hr) -> fracción`, `emisionesMWh(mwh) -> tCO₂e`.
- `FACTOR_PLANTA`: columna «Promedio 2022–2024» de `docs/calculadora/informe.md:222-229`, con ids `nuclear ciclo-combinado geotermia turbogas eolica carbon solar hidro`.
- `SITIOS_SOLARES`: los 10 de `docs/calculadora/notas/electricidad_unidades_tecnicas.md:146-155` (id, nombre, pvout).
- `FACTOR_SEN = { valor: 0.444, anio: 2024, fuente: 'aviso-semarnat-2026' }`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
const near = (g, w, t) => expect(Math.abs(g - w)).toBeLessThanOrEqual(t);
it('energía', () => { expect(energiaMWh(100, 8)).toBe(800); near(convertir(800, 'mwh', 'tj'), 2.88, 1e-9); });
it('S, P y Q', () => { const r = spq({ p: 90, fdp: 0.9 }); near(r.s, 100, 1e-9); near(r.q, 43.59, 0.01); });
it('corriente', () => near(corrienteTrifasica(100, 230), 251, 0.5));
it('compensación', () => near(compensacion(1000, 0.8, 0.97), 499, 0.5));
it('solar en Hermosillo', () => { const r = solar({ mwAc: 100, ilr: 1.3, pvout: 1908 }); near(r.mwDc, 130, 1e-9); expect(r.mwhAnio).toBeCloseTo(248040); near(r.factorAc, 0.283, 5e-4); near(r.factorDc, 0.218, 5e-4); });
it('SAE', () => { const r = sae({ mw: 30, horas: 3, eficiencia: 0.85 }); expect(r.mwh).toBe(90); near(r.cRate, 0.33, 0.01); near(r.carga, 105.9, 0.05); });
it('viento con tope', () => { near(viento({ rotorM: 150, v: 8 }).mw, 2.49, 0.01); const t = viento({ rotorM: 150, v: 12, nominalMw: 3 }); expect(t.mw).toBe(3); expect(t.topado).toBe(true); expect(viento({ rotorM: 150, v: 8, cp: 0.6 }).sobreBetz).toBe(true); });
it('hidro', () => near(hidro({ q: 100, h: 100, eta: 0.88 }), 86.3, 0.05));
it('heat rate', () => near(eficienciaHeatRate(7139), 0.504, 5e-4));
it('emisiones', () => near(emisionesMWh(120), 53.28, 1e-9));
it('tablas', () => { expect(SITIOS_SOLARES).toHaveLength(10); expect(FACTOR_PLANTA['ciclo-combinado']).toBe(0.668); expect(Object.keys(FACTOR_PLANTA)).toHaveLength(8); });
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/calc-electricidad.test.js`
Expected: FAIL, el módulo no existe.

- [ ] **Step 3: Implementar `src/lib/calc/electricidad.js`.** `Factor` de planta = energía / (potencia × 8 760). Fórmulas: `docs/calculadora/informe.md:199-212`.

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run tests/calc-electricidad.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc/electricidad.js tests/calc-electricidad.test.js
git commit -m "feat: add electrical formulas for the energy calculator"
```

### Task 6: Mercado eléctrico

**Files:** Create `src/lib/calc/mercado.js`; Test `tests/calc-mercado.test.js`.

**Interfaces — Produces:**
- `LEYENDA_MERCADO = 'Regla aplicada hoy por CENACE; pendiente de actualización'`.
- `PRECIO_NETO_2025 = { sin: 4397797.01, bca: 2073887.95, bcs: 6814089.79, version: '2026-09-03', fuente: 'cenace-precio-neto-2025' }`.
- `precioNeto(factor, cone, renta) -> number`: `max(0, factor × cone − renta)`. `kwMes(mwAnio) -> number`: entre 12 000. `pagoPotencia(mwAnio, sistema) -> number`.
- `temporadaGDMTH(sistema, 'YYYY-MM-DD') -> 'verano' | 'invierno'`, con `sistema` en `sin bca bcs`.
- `periodoGDMTH({ sistema, fecha, hora, festivo }) -> { ok, periodo, temporada, dia, errores }`, `periodo` en `base intermedio punta`. Tabla: `docs/calculadora/notas/mercado_electrico_mexicano.md:256-274`. Temporadas: líneas 243-248.
- `PUNTAS_DIST_DIT`: tabla de texto, líneas 278-283 de esas notas.
- `REQUISITO_CEL = { 2025: 0.139, 2026: 0.139 }`, `celRequeridos(mwh, anio) -> number | null`, `celGenerados(mwh, fraccionLimpia = 1) -> number`.
- `figuraPermiso(mw, { autoconsumo = false } = {}) -> 'exenta' | 'permiso' | 'simplificado'`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
const near = (g, w, t) => expect(Math.abs(g - w)).toBeLessThanOrEqual(t);
it('reproduce el Precio Neto del SIN', () => { near(precioNeto(1.3749, 3812112.33, 843476.23), PRECIO_NETO_2025.sin, 2); expect(precioNeto(0, 1, 5)).toBe(0); });
it('$/kW-mes', () => { near(kwMes(PRECIO_NETO_2025.sin), 366.48, 0.005); near(kwMes(PRECIO_NETO_2025.bca), 172.82, 0.005); near(kwMes(PRECIO_NETO_2025.bcs), 567.84, 0.005); });
it('pago', () => near(pagoPotencia(50, 'sin'), 219889850.50, 0.01));
it.each([['sin', '2026-04-04', 'invierno'], ['sin', '2026-04-05', 'verano'], ['sin', '2026-10-24', 'verano'], ['sin', '2026-10-25', 'invierno'], ['bcs', '2026-04-05', 'verano'],
  ['bca', '2026-04-30', 'invierno'], ['bca', '2026-05-01', 'verano'], ['bca', '2026-10-24', 'verano'], ['bca', '2026-10-25', 'invierno']])('temporada %s %s', (s, f, t) => expect(temporadaGDMTH(s, f)).toBe(t));
it('no depende de la zona horaria', () => { const tz = process.env.TZ; process.env.TZ = 'America/Tijuana'; expect(temporadaGDMTH('sin', '2026-04-05')).toBe('verano'); process.env.TZ = tz; });
it.each([
  ['sin', '2026-07-15', '19:59', false, 'intermedio'], ['sin', '2026-07-15', '20:00', false, 'punta'], ['sin', '2026-07-15', '22:00', false, 'intermedio'], ['sin', '2026-07-15', '05:59', false, 'base'],
  ['sin', '2026-07-15', '20:30', true, 'intermedio'], ['sin', '2026-07-18', '19:30', false, 'intermedio'], ['sin', '2026-12-12', '19:30', false, 'punta'], ['sin', '2026-12-16', '18:00', false, 'punta'],
  ['bca', '2026-07-15', '14:00', false, 'punta'], ['bca', '2026-07-18', '15:00', false, 'intermedio'], ['bca', '2026-12-13', '12:00', false, 'base'],
  ['bcs', '2026-07-18', '20:00', false, 'punta'], ['bcs', '2026-12-13', '20:00', false, 'intermedio'],
])('periodo %s %s %s festivo=%s', (sistema, fecha, hora, festivo, periodo) => expect(periodoGDMTH({ sistema, fecha, hora, festivo }).periodo).toBe(periodo));
it.each([['2026-02-30', '12:00'], ['', '12:00'], ['2026-07-15', '24:00'], ['2026-07-15', ''], ['ayer', '12:00']])('rechaza %s %s', (fecha, hora) => { const r = periodoGDMTH({ sistema: 'sin', fecha, hora, festivo: false }); expect(r.ok).toBe(false); expect(r.errores.length).toBeGreaterThan(0); });
it('CEL', () => { expect(celRequeridos(10000, 2026)).toBeCloseTo(1390); expect(celRequeridos(10000, 2027)).toBeNull(); expect(celGenerados(1000, 0.4)).toBe(400); expect(celGenerados(1000)).toBe(1000); });
it('permiso', () => { expect(figuraPermiso(0.69)).toBe('exenta'); expect(figuraPermiso(0.7)).toBe('permiso'); expect(figuraPermiso(20, { autoconsumo: true })).toBe('simplificado'); expect(figuraPermiso(21, { autoconsumo: true })).toBe('permiso'); });
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/calc-mercado.test.js`
Expected: FAIL, el módulo no existe.

- [ ] **Step 3: Implementar `src/lib/calc/mercado.js`.** Las fechas se leen de la cadena y se calculan con `Date.UTC` y `getUTCDay`. Una fecha que no ida y vuelta (30 de febrero) es inválida. Festivo se trata como domingo.

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run tests/calc-mercado.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc/mercado.js tests/calc-mercado.test.js
git commit -m "feat: add dated electricity market tables and the GDMTH period lookup"
```

### Task 7: Ruta

**Files:** Create `src/lib/calc/ruta.js`; Test `tests/calc-ruta.test.js`.

**Interfaces — Produces:**
- `calcRoute(hash) -> Parcial | null`: `null` si no es de la calculadora. `Parcial = { pestana, valor?, unidad?, producto?, base?, horas?, magnitud?, ajustes? }`.
- `calcHash(parcial) -> string`: parámetros en el orden `v u p b h mg` y luego `t d c pc k m pm a dt`. Omite `null`, `''`, ajustes vacíos y `b=oficial`, que es el valor por defecto.
- Solo valida forma, sin catálogos: pestaña conocida, números finitos, `b` en `oficial fisica`, `k` en `superior inferior`, `pm` en `man abs`. `u`, `p`, `mg`, `c` y `m` son cadenas `[a-z0-9-]+`; el resto lo filtra `normalizarEstado` en la Tarea 8.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
it('direcciones básicas', () => {
  expect(calcRoute('#calculadora')).toEqual({ pestana: 'electricidad' });
  expect(calcRoute('#calculadora=gas-lp')).toEqual({ pestana: 'gas-lp' });
  expect(calcRoute('#polos')).toBeNull(); expect(calcRoute('#calculadoras')).toBeNull(); expect(calcRoute('')).toBeNull(); expect(calcRoute(undefined)).toBeNull();
});
it('enlace completo', () => expect(calcRoute('#calculadora=petroliferos&v=100&u=mbd&p=gasolina&b=fisica&t=35')).toEqual({ pestana: 'petroliferos', valor: 100, unidad: 'mbd', producto: 'gasolina', base: 'fisica', ajustes: { t: 35 } }));
it('ignora lo inválido', () => {
  expect(calcRoute('#calculadora=zzz')).toEqual({ pestana: 'electricidad' });
  expect(calcRoute('#calculadora=otras&v=abc&b=x&t=NaN&u=<b>&k=z')).toEqual({ pestana: 'otras' });
});
it.each([{ pestana: 'electricidad' }, { pestana: 'gas-lp', valor: 300, unidad: 'tanque-agua' }, { pestana: 'electricidad', valor: 1, unidad: 'mw', horas: 1 },
  { pestana: 'gas-natural', valor: 1, unidad: 'mmpc', ajustes: { c: 'base-nom', pc: 40, k: 'inferior' } }, { pestana: 'otras', magnitud: 'presion', valor: 1, unidad: 'bar', ajustes: { pm: 'man', a: 2240 } },
  { pestana: 'otras', magnitud: 'temperatura', valor: 10, unidad: 'c', ajustes: { dt: true } }, { pestana: 'gas-lp', valor: -5, unidad: 'kg', ajustes: { t: -5, m: '70-30' } }])('ida y vuelta %#', p => expect(calcRoute(calcHash(p))).toEqual(p));
it('electricidad sola es la dirección corta', () => expect(calcHash({ pestana: 'electricidad' })).toBe('#calculadora'));
it('omite lo que es por defecto', () => expect(calcHash({ pestana: 'petroliferos', valor: 100, unidad: 'mbd', producto: 'gasolina', base: 'oficial', horas: null, ajustes: {} })).toBe('#calculadora=petroliferos&v=100&u=mbd&p=gasolina'));
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/calc-ruta.test.js`
Expected: FAIL, el módulo no existe.

- [ ] **Step 3: Implementar `src/lib/calc/ruta.js`** con `URLSearchParams`. Parámetros en Decisiones, punto 3. Sin importar otros módulos: `ui.js` lo carga al arrancar.

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run tests/calc-ruta.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc/ruta.js tests/calc-ruta.test.js
git commit -m "feat: add energy calculator routes"
```

### Task 8: Pestañas y motor

**Files:** Create `src/lib/calc/pestanas.js`, `src/lib/calc/motor.js`; Test `tests/calc-motor.test.js`, `tests/calc-cadena.test.js`.

**Interfaces — Consumes:** Tareas 1 a 4 y `FACTOR_SEN` de la 5.

**Interfaces — Produces:**
- `PESTANAS`: `[{ id, titulo, unidades, productos, ejemplo, ajustes, tieneBase }]`, con unidades del spec. Títulos: Electricidad, Gasolinas y diésel, Gas natural, Gas LP, Otras. `ejemplo`: `electricidad` 1 MW y 1 hora; `petroliferos` 100 `mbd` de `gasolina`; `gas-natural` 1 `mmpc`; `gas-lp` 1 `cil20`; `otras` 1 `bar`, magnitud `presion`.
- `ATAJOS`: `[{ titulo, ruta }]`, en este orden: «¿Qué es 1 MW?» `{ pestana: 'electricidad', valor: 1, unidad: 'mw', horas: 1 }`; «¿Cuánto es un barril?» `{ pestana: 'petroliferos', valor: 1, unidad: 'bl', producto: 'gasolina' }`; «¿Cuánto trae mi tanque?» `{ pestana: 'gas-lp', valor: 300, unidad: 'tanque-agua' }`.
- `PRODUCTOS_PETROLIFEROS`: `[{ id, nombre }]` con `gasolina diesel turbosina combustoleo coque maya istmo olmeca` y los nombres del spec.
- Unidades propias de pestaña, fuera de `UNIDADES`: `bep` (energía, 6 347 MJ), `cil10 cil20 cil30 cil45` (cilindros de gas LP, en kg), `tanque-agua` (litros de agua; carga el 85 %, NOM-009), y `kgco2` y `tco2` para emisiones.
- `unidadesValidas(estado) -> string[]`: coque sin volumen ni bep; Otras por magnitud.
- `normalizarEstado(parcial) -> Estado`: `{ pestana, magnitud, valor, unidad, producto, base, ajustes, horas }`. Quita lo inválido (Review Focus 1). `valor` ausente es `null`. `base` es `'oficial'` donde hay selector y `null` donde no. `horas` es 1 si la unidad es potencia y no llegó; `''` significa sin horas.
- `calcular(estado) -> Salida`: `{ ok, principal, otras, comparacion, pasos, fuentes, avisos, errores, ejemplo, origen }`. `valor` y `horas` pueden llegar como texto; los lee `leerNumero`. Cifra: `{ valor, unidad, clase, fuente, anio, emisor, etiqueta, etiquetaUna, frente, nota }`, con `valor` en su `unidad`. `errores`: `[{ campo, mensaje }]`. `comparacion`: `{ texto, rotulo } | null`. `fuentes`: objetos de `FUENTES`, sin repetir. `origen`: `rotulo` de la primera cifra no exacta al frente (principal, luego las de `frente: true`); si todas son exactas, «Exacto por definición».

Regla de qué va al frente. `otras` lleva todas las demás cifras de cada magnitud; las que no van al frente llevan `frente: false`, y la vista las muestra en «Ver fórmula y fuente».

| Pestaña y entrada | Principal | Otras al frente | Comparación |
|---|---|---|---|
| Petrolíferos: bl, gal, Mbd, MMb, kg, t | Litros | Energía, CO₂ | Tanques |
| Petrolíferos: L, m³ | Barriles | Energía, CO₂ | Tanques |
| Petrolíferos: energía o bep | Litros | Barriles, CO₂ | Tanques |
| Coque: masa | Energía | CO₂ | No |
| Coque: energía | Toneladas | CO₂ | No |
| Electricidad: potencia con horas | Energía en kWh a TWh | Energía en MJ a PJ | Usuarios |
| Electricidad: potencia sin horas | La misma potencia en kW; si entró en kW, en MW | No | No |
| Electricidad: kWh a TWh | Energía en MJ a PJ | No | Usuarios |
| Electricidad: TJ, PJ | Energía en kWh a TWh | No | Usuarios |
| Gas natural: volumen o masa | Energía | m³ estándar (pc si entró en m³), CO₂ | Cilindros |
| Gas natural: energía o bep | m³ estándar | pc, CO₂ | Cilindros |
| Gas LP: volumen o tanque | Kilos | Energía, CO₂ | Cilindros |
| Gas LP: masa o cilindro | Litros | Energía, CO₂ | Cilindros |
| Gas LP: energía | Kilos | Litros, CO₂ | Cilindros |
| Otras | Unidad oficial de la magnitud (kPa, kW, MJ, °C, kg, m³, m³/h, m/s, m²); si ya entró en ella, la segunda de `unidadesDe(magnitud)` | Todas, con `formatoClase` | No |

Escalas: energía entre MJ, GJ, TJ y PJ para quedar entre 1 y 1 000 (MJ como mínimo); electricidad igual con kWh, MWh, GWh y TWh; CO₂ en kilos hasta 1 000 y después toneladas. La masa y el volumen del producto no cambian de escala. Con `mbd` o `mmpcd` se calcula por día: el flujo en L/d se trata como volumen y las etiquetas agregan «al día».

Etiquetas: «litros», «barriles», «metros cúbicos», «metros cúbicos estándar», «pies cúbicos», «kilos», «toneladas»; energía de combustible, «megajoules de energía» y así hasta «petajoules de energía»; electricidad, «kilowatts-hora» a «terawatts-hora» (`etiquetaUna` «kilowatt-hora»…), y «megajoules» a «petajoules»; emisiones, «kilos de CO₂» y «toneladas de CO₂»; en Otras con `pm: 'man'`, «presión absoluta».

Gas natural a barril equivalente usa el gas seco de la Lista y avisa que Pemex usa otra equivalencia para reservas.

Tanque de coche solo en `gasolina diesel turbosina`. Textos: `la energía de un año de <n> usuarios residenciales`, `<n> tanques de coche de 50 L`, `<n> cilindros de 20 kg`; con `unos` delante de `<n>`. Por debajo de 1, `el <p> % de …` en singular. Rótulos exactos en la tabla «Comparaciones» del spec. Valor 0: sin comparación.

Avisos fijos: Gasolinas, «La Lista no separa Magna y Premium ni los tipos de crudo»; diésel, que 0.84 kg/L no tiene fuente oficial y se puede editar; Gas LP oficial, que implica 48.37 MJ/kg y que 0.54 kg/L es «convención de las tablas de precios»; Gas natural, «valor típico, no oficial», y `pc` fuera de 37.30 a 43.60 MJ/m³.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
// tests/calc-motor.test.js
const c = p => calcular(normalizarEstado(p));
const near = (g, w, t) => expect(Math.abs(g - w)).toBeLessThanOrEqual(t);
const todas = r => [r.principal, ...r.otras];
it('maqueta: 100 Mbd de gasolina', () => {
  const r = c({ pestana: 'petroliferos', valor: 100, unidad: 'mbd', producto: 'gasolina' });
  expect(textoFrente(r.principal)).toBe('15.9 millones de litros al día');
  expect(r.otras.filter(x => x.frente).map(textoFrente)).toEqual(['561 terajoules de energía al día', '38\u00A0900 toneladas de CO₂ al día']);
  expect(r.comparacion.texto).toBe('unos 320 mil tanques de coche de 50 L'); expect(r.comparacion.rotulo).toBe('Ilustrativo');
  expect(r.origen).toBe('Valor publicado por SENER, 2026');
  expect(rotulo(r.otras.find(x => x.unidad === 'tco2'))).toBe('Valor publicado por Semarnat, 2015');
  near(r.otras.find(x => x.unidad === 'bep').valor, 88435, 1);
  expect(r.pasos.length).toBeGreaterThan(0); expect(r.fuentes.map(f => f.id)).toContain('lista-2026');
});
it('atajos', () => {
  const [mw, bl, tanque] = ATAJOS.map(a => c(a.ruta));
  expect(textoFrente(mw.principal)).toBe('1 megawatt-hora'); expect(mw.comparacion.texto).toMatch(/^el 53\s% de la energía de un año de un usuario residencial$/);
  expect(textoFrente(bl.principal)).toBe('159 litros'); expect(bl.otras.filter(x => x.frente).map(textoFrente)).toEqual(['5.61 gigajoules de energía', '389 kilos de CO₂']);
  expect(textoFrente(tanque.principal)).toBe('138 kilos'); near(tanque.otras.find(x => x.unidad === 'l').valor, 255, 1e-9);
});
it('potencia sin horas no da energía ni comparación', () => { const r = c({ pestana: 'electricidad', valor: 1, unidad: 'mw', horas: '' }); expect(r.principal.unidad).toBe('kw'); expect(r.comparacion).toBeNull(); });
it('horas inválidas', () => { for (const h of ['abc', 0, -1]) expect(c({ pestana: 'electricidad', valor: 1, unidad: 'mw', horas: h }).errores[0].campo).toBe('horas'); });
it('gas natural', () => { const r = c({ pestana: 'gas-natural', valor: 1, unidad: 'mmpc' }); expect(r.principal.unidad).toBe('tj'); near(convertir(r.principal.valor, 'tj', 'gj'), 1094.2, 0.1); expect(r.avisos.join()).toMatch(/valor típico, no oficial/); expect(r.principal.clase).toBe('tipico'); expect(r.comparacion.texto).toContain('1\u00A0100 cilindros'); near(r.otras.find(x => x.unidad === 'bep').valor, 154.3, 0.1); });
it('condición base', () => near(c({ pestana: 'gas-natural', valor: 100, unidad: 'm3', ajustes: { c: 'base-nom' } }).otras.find(x => x.etiqueta.includes('estándar')).valor, 95.137, 1e-6));
it('poder calorífico', () => { expect(c({ pestana: 'gas-natural', valor: 1, unidad: 'm3', ajustes: { pc: 30 } }).avisos.join()).toContain('37.30'); expect(c({ pestana: 'gas-natural', valor: 1, unidad: 'm3', ajustes: { pc: 0 } }).ok).toBe(false); });
it('Otras', () => { const r = c({ pestana: 'otras', magnitud: 'presion', valor: 1, unidad: 'bar' }); expect(r.principal.unidad).toBe('kpa'); expect(r.principal.valor).toBeCloseTo(100); expect(c({ pestana: 'otras', magnitud: 'presion', valor: 1, unidad: 'psi' }).principal.valor).toBeCloseTo(6.894757, 5); });
it('presión manométrica en altitud', () => { const r = c({ pestana: 'otras', magnitud: 'presion', valor: 0, unidad: 'kpa', ajustes: { pm: 'man', a: 2240 } }); near(r.otras.find(x => x.etiqueta.includes('absoluta')).valor, 77.15, 0.05); });
it('temperatura o diferencia', () => { expect(todas(c({ pestana: 'otras', magnitud: 'temperatura', valor: 20, unidad: 'c' })).find(x => x.unidad === 'f').valor).toBeCloseTo(68); expect(todas(c({ pestana: 'otras', magnitud: 'temperatura', valor: 10, unidad: 'c', ajustes: { dt: true } })).find(x => x.unidad === 'f').valor).toBeCloseTo(18); });
it('avisos de la tabla de errores', () => {
  expect(c({ pestana: 'electricidad', valor: 'abc', unidad: 'mw' }).errores[0].mensaje).toBe('Escribe un número, como 1 234.5');
  expect(c({ pestana: 'electricidad', valor: -1, unidad: 'mw' }).ok).toBe(false);
  expect(c({ pestana: 'otras', magnitud: 'temperatura', valor: -300, unidad: 'c' }).ok).toBe(false);
  expect(c({ pestana: 'otras', magnitud: 'temperatura', valor: -10, unidad: 'c' }).ok).toBe(true);
  expect(c({ pestana: 'otras', magnitud: 'presion', valor: -1, unidad: 'kpa', ajustes: { pm: 'abs' } }).ok).toBe(false);
  expect(c({ pestana: 'otras', magnitud: 'presion', valor: -1, unidad: 'kpa', ajustes: { pm: 'man' } }).ok).toBe(true);
  const fuera = c({ pestana: 'petroliferos', valor: 100, unidad: 'l', producto: 'gasolina', ajustes: { t: 90 } }); expect(fuera.ok).toBe(true); expect(fuera.avisos.join()).toContain('sin ajuste');
  expect(c({ pestana: 'electricidad', valor: '1'.repeat(400), unidad: 'mw' }).ok).toBe(false);
});
it('campo vacío da el ejemplo', () => { const r = c({ pestana: 'otras' }); expect(r.ejemplo).toBe(true); expect(r.principal.valor).toBeCloseTo(100); });
it('valor cero', () => { const r = c({ pestana: 'gas-lp', valor: 0, unidad: 'kg' }); expect(r.ok).toBe(true); expect(r.principal.valor).toBe(0); expect(r.comparacion).toBeNull(); });
it('sin comparación donde no aplica', () => { for (const producto of ['combustoleo', 'coque', 'maya']) expect(c({ pestana: 'petroliferos', valor: 10, unidad: 't', producto }).comparacion).toBeNull(); });
it('normalizar quita lo que no va junto', () => {
  expect(normalizarEstado({ pestana: 'gas-lp', unidad: 'mw', producto: 'gasolina', ajustes: { c: 'zzz', pc: 40 } })).toMatchObject({ unidad: 'cil20', ajustes: {} });
  expect(normalizarEstado({ pestana: 'gas-natural', base: 'fisica', producto: 'gasolina' })).toMatchObject({ base: null, producto: null });
  expect(normalizarEstado({ pestana: 'petroliferos', producto: 'coque', unidad: 'l' }).unidad).toBe('t');
  expect(normalizarEstado({ pestana: 'otras', magnitud: 'zzz' }).magnitud).toBe('presion');
  expect(unidadesValidas(normalizarEstado({ pestana: 'petroliferos', producto: 'coque' }))).not.toContain('l');
});
// tests/calc-cadena.test.js
const LIQ = ['gasolina', 'diesel', 'turbosina', 'combustoleo', 'maya', 'istmo', 'olmeca'];
// Toma la primera cifra de la magnitud y la pasa a MJ o kg; el CO₂ (kgco2, tco2) no está en UNIDADES.
const en = (r, magnitud, hacia) => { const x = [r.principal, ...r.otras].find(y => UNIDADES[y.unidad]?.magnitud === magnitud); return convertir(x.valor, x.unidad, hacia); };
const mj = r => en(r, 'energia', 'mj');
const kg = r => en(r, 'masa', 'kg');
describe.each(['oficial', 'fisica'])('base %s', base => {
  describe.each([{}, { t: 35 }])('ajustes %j', ajustes => {
    it.each(LIQ)('L → kg → MJ = L → MJ en %s', producto => {
      const l = calcular(normalizarEstado({ pestana: 'petroliferos', valor: 1000, unidad: 'l', producto, base, ajustes }));
      const porKg = calcular(normalizarEstado({ pestana: 'petroliferos', valor: kg(l), unidad: 'kg', producto, base }));
      expect(mj(porKg) / mj(l)).toBeCloseTo(1, 9);
    });
    it('gas LP', () => {
      const a = { ...ajustes, m: '70-30' };
      const l = calcular(normalizarEstado({ pestana: 'gas-lp', valor: 100, unidad: 'l', base, ajustes: a }));
      const porKg = calcular(normalizarEstado({ pestana: 'gas-lp', valor: kg(l), unidad: 'kg', base, ajustes: { m: '70-30' } }));
      expect(mj(porKg) / mj(l)).toBeCloseTo(1, 9);
    });
  });
});
it('gas LP a 30 °C', () => { const r = calcular(normalizarEstado({ pestana: 'gas-lp', valor: 100, unidad: 'l', ajustes: { t: 30, m: '60-40' } })); expect(Math.abs(r.principal.valor - 51.74)).toBeLessThan(0.01); });
it('la base física lo recalcula todo', () => { const v = base => mj(calcular(normalizarEstado({ pestana: 'petroliferos', valor: 1, unidad: 'l', producto: 'gasolina', base }))); expect(v('oficial')).toBeCloseTo(35.30, 2); expect(v('fisica')).toBeCloseTo(32.56, 2); });
it('volumen → energía → volumen en gas', () => { const r = calcular(normalizarEstado({ pestana: 'gas-natural', valor: 1, unidad: 'mmpc', ajustes: { c: 'conuee', k: 'inferior' } })); const ida = mj(r); const vuelta = calcular(normalizarEstado({ pestana: 'gas-natural', valor: ida, unidad: 'mj', ajustes: { c: 'conuee', k: 'inferior' } })); expect(vuelta.otras.find(x => x.unidad === 'pc').valor / 1e6).toBeCloseTo(aEstandar(1, 'conuee'), 9); });
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/calc-motor.test.js tests/calc-cadena.test.js`
Expected: FAIL, los módulos no existen.

- [ ] **Step 3: Implementar `pestanas.js` y `motor.js`**

Cadena en líquidos y Gas LP: todo pasa por litros a referencia. Con ajuste de temperatura, litros a referencia = litros × factor; masa y energía salen de ahí. Una entrada en masa o energía no usa el factor para su energía, y muestra los litros a esa temperatura. Gas LP con `t` o `m`: `kgPorL` = `densidadLP(15.56, mezcla)` y factor = `densidadLP(t, mezcla) / densidadLP(15.56, mezcla)`; sin `m`, la mezcla es `60-40`. En gas, todo pasa por Sm³. Todo resultado no finito da aviso, sin cifra. En gas, `pc` y las `otras` en `pc` y `m3` son a condición estándar, salvo la cifra de entrada.

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run tests/calc-motor.test.js tests/calc-cadena.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc/pestanas.js src/lib/calc/motor.js tests/calc-motor.test.js tests/calc-cadena.test.js
git commit -m "feat: add the energy calculator engine and its tabs"
```

### Task 9: Otras cuentas

**Files:** Create `src/lib/calc/cuentas.js`; Test `tests/calc-cuentas.test.js`.

**Interfaces — Consumes:** Tareas 3 a 6.

**Interfaces — Produces:**
- `CUENTAS`: mapa `id -> { id, pestana, titulo, nota, campos: Campo[] }`. `Campo = { id, etiqueta, tipo: 'numero' | 'opcion' | 'casilla' | 'fecha' | 'hora', porDefecto, opciones, obligatorio, sugerencia, unidad }`.
- `cuentasDe(pestana) -> Cuenta[]`. Las `paraEntender: true` no salen ahí; las abre su tarjeta.
- `calcularCuenta(id, valores) -> { ok, lineas: [{ valor, texto, unidad, clase, fuente, anio }], avisos, errores: [{ campo, mensaje }], fuentes }`. Lee números con `leerNumero`. Nunca devuelve valores no finitos.

Los campos de la tercera columna son los `id` de `Campo`, con el valor de prueba. Los porcentajes se escriben como 85, no 0.85.

| Id | Título | Campos de prueba | Resultado esperado |
|---|---|---|---|
| `central` | Energía de una central | `mw` 100, `horas` 8760, `tecnologia` `ciclo-combinado` | 585 168 MWh |
| `solar` | Paneles solares | `mwAc` 100, `ilr` 1.3, `sitio` `hermosillo` | 130 MW pico; 248 040 MWh; 28.3 % en AC; 21.8 % en DC |
| `sae` | Almacenamiento | `mw` 30, `horas` 3, `eficiencia` 85 | 90 MWh; 0.33 C; 105.9 MWh de carga |
| `factor-potencia` | Factor de potencia y corriente | `p` 90, `fdp` 0.9, `kv` 230, `objetivo` 0.97 | S 100 MVA; Q 43.59 MVAr; 251 A; 21.0 MVAr para llegar a 0.97 |
| `viento-agua` | Viento y agua | `tipo` `viento`, `rotor` 150, `v` 8; `cp` 0.45 y `nominal` vacío por defecto | 2.49 MW |
| `viento-agua` | | `tipo` `agua`, `q` 100, `h` 100, `eta` 0.88 | 86.3 MW |
| `costo-electricidad` | Costo con tu precio | `mwh` 1, `precio` 1.8674 ($/kWh) | 1 867.40 $/MWh; 1 867.40 $ |
| `emisiones-electricidad` | Emisiones | `mwh` 120 | 53.28 tCO₂e |
| `periodo` (entender) | ¿En qué periodo estoy? | `sistema` `sin`, `fecha` 2026-07-15, `hora` 20:00, `festivo` false | Punta, verano |
| `precio-potencia` (entender) | Precio de la Potencia | `sistema` `sin`, `mwAnio` 50 (vacío por defecto) | 366.48 $/kW-mes; 219 889 850.50 $ |
| `cel` (entender) | CEL | `mwh` 10000, `anio` 2026 | 1 390 CEL (unidad `cel`) |
| `permiso` (entender) | Permiso según MW | `mw` 0.5, `autoconsumo` false | Generadora Exenta |
| `costo-petroliferos` | Costo con tu precio | `precio` 23 ($/L), `producto` `gasolina` | 3 656.7 $/bl; 651.5 $/GJ; 706.4 $/GJ con la referencia física |
| `dilatacion` | Dilatación por calor | `litros` 20000, `t` 35, `tRef` 20, `producto` `gasolina` | 19 623 L |
| `api` | °API y densidad | `api` 22 | 0.9218; 920.9 kg/m³; 146.4 kg/bl; 6.83 bl/t |
| `velocidad-ducto` | Velocidad en un ducto | `mbd` 100, `diametro` 0.3048 (m, interior) | 2.52 m/s |
| `medidor-altitud` | Medidor y altitud | `volumen` 100, `presion` 2 (kPa manométricos), `t` 20, `altitud` 2240 | 76.8 m³ estándar |
| `presion-z` | Presión, temperatura y Z | `volumen` 1000, `presion` 50 (kg/cm² manométricos), `t` 20 | 53 800 m³ estándar; Z 0.90; 2 078 GJ; aviso de ±3 % |
| `gas-central` | Gas de una central | `mw` 1000, `hr` 7 (GJ/MWh), `pcs` 38.64 | 154 MMpcd |
| `gnl` | GNL | `m3` 1 | 450 kg; 23.4 MMBtu; 639 m³ estándar (unidad `sm3`); energía (unidad `mj`) |
| `costo-gas` | Costo con tu precio | `precio` 4 (USD/MMBtu), `cambio` 18.6297 | 70.63 MXN/GJ; 0.254 MXN/kWh |
| `tanque` | Cuánto carga un tanque | `litros` 300 (de agua), `llenado` 85 | 255 L; 137.7 kg |
| `quemador` | Altitud y quemador | `altitud` 2240 | 87.3 % de la potencia a nivel del mar |
| `costo-lp` | Costo con tu precio | `precio` 20 ($/kg) | 10.80 $/L |
| `emisiones-lp` | Emisiones | `kg` 20 | 61.0 kg de CO₂ |

Notas fijas: `solar`, relación DC/AC obligatoria, sin valor por defecto, con sugerencia «1.3, EE. UU., sin dato mexicano», y aviso de recorte si pasa de 1.3. `factor-potencia`, los dos umbrales (0.97 del Código de Red desde el 8-abr-2026; 90 % del recibo como regla heredada, sin sumarla a nada), y dónde empiezan RNT y RGD (`docs/calculadora/informe.md:231`). `sae`, texto de `docs/calculadora/informe.md:233`. `dilatacion`, que no es fraude. `gnl`, por qué circulan 585, 600 y 615. `viento-agua`, que elevar al cubo la velocidad media subestima. `costo-gas`, tipo de cambio sin valor por defecto. `precio-potencia`, `periodo` y `cel` llevan `LEYENDA_MERCADO`. `permiso` dice que es orientación, no asesoría legal, y no afirma si 0.7 MW es AC o DC. `cel` para un año sin requisito no da número y lo explica.

- [ ] **Step 1: Escribir las pruebas que fallan**

Una prueba por renglón de la tabla, con `it.each([id, campos, esperados])`. Comprueba `ok` y cada número de la última columna contra `lineas[].valor`, con tolerancia de medio último dígito impreso. Además:

```js
it.each([['solar', { mwAc: 100, ilr: '', sitio: 'hermosillo' }, 'ilr'], ['solar', { mwAc: 100, ilr: 0, sitio: 'hermosillo' }, 'ilr'], ['factor-potencia', { p: 90, fdp: 0, kv: 230, objetivo: 0.97 }, 'fdp'], ['factor-potencia', { p: 90, fdp: 0.9, kv: 0, objetivo: 0.97 }, 'kv'],
  ['sae', { mw: 30, horas: 3, eficiencia: 0 }, 'eficiencia'], ['velocidad-ducto', { mbd: 100, diametro: 0 }, 'diametro'], ['costo-gas', { precio: 4, cambio: '' }, 'cambio'], ['gas-central', { mw: 1000, hr: 7, pcs: 0 }, 'pcs'], ['viento-agua', { tipo: 'viento', rotor: 0, v: 8 }, 'rotor'], ['tanque', { litros: 300, llenado: 150 }, 'llenado']])('%s rechaza %j', (id, v, campo) => {
  const r = calcularCuenta(id, v); expect(r.ok).toBe(false); expect(r.errores[0].campo).toBe(campo); expect(r.lineas).toEqual([]);
});
it('ninguna cuenta devuelve valores no finitos con sus valores por defecto', () => { for (const c of Object.values(CUENTAS)) { const v = Object.fromEntries(c.campos.map(f => [f.id, f.porDefecto])); for (const l of calcularCuenta(c.id, v).lineas) if (l.valor != null) expect(Number.isFinite(l.valor), c.id).toBe(true); } });
it('GNL coincide por los dos caminos', () => { const r = calcularCuenta('gnl', { m3: 1 }); const gas = r.lineas.find(l => l.unidad === 'sm3').valor; expect(gas * 38.64).toBeCloseTo(r.lineas.find(l => l.unidad === 'mj').valor, 6); });
it('CEL fuera de 2025 y 2026', () => { const r = calcularCuenta('cel', { mwh: 100, anio: 2027 }); expect(r.lineas.find(l => l.unidad === 'cel')).toBeUndefined(); expect(r.avisos.join()).toMatch(/2027/); });
it('Z por encima de 85 kg/cm²', () => { const r = calcularCuenta('presion-z', { volumen: 1000, presion: 90, t: 20 }); expect(r.ok).toBe(true); expect(r.avisos.join()).toMatch(/sin Z/); });
it('cada cuenta del spec existe en su pestaña', () => { expect(cuentasDe('electricidad').map(c => c.id)).toEqual(['central', 'solar', 'sae', 'factor-potencia', 'viento-agua', 'costo-electricidad', 'emisiones-electricidad']); expect(cuentasDe('petroliferos').map(c => c.id)).toEqual(['costo-petroliferos', 'dilatacion', 'api', 'velocidad-ducto']); expect(cuentasDe('gas-natural').map(c => c.id)).toEqual(['medidor-altitud', 'presion-z', 'gas-central', 'gnl', 'costo-gas']); expect(cuentasDe('gas-lp').map(c => c.id)).toEqual(['tanque', 'quemador', 'costo-lp', 'emisiones-lp']); expect(cuentasDe('otras')).toEqual([]); });
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/calc-cuentas.test.js`
Expected: FAIL, el módulo no existe.

- [ ] **Step 3: Implementar `src/lib/calc/cuentas.js`.** Solo reparte: toda fórmula vive en `energeticos`, `ajustes`, `electricidad` o `mercado`. Los ids de campo son los de la prueba.

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run tests/calc-cuentas.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc/cuentas.js tests/calc-cuentas.test.js
git commit -m "feat: add the energy calculator small calculations"
```

### Task 10: Textos de «Para entender» y pruebas de procedencia

**Files:** Create `src/lib/calc/textos.js`; Modify `tests/calc-fuentes.test.js`; Test `tests/calc-textos.test.js`.

**Interfaces — Produces:**
- `PARA_ENTENDER`: mapa `pestana -> [{ id, titulo, parrafos: string[], articulos: [{ id, texto }], fuente?, cuenta? }]`.
- `TITULO`, `SUBTITULO`, `NOTA_PIE`: textos exactos del spec, anatomía 1 y 10.

| Pestaña | Id | Título | Hechos, en `docs/calculadora/informe.md` | Artículos y cuenta |
|---|---|---|---|---|
| Electricidad | `potencia-energia` | Potencia y energía | 197, coche y kilómetros; 90 543 MW y 352 305 GWh | |
| | `hora-pico` | Hora pico, horario punta y horas críticas | 258-268, y `PUNTAS_DIST_DIT` | `periodo` |
| | `servicios-conexos` | Servicios conexos | 254 | `LSE-Art-115` |
| | `precio-potencia` | Precio de la Potencia | 252; MW-año no es energía | `LSE-Art-112`, `LSE-Trans-03`; `precio-potencia` |
| | `pml` | Precio Marginal Local (PML) | 247, 275; ejemplo ilustrativo | |
| | `cel` | CEL | 279-280, 284 | `LSE-Art-143`, `-144`, `-145`, `RLSE-Art-191`; `cel` |
| | `permiso` | Permiso según MW | 282 | `LSE-Art-019`, `-025`, `-030`, `-032`, `RLSE-Art-002`; `permiso` |
| Gasolinas y diésel | `barril` | Qué es un barril | 40; 42 galones | |
| | `m-y-mm` | M y MM no son mega | 47-57 | |
| | `bep` | Barril equivalente | 55, 67, 71-76 | `RLPTE-Art-075` |
| Gas natural | `condicion` | Condición base y estándar | 82-94 | |
| | `poder-calorifico` | Poder calorífico superior e inferior | 114, 139, 183 | |
| | `mbtu` | MBtu significa cosas distintas | 53 | |
| Gas LP | `convencion-054` | Por qué 0.54 kg/L es convención | 187 | |
| | `litros-agua` | Litros de agua y litros de gas | 189 | |
| | `vapor` | 1 litro líquido en vapor | 189 | |
| Otras | `kw-h` | kW/h no es kWh | 57 | |
| | `billon` | «Billón» en español y en inglés | 59 | |
| | `kg-cm2` | kg/cm² no es bar | 56 | |
| | `m-mm-mega` | M, MM y mega | 47-54 | |

`LSE-Trans-03` y el resto del mercado eléctrico llevan `LEYENDA_MERCADO`. Las Bases del Mercado van a su liga en el Diario Oficial (`bme-2015`), no como artículo. No enlazar `LSH-Art-027` ni `RLSH-Art-336`. Cada tarjeta, de 40 a 90 palabras. Son borrador: el usuario los aprueba en la Tarea 14.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
// tests/calc-textos.test.js
const todas = Object.values(PARA_ENTENDER).flat();
const textoDe = t => [t.titulo, ...t.parrafos].join(' ');
const publicos = [TITULO, SUBTITULO, NOTA_PIE, ...todas.map(textoDe), ...Object.values(CUENTAS).flatMap(c => [c.titulo, c.nota ?? '', ...c.campos.map(f => f.etiqueta)]), ...ATAJOS.map(a => a.titulo)].join('\n');
it('textos fijos', () => { expect(TITULO).toBe('Calculadora de energía'); expect(SUBTITULO).toBe('Escribe un número y te decimos cuánto es y qué significa.'); expect(NOTA_PIE).toBe('Cálculo orientativo. No sirve para medir ni facturar.'); });
it.each([/acervo/i, /instrumento/i, /\bDOF\b/, /\berror\b/i, /\bFP\b/])('sin %s', r => expect(publicos).not.toMatch(r));
// Solo la tarjeta que lo explica puede decir «billón».
it('sin billón ni trillón', () => expect(publicos.replace(textoDe(todas.find(t => t.id === 'billon')), '')).not.toMatch(/bill[oó]n|trill[oó]n/i));
it('nunca M sola', () => { const sinExplicar = todas.filter(t => !['m-y-mm', 'm-mm-mega'].includes(t.id)).map(textoDe).join(' '); expect(sinExplicar).not.toMatch(/(^|\s)M(\s|$)/); });
it.each([['SAE', 'Sistema de Almacenamiento de Energía'], ['RNT', 'Red Nacional de Transmisión'], ['RGD', 'Redes Generales de Distribución'], ['CEL', 'Certificados de Energías Limpias'], ['PML', 'Precio Marginal Local']])('%s se desarrolla en cada tarjeta', (sigla, largo) => {
  for (const t of [...todas.map(x => [x.id, textoDe(x)]), ...Object.values(CUENTAS).map(c => [c.id, `${c.titulo} ${c.nota ?? ''}`])]) if (t[1].includes(sigla)) expect(t[1], t[0]).toContain(largo);
});
it('el mercado eléctrico lleva su leyenda', () => { for (const id of ['hora-pico', 'servicios-conexos', 'precio-potencia', 'pml', 'cel']) expect(textoDe(todas.find(t => t.id === id))).toContain(LEYENDA_MERCADO); });
it('permiso es orientación', () => expect(textoDe(todas.find(t => t.id === 'permiso'))).toMatch(/orientación.*no.*asesoría legal/is));
it('toda cuenta citada existe', () => { for (const t of todas) if (t.cuenta) expect(CUENTAS[t.cuenta], t.id).toBeTruthy(); });
// se agrega a tests/calc-fuentes.test.js
const ids = new Set(readdirSync('public/data').filter(f => f.endsWith('_chunks.json')).flatMap(f => { const d = JSON.parse(readFileSync(`public/data/${f}`, 'utf8')); return (Array.isArray(d) ? d : d.articulos || d.chunks || []).map(a => a.id); }));
it('todo artículo enlazado existe', () => { const enlazados = Object.values(PARA_ENTENDER).flat().flatMap(t => t.articulos.map(a => a.id)); expect(enlazados.length).toBeGreaterThanOrEqual(13); for (const id of enlazados) expect(ids.has(id), id).toBe(true); });
it('no enlaza artículos con defectos conocidos', () => { const enlazados = Object.values(PARA_ENTENDER).flat().flatMap(t => t.articulos.map(a => a.id)); expect(enlazados).not.toContain('LSH-Art-027'); expect(enlazados).not.toContain('RLSH-Art-336'); });
it('toda cifra no exacta tiene fuente, fecha y año', () => {
  const casos = [...ATAJOS.map(a => a.ruta), ...PESTANAS.map(p => ({ pestana: p.id })), ...PRODUCTOS_PETROLIFEROS.map(p => ({ pestana: 'petroliferos', valor: 10, unidad: 't', producto: p.id })), { pestana: 'gas-lp', valor: 1, unidad: 'kg', base: 'fisica' }];
  for (const caso of casos) { const r = calcular(normalizarEstado(caso)); for (const x of [r.principal, ...r.otras]) if (x.clase !== 'exacto') { expect(FUENTES[x.fuente], x.etiqueta).toBeTruthy(); expect(FUENTES[x.fuente].fecha).toBeTruthy(); expect(x.anio, x.etiqueta).toBeTruthy(); } }
});
it('toda línea no exacta de una cuenta tiene fuente', () => { for (const c of Object.values(CUENTAS)) { const v = Object.fromEntries(c.campos.map(f => [f.id, f.porDefecto])); for (const l of calcularCuenta(c.id, v).lineas) if (l.valor != null && l.clase && l.clase !== 'exacto') expect(FUENTES[l.fuente], `${c.id} ${l.texto}`).toBeTruthy(); } });
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/calc-textos.test.js tests/calc-fuentes.test.js`
Expected: FAIL, `textos.js` no existe.

- [ ] **Step 3: Escribir `src/lib/calc/textos.js`** y corregir en `cuentas.js` y `motor.js` lo que las pruebas señalen.

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run tests/calc-textos.test.js tests/calc-fuentes.test.js tests/calc-cuentas.test.js tests/calc-motor.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc/textos.js src/lib/calc/cuentas.js src/lib/calc/motor.js tests/calc-textos.test.js tests/calc-fuentes.test.js
git commit -m "feat: add the energy calculator explanations and provenance tests"
```

### Task 11: Vista: conversor y resultado

**Files:** Create `src/scripts/calculadora-view.js`, `src/styles/calculadora.css`; Test `tests/calculadora-view.test.js`.

**Interfaces — Consumes:** `calcular`, `normalizarEstado`, `unidadesValidas`, `PESTANAS`, `ATAJOS` (Tarea 8); `calcHash` (Tarea 7); `textoFrente`, `formatoClase`, `rotulo` (Tarea 1); `TITULO`, `SUBTITULO`, `NOTA_PIE` (Tarea 10).

**Interfaces — Produces:**
- `renderCalculadoraView(container, { ruta, onRoute }) -> { show(ruta), destroy() }`. Raíz `.ce-view`. `onRoute(hash)` solo al cambiar de pestaña o tocar un atajo; escribir no lo llama.
- Atributos para pruebas: `[data-ce="tab"]`, `valor`, `unidad`, `producto`, `horas`, `aviso-valor`, `oficial`, `resultado`, `principal`, `frente` (contenedor de las cifras al frente), `comparacion`, `origen`, `ajustar`, `formula`, `base` (botones con `data-valor`), `copiar`, `compartir`, `manual`.

Comportamiento:
- Pestañas con `role="tablist"`, `role="tab"`, `aria-selected`, `tabindex` móvil y flechas de teclado.
- El campo de número es `type="text" inputmode="decimal"`, vacío con el ejemplo como `placeholder`. Al escribir solo se repinta `[data-ce="resultado"]`, nunca el campo. El resultado lleva `aria-live="polite"` y, si es ejemplo, el rótulo «Ejemplo».
- Si la unidad de entrada está en `UNIDADES` con `oficial: false`, `[data-ce="oficial"]` muestra junto al campo la misma cantidad en la unidad oficial de su magnitud, con `formatoClase` exacto: MJ, kW, kPa, kg, L, m³/h, m/s o m². Con unidad oficial o propia de pestaña no aparece.
- Campo «horas» solo con unidad de potencia. `Ajustar` solo si la pestaña tiene ajustes, con los del spec; densidad solo en diésel; poder calorífico con el rango 37.30 a 43.60 MJ/m³ a la vista.
- `Ver fórmula y fuente`: selector de base (`.bu-seg`, solo en Gasolinas y diésel y en Gas LP), `pasos`, todas las cifras con `formatoClase` y su rótulo, y fuentes con título, fecha y liga (`rel="noopener"`).
- Copiar deja: entrada, resultado con unidad, fuente y enlace, con espacios normales. Compartir usa `navigator.share` o copia. Si falla el portapapeles, sale `[data-ce="manual"]`, un `textarea` de solo lectura con el texto.
- Enlace: `location.origin + location.pathname + calcHash(estado)`.
- Otras: selector de magnitud; en presión, `.bu-seg` manométrica o absoluta y altitud; en temperatura, `.bu-seg` temperatura o diferencia.
- Un solo oyente delegado en la raíz, por tipo de evento. `destroy()` los quita y vacía el contenedor.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
const montar = (hash = '#calculadora') => { const host = document.createElement('div'); document.body.append(host); const onRoute = vi.fn(); const view = renderCalculadoraView(host, { ruta: calcRoute(hash), onRoute }); return { host, onRoute, view, $: s => host.querySelector(`[data-ce="${s}"]`), $$: s => [...host.querySelectorAll(`[data-ce="${s}"]`)] }; };
const escribir = (el, texto) => { el.focus(); el.value = texto; el.dispatchEvent(new Event('input', { bubbles: true })); };
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
it('título, atajos y pestañas', () => { const { host, $$ } = montar(); expect(host.querySelector('h1').textContent).toBe('Calculadora de energía'); expect(host.querySelectorAll('.bu-chip')).toHaveLength(3); expect(host.querySelector('[role="tablist"]')).not.toBeNull(); expect($$('tab').map(t => t.textContent.trim())).toEqual(['Electricidad', 'Gasolinas y diésel', 'Gas natural', 'Gas LP', 'Otras']); expect($$('tab')[0].getAttribute('aria-selected')).toBe('true'); });
it('flechas cambian de pestaña y agregan historial', () => { const { $$, onRoute } = montar(); $$('tab')[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); expect(onRoute).toHaveBeenCalledWith('#calculadora=petroliferos'); expect($$('tab')[1].getAttribute('aria-selected')).toBe('true'); });
it('pinta la maqueta', () => { const { $ } = montar('#calculadora=petroliferos&v=100&u=mbd&p=gasolina'); expect($('principal').textContent).toContain('15.9 millones de litros al día'); expect($('frente').textContent).toContain('561 terajoules'); expect($('comparacion').textContent).toContain('Para darte idea'); expect($('origen').textContent).toContain('Valor publicado por SENER, 2026'); });
it('escribir recalcula, no cambia la dirección y conserva el foco', () => { const { $, onRoute } = montar('#calculadora=gas-lp'); const campo = $('valor'); escribir(campo, '40'); expect(document.activeElement).toBe(campo); expect($('valor')).toBe(campo); expect($('principal').textContent).toMatch(/litros/); expect(onRoute).not.toHaveBeenCalled(); });
it('texto y lectura ambigua', () => { const { $ } = montar(); escribir($('valor'), 'abc'); expect($('aviso-valor').textContent).toBe('Escribe un número, como 1 234.5'); expect($('principal')).toBeNull(); escribir($('valor'), '1,234'); expect($('aviso-valor').textContent.replaceAll('\u00A0', ' ')).toContain('1 234'); expect($('principal')).not.toBeNull(); });
it('a medio escribir no rompe', () => { const { $, host } = montar(); for (const t of ['1,', '.', '-', '1 234,5', '  ']) { escribir($('valor'), t); expect(host.textContent).not.toMatch(/NaN|Infinity|undefined/); } });
it('coque deja solo unidades de masa y energía', () => { const { $ } = montar('#calculadora=petroliferos&v=10&u=l&p=gasolina'); $('producto').value = 'coque'; $('producto').dispatchEvent(new Event('change', { bubbles: true })); const u = [...$('unidad').options].map(o => o.value); expect(u).not.toContain('l'); expect(u).toContain('t'); expect($('unidad').value).toBe('t'); expect($('principal')).not.toBeNull(); });
it('enlace con datos que no van juntos', () => { const { $, host } = montar('#calculadora=gas-lp&u=mw&p=gasolina&c=zzz'); expect($('unidad').value).toBe('cil20'); expect(host.textContent).not.toMatch(/NaN|undefined/); });
it('unidad oficial al lado', () => { expect(montar('#calculadora=gas-natural&v=1&u=mmbtu').$('oficial').textContent.replaceAll('\u00A0', ' ')).toContain('1 055.056 MJ'); expect(montar('#calculadora=gas-natural&v=1&u=gj').$('oficial')).toBeNull(); expect(montar('#calculadora=gas-lp&v=1&u=cil20').$('oficial')).toBeNull(); });
it('horas solo con potencia', () => { const { $ } = montar('#calculadora=electricidad&v=1&u=mw'); expect($('horas')).not.toBeNull(); $('unidad').value = 'mwh'; $('unidad').dispatchEvent(new Event('change', { bubbles: true })); expect($('horas')).toBeNull(); });
it('Ajustar y base según la pestaña', () => { expect(montar().$('ajustar')).toBeNull(); expect(montar('#calculadora=gas-natural').$('base')).toBeNull(); const { $, host } = montar('#calculadora=petroliferos&v=1&u=l&p=gasolina'); expect($('ajustar')).not.toBeNull(); const antes = host.querySelector('[data-ce="formula"]').textContent; host.querySelector('[data-ce="base"] [data-valor="fisica"]').click(); expect(host.querySelector('[data-ce="formula"]').textContent).not.toBe(antes); });
it('Copiar con texto completo', async () => { const writeText = vi.fn().mockResolvedValue(); vi.stubGlobal('navigator', { clipboard: { writeText } }); const { $ } = montar('#calculadora=petroliferos&v=100&u=mbd&p=gasolina'); $('copiar').click(); await Promise.resolve(); const t = writeText.mock.calls[0][0]; expect(t).toContain('15.9 millones de litros al día'); expect(t).toContain('Lista de combustibles'); expect(t).toContain('#calculadora=petroliferos&v=100&u=mbd&p=gasolina'); expect(t).not.toContain('\u00A0'); });
it('Compartir sin permiso enseña el texto', async () => { vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) } }); const { $ } = montar(); $('compartir').click(); await new Promise(r => setTimeout(r)); expect($('manual').value).toContain('#calculadora'); });
it('no pinta HTML de la persona', () => { const { $, host } = montar(); escribir($('valor'), '<img src=x onerror=alert(1)>'); expect(host.querySelector('img')).toBeNull(); });
it('show y destroy', () => { const { view, host, $, $$ } = montar(); view.show(calcRoute('#calculadora=otras')); expect($$('tab')[4].getAttribute('aria-selected')).toBe('true'); expect($('principal').textContent).toContain('100'); expect(host.querySelectorAll('.ce-view')).toHaveLength(1); view.destroy(); expect(host.children).toHaveLength(0); });
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/calculadora-view.test.js`
Expected: FAIL, el módulo no existe.

- [ ] **Step 3: Implementar la vista y el CSS del conversor**

Primero `import '../styles/calculadora.css'`, como `polos-view.js`. Reutiliza `.bu-chip`, `.bu-campo`, `.bu-seg`, `.bu-btn` de `src/styles/design/buho/controls.css`. Cifras con `font-variant-numeric: tabular-nums`, una sola densidad de cristal. Pestañas con desplazamiento lateral en celular.

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run tests/calculadora-view.test.js tests/design-leftovers.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/calculadora-view.js src/styles/calculadora.css tests/calculadora-view.test.js
git commit -m "feat: add the energy calculator converter view"
```

### Task 12: Vista: Otras cuentas, Para entender y tamaños

**Files:** Modify `src/scripts/calculadora-view.js`, `src/styles/calculadora.css`, `tests/calculadora-view.test.js`.

**Interfaces — Consumes:** `cuentasDe`, `CUENTAS`, `calcularCuenta` (Tarea 9); `PARA_ENTENDER` (Tarea 10).

**Interfaces — Produces:** `[data-ce="cuenta"]` y `[data-ce="entender"]`, ambos `<details class="ce-tarjeta">` con `data-id`; `[data-ce="cuenta-resultado"]` dentro.

Comportamiento: abrir la tarjeta pinta sus campos dentro, solo la primera vez, en el orden de la tabla de la Tarea 9. Calcula al escribir, con la misma regla de foco. En `periodo`, la vista llena fecha y hora con el momento actual de la persona. Una tarjeta abierta ocupa toda la fila (`grid-column: 1 / -1`). Los artículos son `<a href="#art-<id>">`. Las cuentas `paraEntender` se abren dentro de su tarjeta. Otras no muestra el título «Otras cuentas».

Tamaños, exactos del spec: de 1200 px en adelante, campos en una línea y 4 columnas; de 768 a 1199 px, 2 columnas; por debajo de 768 px, campos apilados con 44 px de alto mínimo y 1 columna. Sin animación con `prefers-reduced-motion`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
it('tarjetas de cada pestaña', () => { const { host } = montar('#calculadora=gas-lp'); const ids = s => [...host.querySelectorAll(`[data-ce="${s}"]`)].map(d => d.dataset.id); expect(ids('cuenta')).toEqual(['tanque', 'quemador', 'costo-lp', 'emisiones-lp']); expect(ids('entender')).toEqual(['convencion-054', 'litros-agua', 'vapor']); });
it('Otras no lleva Otras cuentas', () => { const { host } = montar('#calculadora=otras'); expect(host.querySelectorAll('[data-ce="cuenta"]')).toHaveLength(0); expect(host.textContent).not.toContain('Otras cuentas'); });
it('una cuenta calcula en su lugar', () => { const { host } = montar('#calculadora=gas-lp'); const d = host.querySelector('[data-ce="cuenta"][data-id="tanque"]'); d.open = true; d.dispatchEvent(new Event('toggle')); expect(d.querySelector('[data-ce="cuenta-resultado"]').textContent).toContain('255'); const campo = d.querySelector('input'); campo.focus(); campo.value = '500'; campo.dispatchEvent(new Event('input', { bubbles: true })); expect(document.activeElement).toBe(campo); expect(d.querySelector('[data-ce="cuenta-resultado"]').textContent).toContain('425'); });
it('una cuenta con dato faltante avisa', () => { const { host } = montar(); const d = host.querySelector('[data-ce="cuenta"][data-id="solar"]'); d.open = true; d.dispatchEvent(new Event('toggle')); expect(d.textContent).toContain('1.3'); expect(d.textContent).toContain('sin dato mexicano'); });
it('tarjeta con artículo y cuenta dentro', () => { const { host } = montar(); const d = host.querySelector('[data-ce="entender"][data-id="precio-potencia"]'); d.open = true; d.dispatchEvent(new Event('toggle')); expect(d.querySelector('a[href="#art-LSE-Art-112"]')).not.toBeNull(); expect(d.querySelector('[data-ce="cuenta-resultado"]').textContent).toContain('366.48'); });
it('«¿En qué periodo estoy?» responde', () => { const { host } = montar(); const d = host.querySelector('[data-ce="entender"][data-id="hora-pico"]'); d.open = true; d.dispatchEvent(new Event('toggle')); expect(d.querySelector('input[type="checkbox"]')).not.toBeNull(); expect(d.textContent).toContain('DIST');
  const fijar = (sel, v) => { const el = d.querySelector(sel); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  fijar('input[type="date"]', '2026-07-15'); fijar('input[type="time"]', '20:00'); expect(d.querySelector('[data-ce="cuenta-resultado"]').textContent).toMatch(/punta/i);
  fijar('input[type="time"]', '19:00'); expect(d.querySelector('[data-ce="cuenta-resultado"]').textContent).toMatch(/intermedio/i); });
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/calculadora-view.test.js`
Expected: FAIL en las pruebas nuevas.

- [ ] **Step 3: Implementar tarjetas y CSS por tamaño**

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run tests/calculadora-view.test.js tests/design-leftovers.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/calculadora-view.js src/styles/calculadora.css tests/calculadora-view.test.js
git commit -m "feat: add small calculations and explanation cards to the calculator view"
```

### Task 13: Conectar con el sitio

**Files:** Modify `index.html:143-152`, `index.html:205-206`, `src/scripts/ui.js`, `tests/shell-nav.test.js`, `CLAUDE.md`.

**Interfaces — Consumes:** `calcRoute` (Tarea 7); `renderCalculadoraView` (Tarea 11).

- [ ] **Step 1: Escribir las pruebas que fallan** en `tests/shell-nav.test.js`

Sumar `'nav-calculadora'` y `'mobile-nav-calculadora'` a `KEPT_IDS`, cambiar a `toHaveLength(8)` y el nombre a `offers eight destinations`. Agregar:

```js
it('places Calculadora last in the rail, in the sheet and out of the bottom menu', () => {
  expect([...document.querySelectorAll('.bu-riel__nav > [data-nav]')].at(-1).dataset.nav).toBe('calculadora');
  expect(document.getElementById('nav-calculadora').getAttribute('href')).toBe('#calculadora');
  expect(document.getElementById('mobile-nav-calculadora').getAttribute('href')).toBe('#calculadora');
  expect(document.querySelector('#bottom-nav a[href^="#calculadora"]')).toBeNull();
});
it('opens Calculadora at start without waiting for the catalogue', () => {
  const source = readFileSync('src/scripts/ui.js', 'utf8');
  expect(source).toMatch(/polosRoute\(location\.hash\) \|\| calcRoute\(location\.hash\)\) setTimeout\(handleInitialHash, 0\)/);
  expect(source).toContain("'nav-calculadora', 'mobile-nav-calculadora'");
  expect(source).toMatch(/activeId !== 'nav-calculadora' && calculadoraView/);
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/shell-nav.test.js`
Expected: FAIL.

- [ ] **Step 3: Agregar las entradas en `index.html`**

Riel, último dentro de `.bu-riel__nav`; hoja «Más», antes del botón `data-compartir-app`. Mismo icono en los dos:

```html
<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 7h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/></svg>
```

Riel: `<div data-nav="calculadora"><a href="#calculadora" id="nav-calculadora" class="bu-riel__it" title="Calculadora">…<span>Calculadora</span></a></div>`. Hoja: `<a href="#calculadora" id="mobile-nav-calculadora" class="bu-mas__it">…<span>Calculadora</span></a>`.

- [ ] **Step 4: Conectar `src/scripts/ui.js`**, en estos puntos, igual que Polos:
  - `import { calcRoute } from '../lib/calc/ruta.js';` junto a `polosRoute` (línea 40).
  - `let calculadoraView = null;` junto a `polosView` (línea 128).
  - Rama `else if (calcRoute(hash))` tras la de Polos en `handleInitialHash` (línea 633): cierra el modal igual y llama `showCalculadoraView(calcRoute(hash))`.
  - Línea 761: `|| calcRoute(location.hash)` después de `polosRoute(location.hash)`.
  - `NAV_IDS` (línea 933): suma `'nav-calculadora', 'mobile-nav-calculadora'`.
  - `setActiveNav` (línea 944): `if (activeId !== 'nav-calculadora' && calculadoraView) { calculadoraView.destroy(); calculadoraView = null; }`.
  - `showCalculadoraView(ruta)`, tras `showPolosView` (línea 3517), con el mismo cuerpo salvo `setHash`: la dirección ya cambió, por el enlace del riel o por `onRoute`. Si ya está viva y hay `.ce-view`, `calculadoraView.show(ruta)`; si no, `import('./calculadora-view.js')` con guardia de `calculadoraRequest` y `calcRoute(location.hash)`, y `onRoute: next => setHash(next)`. `skeleton('list', 'Cargando la calculadora')`.
  - `document.getElementById('mobile-nav-calculadora')?.addEventListener('click', () => toggleMobileMenu(false));`.

- [ ] **Step 5: Actualizar `CLAUDE.md`**

En «Vistas», dentro de `#results-container`: `#calculadora` (`calculadora-view.js`). En «Módulos principales», una fila: `src/lib/calc/*` | Motor puro de la calculadora; `motor.js` y `pestanas.js` son la entrada. En «Scripts» agregar `node scripts/audit-calc-fuentes.mjs [--strict]` y la revisión de cada febrero.

- [ ] **Step 6: Verificar**

Run: `npx vitest run` y `npm run lint`
Expected: todo pasa, salvo lo anotado en la línea base.

- [ ] **Step 7: Commit**

```bash
git add index.html src/scripts/ui.js tests/shell-nav.test.js CLAUDE.md
git commit -m "feat: add the energy calculator to the site navigation"
```

### Task 14: Revisar en navegador y preparar textos

**Files:** Create `docs/calculadora/textos-para-aprobar.md`. Lo que esta revisión encuentre se corrige con prueba en la tarea que corresponda.

- [ ] **Step 1: Preparar el entorno de prueba**

Confirmar que `.env` y `.env.local` están ignorados: `git check-ignore .env .env.local`. Copiar `.env` del checkout principal al worktree. Preview: `preview_start {name: "dev"}`.

- [ ] **Step 2: Recorrer los tamaños y los temas**

En `#calculadora`, a 1440, 820 y 390 px, con los temas `light`, `dark`, `sepia` y `contraste`:
- Sin desplazamiento horizontal: `document.documentElement.scrollWidth <= innerWidth`.
- Pestañas, atajos, cada Ajustar, Otras cuentas y Para entender se abren y calculan.
- Contraste legible y resultado en una sola densidad de cristal.
- El riel con 8 destinos cabe en una pantalla de 1366 × 768 sin esconder el pie.
- Consola sin errores: `read_console_messages {onlyErrors: true}`.

Expected: capturas de los tres tamaños, para el PR.

- [ ] **Step 3: Recorrer la navegación**

- Atrás y Adelante entre pestañas.
- Abrir un artículo desde Para entender y cerrarlo: vuelve a Calculadora con la misma pestaña.
- Abrir un enlace completo en pestaña nueva.
- Copiar y Compartir.
- Salir a otra sección y volver.

- [ ] **Step 4: Con Supabase caído**

Crear `.env.local` con `VITE_SUPABASE_URL=http://127.0.0.1:9` y `VITE_SUPABASE_ANON_KEY=x`, reiniciar el preview y abrir `#calculadora` directo.
Expected: abre, calcula y no se queda en «Cargando…». Borrar `.env.local` al terminar.

- [ ] **Step 5: Sin conexión, en producción**

Run: `npm run build`. Luego `preview_start {name: "preview"}`, abrir `#calculadora`, esperar a que el service worker quede activo, `preview_stop` y recargar.
Expected: la calculadora abre y calcula. Si no, se le dice al usuario, porque el spec afirma lo contrario.

- [ ] **Step 6: Escribir `docs/calculadora/textos-para-aprobar.md`**

Generarlo desde `textos.js`, `cuentas.js`, `pestanas.js` y los avisos de `motor.js`, para que el usuario lea exactamente lo que sale al público. Enviarlo con `SendUserFile`.

- [ ] **Step 7: Commit**

```bash
git add docs/calculadora/textos-para-aprobar.md
git commit -m "docs: add energy calculator copy for review"
```

### Task 15: Condiciones para publicar

**Files:** Modify `src/lib/calc/fuentes.js`, y `energeticos.js`, `mercado.js` o `textos.js` si un cotejo cambia un valor. Si cambia un valor, primero se cambia la prueba.

Esta tarea no se delega a un subagente: cada condición la decide el usuario. No se abre PR ni se fusiona sin que lo pida.

- [ ] **Step 1: Cotejar la Lista 2026**

Pedir permiso al usuario para descargar `lista_de_combustibles_2026.pdf` de gob.mx, diciendo nombre, origen y tamaño. Convertir sus páginas a imagen, transcribir los 8 valores que usa la calculadora y presentarlos al usuario junto a la imagen, uno por uno.
Expected: el usuario aprueba cada valor. Con su aprobación, `lista-2026` pasa a `cotejo: 'humano'`.

- [ ] **Step 2: Leer el Acuerdo de CEL en el Diario Oficial**

Abrir el Acuerdo del 17-ago-2026 en el Diario Oficial.
Expected: confirma 13.9 % para 2025 y 2026. Si no se puede leer o dice otra cosa, se le dice al usuario. Si no se puede leer, se retiran la cuenta `cel` y `REQUISITO_CEL`, con sus pruebas.

- [ ] **Step 3: Revisar vigencia**

NOM-001-SECRE-2010 y NOM-016-CRE-2016 en PLATIICA; Reglas del Mercado en el Diario Oficial; factor del sistema eléctrico en Semarnat y CNE.
Expected: resumen al usuario con lo hallado y lo que no se pudo confirmar. Si hay cambio, se actualiza la cifra, su prueba y `revisado`.

- [ ] **Step 4: Confirmar artículos en Supabase, por id y sin barridos**

Con `.env`, un script desechable en el scratchpad con el cliente anónimo. Las leyes por sus siglas, que no son barrido porque el filtro es corto:

```js
await supabase.from('articulos').select('id, ley_id').in('id', IDS_ENLAZADOS);
await supabase.from('leyes').select('id, siglas').in('siglas', ['LSE', 'RLSE', 'RLPTE']);
```

Expected: los 13 ids devueltos y las 3 leyes presentes. Si la base no responde, no se reintenta en bucle: la base está compartida y es plan Free. Se le avisa al usuario. Un id ausente se quita de `textos.js`.

- [ ] **Step 5: Aprobar textos**

El usuario lee `docs/calculadora/textos-para-aprobar.md`. Se aplican sus cambios y se corre `npx vitest run tests/calc-textos.test.js`.

- [ ] **Step 6: Cerrar fuentes**

Presentar al usuario la salida de `node scripts/audit-calc-fuentes.mjs`, con qué se cotejó de cada una. Con su aprobación, pasar el resto a `cotejo: 'humano'` y actualizar `revisado`.

Run: `node scripts/audit-calc-fuentes.mjs --strict`
Expected: código de salida 0.

- [ ] **Step 7: Revisión final**

Run: `npx vitest run`, `npm run lint` y `npm run build`.
Expected: pasan. Repetir el Paso 2 de la Tarea 14 si cambió algo visible.

- [ ] **Step 8: Commit y preguntar por el PR**

```bash
git add src/lib/calc tests docs/calculadora
git commit -m "chore: record verified sources for the energy calculator"
```

Preguntar al usuario si abre el PR, con las 7 condiciones y la evidencia en el cuerpo. La fusión la decide el usuario.
