# Calculadora de energía

Fecha: 2026-11-09. Estado: diseño aprobado en conversación; falta revisión del texto escrito.

Investigación que respalda este diseño: [informe](../../calculadora/informe.md) y [notas por tema](../../calculadora/notas/). Los valores, fuentes con liga y fórmulas completas están ahí; este documento fija qué se construye y con qué reglas.

## Propósito

Una última sección del Buscador Jurídico donde cualquier persona escribe un número y entiende cuánto es y qué significa, en todo el mercado energético de México: electricidad, gasolinas y diésel, gas natural y gas LP. Quien lo necesite puede abrir el ajuste, la fórmula y la fuente.

Éxito significa:

- Una persona sin formación técnica entiende el resultado sin abrir nada.
- Una persona del sector encuentra la fórmula, la fuente y la fecha de cada cifra a un toque.
- Ninguna cifra aparece sin saber de dónde sale.

## Decisiones del usuario

| Tema | Decisión |
|---|---|
| Público | General primero. Lo técnico se queda, en segundo plano |
| Entrada | Pestañas por energético, con atajos de preguntas comunes arriba |
| Alcance | Solo lo que no caduca en el mes. Costo con el precio que escribe la persona |
| Valor base en combustibles | El valor oficial de SENER al frente; la referencia física a un toque, con selector que recalcula todo |
| Tamaños | Escritorio, tablet y celular (maqueta aprobada) |

## Fuera de esta versión

- Recibo de CFE y costo por tarifa (exige cuotas mensuales de 17 divisiones).
- Precios del día y tipo de cambio automático.
- Selector de año de la Lista de combustibles. Solo va la Lista 2026; el modelo de datos guarda el año para sumar otras.
- Gasóleo, porque su valor oficial (42 524 MJ/m³) parece mal rotulado.
- Sección en la portada, menú de la guía del búho y páginas para buscadores.
- Los cálculos que el informe descarta: ingreso por nodo o por servicios conexos, estimar Potencia acreditada, predecir horas críticas, proyectar precios, costo de CEL, CEL desde 2027, demanda facturable con FRI y FRB, ahorro solar, Weymouth, capacidad de líneas, cambio de esprea, tablas API completas y facturación de gas.

## Pantalla

### Ubicación

Ruta `#calculadora`. Último lugar del riel (`nav-calculadora`) y entrada en la hoja «Más» (`mobile-nav-calculadora`), con icono de trazo igual a los demás. No entra al menú inferior.

### Anatomía, de arriba abajo

1. Título en Fraunces: «Calculadora de energía». Debajo: «Escribe un número y te decimos cuánto es y qué significa.»
2. Atajos como `.bu-chip`:
   - «¿Qué es 1 MW?» abre Electricidad con 1 MW.
   - «¿Cuánto es un barril?» abre Gasolinas y diésel con 1 barril de gasolina.
   - «¿Cuánto trae mi tanque?» abre Gas LP con un tanque de 300 L de agua.
3. Pestañas: Electricidad, Gasolinas y diésel, Gas natural, Gas LP, Otras. Con `role="tablist"` y flechas de teclado. En celular se deslizan de lado.
4. Conversor: número, unidad y, si aplica, producto.
5. Resultado: cifra principal, otras cifras, «Para darte idea», y la línea de origen («Valor publicado por SENER, 2026»). Usa `aria-live="polite"`.
6. Desplegables: «Ajustar» (solo si la pestaña tiene ajustes) y «Ver fórmula y fuente».
7. Acciones: Copiar deja en el portapapeles la entrada, el resultado con unidad, la fuente y el enlace. Compartir manda el enlace.
8. «Otras cuentas»: tarjetas que abren una cuenta pequeña en el mismo lugar.
9. «Para entender»: tarjetas con una explicación corta y, si aplica, el artículo de ley.
10. Nota al pie: «Cálculo orientativo. No sirve para medir ni facturar.»

### Pestañas

**Electricidad**

- Unidades: kW, MW, GW, TW; kWh, MWh, GWh, TWh; TJ, PJ. Con una unidad de potencia aparece el campo «horas» (1 por defecto) para calcular energía.
- Otras cuentas:
  - Energía de una central: MW, horas y factor de planta por tecnología.
  - Paneles solares: MW AC, relación DC/AC y ciudad dan MW pico, MWh al año y factor de planta. La relación es obligatoria y sugiere 1.3, rotulada «EE. UU., sin dato mexicano».
  - Almacenamiento: Sistema de Almacenamiento de Energía (SAE), con MW, horas y eficiencia.
  - Factor de potencia y corriente: S, P y Q; corriente trifásica; compensación. Explica los dos umbrales: 0.97 del Código de Red y 90 % del recibo, este último como regla heredada sin sumarla a ningún estimado.
  - Viento y agua, con tope nominal en viento.
  - Costo con tu precio y Emisiones (0.444 tCO₂e/MWh, dato de 2024).
