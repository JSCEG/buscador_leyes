# Fuentes de la calculadora para aprobar

Generado del código el 2026-11-09. La Lista de combustibles 2026 ya está aprobada. Quedan 28 fuentes pendientes. Aprobarlas las marca como cotejadas («humano») y deja pasar `node scripts/audit-calc-fuentes.mjs --strict`.

## Abiertas hoy en el documento oficial (5)

| Fuente | Qué respalda en la calculadora | Cómo se revisó |
|---|---|---|
| Aviso del factor de emisión del sistema eléctrico nacional (Semarnat, 2026) | Factor del sistema eléctrico 0.444 tCO₂e/MWh (dato 2024) | Es el aviso vigente que enlaza el Registro Nacional de Emisiones (página del 29-05-2026). La cifra, de la investigación. |
| NOM-001-SECRE-2010, Especificaciones del gas natural (CRE, 2010) | Condición estándar 15 °C y 101.325 kPa; base 20 °C y 98.07 kPa (0.95137); rango 37.30 a 43.60 MJ/m³ | Ficha oficial «Vigente» en PLATIICA. Las cifras, de la investigación (lectura de la tabla de la norma). |
| NOM-016-CRE-2016, Especificaciones de calidad de los petrolíferos (CRE, 2016) | Densidades de trabajo de gasolinas, turbosina y combustóleo; rango 0.504 a 0.540 del gas LP | Ficha oficial «Vigente» en PLATIICA. Las cifras, de la investigación. |
| Acuerdo por el que se establecen los requisitos para la adquisición de Certificados de Energías Limpias para los años 2025 y 2026 (SENER, 2026-08-17) | 13.9 % de CEL para 2025 y 2026 | Leído en el Diario Oficial (SIDOF): Artículo Único, publicación 17-08-2026. |
| Ley del Sector Eléctrico (Congreso de la Unión, 2025-03-18) | Permiso según MW (0.7 y 20 MW); artículos enlazados | Texto de los 13 artículos comparado contra Supabase y los archivos del sitio. |

## De la investigación, no reabiertas hoy (23)

Las leyeron los investigadores en noviembre de 2026 y sus cifras se recalcularon de forma independiente (89 comprobaciones; las dos diferencias se corrigieron). No las volví a abrir en esta revisión.

| Fuente | Qué respalda en la calculadora | Cómo se revisó |
|---|---|---|
| Directrices del IPCC de 2006, volumen 2, cuadro 1.2 (IPCC, 2006) | Poder calorífico físico por kilo de cada combustible | Cuadro 1.2 del IPCC 2006; MJ/L recalculados y coinciden con el informe. |
| Acuerdo de factores de emisión del Registro Nacional de Emisiones (Semarnat, 2015-09-03) | Factores de CO₂ por TJ (69.3, 74.1, 71.5, 77.4, 97.5, 73.3, 63.1, 56.1) | Acuerdo del Diario Oficial del 03-09-2015; kg de CO₂ por litro recalculados. |
| Guide for the Use of the International System of Units (SP 811) (NIST, 2008) | Todos los factores exactos de unidades | Recalculados desde definiciones exactas; 37 pruebas contra las cifras de NIST. |
| NOM-008-SE-2021, Sistema General de Unidades de Medida (Secretaría de Economía, 2021) | Formato de números (espacio de miles, sin «billón»); unidades oficiales | Leída por la investigación; año de la clave (2021). |
| NOM-009-SESH-2011, Recipientes para gas LP (SENER, 2011) | Tanque al 85 % de llenado | Leída por la investigación. |
| NOM-213-SCFI-2018, Cilindros portátiles de gas LP (Secretaría de Economía, 2018) | Cilindro de 20 kg para comparar | Leída por la investigación. |
| Precios máximos de gas LP, del 8 al 14 de noviembre de 2026 (CNE, 2026-11-08) | 0.54 kg/L como convención | La investigación verificó la razón $/L ÷ $/kg en las 2 470 filas de la semana. |
| Precio Neto de la Potencia en 2025, recálculo (CENACE, 2026-09-03) | Precio Neto de la Potencia 2025 por sistema | La fórmula oficial reproduce el valor del SIN al centavo (prueba automática). |
| Acuerdo de tarifas finales de suministro básico 2026 (CNE, 2026) | Horarios y temporadas GDMTH; puntas DIST y DIT | Tablas 4 a 7 leídas por la investigación; temporadas probadas en fechas de frontera. |
| Bases del Mercado Eléctrico (SENER, 2015-09-08) | Explicación de servicios conexos y Precio Marginal Local | Solo texto explicativo; no da cifras. |
| Plan de Desarrollo del Sector Eléctrico (SENER, 2025) | Factor de planta por tecnología; 1 885 kWh por usuario residencial | Cálculo propio de la investigación con las tablas 2.1 y 2.2. |
| Global Solar Atlas (Banco Mundial, 2026-11-08) | Rendimiento solar de 10 ciudades | Consultado en la API del Atlas por la investigación. |
| Costos y parámetros de referencia (COPAR) 2012 (CFE, 2012) | Fórmulas de viento y eficiencia | Edición heredada en un repositorio de terceros. |
| Código de Red (CRE, 2021) | Factor de potencia 0.97 desde el 08-04-2026 | Leído por la investigación. |
| Acuerdo de tarifas con cargo por factor de potencia (SHCP, 2000) | Umbral de 90 % del recibo, como regla heredada | Leído por la investigación; no confirmado en tarifas vigentes, y la pantalla lo dice. |
| Segunda Convocatoria de SENER, numeral 1.2.1 (SENER, 2026-05-11) | 30 % y 3 horas de almacenamiento | Numeral 1.2.1 leído por la investigación. |
| Correlación de compresibilidad de GPSA (Technical Toolboxes, 2026-11-08) | Factor de compresibilidad Z | Fuente secundaria; rotulado «orientativo». |
| Corrección de volumen por temperatura (API MPMS 11.1) (Wikipedia, 2026-11-08) | Corrección de volumen por temperatura | Fuente secundaria (la norma API es de pago); rotulado «orientativo». |
| NIST Chemistry WebBook, propano y n-butano (NIST, 2026-11-08) | Densidad del gas LP por temperatura y mezcla | Tablas de NIST consultadas por la investigación. |
| Pressure altitude (Servicio Meteorológico de EE. UU., 2026-11-08) | Presión atmosférica por altitud | Fórmula recalculada; coincide con 77.15 kPa en Ciudad de México. |
| Contenido de energía del gas natural (EIA, 2026-11-08) | Poder calorífico típico del gas, 38.64 MJ/m³ | Valor típico, no oficial; rotulado así en pantalla. |
| Hojas de datos de crudos Maya, Istmo y Olmeca (Pemex, 2026-11-08) | Grados API de Maya, Istmo y Olmeca | Fichas de Pemex leídas por la investigación. |
| Anexo 21 de la Resolución Miscelánea Fiscal 2026 (SAT, 2026-01-13) | Condiciones de referencia de los petrolíferos | Leído por la investigación. |
