# Gas natural y GNL en México: unidades, condiciones de referencia, calidad y ajustes

Consulta al 8 de noviembre de 2026. Los números marcados "cálculo propio" salen de mis propias cuentas sobre valores citados; no son de una fuente. Las cifras de la NOM-001, la Lista de combustibles 2025, la Serie histórica y la hoja de factores de SENER las leí directamente en el PDF oficial (texto o imagen de la página). Notación: punto decimal y coma de miles, salvo en citas de la NOM, que usa coma decimal.

**Tres premisas del encargo que hay que corregir:**
1. La NOM-001-SECRE-2010 **no** fija "20 °C y 101.325 kPa". Fija dos juegos: *base* = 20 °C y 98.07 kPa; *estándar* = 15 °C y 101.325 kPa. Las propiedades, y los informes al público, van en estándar.
2. La NOM-014-CRE-2016 **no** es de medición de gas natural: el DOF la nombra "Especificaciones de calidad de los petroquímicos". La medición está en otros instrumentos (sección 5).
3. "5.8 Mpc/boe" no es el valor mexicano. Es una regla que sale de 5.8 MMBtu por barril con gas de 1,000 Btu/pc. Pemex usa 5.201 mil pies cúbicos de gas seco por barril (sección 10).

---

## 1. Volumen y flujo: pc, mpc, Mpc, MMpc, MMpcd, Bcf, Tcf; m³, Nm³, Sm³

### Takeaway
En gas, "M" romana significa mil y "MM" millón, al revés del prefijo SI, y las fuentes mexicanas no son uniformes (MMPCSD, MMPCD, MMpc, mmpcd, b/mmpc). Lo que más pesa no es la letra sino la condición de referencia: un "MMPCD" de Cenagas puede estar a condición base y un "MMPCSD" a estándar, con 5% de diferencia.