- Para entender:
  - Potencia y energía.
  - Hora pico, horario punta y horas críticas, con la consulta «¿En qué periodo estoy?».
  - Servicios conexos.
  - Precio de la Potencia: $/MW-año a $/kW-mes, Precio Neto 2025 por sistema con versión, y pago con los MW-año que escribe la persona.
  - Precio Marginal Local (PML), explicativo.
  - CEL: requeridos solo en años con requisito (2025 y 2026), y generados.
  - Permiso según MW: menos de 0.7 MW, Generadora Exenta; 0.7 o más, permiso; 0.7 a 20 MW en autoconsumo interconectado, trámite simplificado posible.

«¿En qué periodo estoy?» cubre solo GDMTH, cuya tabla está completa en las notas. Pide sistema (SIN, Baja California, Baja California Sur), fecha, hora y la casilla «Es día festivo». Calcula la temporada y responde base, intermedio o punta. Las puntas de DIST y DIT en el SIN van como tabla de texto.

**Gasolinas y diésel**

- Productos: Gasolinas y naftas, Diésel, Turbosina, Combustóleo, Coque (solo masa), Crudo Maya, Istmo y Olmeca. Aviso: «La Lista no separa Magna y Premium ni los tipos de crudo».
- Unidades: L, m³, galón, barril, miles de barriles diarios (Mbd), millones de barriles (MMb); kg, t; MJ, GJ, TJ, PJ, kWh, MMBtu, barril equivalente.
- Ajuste: temperatura.
- Otras cuentas: Costo con tu precio ($/L, $/bl, $/GJ), Dilatación por calor (explica que no es fraude), °API y densidad, Velocidad en un ducto.
- Para entender: Qué es un barril; M y MM no son mega; Barril equivalente.

**Gas natural**

- Unidades: pc, Mpc, MMpc, MMpcd, Bcf; m³ estándar; kg; GJ, MMBtu, therm, kWh, barril equivalente.
- Ajustes: condición de referencia, poder calorífico (editable, con el rango de la NOM-001 a la vista), base superior o inferior.
- Otras cuentas: Medidor y altitud; Presión, temperatura y Z; Gas de una central; GNL; Costo con tu precio (USD/MMBtu a MXN/GJ con el tipo de cambio que escribe la persona).
- Para entender: Condición base y estándar; Poder calorífico superior e inferior; MBtu significa cosas distintas.

**Gas LP**

- Unidades: kg, L, m³ líquido, barril; cilindro de 10, 20, 30 y 45 kg; tanque en litros de agua; MJ, GJ, kWh.
- Ajustes: temperatura y mezcla.
- Otras cuentas: Cuánto carga un tanque (85 %, NOM-009), Altitud y quemador, Costo con tu precio ($/kg a $/L), Emisiones.
- Para entender: Por qué 0.54 kg/L es convención; Litros de agua y litros de gas; 1 litro líquido en vapor.

**Otras**

- Magnitudes: energía, potencia, presión, temperatura, masa, volumen, flujo, velocidad y área. Primero se elige la magnitud.
- Presión: pregunta si es manométrica o absoluta, y la altitud cuando importa.
- Temperatura: pregunta si es una temperatura o una diferencia.
- Para entender: kW/h no es kWh; «billón» en español y en inglés; kg/cm² no es bar; M, MM y mega.

### Textos

- Español llano, sin «acervo», «instrumento» ni «DOF». Se escribe «Diario Oficial».
- Cada sigla se desarrolla la primera vez en cada tarjeta: SAE, RNT, RGD, CEL, PML.
- La palabra «error» no se usa para valores oficiales. Se dice «valor publicado» y «referencia física».
- Nunca se escribe «M» sola: «miles de barriles diarios (Mbd)». Tampoco «FP»: se escribe «factor de potencia» o «factor de planta».
- La unidad oficial aparece al lado cuando la de entrada no está en la NOM-008 (bar, kg/cm², psi, Btu, caloría, hp, barril, galón).
- Los horarios de punta, el Precio Neto y el resto del mercado eléctrico llevan: «Regla aplicada hoy por CENACE; pendiente de actualización».
- «Permiso según MW» dice que es orientación, no asesoría legal.

### Diseño visual

Sistema Búho: `.bu-chip`, `.bu-campo`, `.bu-seg`, `.bu-btn`, `<details>`. La pestaña activa y lo seleccionado van en guinda; la acción principal en tinta. El resultado usa una sola densidad de cristal. Cifras con `font-variant-numeric: tabular-nums`. Clases propias con prefijo `.ce-` en `src/styles/calculadora.css`, solo con tokens. No sube los topes de `tests/design-leftovers.test.js`.

| Ancho | Conversor | Otras cuentas y Para entender |
|---|---|---|
| 1200 px o más | Campos en una línea | 4 columnas |
| 768–1199 px | Campos en una línea si caben | 2 columnas |
| Menos de 768 px | Campos apilados, 44 px de alto mínimo | 1 columna |

Funciona en los cuatro temas. Con `prefers-reduced-motion` cambia sin animar.

## Arquitectura

La lógica es pura y la pantalla solo la muestra. No usa red ni Supabase, y no agrega dependencias. Sin conexión funciona después de abrirla una vez, porque el service worker guarda el paquete al primer uso.

### Módulos

| Archivo | Hace | Depende de |
|---|---|---|
| `src/lib/calc/fuentes.js` | Registro de fuentes | Nada |
| `src/lib/calc/unidades.js` | Unidades por magnitud, factores como fracción | Nada |
| `src/lib/calc/energeticos.js` | Valores por combustible, en base oficial y física | `fuentes` |
| `src/lib/calc/ajustes.js` | Temperatura, gas, altitud, °API, mezcla | Nada |
| `src/lib/calc/electricidad.js` | Fórmulas eléctricas | `fuentes` |
| `src/lib/calc/mercado.js` | Tablas fechadas y consulta de periodo | `fuentes` |
| `src/lib/calc/formato.js` | Mostrar y leer números | Nada |
| `src/lib/calc/ruta.js` | `calcRoute(hash)` y `calcHash(estado)` | Nada |
| `src/lib/calc/pestanas.js` | Qué ofrece cada pestaña; atajos; textos | Lo anterior |
| `src/lib/calc/motor.js` | `calcular(estado)` | Lo anterior |
| `src/scripts/calculadora-view.js` | `renderCalculadoraView(container, { ruta, onRoute })` devuelve `{ show(ruta), destroy() }` | `motor`, `pestanas`, `formato`, `ruta` |
| `src/styles/calculadora.css` | Estilos `.ce-*` | Tokens |

### Tipos de dato

```js
// Fuente, en fuentes.js
{ id, titulo, emisor, url, fecha, revisado, cotejo }  // cotejo: 'humano' | 'pendiente'

// Unidad lineal, en unidades.js
{ id, nombre, simbolo, magnitud, factor: [num, den], oficial }  // a la unidad base; oficial: está en la NOM-008

// Cifra: lo que sale del motor
{ valor, unidad, clase, fuente, anio, etiqueta }  // clase: 'exacto' | 'oficial' | 'tipico' | 'convencion'

// Entrada del motor
{ pestana, magnitud, valor, unidad, producto, base, ajustes, horas }

// Salida del motor
{ ok, principal, otras, comparacion, pasos, fuentes, avisos, errores }
```

Temperatura, presión manométrica y los puentes con combustible no caben en un factor: son funciones aparte. Un mismo campo nunca los mezcla.

### Flujo

La persona cambia un campo. El estado de la vista cambia. `calcular(estado)` devuelve el resultado. La vista lo pinta. Todo texto pasa por escape al escribirse en el DOM.

### Ruta y enlaces

- `#calculadora`: pestaña Electricidad.
- `#calculadora=<pestana>`, con `electricidad`, `petroliferos`, `gas-natural`, `gas-lp`, `otras`.
- Enlace completo: `#calculadora=petroliferos&v=100&u=mbd&p=gasolina&b=fisica&t=35`. Se lee con `URLSearchParams`. Un parámetro inválido se ignora y usa su valor por defecto.
- Cambiar de pestaña agrega entrada al historial. Escribir no cambia la dirección. Compartir arma el enlace completo con `navigator.share`, o lo copia si no existe.
- Artículos de ley: enlace normal `#art-<id>`, igual que los enlaces del riel.

### Integración