### Cited Findings
- Cenagas define "MMPCSD: millones de pies cúbicos diarios a condiciones estándar" y pide las cantidades en volumen (MMPCSD) y energía (Giga Joules) — [TCPS Sistrangas 2021, definiciones y condición 7.1](https://boletin-gestor.cenagas.gob.mx/Docs/tcps/TCPS_2021.pdf).
- La tabla de capacidad del Sistrangas usa "MMPCD" y aclara que la capacidad operativa se calcula "en condiciones base de 98.07 kPa y temperatura de 293.15 K conforme a lo establecido en el permiso de cada Sistema Integrante"; p. ej. Sistema Nacional de Gasoductos 5,880 MMPCD, Gasoductos del Noreste 2,100 MMPCD — [Cenagas, Descripción General](https://boletin-gestor.cenagas.gob.mx/Docs/diagramas/Descripcion_General_SISTRANGAS.pdf).
- SENER usa "MMpc" en una nota al pie y "mmpcd" (minúsculas, también millones) en el texto del mismo documento — [Prospectiva de Gas Natural 2017-2031](https://www.gob.mx/cms/uploads/attachment/file/284343/Prospectiva_de_Gas_Natural_2017.pdf).
- Pemex escribe "millares de pies cúbicos" y "b/mmpc" para barriles por millón de pies cúbicos — [Las reservas de hidrocarburos de México, 1 de enero de 2019](https://www.pemex.com/ri/Publicaciones/Reservas%20de%20hidrocarburos%20evaluaciones/20190101_rh_e.pdf).
- El IPGN (CRE, hoy publicado en el sitio de la CNE) escribe "Dólares por Millón de unidades térmicas británicas (USD/MBtu)": ahí MBtu = millón — [Metodología IPGN](https://www.gob.mx/cms/uploads/attachment/file/301451/180129.IPGN.Metodolog_a..pdf); [CNE, IPGN](https://www.cne.gob.mx/IPGN/).
- La hoja de SENER da "1 pie cúbico = 1.03 MBTU de gas natural": ahí MBTU = mil — [Factores de Conversión - Gas Natural, Prospectiva 2015-2029](https://www.gob.mx/cms/uploads/attachment/file/116104/Factores_de_Conversi_n-Gas_Natural.pdf).
- Lista trilateral (Canadá, EE. UU., México) de unidades: cf, Mcf, MMcf, Bcf, Tcf, m³, m³/d, Btu, MMBtu, Btu/cf, MTPA; 1 m³ = 35.3146667 cf; 1 cf = 0.0283168466 m³; Sm³ = 15 °C y 101.325 kPa; Nm³ = 0 °C y 101.325 kPa; 1 Sm³ = 0.948 Nm³; 1 Nm³ = 1.055 Sm³ — [NRCan, factores de la cooperación norteamericana](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information).
- La NOM-002 define el "metro cúbico estándar" a 101.325 kPa y 288.15 K — [NOM-002-SECRE-2010, 4.17](https://www.naturgy.com.mx/mx/files/NOM_002_SECRE_2010.pdf).

### Inferences
- Glosario propuesto: pc = pie cúbico; mpc o Mpc = 10³ pc; MMpc = 10⁶ pc; mmmpc, MMMpc o Bcf = 10⁹ pc; Tcf = 10¹² pc; sufijo "d" = por día. Avisar que "billion" = mil millones y "trillion" = billón en español.
- En el SI, M = mega = 10⁶. Quien lee "Mpc" como mega-pie cúbico se equivoca por mil. Para m³ conviene escribir "millones de m³" o "Mm³", no "MMm³".
- Cálculo propio: 1 MMpcd = 28,316.85 m³/d = 1,179.87 m³/h = 0.32774 m³/s (geométrico, sin cambiar condición).
- Si la calculadora muestra "MMpcd" debe pedir o declarar la condición. Por defecto usaría estándar de la NOM, porque la propia norma exige esa referencia en lo que se pone a disposición del público (sección 3).

### Gaps
- No encontré un glosario oficial vigente de CNE o SENER que fije "mpc" frente a "Mpc". Lo de "mpc = mil" es inferencia por la palabra "millares" de Pemex y el uso de "mmpc" para millón.

---

## 2. Energía: GJ, MMBtu, therm, Gcal, kWh. Qué Btu usa México y en qué se publica el precio

### Takeaway
México reporta y publica el precio mayorista en MXN/GJ y lo convierte a USD/MMBtu con 1.05506 GJ/MMBtu, que es Btu IT redondeado. Todos los factores entre unidades de energía son exactos; lo único que no lo es, es pasar de volumen a energía.

### Cited Findings
- La metodología del IPGN: los comercializadores reportan el volumen en GJ y el precio en pesos (RES/882/2015); el índice se calcula en MXN/GJ, promedio ponderado por volumen, y se convierte a USD/MBtu con el tipo de cambio FIX promedio del mes. El índice se da a conocer "de forma orientativa" (Acuerdo A/034/2017) — [Metodología IPGN](https://www.gob.mx/cms/uploads/attachment/file/301451/180129.IPGN.Metodolog_a..pdf).
- Nota 4 de esa metodología, literal: "El factor de conversión a utilizar es de 1.05506 de millones de unidades térmicas británicas por GJ". Está invertido en palabras: 1.05506 es GJ por MMBtu — [Metodología IPGN](https://www.gob.mx/cms/uploads/attachment/file/301451/180129.IPGN.Metodolog_a..pdf).
- La página actual publica MXN/GJ y USD/MBtu, seis regiones y el criterio de transacción atípica (tres desviaciones estándar) — [CNE, IPGN](https://www.cne.gob.mx/IPGN/). Serie histórica 2017-2025 en CSV — [datos.gob.mx](https://www.datos.gob.mx/dataset/gas_natural).
- SENER: 1 GJ = 0.9478 MMBtu — [Prospectiva 2017-2031, nota 25](https://www.gob.mx/cms/uploads/attachment/file/284343/Prospectiva_de_Gas_Natural_2017.pdf). La hoja de SENER da 1 BTU = 1,055.06 J; 1 BTU = 252 cal; 1 cal = 4.1868 J; 1 kcal = 3.968254 BTU; 1 GJ = 239,000,000 cal; 1 Wh = 3,600 J — [Factores de Conversión](https://www.gob.mx/cms/uploads/attachment/file/116104/Factores_de_Conversi_n-Gas_Natural.pdf).
- La extinta CNH fijó 1 Btu = 1.055056 × 10³ J — [Lineamientos Técnicos en materia de Medición de Hidrocarburos, arts. 11 y 13](https://sidof.segob.gob.mx/notas/docFuente/5409741).
- Conuee usa "1 J = 0.2388458966275 cal", es decir la caloría de 4.1868 J — [Serie histórica de la Lista de combustibles, nota 2](https://www.gob.mx/cms/uploads/attachment/file/995835/Serie_hist_rica_de_la_lista_de_combustibles_y_sus_poderes_calor_ficos_2016-2025.pdf).
- NIST: cal IT = 4.1868 J (exacto); cal termoquímica = 4.184 J (exacto); therm (EC) = 1.05506 × 10⁸ J (exacto); therm (US) = 1.054804 × 10⁸ J (exacto); Btu IT ≈ 1.055056 × 10³ J — [NIST SP 811, apéndice B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9). NRCan da 1 Btu = 1055.05585 J y 251.995761 cal — [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information).
- La electricidad equivale a 3,600 MJ/MWh — [Lista de combustibles 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf).
- La capacidad se adjudica en energía: en NET México, 220,741 MMBtu/d de 753,722 MMBtu/d disponibles; en la primera temporada abierta de Cenagas, 2,346,021 GJ/d — [Prospectiva 2017-2031](https://www.gob.mx/cms/uploads/attachment/file/284343/Prospectiva_de_Gas_Natural_2017.pdf).

### Inferences
- México usa Btu IT en la práctica: los valores 1.05506 (CRE), 1.055056 (CNH) y 1,055.06 J (SENER) son redondeos del Btu IT, y SENER y Conuee usan la caloría de 4.1868 J. No encontré ninguno basado en Btu termoquímico.
- Cálculo propio de la definición: 4.1868 J × 453.59237 × 5/9 = 1,055.05585262 J. Por eso 1 MMBtu = 1.05505585262 GJ exacto. Usar 1.05506 da 0.0004% de diferencia, irrelevante para un público.
- El factor del IPGN se aplica multiplicando: (MXN/GJ ÷ MXN/USD) × 1.05506 = USD/MMBtu. Quien siga la redacción literal y lo aplique al revés se equivoca 11%.

### Gaps
- No pude leer el último valor del IPGN: la tabla carga dinámicamente y llega vacía sin navegador. Tampoco confirmé si la CNE cambió metodología; la página aún habla de la "Comisión Reguladora de Energía".
- No verifiqué en un recibo real ni en condiciones generales de un distribuidor cómo se factura al usuario doméstico (m³, GJ, factor de corrección). La página de [Naturgy](https://www.naturgy.com.mx/blog/hogar/poder-calorifico-del-gas-natural/) no lo dice.

---

## 3. Condiciones de referencia

### Takeaway
Hay al menos seis condiciones vivas en el mercado. La oficial para propiedades y para el público es estándar NOM (15 °C, 101.325 kPa). La condición base (20 °C, 98.07 kPa = 1 kg/cm² absoluto) sobrevive en permisos y medidores viejos y da 5.1% más "metros cúbicos" para el mismo gas. Estándar NOM y estándar de EE. UU. son casi iguales (0.04%).

### Cited Findings
- NOM-001 3.7: "Condiciones base: ... presión absoluta de 98,07 kPa y temperatura de 293,15 K". 3.8: "Condiciones estándar: ... presión absoluta de 101,325 kPa y temperatura de 288,15 K" — [NOM-001-SECRE-2010, DOF 19-mar-2010](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/001secre2010.pdf).
- NOM-001 4.2: "Las propiedades del gas natural en esta Norma se encuentran referidas a condiciones estándar"; "Un metro cúbico de gas natural en condiciones base equivale a 0,95137 metros cúbicos de gas en condiciones estándar"; los equipos nuevos "deberán estar calibrados en condiciones estándar"; "Los informes proporcionados a la Comisión y los que se pongan a disposición del público deberán estar siempre referidos a condiciones estándar" — [misma norma](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/001secre2010.pdf).
- Cenagas conserva la base en capacidad y agrega que esos parámetros "en condiciones estándar" son 101.3 kPa y 288.15 K — [Descripción General Sistrangas](https://boletin-gestor.cenagas.gob.mx/Docs/diagramas/Descripcion_General_SISTRANGAS.pdf).
- La Lista de combustibles (alineada con el Balance Nacional) usa otra: "volúmenes medidos a 20 °C y a 100 kPa de presión" — [Lista 2025, notas 2 y 3](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf).
- La CNH (medición de producción) usa 15.56 °C y 101.325 kPa absolutos, con 1 m³ = 35.3147 pie³ a 15.5556 °C — [Lineamientos de Medición, arts. 11 y 13](https://sidof.segob.gob.mx/notas/docFuente/5409741). Es regulación de 2015; no revisé sus reformas posteriores.
- Referencia trilateral: pies cúbicos a 60 °F y 14.73 psia; m³ a 15 °C y 101.325 kPa — [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information). NAESB: Btu a 14.73 psia secos y 60 °F — [GISB/NAESB](https://ns.naesb.org/pdf/c97017.pdf).
- En Texas hay contratos a 14.65 psia y 60 °F — [definición contractual](https://lawinsider.com/dictionary/standard-base-conditions). Wyoming publica el factor de 14.65 a 14.73 psia, 0.9945 — [Wyoming Code R. 055-3](https://www.law.cornell.edu/regulations/wyoming/055-3-Wyo-Code-R-SS-3-31).

### Inferences
**Tabla de condiciones (cálculo propio con gas ideal; Z cambia menos de 0.05% entre ellas).**

| Condición | T | P abs. | Quién la usa | 1 m³ de esta condición = ... m³ estándar NOM |
|---|---|---|---|---|
| Base NOM | 20 °C | 98.07 kPa | NOM-001 3.7, permisos, Sistrangas capacidad | 0.95137 (EXACTO por norma) |
| Estándar NOM (Sm³) | 15 °C | 101.325 kPa | NOM-001 3.8, NOM-002, informes al público | 1 |
| Conuee / Balance | 20 °C | 100 kPa | Lista de combustibles | 0.97009 |
| CNH | 15.56 °C | 101.325 kPa | Medición de producción | 0.99808 |
| EE. UU. habitual | 60 °F | 14.73 psia (101.56 kPa) | NRCan, NAESB | 1.00039 |
| Contratos Texas | 60 °F | 14.65 psia (101.01 kPa) | Contratos de Texas | 0.99495 |
| Normal (Nm³) | 0 °C | 101.325 kPa | Tablas internacionales | 1.05491 |

- 98.07 kPa es 1 kg/cm² (98.0665 kPa), redondeado. La condición base es la antigua "1 kg/cm² y 20 °C".
- Ejemplo. 1,000 MMpcd medidos en Texas a 60 °F y 14.73 psia: geométricamente son 28.317 millones de m³/d a esa misma condición; a estándar NOM 28.328; a base NOM 29.776. Si alguien multiplica por 0.0283168 y lo declara "a base", subestima 4.9%.
- La energía no cambia: 1,037 MMBtu = 1,094 GJ. Por eso, cuando se contrata en GJ o MMBtu, la condición no afecta el pago: solo importa que volumen y poder calorífico estén en la misma condición.
- Cuándo importa: al mezclar volúmenes de fuentes distintas, al comparar capacidad (base) contra demanda (estándar), al usar un poder calorífico de una condición con un volumen de otra, y al facturar por volumen.
- Por defecto usaría estándar NOM, porque es la que la norma exige para el público, y ofrecería la base como opción.

### Gaps
- No pude leer el texto del Texas Natural Resources Code §91.052: la página oficial llegó sin contenido. Una búsqueda lo atribuye a ese artículo, pero lo cito solo por el uso contractual.
- No confirmé qué condición usa hoy cada permiso de transporte o distribución en particular.

---

## 4. Calidad: NOM-001-SECRE-2010, poder calorífico, Wobbe, densidad

### Takeaway
La NOM-001-SECRE-2010 sigue vigente y no encontré sucesora publicada. Para casi todo el país: metano ≥ 84%, PCS 37.30 a 43.60 MJ/m³ y Wobbe 48.20 a 53.20 MJ/m³ en condición estándar. El gas real medido en 2026 está cerca del piso (37.5 MJ/m³), por lo que un valor típico alto como 1,080 Btu/pc sobreestima unos 7% en ese punto.

### Cited Findings
**Vigencia**
- PLATIICA, Secretaría de Economía: estado "Vigente"; publicada 19/3/2010; en vigor 17/5/2010; última revisión sistemática 24-oct-2022 con resultado "Modificación"; no aparece instrumento de modificación posterior a 2014 — [PLATIICA](https://platiica.economia.gob.mx/normalizacion/nom-001-secre-2010/).
- En 2021 se presentaron avances de una modificación ante el comité consultivo — [ANIQ](https://aniq.org.mx/webpublico/Notas/Nota.asp?id=409).
- Acervo local. `public/data/LSH_chunks.json`, id `LSH-Art-112`: las especificaciones de calidad se establecen en las NOM que expida la SENER, con verificación y vigilancia de la CNE. `LSH-Trans-05` (Transitorio Quinto): la normatividad de SENER, CRE y CNH "continuarán en vigor, en tanto no se opongan a la presente Ley". `public/data/RLB_chunks.json`, id `RLB-Art-116`: nombra expresamente la "NOM-001-SECRE-2010, Especificaciones del gas natural" para inyectar biometano. `public/data/LSH_chunks.json`, id `LSH-Art-119`, antes de la fracción XXIII: dictámenes que determinen "el poder calorífico del gas natural". `public/data/RLSH_chunks.json`, id `RLSH-Art-109`: normatividad de medición y calidad a cargo de SENER o CNE.
- Búsqueda en `public/data/*.json`: "Wobbe", "condiciones de referencia", "condiciones estándar", "pie cúbico", "pies cúbicos" e "IPGN" dan cero resultados. El texto de la NOM-001 no está en esos archivos; solo está citada en `RLB-Art-116`. También aparece "poder calorífico" en `Ley_Sector_Electrico_chunks.json`, id `LSE-Art-003`, sobre metano de residuos, sin relación con este tema.

**Especificaciones (NOM-001, Tabla 1; leída en la imagen de la página oficial).** Las columnas de periodo son solo de la Zona Sur; "Resto del País" es una sola columna. Zona Sur = infraestructura del SNG al sur y occidente de la estación Cempoala, Veracruz (3.51) — [NOM-001, Tabla 1](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/001secre2010.pdf).

| Propiedad | Unidad | Resto del País | Zona Sur desde 1-ene-2013 | Zona Sur hasta 2010 (histórico) |
|---|---|---|---|---|
| Metano, mín. | % vol | 84.00 | 83.00 | NA |
| Oxígeno, máx. | % vol | 0.20 | 0.20 | 0.20 |
| CO₂, máx. | % vol | 3.00 | 3.00 | 3.00 |
| Nitrógeno, máx. | % vol | 4.00 | 6.00 | 9.00 |
| Nitrógeno, variación diaria | % vol | ±1.5 | ±1.5 | ±1.5 |
| Inertes (CO₂ + N₂), máx. | % vol | 4.00 | 6.00 | 9.00 |
| Etano, máx. | % vol | 11.00 | 11.00 | 14.00 |
| Rocío de hidrocarburos, máx. | K (°C) | 271.15 (−2) | 271.15 (−2) | NA |
| Humedad, máx. | mg/m³ | 110 | 110 | 110 |
| PCS, mín. | MJ/m³ | 37.30 | 36.80 | 35.30 |
| PCS, máx. | MJ/m³ | 43.60 | 43.60 | 43.60 |
| Wobbe, mín. | MJ/m³ | 48.20 | 47.30 | 45.20 |
| Wobbe, máx. | MJ/m³ | 53.20 | 53.20 | 53.20 |
| Wobbe, variación diaria | % | ±5 | ±5 | ±5 |
| H₂S, máx. | mg/m³ | 6.00 | 6.00 | 6.00 |
| Azufre total, máx. | mg/m³ | 150 | 150 | 150 |

- Temperatura de entrega entre 283.15 y 323.15 K. Determinación de poder calorífico y Wobbe al menos cada hora. Métodos: ISO 6976:1995, GPA 2172-96, ASTM D3588-98 — [NOM-001 en DOF](https://dof.gob.mx/normasOficiales/3997/sener/sener.htm).
- Definiciones: PCS con agua en fase líquida y productos a 288.15 K; PCI con todo en gas; Wobbe = PCS / raíz de la densidad relativa; densidad relativa respecto del aire seco a igual presión y temperatura — [NOM-001, 3.10, 3.24, 3.29](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/001secre2010.pdf).

**Valores típicos.** Conversiones a otras columnas: cálculo propio.

| Fuente | Dato original | MJ/m³ | kcal/m³ | Btu/pc | GJ/MMpc | Base y notas |
|---|---|---|---|---|---|---|
| [Kinder Morgan, reporte CRE, Estación M1, 1 a 4-jul-2026](https://pipeline2.kindermorgan.com/Documents/KMMX/CRE_Daily_Report.pdf?&from=D) | PCS 37.46; Wobbe 49.33; CH₄ 96.63%; N₂ 1.12%; CO₂ 0.98%; C₂ 1.08%; H₂O 27.9 mg/m³; rocío 258.8 K | 37.46 | 8,948 | 1,006 | 1,061 | Medición real, "Resto del País" |
| [EIA, promedio EE. UU. 2025](https://www.eia.gov/tools/faqs/faq.php?id=45&t=8) | 1,037 Btu/cf | 38.64 | 9,228 | 1,037 | 1,094 | PCS; gas entregado a usuarios en EE. UU. |
| [SENER, hoja de factores 2015-2029](https://www.gob.mx/cms/uploads/attachment/file/116104/Factores_de_Conversi_n-Gas_Natural.pdf) | 1 pc = 1.03 MBTU | 38.38 | 9,166 | 1,030 | 1,087 | Condición no indicada |
| [IMCO 2024](https://imco.org.mx/wp-content/uploads/2024/12/AMGN_Investigacion_20241211.pdf) | 1,039 Btu/pc | 38.71 | 9,246 | 1,039 | 1,096 | Factor usado por IMCO para almacenamiento |
| [Pemex, reservas 2019](https://www.pemex.com/ri/Publicaciones/Reservas%20de%20hidrocarburos%20evaluaciones/20190101_rh_e.pdf) | 1,075 Btu/pc | 40.05 | 9,567 | 1,075 | 1,134 | Gas seco dulce |
| [SENER, Prospectiva 2017-2031, nota 25](https://www.gob.mx/cms/uploads/attachment/file/284343/Prospectiva_de_Gas_Natural_2017.pdf) | 1,080 MMBtu/MMpc | 40.24 | 9,611 | 1,080 | 1,139 | Factor de esa edición |
| [SENER, hoja de factores](https://www.gob.mx/cms/uploads/attachment/file/116104/Factores_de_Conversi_n-Gas_Natural.pdf) | 8,460,000 cal/m³ "para efectos de facturación de gas seco" | 35.42 | 8,460 | 951 | 1,003 | Condición no indicada |
| [SENER, hoja de factores](https://www.gob.mx/cms/uploads/attachment/file/116104/Factores_de_Conversi_n-Gas_Natural.pdf) | 8,967,600 cal/m³ "con un factor de corrección calorífica de 1.06" | 37.55 | 8,968 | 1,008 | 1,063 | Condición no indicada |

**Lista de combustibles 2025 (Conuee, alineada con el Balance Nacional), etiquetada "poder calorífico neto", a 20 °C y 100 kPa** — [Lista 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf); [Serie 2016-2025](https://www.gob.mx/cms/uploads/attachment/file/995835/Serie_hist_rica_de_la_lista_de_combustibles_y_sus_poderes_calor_ficos_2016-2025.pdf):

| Combustible | kJ/m³ 2025 | kJ/m³ 2021 | bep/m³ 2025 | En estándar NOM (cálculo propio) |
|---|---|---|---|---|
| Gas natural (promedio asociado y no asociado) | 39,082.60 | 40,333 | 0.0061 | 40.29 MJ/m³ |
| Gas natural asociado | 40,356.75 | 42,103 | 0.0063 | 41.60 |
| Gas natural no asociado | 37,808.46 | 42,103 | 0.0059 | 38.97 |
| Gas seco | 33,543.27 | 38,128 | 0.0052 | 34.58 |
| Gas seco de exportación | 33,803.55 | 33,804 | 0.0053 | 34.85 |
| Gas seco de importación | 38,239.94 | 38,424 | 0.0059 | 39.42 |

- Referencia de la lista: 1 bep = 6,427.76 MJ/bl en 2025 — [Lista 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf). Conuee la publica cada año, alineada con el Balance — [Conuee](https://www.gob.mx/conuee/articulos/publica-la-conuee-la-lista-de-combustibles-para-ayudar-al-cumplimiento-del-programa-upac).
- El Balance Nacional de Energía usa el joule y el poder calorífico neto; para gas natural la diferencia entre bruto y neto es 10% — [Anexo metodológico del Balance](https://www.snieg.mx/DocAcervoINN/documentacion/inf_nvo_acervo/snigma/orig_dest_energia/anexo%20_5_9_4_anexo_metod_bal_nac_ener.pdf). IPCC: "For most forms of natural and manufactured gas, the NCV is about 10 percent less" — [IPCC 2006, vol. 2, cap. 1](https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_1_Ch1_Introduction.pdf).

### Inferences
- **Valor por defecto del catálogo:** PCS = 38.6 MJ/m³ estándar (1,037 Btu/pc, 1,094 GJ/MMpc, TÍPICO), rango 37.3 a 43.6, y siempre editable. Lo prefiero a 1,080 (SENER 2017) porque el único punto medido que leí, de 2026, está en 1,006; y porque, según el propio encargo, hay importación de Texas. Sobre ese punto, 1,037 aún sobreestima 3%. Cuando dos fuentes oficiales difieren (1,030 y 1,080 de SENER), uso la cercana a lo medido y declaro el rango.
- **PCI ≈ 0.90 × PCS** (TÍPICO, rango 0.89 a 0.91): 34.8 MJ/m³ estándar si PCS = 38.64.
- **Duda sobre la Lista.** "Gas seco" pasa de 38,128 (2021) a 33,543 (2022 en adelante), −12%, justo lo que separa PCS de PCI. Y "gas seco de importación" sigue en 38,240 con la etiqueta "neto". Convertido a estándar (39.42) y dividido entre 0.9, daría PCS ≈ 43.8 MJ/m³, arriba del máximo de la NOM (43.60). Lo más probable es que algunos renglones de la Lista mezclen base bruta y neta. La usaría solo para lo que fue hecha (bep para Usuarios de Patrón de Alto Consumo), no como poder calorífico de facturación.
- **Densidad relativa:** del reporte de Kinder Morgan, rr = (37.46 / 49.33)² = 0.577. Para el catálogo: TÍPICO 0.60, rango 0.57 a 0.65.
- **Densidad:** aire = 1.2249 kg/m³ en estándar y 1.1653 kg/m³ en base (cálculo propio con gas ideal). Gas: ρ = rr × aire: 0.71 a 0.80 kg/m³ en estándar; 0.67 a 0.76 kg/m³ en base. 1 MMpc ≈ 20 a 22.5 t.
- **Comprobación de Wobbe:** 37.46 / √0.577 = 49.3 MJ/m³, igual al reportado.
- Parte de las diferencias entre 8,460 y 8,967.6 kcal/m³ parece de condición: 35.42 MJ/m³ está junto a 37.30 × 0.95137 = 35.49 (piso NOM en base). Es indicio, no dato de SENER.

### Gaps
- No encontré boletines públicos de Cenagas con poder calorífico por punto ni un promedio oficial mexicano reciente de PCS. Solo tengo el dato de Kinder Morgan: un punto y pocos días de julio de 2026, sin saber el origen del gas; no representa a todo el país. El reporte tampoco repite la condición de referencia; supongo estándar por NOM 4.2.
- No conseguí la Lista de combustibles 2026; la última que leí es 2025.
- No obtuve valores de calidad típicos de Pemex por complejo procesador en MJ/m³.
- PLATIICA dice "Modificación" como resultado de revisión, pero no hallé proyecto publicado por SENER o CNE en 2025-2026; esto podría cambiar.

---

## 5. Ajustes: ley de gases, Z, volumen a condición base, medición

### Takeaway
Vb = Vf × (Pf/Pb) × (Tb/Tf) × (Zb/Zf), con presiones absolutas. Para una calculadora pública basta la correlación GPSA para Z, con margen de hasta 3% a alta presión contra otros métodos. Se puede omitir Z solo a baja presión. Para medir o facturar se exige AGA-8 y equipos, no una calculadora.

### Cited Findings
- AGA Report 8 Parte 1 cubre factores de compresibilidad con las ecuaciones DETAIL y GROSS, solo en fase gaseosa — [ficha AGA 8 Parte 1](https://standards.globalspec.com/std/10158319/aga-report-8-p1). La Parte 2 (GERG-2008, edición 2017) mejora a DETAIL, sobre todo a alta presión y baja temperatura — [ficha AGA 8 Parte 2](https://standards.globalspec.com/std/10157853/aga-report-8-p2).
- Rango estándar en una implementación comercial: DETAIL 0 a 1,750 psia; GROSS 0 a 1,200 psia — [Weatherford CygNet](https://softwaredocs.weatherford.com/cygnet/95/Content/Topics/CygNet%20Measurement/CygNet%20Measurement%20Data%20Calculation%20-%20AGA%208.htm).
- Títulos: AGA 3, medición con placa de orificio; AGA 7, medidores de turbina; AGA 9, ultrasónicos multitrayectoria — [lista de normas de un operador](https://etketconnect.energytransfer.com/intrastate/postedDocs/GAS_QUALITY_STANDARDUPLOADALLPIPES.pdf).
- Correlación GPSA: para P > 100 psia, Z = 1 / (1 + P × 344400 × 10^(1.785 × SG) / T^3.825), con P en psia y T en °R; para P ≤ 100 psia, Z = 1 / (1 + 0.0002 × P). La fuente dice que da resultados "relatively crude" arriba de 400 psig — [Technical Toolboxes, Compressibility](https://help.technicaltoolboxes.com/knowledge-base/compressibility/).
- Regla de la misma fuente: para flujo en tubería, Z = 1 suele ser aceptable hasta 100 psig y puede serlo hasta 400 psig; para medición recomienda corregir siempre — [Technical Toolboxes](https://help.technicaltoolboxes.com/knowledge-base/compressibility/).
- **Instrumentos mexicanos de medición:**
  - **NOM-014-CRE-2016** es "Especificaciones de calidad de los petroquímicos" — [DOF, convocatoria a laboratorios](https://dof.gob.mx/nota_detalle.php?codigo=5478196&fecha=01/04/2017). Un blog la describe como norma de medición y calidad del gas natural — [AIRegula](https://airegulasolutions.com/Post/nom-014-cre-2016/30204), pero contradice al DOF; uso el DOF.
  - **Disposiciones de medición en transporte por ducto:** RES/776/2015, con referencias a normas API, AGA, ISO, JCGM, NOM y NMX — [certificado CIATEQ](https://ciateq.repositorioinstitucional.mx/jspui/bitstream/1020/540/1/Certificado%20de%20calibracion%20Llave%20confirmacion%20metrologica.pdf). Un acuerdo posterior delimita su alcance — [Energía a Debate](https://energiaadebate.com/?p=10639).
  - **Lineamientos CNH 2015:** composición por cromatografía o laboratorio, análisis cromatográfico mensual; incertidumbre máxima de 1% en gas natural en Punto de Medición, hasta 5% en gas para aprovechamiento, reinyección o quema, y 1% si hay efectos fiscales o comerciales; reportar factor de corrección por poder calorífico — [Lineamientos, arts. 13, 25, 27, 32, 38](https://sidof.segob.gob.mx/notas/docFuente/5409741).
  - **Medidor doméstico:** NOM-014-SCFI-1997, diafragma hasta 16 m³/h, vigente — [ficha](https://mley.mx/normas/nom-014-scfi-1997/index.html.md). Lo vi en la ficha, no en el texto de la norma.
  - **NOM-017-CRE-2019:** medición de variables de energía libre de combustible, vigente; no es esto, pero aparece en las búsquedas — [PLATIICA](https://platiica.economia.gob.mx/normalizacion/?p=161608).
- Los TCPS remiten la medición a las "Disposiciones Jurídicas Aplicables" y cada Sistema Integrante responde por ella — [TCPS 2021, condición 9.4](https://boletin-gestor.cenagas.gob.mx/Docs/tcps/TCPS_2021.pdf).
- Acervo: `public/data/RLSH_chunks.json`, id `RLSH-Art-003`, fr. XXX, define "Lineamientos Técnicos" como especificaciones que corresponde establecer a la Secretaría; `RLSH-Art-109` manda emitir normatividad de medición y calidad. Es decir, el tema de la extinta CNH pasó a SENER.

### Inferences
**Fórmula con ejemplo resuelto (cálculo propio).**

Vb = Vf × (Pf/Pb) × (Tb/Tf) × (Zb/Zf)

Datos: 1,000 m³ en línea a 50 kg/cm² manométricos y 20 °C. Se pide a estándar NOM.
1. Pf absoluta = 50 × 98.0665 + 101.325 = 5,004.65 kPa. Pb = 101.325 kPa.
2. Tb/Tf = 288.15 / 293.15 = 0.98294.
3. Sin Z: 1,000 × 49.392 × 0.98294 = 48,550 Sm³.
4. Con Z: GPSA da Zf = 0.900 (rr = 0.594, en psia y °R); Zb = 0.997. Vb = 48,550 × 0.997 / 0.900 = 53,800 Sm³.
5. Energía: 53,800 × 38.62 MJ/m³ = 2,078 GJ.
6. Omitir Z aquí subestima unos 10% (entre 9.7% y 11.6%, según el método para Zf). A condición base serían 56,550 m³.

**Comparación de Z (cálculo propio, gas de 93% CH₄, rr = 0.594; no es AGA-8).**

| kg/cm² man. | °C | Peng-Robinson | Papay | GPSA | Diferencia máx. |
|---|---|---|---|---|---|
| 0.2 | 20 | 0.997 | 0.997 | 0.997 | 0% |
| 7 | 20 | — | — | 0.983 | — |
| 10 | 20 | 0.973 | 0.974 | 0.977 | 0.4% |
| 20 | 15 | 0.945 | 0.948 | 0.953 | 0.8% |
| 28 | 15 | — | — | 0.937 | — |
| 35 | 15 | 0.909 | 0.916 | 0.923 | 1.6% |
| 50 | 15 | 0.874 | 0.886 | 0.894 | 2.3% |
| 70 | 15 | 0.833 | 0.852 | 0.858 | 3.0% |
| 84 | 15 | 0.808 | 0.832 | 0.835 | 3.3% |

**Regla propuesta para el catálogo:**
- Hasta 7 kg/cm² man. (100 psig): Z se puede omitir; error de 1.7% en volumen o menos.
- De 7 a 28 kg/cm² (400 psig): aplicar GPSA; margen de 1% aproximado.
- De 28 a 85 kg/cm²: GPSA con aviso de ±3%, "solo orientativo; no sirve para facturar ni medir".
- En una fórmula de flujo Z entra bajo raíz y pesa la mitad; en corrección de volumen pesa completo. Por eso la regla de 400 psig no aplica a conversión de volumen: a 28 kg/cm² omitir Z da casi 7%.
- Zb se puede fijar en 1: en condición base o estándar es 0.997 y el error es 0.3%.

**Casa habitación.** Z ≈ 1, pero la altitud manda. Con presión atmosférica estándar a 2,240 m (77.15 kPa, cálculo propio con atmósfera estándar) y 2 kPa manométricos supuestos a 20 °C: 100 m³ medidos en Ciudad de México son 76.8 m³ estándar (2.97 GJ); al nivel del mar, 100.2 m³ (3.87 GJ). La diferencia es de 23%. El valor de 2 kPa es un supuesto mío para ilustrar.

### Gaps
- No tuve acceso al texto de AGA 3, 7, 8, 9 (de pago) ni a un cálculo AGA-8 real: los márgenes salen de comparar correlaciones, no contra la norma. No pude ejecutar CoolProp o REFPROP aquí.
- No leí el texto de RES/776/2015 en el DOF; el número y fecha (17/12/2015) vienen de fuentes secundarias, y no sé si SENER o CNE la sustituyeron.
- No confirmé si los Lineamientos de la CNH de 2015 siguen en esa redacción tras sus reformas.

---

## 6. GNL

### Takeaway
Para un público: 450 kg/m³, −162 °C, 52 MMBtu/t, 1 m³ de GNL ≈ 600 m³ de gas, 1 mtpa ≈ 132 MMpcd. Todos son TÍPICOS salvo que se fije composición. La capacidad instalada de regasificación en México es 17.9 MTPA ≈ 2,355 MMpcd según GIIGNL 2026.

### Cited Findings
**Factores**
- EIA: enfriado a unos −260 °F; ocupa cerca de 1/600 del volumen; la licuefacción consume cerca de 7% a 15% del gas de alimentación — [EIA, LNG](https://www.eia.gov/energyexplained/natural-gas/liquefied-natural-gas.php).
- NRCan: 1 m³ de GNL = 615 m³ de gas = 21,718.52 cf; 1 Mt = 48.0279467 Bcf; 1 MTPA = 0.131584156 Bcf/d; 1 Bcf/d = 7.59974192 MTPA; advierte que varían con condición y composición — [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information).
- S&P Global Platts: 1 t de GNL = 52 MMBtu — [Platts, Conversion Factors](https://www.spglobal.com/commodityinsights/PlattsContent/_assets/_files/en/conversiontables/conversion_factors.pdf).
- LNG Atlas: 450 kg/m³ (cargas reales 430 a 470 kg/m³); 52 MMBtu/t (51 a 54) — [LNG Atlas](https://lngatlas.org/converter/).
- IGU: densidad 450 kg/m³; 1 t = 1,300 Nm³; 585 m³ gas por m³ de GNL; 53.4 MMBtu/t y 24.0 MMBtu/m³ en poder calorífico bruto — [IGU, Natural Gas Conversion Pocketbook](https://www.apeg.pt/folder/documento/ficheiro/natural-gas-conversion-pocketbook_fec0aeed1d2e6a84b27445ef096963a7eebab0a2.pdf). Dato visto por resumen de búsqueda, no en el PDF completo.
- Buques: 79 entregados en 2025 con capacidad media de 175,586 m³ — [GIIGNL Annual Report 2026](https://www.americaslngsummit.com/media/anfhb5t1/2026-giignl-annual-report.pdf).

**Terminales de regasificación** — [GIIGNL 2026](https://www.americaslngsummit.com/media/anfhb5t1/2026-giignl-annual-report.pdf). Conversión a MMpcd: cálculo propio con 131.58 MMpcd/MTPA.

| Terminal | Tipo | Tanques | Almacenamiento (m³) | Vaporizadores | MTPA | MMpcd | Operador o dueños | Inicio |
|---|---|---|---|---|---|---|---|---|
| Altamira | En tierra | 2 | 300,000 | 5 | 5.7 | 750 | Terminal de LNG de Altamira (Vopak 60%, Enagás 40%) | 2006 |
| Energía Costa Azul | En tierra | 2 | 320,000 | 6 | 7.6 | 1,000 | IEnova (Sempra) | 2008 |
| Manzanillo | En tierra | 2 | 300,000 | N/D | 3.8 | 500 | Mitsui 37.5%, Samsung 37.5%, KOGAS 25%; opera Terminal KMS | 2012 |
| Pichilingue, La Paz | En tierra | 3 | 1,050 | N/D | 0.8 | 105 | New Fortress Energy | 2021 |
| **Total** | | | **921,050** | | **17.9** | **2,355** | | |

- SENER en 2017: tres terminales con "capacidad de regasificación de hasta 2900 mmpcd" y 920,000 m³ de almacenamiento — [Prospectiva 2017-2031](https://www.gob.mx/cms/uploads/attachment/file/284343/Prospectiva_de_Gas_Natural_2017.pdf).
- EIA: Altamira 0.6 Bcf/d, Manzanillo 0.5 Bcf/d, Costa Azul 1 Bcf/d — [EIA, Today in Energy](https://www.eia.gov/todayinenergy/detail.php?id=11291). Altamira con 500 MMcf/d pico según una nota de NGI vista solo en resultado de búsqueda, porque el sitio bloqueó la lectura — [NGI](https://www.naturalgasintel.com/shell-submits-winning-bid-for-altamira-lng-project-2/).

**Exportación**

| Proyecto | Capacidad | Estado reportado | Fuente |
|---|---|---|---|
| Altamira Fast LNG FLNG1 | 1.4 MTPA; 0.199 Bcf/d; tanque 160,000 m³ | Exportó 1.1 Mt en 2025 | [GIIGNL 2026](https://www.americaslngsummit.com/media/anfhb5t1/2026-giignl-annual-report.pdf); [EIA](https://www.eia.gov/todayinenergy/detail.php?id=62984) |
| Altamira FLNG2 | otras 0.199 Bcf/d; 2.8 MTPA con ambas (dato visto en resultado de búsqueda) | En construcción en 2024; se esperaba 1S 2026, sin confirmar | [EIA](https://www.eia.gov/todayinenergy/detail.php?id=62984); [RBN](https://rbnenergy.com/daily-posts/blog/mexico-hoping-boom-lng-exports-major-hurdles-remain) |
| ECA Fase 1, Ensenada | 3.25 MTPA; ~430 MMcf/d (EIA: 0.4 Bcf/d) | Primer GNL junio de 2026, primer cargamento julio de 2026; daño en compresores; terminación sustancial esperada en 4T 2026 | [OGJ](https://www.ogj.com/pipelines-transportation/lng/news/55394088/sempra-extends-eca-lng-phase-1-commissioning-due-to-compressor-damage); [GIIGNL news](https://www.giignl.org/news/sempra-infrastructure-extends-eca-lng-commissioning-due-to-compressor-damage); [East Daley](https://eastdaley.com/daley-note/costa-azul-produces-first-lng-adding-to-southwest-demand-growth) |
| Saguaro Energía (Mexico Pacific) | EIA 2.0 Bcf/d; 14.1 Mt/año en 2023; hasta 15 Mtpa en otros resúmenes | Propuesto, sin FID en el reporte de EIA | [EIA](https://www.eia.gov/todayinenergy/detail.php?id=62984); [Oil & Gas Watch, 2023](https://news.oilandgaswatch.org/post/the-u-s-lng-export-boom-is-spreading-to-mexico-and-its-environmentally-sensitive-gulf-of-california) |
| Amigo LNG, Guaymas | EIA 1.0 Bcf/d; 4.2 Mt/año más 3.6 posibles (7.8 en total) | Propuesto; contratos con inicio en 3T 2028 | [EIA](https://www.eia.gov/todayinenergy/detail.php?id=62984); [Oil & Gas Watch, 2023](https://news.oilandgaswatch.org/post/the-u-s-lng-export-boom-is-spreading-to-mexico-and-its-environmentally-sensitive-gulf-of-california); [GIIGNL 2026](https://www.americaslngsummit.com/media/anfhb5t1/2026-giignl-annual-report.pdf) |
| Vista Pacífico; Gato Negro; Salina Cruz | 0.5; 0.6; 0.4 Bcf/d | Propuestos en 2024 | [EIA](https://www.eia.gov/todayinenergy/detail.php?id=62984) |

Acervo: `public/data/LSH_chunks.json`, id `LSH-Art-076`, fr. II, inciso a), pone a cargo de la CNE el procesamiento, licuefacción y regasificación de gas natural; `public/data/RLSH_chunks.json`, id `RLSH-Art-003`, fr. XXIX, define Licuefacción, e id `RLSH-Art-093` da hasta veinte años a esos permisos.

### Inferences
Cálculo propio:
- −260 °F = −162.2 °C.
- 1 m³ GNL (450 kg/m³; 52 MMBtu/t) = 0.45 t = 23.4 MMBtu = 24.7 GJ.
- 1 t GNL = 2.22 m³ GNL = 52 MMBtu = 54.9 GJ (rango 53.8 a 57.0) = 48.0 Mpc (NRCan).
- 1 m³ GNL en m³ de gas según condición, con gas de rr = 0.594: 617 Sm³ o 649 m³ base. Por eso conviven 585 (Nm³), 600 (redondeo), 615 (Sm³). Con la condición base de permisos da unos 650.
- 1 t GNL ≈ 1,372 Sm³ ≈ 1,442 m³ base.
- Buque medio de 175,586 m³ = 79,014 t = 4.11 millones de MMBtu = 4.33 PJ = 3.79 Bcf. Llenaría 7.6 días a una terminal de 500 MMpcd.
- La razón Bcf/d por mtpa varía según el proyecto: ECA 0.123, Amigo 0.128, Saguaro 0.133 a 0.142, NRCan 0.132, FLNG Altamira 0.142. Conviene mostrarla como 0.13 ±8%. Parte de la dispersión es capacidad nominal contra gas de alimentación, porque la licuefacción consume 7% a 15%.
- En GIIGNL, 5.7, 7.6 y 3.8 MTPA equivalen justo a 750, 1,000 y 500 MMpcd, y la suma coincide con el total del país (17.9), así que usaría esa fuente. Para Altamira difiere de 500 MMcf/d (NGI) y 0.6 Bcf/d (EIA, 2013): por defecto 750, mencionando que fuentes anteriores daban 500-600.
- La cifra de 2,900 mmpcd de SENER (2017) no cuadra con GIIGNL (2,355), aunque el almacenamiento sí. Daría GIIGNL por defecto y citaría SENER como capacidad "de hasta".
- **Error que apareció en mi propia búsqueda:** un resumen automático decía "0.73 mtpa por Bcf/d". Es falso: 1 Bcf/d ≈ 7.6 mtpa.

### Gaps
- No encontré una tabla de conversión de GNL de GIIGNL en el informe 2026 ni la composición típica de cargamentos a México.
- Los datos por operador (Vopak, KMS, Sempra) no los verifiqué en sus sitios; GIIGNL es la fuente. El estado de FLNG2, Saguaro y Amigo a noviembre de 2026 no está confirmado. Después de agosto no hallé noticias sobre el arreglo de ECA.
- La capacidad de Saguaro en Bcf/d y en mtpa viene de fuentes distintas; no vi un documento del desarrollador. IEEFA, RBN y NGI bloquearon la lectura automática.

---

## 7. Presión, velocidad y capacidad

### Takeaway
En México se habla en kg/cm², y 1 kg/cm² no es 1 bar (2% de diferencia). El Sistrangas opera con máximos de inyección de unos 21 a 77 kg/cm², entrega a 21 kg/cm² en city gates y 7 kg/cm² a usuarios directos. Dentro de una casa la norma limita a 50 kPa, pero no hallé en norma la presión de aparatos domésticos.

### Cited Findings
- NIST: 1 kgf/cm² = 98,066.5 Pa (exacto); 1 psi = 6,894.757 Pa; 1 inH₂O convencional = 249.0889 Pa — [NIST SP 811, B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9). NRCan: 1 kPa = 0.145037738 psi — [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information).
- Cenagas expresa la presión de recepción o entrega "en kg/cm2 o lb/pulg2" y remite a su Anexo 8 — [TCPS 2021, definiciones y 9.1](https://boletin-gestor.cenagas.gob.mx/Docs/tcps/TCPS_2021.pdf).
- Anexo 8: entrega a usuarios directos 686 kPa (7 kg/cm²); a distribución en city gates 2,059 kPa (21 kg/cm²). Máximas de inyección: 48" Cactus-Lerdo 6,998 kPa; 48" Altamira-Madero 6,984 kPa; 42" India Bonita-Los Ramones 7,584 kPa; 36" Cactus-km 100 7,443 kPa; 12" Reynosa-Miguel Alemán 2,068 kPa — [Anexo 8, Presiones](https://www.gob.mx/cms/uploads/attachment/file/405258/Anexo_8_Presiones.pdf). El texto no dice si es absoluta o manométrica.
- Los Ramones Fase II Norte, presión máxima de operación 8,542 kPa (87.11 kg/cm²) según una tesis — [tesis BUAP](https://repositorioinstitucional.buap.mx/bitstreams/1c515f7e-0ec3-4fb1-9147-af9287045be2/download). Fuente secundaria.
- NOM-002 5.3: en instalaciones domésticas, la MPOP dentro de la casa "no debe exceder de 50 kPa", salvo cubo ventilado o cuartos de caldera. Tubería de cobre hasta 410 kPa; polietileno hasta 689 kPa. Las pruebas de hermeticidad se dividen en hasta 2.5 kPa (0.36 psi), de 2.5 a 50 kPa, de 50 a 689 kPa, y más de 689 kPa. Reguladores según NMX-X-032-SCFI-2006 — [NOM-002-SECRE-2010](https://www.naturgy.com.mx/mx/files/NOM_002_SECRE_2010.pdf).
- Presión de red doméstica, sitio no oficial: 3.5 a 7 inH₂O — [Sensor Automotriz](https://sensorautomotriz.com/preguntas-frecuentes/cuantos-psi-debe-tener-una-casa). Fuente débil, solo de referencia.
- Velocidad de erosión: C/√ρ en ft/s con ρ en lb/ft³, C = 100 según API RP 14E (1984) — [Technical Toolboxes](https://help.technicaltoolboxes.com/?p=1884). Una compilación basada en Menon toma 50% de la de erosión como velocidad aceptable — [Scribd](https://www.scribd.com/doc/241770698/Pipeline-Flow-Gas). Secundaria.
- Weymouth: Q (ft³/d) = 433.49 × (Tb/Pb) × D^2.667 × [(P1² − e^s P2²)/(G Tf Le Z)]^0.5, con °R, psia, pulgadas y millas. La misma fuente dice que está hecha para líneas pequeñas de baja a media presión, y que en líneas grandes de alta presión subestima de 8% a 12% — [Technical Toolboxes, Weymouth](https://ttwiki.azurewebsites.net/knowledge-base/weymouth).

### Inferences
**Ejemplos (cálculo propio).**

Conversiones: 7 kg/cm² = 686.5 kPa = 99.6 psi; 21 kg/cm² = 2,059 kPa = 299 psi; 70 kg/cm² = 6,865 kPa = 996 psi = 68.65 bar. 6,998 kPa = 71.4 kg/cm²; 7,584 kPa = 77.3 kg/cm². 50 kPa = 7.25 psi = 0.51 kg/cm². 7 inH₂O = 1.74 kPa = 17.4 mbar. 2.5 kPa = 10 inH₂O.

Manométrica a absoluta: P abs = P man + P atm. P atm = 101.325 kPa al nivel del mar y 77.15 kPa a 2,240 m.

**Velocidad:** v = (Qb / A) × (Pb / P) × (T / Tb) × (Z / Zb).

1,000 MMpcd por un ducto de 36" (diámetro interno 876 mm supuesto; A = 0.6027 m²), a 15 °C, gas rr = 0.594:
- Qb = 327.7 m³/s (14.73 psia, 60 °F).
- A 70 kg/cm² man., Z ≈ 0.85: gasto en línea 4.07 m³/s; **v ≈ 6.7 m/s**.
- A 40 kg/cm² man., Z ≈ 0.91: gasto en línea 7.5 m³/s; **v ≈ 12.5 m/s**.
- Densidad a 70 kg/cm²: 59 kg/m³. Velocidad de erosión con C = 100 en SI (122/√ρ, conversión propia): 15.9 m/s; la mitad, 8 m/s.

La misma tubería va casi al doble de velocidad si baja la presión a poco más de la mitad; ese efecto se le puede explicar a un público.

**Capacidad (Weymouth, en SI):** Q (m³/d) = 3.7435 × 10⁻³ × E × (Tb/Pb) × √[(P1² − P2²)/(G × Tf × L × Z)] × D^2.667, con D en mm, L en km, P en kPa, T en K. La constante en SI la tomé de memoria y la comprobé numéricamente contra la forma con 433.49: ambas dan lo mismo. Con 36", 100 km, de 70 a 50 kg/cm² man., E = 0.95, Z = 0.85: **≈ 1,009 MMpcd**.

Recomendación: mostrar velocidad al público sí; capacidad solo como "orden de magnitud ±15%", o no mostrarla, porque depende de eficiencia, perfil y compresión.

### Gaps
- No hallé en norma mexicana la presión de suministro a aparatos domésticos (mbar, inH₂O, kPa) ni los mínimos por distribuidor. NOM-002 no la da en lo que revisé. Sin fuente verificada: "7 inH₂O ≈ 1.74 kPa"; no lo pondría como dato mexicano oficial.
- No verifiqué la vigencia de NOM-002-SECRE-2010 frente a posibles normas de ASEA, ni leí NOM-003-SECRE/ASEA (distribución) o NOM-007-ASEA (transporte).
- Las filas del Anexo 8 están desalineadas en el PDF: las presiones por ducto son confiables, la correspondencia con punto de recepción no. Es un anexo de versión anterior de los TCPS; pudo cambiar.
- "Velocidad típica de 10 a 20 m/s en gasoductos": sin fuente verificada.

---

## 8. Consumo por central

### Takeaway
1,000 MW de ciclo combinado consumen unos 140 a 175 MMpcd a plena carga. La fórmula es MMpcd = MW × HR × 24 / 1,094, con HR en GJ/MWh en PCS. Conviene dejar claro si el heat rate está en PCI o PCS, porque cambia 10%.

### Cited Findings
- EE. UU., heat rate promedio de ciclo combinado a gas: 7,549 (2023), 7,548 (2024), 7,535 Btu/kWh (2025); turbina de gas 10,975 y vapor 10,293 Btu/kWh en 2025 — [EIA, Electric Power Annual, tabla 8.2](https://www.eia.gov/electricity/annual/html/epa_08_02.html).
- Ejemplo con 7 GJ/MWh en un ciclo combinado de 540 MW — [Iniciativa Climática sobre acuerdo de la CRE](https://dcmpx.remotevs.com/org/iniciativaclimatica/www/PL/wp-content/uploads/2023/08/Explicacion-Acuerdo-CRE_final.pdf). Copia en un servidor espejo; es un ejemplo, no un promedio.
- Diseños comparados para El Sauz de CFE: 5,674 a 5,695 kJ/kWh en PCI — [tesis UNAM](https://ru.dgb.unam.mx/bitstream/20.500.14330/TES01000752177/3/0752177.pdf).
- Conuee: 1 MWh = 3,600 MJ — [Lista 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf).

### Inferences
Cálculo propio, 1,000 MW a plena carga con 1,037 Btu/pc (1,094 GJ/MMpc):

| Caso | HR (GJ/MWh, PCS) | Eficiencia PCS | GJ/h | GJ/d | MMBtu/d | MMpcd | Mpc/MWh |
|---|---|---|---|---|---|---|---|
| Diseño nuevo (5.7 PCI / 0.9) | 6.33 | 56.8% | 6,333 | 152,000 | 144,068 | 139 | 5.8 |
| Ejemplo CRE | 7.00 | 51.4% | 7,000 | 168,000 | 159,233 | 154 | 6.4 |
| Promedio EE. UU. 2025 | 7.95 | 45.3% | 7,950 | 190,800 | 180,844 | 174 | 7.3 |

- Si el ejemplo de 7 GJ/MWh estuviera en PCI, sube cerca de 11%: 171 MMpcd.
- Por defecto usaría 7.0 GJ/MWh, editable, y factor de planta aparte: a 60% de carga no se reduce proporcional porque baja la eficiencia. Ese último punto es criterio de ingeniería mío, sin fuente aquí.

### Gaps
- No encontré un heat rate oficial mexicano reciente (COPAR, PLADESE, parque CFE). COPAR 2012 aparece como referencia, pero no vi la cifra; no pude confirmar si el 7 GJ/MWh es PCI o PCS.

---

## 9. Emisiones

### Takeaway
Factor oficial mexicano: 56.1 tCO₂/TJ, igual al valor por defecto de IPCC, que se basa en poder calorífico **inferior**. Aplicado a GJ en PCS sobrestima 11%. Para m³: unos 1.95 kg CO₂/Sm³. CH₄ y N₂O de combustión fija suman solo 0.1%.

### Cited Findings
- Acuerdo de metodologías RENE (firmado el 26-ago-2015; DOF 3-sep-2015): para gas natural y gas seco en generación eléctrica o térmica, CO₂ 5.61E-05 t/MJ, CH₄ 1.00E-06 kg/MJ, N₂O 1.00E-07 kg/MJ. Para transporte vehicular: CO₂ 0.0000561 t/MJ, CH₄ 0.000092 kg/MJ, N₂O 0.000003 kg/MJ — [DOF](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149).
- Potenciales de calentamiento (acuerdo DOF 14-ago-2015): CH₄ 28, N₂O 265, carbono negro 900 — [extracto ANIQ del acuerdo](https://aniq.org.mx/eventos/2017/CursoCOAFAMSA/docs/Abril%204/herramientas/E%20factores%20emisi%C3%B3n%20y%20calentamiento%20RENE.pdf). Fuente secundaria; una guía comercial coincide en "PCG 28 y 265" — [Certifica tu Energía](https://certificatuenergia.com/registro-nacional-de-emisiones-rene/).
- IPCC 2006: gas natural 56,100 kg CO₂/TJ; PCI por defecto 48.0 TJ/Gg; "These Guidelines use net calorific values" — [IPCC 2006, vol. 2, cap. 1](https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_1_Ch1_Introduction.pdf).
- Esa guía comercial aplica 0.0561 t/GJ a 150,000 GJ y cita un aviso de SEMARNAT de 29-may-2026, que es del factor eléctrico (0.444 tCO₂e/MWh), no del gas — [Certifica tu Energía](https://certificatuenergia.com/registro-nacional-de-emisiones-rene/).

### Inferences
Cálculo propio:
- 56.1 t/TJ = 56.1 kg/GJ en PCI ≈ 50.5 kg/GJ en PCS ≈ 53.3 kg/MMBtu en PCS.
- Por volumen: 1.95 kg CO₂/Sm³ (PCI = 0.9 × 38.64 = 34.8 MJ/m³); 1.86 kg/m³ en base; 55 kg/Mpc.
- Comprobación con la Lista: gas seco 33.54 MJ/m³ a 20 °C y 100 kPa = 1.88 kg/m³ en esa condición = 1.94 kg/Sm³. Cuadra con el anterior.
- CO₂e en combustión fija: 56.1 + 0.001 × 28 + 0.0001 × 265 = 56.15 t/TJ; +0.1%. Vehicular: 59.47 t/TJ; +6%.
- Fuga de metano (no quemado): 1 Sm³ de CH₄ = 0.678 kg = 19 kg CO₂e con PCG 28. En una calculadora vale un renglón aparte: fugar es unas 10 veces peor que quemar, por metro cúbico.
- La factura está probablemente en PCS (es lo que define la NOM como propiedad de referencia). Si alguien multiplica GJ de factura por 56.1 sobreestima 11%. Mostraría ambas opciones.

### Gaps
- No verifiqué en el DOF los valores del acuerdo de 14-ago-2015 ni si la Guía del RENE dice cuál poder calorífico usar. La Lista de Conuee, etiquetada "neto", parece la pareja natural, pero no vi el texto que lo ordene.
- No encontré derogación ni actualización de estos factores de gas natural a 2026. No puedo asegurar que no exista.
- SEMARNAT o SENER no publican, que yo haya hallado, un kg CO₂/m³ directo para gas natural.

---

## 10. Equivalencia con crudo

### Takeaway
Pemex usa 5.201 mil pies cúbicos de gas seco por barril de crudo equivalente (192.27 bpce por MMpc). Es el valor mexicano para reservas. Conuee y SENER dan otros valores para otros fines. El "5.8 Mpc/boe" internacional es una regla que sale de 5.8 MMBtu por barril suponiendo gas de 1,000 Btu/pc.

### Cited Findings
- Pemex: "equivalencia de 5.201 millares de pies cúbicos de gas seco por barril de petróleo crudo", resultado de 5.591 millones de BTU por barril y 1,075 BTU por pie cúbico de gas seco dulce; "el factor mencionado es de 192.27 barriles por millón de pies cúbicos" — [Reservas 2019](https://www.pemex.com/ri/Publicaciones/Reservas%20de%20hidrocarburos%20evaluaciones/20190101_rh_e.pdf); igual en [Reservas 2009](https://www.pemex.com/ri/Publicaciones/Reservas%20de%20hidrocarburos%20evaluaciones/090101_rh_00_vc_e.pdf).
- SENER: 1 barril de petróleo = 5,000 pies cúbicos de gas natural; 1 MMpc = 0.026 miles de t de crudo; 1 millón de m³ = 0.9 miles de t de crudo — [Factores de Conversión 2015-2029](https://www.gob.mx/cms/uploads/attachment/file/116104/Factores_de_Conversi_n-Gas_Natural.pdf).
- Esa misma hoja dice 1 millón de pies cúbicos = 178.107 miles de barriles en "Equivalencias de Volumen": es geometría pura, no energía — [misma hoja](https://www.gob.mx/cms/uploads/attachment/file/116104/Factores_de_Conversi_n-Gas_Natural.pdf).
- Conuee 2025: 1 bep = 6,427.76 MJ/bl; gas natural 0.0061 bep/m³; gas seco 0.0052 bep/m³; gas seco de importación 0.0059 bep/m³ — [Lista 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf). En 2021 era 0.0066 bep/m³ de gas natural, sobre 6,122 MJ/bl — [Lista 2021](https://www.gob.mx/cms/uploads/attachment/file/619062/Lista_Combustibles_2021_26feb2021.pdf).
- SPE: 6 Mcf equivalen en energía a un barril — [PetroWiki](https://petrowiki.spe.org/Glossary:Barrel_equivalent). Un barril contiene alrededor de 5.8 millones de Btu, según varias fuentes secundarias — [Wikiwand, Barrels of oil equivalent](https://www.wikiwand.com/en/articles/Barrels_of_oil_equivalent).
- Pemex dice que sus reservas de 2020-2021 fueron aprobadas por CNH — [Anuario Estadístico 2020](https://www.pemex.com/ri/Publicaciones/Anuario%20Estadistico%20Archivos/Anuario-Estadistico_2020.pdf).

### Inferences
Cálculo propio:
- 5.591 × 10⁶ / 1,075 = 5,201 pc. Comprobado.
- Conuee 2025: 164.5 m³/bep (gas natural) = 5.81 Mpc geométricos; 191.6 m³/bep (gas seco) = 6.77 Mpc. La coincidencia con "5.8" es casual: son 20 °C y 100 kPa, sobre una cifra etiquetada neta.
- 5.8 MMBtu/bbl con 1,037 Btu/pc da 5.59 Mpc/boe.

| Uso en la calculadora | Factor | Tipo |
|---|---|---|
| Reservas o producción mexicana (por defecto) | 5.201 Mpc/bpce; 192.27 bpce/MMpc | Convención de Pemex, fija; TÍPICO en energía |
| Usuarios de Patrón de Alto Consumo | 0.0061 bep/m³ (2025) | Oficial anual; solo Conuee |
| Comparar con empresas extranjeras | 6 Mpc/boe | Convención |
| Regla redonda de SENER | 5 Mpc/barril | Heredado, no usar por defecto |

### Gaps
- No confirmé que Pemex siga usando 5.201 en su informe más reciente (a 1-ene-2025 o 2026); lo último que leí es de 2019. Las cifras de 2025 en [Bloomberg Línea](https://www.bloomberglinea.com/latinoamerica/mexico/las-reservas-probadas-de-petroleo-de-pemex-caen-mientras-las-de-gas-suben/) no traen el factor.
- No encontré el factor que usa CNH o SENER en sus reportes de reservas. No hallé un documento de SEC primario para el 6:1.

---

## 11. Tabla maestra de unidades para el catálogo

### Takeaway
Exacto: todo cambio entre unidades de la misma magnitud y los cambios de condición por norma. Típico: todo lo que cruza de volumen a energía o masa. Para cada típico, el catálogo debe permitir editar el supuesto.

### Cited Findings
Los valores citados están enlazados en la columna Fuente. "Propio" = cálculo mío sobre valores citados.

| De | A | Factor por defecto | Tipo | Rango y supuestos | Fuente |
|---|---|---|---|---|---|
| **Volumen** | | | | | |
| 1 pc | m³ | 0.0283168466 | EXACTO | Geométrico: misma condición en ambos lados | [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information) |
| 1 m³ | pc | 35.3146667 | EXACTO | Igual | [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information) |
| 1 MMpc | m³ | 28,316.85 | EXACTO | Geométrico | Propio |
| 1 MMpcd | m³/h; m³/s | 1,179.87; 0.32774 | EXACTO | Geométrico | Propio |
| 1 Mpc; MMpc; Bcf; Tcf | pc | 10³; 10⁶; 10⁹; 10¹² | EXACTO | Notación de gas, no SI | [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information) |
| **Condición** | | | | | |
| 1 m³ base NOM | m³ estándar NOM | 0.95137 | EXACTO | Por norma | [NOM-001, 4.2](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/001secre2010.pdf) |
| 1 m³ estándar NOM | m³ base NOM | 1.05112 | EXACTO | Inverso | Propio |
| 1 pc a 60 °F y 14.73 psia | m³ estándar NOM | 0.028328 | EXACTO (gas ideal) | Z cambia menos de 0.05% | Propio |
| 1 MMpc a 60 °F y 14.73 psia | m³ base NOM | 29,776 | EXACTO (gas ideal) | Igual | Propio |
| 1 m³ a 20 °C y 100 kPa | m³ estándar NOM | 0.97009 | EXACTO (gas ideal) | Lista de Conuee | Propio |
| 1 Nm³ | Sm³ | 1.0549 | EXACTO (gas ideal) | NRCan redondea a 1.055 | [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information) |
| 14.65 psia | 14.73 psia | 0.9946 | EXACTO | Contratos de Texas; misma T | [Wyoming da 0.9945](https://www.law.cornell.edu/regulations/wyoming/055-3-Wyo-Code-R-SS-3-31) |
| **Energía** | | | | | |
| 1 MMBtu | GJ | 1.05505585262 | EXACTO | Btu IT. México publica 1.05506 | [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information); [IPGN](https://www.gob.mx/cms/uploads/attachment/file/301451/180129.IPGN.Metodolog_a..pdf) |
| 1 GJ | MMBtu | 0.947817 | EXACTO | SENER: 0.9478 | [Prospectiva 2017](https://www.gob.mx/cms/uploads/attachment/file/284343/Prospectiva_de_Gas_Natural_2017.pdf) |
| 1 therm (EC); (US) | MJ | 105.506; 105.4804 | EXACTO | MMBtu = 10 therms | [NIST](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9); [EIA](https://www.eia.gov/tools/faqs/faq.php?id=45&t=8) |
| 1 Gcal IT | GJ; MMBtu | 4.1868; 3.96832 | EXACTO | Termoquímica: 4.184 GJ | [NIST](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| 1 MWh | GJ; MMBtu | 3.6; 3.41214 | EXACTO | | [Lista 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf) |
| 1 MMBtu | kWh | 293.071 | EXACTO | | Propio |
| **Volumen a energía** | | | | | |
| 1 pc | Btu | 1,037 | TÍPICO | 988 a 1,170 (NOM); medido 1,006; SENER 1,030 a 1,080; PCS | [EIA](https://www.eia.gov/tools/faqs/faq.php?id=45&t=8) |
| 1 m³ estándar | MJ (PCS) | 38.6 | TÍPICO | 36.8 Sur, 37.3 Resto, a 43.6 | [NOM-001](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/001secre2010.pdf); Propio |
| 1 m³ base | MJ (PCS) | 36.7 | TÍPICO | 35.0 a 41.5 | Propio |
| 1 m³ estándar | kcal (PCS) | 9,225 | TÍPICO | 8,790 a 10,414 | Propio |
| 1 m³ estándar | kWh (PCS) | 10.7 | TÍPICO | 10.2 a 12.1 | Propio |
| 1 MMpc | GJ (PCS) | 1,094 | TÍPICO | 1,042 a 1,235; medido 1,061 | Propio |
| 1 MMpc | MMBtu (PCS) | 1,037 | TÍPICO | Igual | [EIA](https://www.eia.gov/tools/faqs/faq.php?id=45&t=8) |
| 1 GJ | m³ estándar | 25.9 | TÍPICO | 22.9 a 27.2 | Propio |
| PCI | PCS | 0.90 | TÍPICO | Rango 0.89 a 0.91 | [IPCC](https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_1_Ch1_Introduction.pdf); [Balance](https://www.snieg.mx/DocAcervoINN/documentacion/inf_nvo_acervo/snigma/orig_dest_energia/anexo%20_5_9_4_anexo_metod_bal_nac_ener.pdf) |
| **Masa** | | | | | |
| Densidad relativa | — | 0.60 | TÍPICO | 0.57 a 0.65 | [Kinder Morgan](https://pipeline2.kindermorgan.com/Documents/KMMX/CRE_Daily_Report.pdf?&from=D); Propio |
| 1 m³ estándar | kg | 0.735 | TÍPICO | 0.70 a 0.80 | Propio |
| 1 m³ base | kg | 0.699 | TÍPICO | 0.67 a 0.76 | Propio |
| 1 MMpc | t | 20.8 | TÍPICO | 20.0 a 22.5 | Propio |
| **GNL** | | | | | |
| 1 m³ GNL | kg | 450 | TÍPICO | 430 a 470 | [LNG Atlas](https://lngatlas.org/converter/); [IGU](https://www.apeg.pt/folder/documento/ficheiro/natural-gas-conversion-pocketbook_fec0aeed1d2e6a84b27445ef096963a7eebab0a2.pdf) |
| 1 m³ GNL | m³ de gas | 600 | TÍPICO | 585 Nm³; 615 Sm³; ~650 base | [EIA](https://www.eia.gov/energyexplained/natural-gas/liquefied-natural-gas.php); [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information); [IGU](https://www.apeg.pt/folder/documento/ficheiro/natural-gas-conversion-pocketbook_fec0aeed1d2e6a84b27445ef096963a7eebab0a2.pdf) |
| 1 t GNL | MMBtu; GJ | 52; 54.9 | TÍPICO | 51 a 54 MMBtu | [Platts](https://www.spglobal.com/commodityinsights/PlattsContent/_assets/_files/en/conversiontables/conversion_factors.pdf) |
| 1 m³ GNL | MMBtu; GJ | 23.4; 24.7 | TÍPICO | IGU da 24.0 MMBtu | Propio |
| 1 t GNL | m³ GNL | 2.22 | TÍPICO | Por densidad | Propio |
| 1 Mt GNL | Bcf | 48.03 | TÍPICO | Con 52 MMBtu/t y 1,037 Btu/pc saldría 50 | [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information) |
| 1 mtpa | MMpcd; Bcf/d | 131.6; 0.1316 | TÍPICO | 0.123 a 0.142 Bcf/d en proyectos | [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information); [EIA](https://www.eia.gov/todayinenergy/detail.php?id=62984) |
| 1 Bcf/d | mtpa | 7.60 | TÍPICO | | [NRCan](https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information) |
| Temperatura del GNL | °C | −162 | TÍPICO | −260 °F | [EIA](https://www.eia.gov/energyexplained/natural-gas/liquefied-natural-gas.php) |
| Buque medio | m³ | 175,586 | TÍPICO | Entregas de 2025 | [GIIGNL 2026](https://www.americaslngsummit.com/media/anfhb5t1/2026-giignl-annual-report.pdf) |
| **Presión** | | | | | |
| 1 kg/cm² | kPa | 98.0665 | EXACTO | | [NIST](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| 1 kg/cm² | psi; bar | 14.2233; 0.980665 | EXACTO | | Propio |
| 1 psi | kPa | 6.894757 | EXACTO (redondeado) | | [NIST](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| 1 inH₂O | Pa | 249.0889 | EXACTO (convencional) | | [NIST](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| **Central** | | | | | |
| Heat rate ciclo combinado | GJ/MWh (PCS) | 7.0 | TÍPICO | 6.3 a 8.0 | [EIA](https://www.eia.gov/electricity/annual/html/epa_08_02.html); Propio |
| 1,000 MW plena carga | MMpcd | 154 | TÍPICO | 139 a 174 | Propio |
| **Emisiones** | | | | | |
| 1 TJ (PCI) | t CO₂ | 56.1 | OFICIAL RENE | Combustión | [DOF](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| 1 m³ estándar | kg CO₂ | 1.95 | TÍPICO | 1.86 a 2.20 según PCS de la NOM | Propio |
| CH₄; N₂O | PCG | 28; 265 | OFICIAL | Acuerdo DOF 14-ago-2015 | [ANIQ](https://aniq.org.mx/eventos/2017/CursoCOAFAMSA/docs/Abril%204/herramientas/E%20factores%20emisi%C3%B3n%20y%20calentamiento%20RENE.pdf) |
| **Crudo** | | | | | |
| 1 bpce | Mpc de gas seco | 5.201 | CONVENCIÓN Pemex | Alternativas: 5, 5.8 geom. Conuee, 6 | [Pemex](https://www.pemex.com/ri/Publicaciones/Reservas%20de%20hidrocarburos%20evaluaciones/20190101_rh_e.pdf) |

### Inferences
- Por defecto el catálogo debería calcular siempre pasando por energía (GJ), y dejar visibles dos ajustes: poder calorífico y condición de referencia.
- Los factores "EXACTO (gas ideal)" son exactos salvo Z de referencia, despreciable (menos de 0.05% entre esas condiciones, cálculo propio con Peng-Robinson).

### Gaps
- El valor central de PCS no tiene una fuente oficial mexicana reciente: es EIA más un punto medido de México. Si CNE o Cenagas publican un promedio, debería reemplazarlo.

---

## 12. Trampas

### Takeaway
Casi todos los errores vienen de cinco cosas: letras M y MM, condición de referencia, PCS y PCI, presión manométrica y absoluta, y aplicar un factor sin ver para qué se hizo.

### Cited Findings
1. **"20 °C y 101.325 kPa" no es condición de la NOM.** 20 °C va con 98.07 kPa; 101.325 kPa va con 15 °C — [NOM-001, 3.7 y 3.8](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/001secre2010.pdf).
2. **MBtu significa dos cosas en documentos mexicanos.** Millón en el IPGN — [Metodología](https://www.gob.mx/cms/uploads/attachment/file/301451/180129.IPGN.Metodolog_a..pdf); mil en la hoja de SENER — [Factores](https://www.gob.mx/cms/uploads/attachment/file/116104/Factores_de_Conversi_n-Gas_Natural.pdf).
3. **Nota del IPGN invertida.** Dice "millones de BTU por GJ" donde es GJ por millón de BTU — [Metodología](https://www.gob.mx/cms/uploads/attachment/file/301451/180129.IPGN.Metodolog_a..pdf).
4. **MMPCD no siempre es MMPCSD.** Capacidad en base, cantidades en estándar — [Descripción General](https://boletin-gestor.cenagas.gob.mx/Docs/diagramas/Descripcion_General_SISTRANGAS.pdf); [TCPS](https://boletin-gestor.cenagas.gob.mx/Docs/tcps/TCPS_2021.pdf).
5. **Leer mal la Tabla 1 de la NOM.** Los tres periodos son de la Zona Sur; Resto del País es la última columna. Al extraer el texto del PDF, las columnas salen revueltas, y un lector automático me dio una tabla equivocada en esta investigación — [imagen oficial](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/001secre2010.pdf).
6. **Coma y punto.** La NOM usa coma decimal (0,95137; 37,30) — [NOM-001, 4.1](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/001secre2010.pdf). Pemex escribe "5.201 millares" = 5,201 pies cúbicos — [Pemex](https://www.pemex.com/ri/Publicaciones/Reservas%20de%20hidrocarburos%20evaluaciones/20190101_rh_e.pdf).
7. **178.107 miles de barriles por MMpc es volumen, no energía.** El valor energético de Pemex es 192.27 barriles: casi mil veces menos — [SENER](https://www.gob.mx/cms/uploads/attachment/file/116104/Factores_de_Conversi_n-Gas_Natural.pdf); [Pemex](https://www.pemex.com/ri/Publicaciones/Reservas%20de%20hidrocarburos%20evaluaciones/20190101_rh_e.pdf).
8. **La Lista de Conuee no es para facturar.** Tiene su propia condición (20 °C y 100 kPa) y etiqueta neto; sirve para identificar Usuarios de Patrón de Alto Consumo — [Lista 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf). Cambia cada año; "gas seco" bajó 12% en 2022 — [Serie](https://www.gob.mx/cms/uploads/attachment/file/995835/Serie_hist_rica_de_la_lista_de_combustibles_y_sus_poderes_calor_ficos_2016-2025.pdf).
9. **La NOM-014-CRE no es de medición de gas.** Tampoco es igual a la NOM-014-SCFI — [DOF](https://dof.gob.mx/nota_detalle.php?codigo=5478196&fecha=01/04/2017); [NOM-014-SCFI](https://mley.mx/normas/nom-014-scfi-1997/index.html.md).
10. **El IPGN no es lo que paga cada quien.** Es orientativo, un promedio mensual de comercializadores, y no distingue tipo de contrato — [Metodología](https://www.gob.mx/cms/uploads/attachment/file/301451/180129.IPGN.Metodolog_a..pdf).
11. **El GNL gasta gas.** La licuefacción consume cerca de 7% a 15% de la alimentación: mtpa de salida y MMpcd de entrada no son lo mismo — [EIA](https://www.eia.gov/energyexplained/natural-gas/liquefied-natural-gas.php).
12. **Weymouth en líneas grandes** subestima de 8% a 12% — [Technical Toolboxes](https://ttwiki.azurewebsites.net/knowledge-base/weymouth).
13. **Búsquedas engañosas.** "CNE" también es la Comisión Nacional de Energía de Chile — [CNE Chile](https://cne.cl/wp-content/uploads/2026/01/RMensual_v202601.pdf). Sus reportes aparecen al buscar el IPGN.

### Inferences
14. **PCS contra PCI.** 10% de diferencia. Heat rates de fabricante suelen ir en PCI, EIA y facturas en PCS. El factor RENE de 56.1 va sobre PCI.
15. **Manométrica contra absoluta.** La corrección siempre usa absoluta. A 2,240 m, cada m³ que marca un medidor doméstico sin corregir equivale a unos 0.77 m³ estándar: 23% menos energía que el mismo m³ al nivel del mar.
16. **kg/cm² no es bar.** 2% de diferencia; poco en gasoducto, pero es error de redondeo sistemático. Tampoco es "atmósfera".
17. **Z.** En volumen pesa completo; en fórmula de flujo, bajo raíz. Omitirlo a 50 kg/cm² da cerca de 10% de error en volumen.
18. **Multiplicar por 35.3147 "cruza la frontera" sin cambiar condición.** Entre base y EE. UU. hay 5.15%; entre estándar NOM y EE. UU., 0.04%.
19. **1 m³ de GNL "= 600 m³".** Con condición base de un permiso mexicano son unos 650. La diferencia con 585 es de 11%, sin ningún cambio físico.
20. **Texas a 14.65 psia.** 0.54% contra 14.73.
21. **Importación.** Como el contrato va en energía, los cambios de condición no cambian el pago. Sí cambia si el resultado se presenta en volumen.
22. **Billion.** Bcf es mil millones; un "billón" en español es 10¹² (Tcf).
23. **1 Bcf/d ≈ 7.6 mtpa, no 0.76 ni 0.73.**

### Gaps
- No verifiqué qué tan común es el error 14 en documentos de CFE o SENER; es criterio general.