- `index.html`: entradas en riel y hoja «Más».
- `ui.js`, igual que Polos: `showCalculadoraView` con `import()` tardío, ruta en `handleInitialHash` y `popstate`, `NAV_IDS`, cierre en `setActiveNav`.
- La ruta entra en la lista de arranque que no espera a Supabase (`ui.js:761`), para funcionar aunque Supabase no responda.
- `tests/shell-nav.test.js`: suma los dos ids.
- `CLAUDE.md`: suma la vista y sus módulos.

## Reglas de cálculo

### Bases oficial y física

Ningún cálculo mezcla bases. Cada base es una cadena cerrada, así que pasar por litros, kilos o energía da lo mismo.

| Energético | Base oficial | Base física |
|---|---|---|
| Líquidos | Energía = volumen a referencia × MJ/L de la Lista 2026. Masa = volumen × densidad | Energía = masa × MJ/kg de IPCC 2006. Masa = volumen × densidad |
| Gas LP | Lo mismo, con 26.12 MJ/L y 0.54 kg/L. Implica 48.37 MJ/kg, y se avisa | Lo mismo, con 46.07 MJ/kg y densidad de la mezcla (0.5375 kg/L en 60/40) |
| Gas natural | No hay valor oficial de mercado: no lleva selector de base | Energía = m³ estándar × poder calorífico |

- El selector Oficial/Física aparece solo en Gasolinas y diésel y en Gas LP, dentro de «Ver fórmula y fuente».
- Con base física, las emisiones usan el mismo factor por TJ del Acuerdo de 2015 sobre la energía física.
- El barril equivalente siempre se calcula como poder calorífico entre 6 347 MJ/bl. No se copian los factores redondeados de la Lista.

### Cifras y formato

Al frente van 3 cifras significativas, con palabra de escala («15.9 millones»). No se usan «billón» ni «trillón». En «Otras» y en «Ver fórmula y fuente», las cifras siguen la clase:

| Clase | Cifras significativas | Rótulo |
|---|---|---|
| Exacto | 7 | «Exacto por definición» |
| Oficial | 4 | «Valor publicado por SENER, 2026» |
| Típico | 3 | «Valor típico, puede variar» |
| Convención | 3 | «Convención usada en…» |

Se calcula con `Number` y se redondea solo al mostrar. Miles con espacio y punto decimal, según NOM-008, con formato propio porque `Intl.NumberFormat('es-MX')` usa comas.

Lectura de números: acepta `1 234.5`, `1,234.5` y `1234.5`. Con «1,234» lo lee como mil doscientos treinta y cuatro y lo dice en pantalla. Con «1.234» lo lee como uno punto dos tres cuatro. Con «1,5» avisa y lo lee como uno punto cinco.

### Valores por defecto

| Energético | Oficial, Lista 2026 | Física | Densidad de trabajo | CO₂ (t/TJ) |
|---|---|---|---|---|
| Gasolinas y naftas | 5 613 MJ/bl | 44.3 MJ/kg | 0.735 kg/L | 69.3 |
| Diésel | 6 065 MJ/bl | 43.0 MJ/kg | 0.84 kg/L, sin fuente oficial y editable | 74.1 |
| Turbosina | 5 888 MJ/bl | 44.1 MJ/kg | 0.8045 kg/L | 71.5 |
| Combustóleo | 6 656 MJ/bl | 40.4 MJ/kg | 0.9941 kg/L | 77.4 |
| Coque | 34 518 MJ/t | 32.5 MJ/kg | Solo masa | 97.5 |
| Crudo Maya, Istmo, Olmeca | 6 347 MJ/bl | 42.3 MJ/kg | °API 21.5, 32.5 y 38.5, punto medio de Pemex | 73.3 |
| Gas LP | 4 153 MJ/bl | 46.07 MJ/kg | 0.54 kg/L | 63.1 |
| Gas natural | No aplica | PCS 38.64 MJ/m³ estándar, «valor típico, no oficial»; PCI = 0.90 × PCS | 0.735 kg/m³ | 56.1 sobre PCI |
| GNL | No aplica | 52 MMBtu/t | 450 kg/m³ | Vía gas |

Referencias: 20 °C en petrolíferos, 15.56 °C en crudo y gas LP. En gas natural, m³ estándar: 15 °C y 101.325 kPa (NOM-001).

Del gas natural a barril equivalente se usa el gas seco de la Lista (33 543 kJ/m³ a 20 °C y 100 kPa). El texto menciona que Pemex usa otra equivalencia para reservas.

### Ajustes

| Ajuste | Fórmula | Rango | Etiqueta |
|---|---|---|---|
| Temperatura en líquidos | VCF = exp{−α·ΔT·[1 + 0.8·α·ΔT]}, α = K0/ρ² + K1/ρ + K2 (constantes en el informe) | −10 a 60 °C | Orientativo, fuente secundaria |
| Temperatura y mezcla en gas LP | Tabla de densidad NIST por temperatura y mezcla, con interpolación lineal. Masa = V × ρ(T, mezcla); V a referencia = masa / ρ(15.56 °C, mezcla) | −10 a 50 °C | Típico |
| Condición de referencia | (P/101.325) × (288.15/T). La base NOM usa 0.95137, valor de la norma | Lista cerrada de 7 condiciones | Exacto con gas ideal |
| Presión, temperatura y Z | Vb = Vf × (Pf/Pb) × (Tb/Tf) × (Zb/Zf); Z de GPSA | Hasta 7 kg/cm², Z se omite; 7 a 28, GPSA; 28 a 85, GPSA con aviso de ±3 %; más de 85 no calcula Z | Orientativo |
| Altitud | p = 101.325 × (1 − 2.25577×10⁻⁵ h)^5.25588. Lista de ciudades y altitud editable | 0 a 4 000 m | Atmósfera estándar |
| Quemador en altitud | √(p/101.325), con orificio fijo | Igual | Física simple, no norma |

Sin ajuste abierto, cada energético usa su referencia. Al abrir el ajuste, la densidad o el volumen a referencia cambian en toda la cadena, para que siga cerrada.

**GNL:** la masa es la base. 1 m³ de GNL pesa 450 kg, y 1 t tiene 52 MMBtu. Los m³ de gas se obtienen por energía: energía ÷ poder calorífico. Con los valores por defecto, 1 m³ de GNL da unos 639 m³ estándar; la tarjeta explica por qué también circulan 585, 600 y 615. Así GNL → gas → energía coincide con GNL → energía.

### Comparaciones de «Para darte idea»

Solo tres, siempre rotuladas y a 2 cifras:

| Referencia | Valor | Se usa en | Rótulo |
|---|---|---|---|
| Usuarios residenciales | 1 885 kWh al año | Electricidad, cuando el resultado es energía | «Derivado del PLADESE; energía anual, no cobertura hora por hora» |
| Tanque de coche | 50 L | Gasolinas y diésel, salvo combustóleo, coque y crudo | «Ilustrativo» |
| Cilindro de gas LP | 20 kg, 967 MJ con la Lista 2026 | Gas LP y, por energía, gas natural | «NOM-213» |

Sin referencia aplicable, la línea no aparece. Con potencia y sin horas tampoco aparece, porque no hay energía que comparar.

## Errores y límites

| Caso | Qué pasa |
|---|---|
| Campo vacío | Resultado del ejemplo fijo de esa pestaña, definido en `pestanas.js` y rotulado «Ejemplo» (en Otras, 1 bar en kPa) |
| Texto que no es número | Aviso junto al campo: «Escribe un número, como 1 234.5». Sin resultado |
| Negativo donde no cabe | Aviso. Se permite en temperatura y presión manométrica |
| Bajo cero absoluto | Aviso. Sin resultado |
| Fuera del rango del ajuste | Calcula sin ajuste y lo dice |
| Z por encima de 85 kg/cm² | Da el resultado sin Z y lo dice |
| Valor muy grande o muy chico | Notación ×10ⁿ |
| Copiar o compartir sin permiso del navegador | Muestra el texto para copiarlo a mano |
| Parámetro inválido en el enlace | Se ignora |

## Pruebas

Se escriben antes que el código, por módulo.

| Prueba | Qué comprueba |
|---|---|
| `tests/calc-unidades.test.js` | Cada factor contra la cifra publicada por NIST; ida y vuelta; temperatura y presión con desplazamiento |
| `tests/calc-energeticos.test.js` | MJ/L, barril equivalente y CO₂ contra el informe; 100 Mbd de gasolina = 561.3 TJ/d |
| `tests/calc-cadena.test.js` | Por combustible y base, con y sin ajuste: L → kg → MJ = L → MJ. GNL → gas → energía = GNL → energía |
| `tests/calc-ajustes.test.js` | 20 000 L de gasolina a 35 °C = 19 623 L a 20 °C; 100 m³ a 2 kPa y 20 °C en Ciudad de México = 76.8; Z = 0.90 a 50 kg/cm²; las 7 condiciones |
| `tests/calc-electricidad.test.js` | Los ejemplos del informe |
| `tests/calc-mercado.test.js` | Reproduce el Precio Neto del SIN con la fórmula oficial, y los $/kW-mes; periodo GDMTH en fechas de frontera de temporada, sábado y festivo |
| `tests/calc-formato.test.js` | Espacios de miles, cifras por clase, escalas; lectura de `1,234`, `1.234`, `1,5` y texto |
| `tests/calc-ruta.test.js` | Ida y vuelta; parámetros inválidos; otros hashes dan `null` |
| `tests/calc-fuentes.test.js` | Toda cifra no exacta tiene fuente y fecha; todo artículo enlazado existe en `public/data/*_chunks.json` |
| `tests/calculadora-view.test.js` | En jsdom: cambiar pestaña y unidad, resultado, avisos, enlace, sin HTML sin escapar |
| `tests/shell-nav.test.js` | Los dos ids nuevos |

Además: `npm test`, `npm run lint` y revisión en navegador en escritorio, tablet y celular, con los cuatro temas y con Supabase caído.

Artículos enlazados en esta versión, confirmados en archivos locales: `LSE-Art-112`, `LSE-Art-115`, `LSE-Art-019`, `LSE-Art-025`, `LSE-Art-030`, `LSE-Art-032`, `LSE-Art-143`, `LSE-Art-144`, `LSE-Art-145`, `LSE-Trans-03`, `RLSE-Art-002`, `RLSE-Art-191`, `RLPTE-Art-075`. Las Bases del Mercado no se enlazan como artículos del sitio: van a su liga en el Diario Oficial.

## Mantenimiento

Los valores con fecha viven solo en `energeticos.js`, `mercado.js` y `fuentes.js`. Revisión cada febrero, cuando sale la Lista de combustibles, y puntual si CENACE recalcula o SENER publica.

`node scripts/audit-calc-fuentes.mjs` lista cada fuente con su fecha, su última revisión y su cotejo. Con `--strict` falla si alguna está `pendiente` o lleva más de 14 meses sin revisar. No forma parte de `npm test`, porque el paso del tiempo no debe romper pruebas.

## Condiciones para publicar

Un push a `main` publica en menos de un minuto, así que el PR no se fusiona hasta cumplir todo esto:

1. **Lista 2026 cotejada.** Se transcribe de las imágenes del escaneo, y el usuario aprueba valor por valor los que usa la calculadora.
2. **CEL leído en el Diario Oficial.** El 13.9 % se confirmó en despachos, no en el Acuerdo del 17-ago-2026. Si no se puede leer, esa cuenta se retira.
3. **Vigencia revisada.** NOM-001-SECRE-2010, NOM-016-CRE-2016, Reglas del Mercado y factor del sistema eléctrico, en PLATIICA, Diario Oficial y Semarnat.
4. **Artículos confirmados en la tabla `leyes`**, consultando por id, sin barridos: la base es compartida y de plan Free.
5. **Fuentes en orden.** `node scripts/audit-calc-fuentes.mjs --strict` pasa.
6. **Textos aprobados por el usuario**, conforme a la regla de contenido técnico del 2026-10-04.
7. **Revisión final:** `npm test`, `npm run lint` y navegador, con evidencia en el PR.

## Riesgos conocidos

| Riesgo | Cómo se trata |
|---|---|
| Los «netos» de la Lista quedan 4 a 8 % sobre el cálculo físico | Se publican como «valor publicado», con la física a un toque. Consultar a SENER es opcional y no bloquea |
| 0.54 kg/L no aparece en un documento | Se rotula «convención de las tablas de precios» |
| 38.64 MJ/m³ no es oficial | Se rotula «valor típico, no oficial»; campo editable con el rango de la NOM |
| Densidad de diésel sin fuente oficial | Editable y rotulada |
| Constantes de VCF de fuente secundaria; Z sin AGA-8 | Rotulado «orientativo»; la nota al pie excluye medir y facturar |
| Reglas del Mercado pendientes de actualización | Rótulo fijo en esos cálculos, y fecha y versión en cada valor |
| 0.444 es de 2024 | Se muestra el año; se revisa en febrero |
| Defectos del troceado (`LSH-Art-027` duplicado) | Tarea aparte. Ese artículo no se enlaza |
| El «0.7 MW» no aclara AC o DC | La cuenta no afirma cuál |
