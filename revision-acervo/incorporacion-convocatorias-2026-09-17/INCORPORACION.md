# Tres convocatorias y diez modificaciones incorporadas

Cargas del 17 de septiembre de 2026; informe cerrado el 18. Radar v4.17, corte 14 de septiembre.

El acervo pasó de **25 a 38 instrumentos**, de **3,044 a 3,237 fragmentos** y de **644 a 831 entradas de estructura**. Los 25 instrumentos anteriores y todos sus registros permanecen exactamente iguales, incluidas sus fechas de creación.

| Publicación | Fecha DOF | Fragmentos | Estructura | Fuente |
|---|---|---:|---:|---|
| CONV-GEN-1 | 17/10/2025 | 19 | 17 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5770299) |
| CONV-GEN-1-M1 | 24/10/2025 | 6 | 4 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5770917) |
| CONV-GEN-1-M2 | 10/11/2025 | 6 | 4 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5772392) |
| CONV-GEN-1-M3 | 02/12/2025 | 6 | 4 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5774850) |
| CONV-GEN-2 | 11/05/2026 | 36 | 40 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5787117) |
| CONV-GEN-2-M1 | 26/05/2026 | 6 | 4 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5788509) |
| CONV-GEN-2-M2 | 08/06/2026 | 6 | 4 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5789883) |
| CONV-GEN-2-M3 | 18/06/2026 | 6 | 4 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5790938) |
| CONV-GEN-2-M4 | 10/09/2026 | 5 | 3 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5798361) |
| CONV-ESTRATEGICOS | 15/05/2026 | 58 | 71 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5787666) |
| CONV-ESTRATEGICOS-M1 | 26/05/2026 | 6 | 4 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5788508) |
| CONV-ESTRATEGICOS-M2 | 10/07/2026 | 28 | 25 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5793261) |
| CONV-ESTRATEGICOS-M3 | 02/09/2026 | 5 | 3 | [Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5797703) |

Las altas suman 180 fragmentos procedentes de las fuentes oficiales y 13 notas editoriales. Cada nota enlaza el original y sus modificaciones e identifica la versión publicada. Los títulos incluyen la fecha DOF. No se sustituyó el original por una consolidación; el indicador booleano de vigencia se dejó sin determinación para no confundir vigencia con apertura de plazos.

## Conservación y cotejo

Se preservaron 35 tablas HTML, 1,320 celdas y nueve casillas. Los cuatro recursos gráficos oficiales incluyen tres tablas de costos/tiempos publicadas como imagen y una gráfica técnica. Se verificó el texto completo y cada celda, incluyendo rowspan y colspan, contra la fuente. Las casillas originales se inspeccionaron y sus huellas se comprobaron antes de representarlas como □.

Se preservaron los formularios efectivamente publicados. Los tres originales remiten al formato de manifestación de interés disponible en VUPE; esa remisión se conserva como referencia, no como formulario incorporado desde el portal.

La convocatoria original de proyectos estratégicos repite 17.4 en dos bloques (PDF oficial, páginas 33 y 35). Ambos permanecen con etiquetas que los distinguen; no se renumeró el texto. En la segunda modificación, los numerales citados se separan dentro del resolutivo PRIMERO y mantienen el contexto del acto modificatorio.

## Verificación

Trece transacciones individuales; cotejo exacto de cada fila contra el respaldo posterior. Cero textos vacíos, FTS vacíos, identificadores duplicados por instrumento u órdenes duplicados. Trece búsquedas reales con resultados; 31 fragmentos con tablas o gráficos abiertos en navegador y cotejados, con los cuatro gráficos cargados. Se comprobó la navegación entre versiones y la ausencia de desbordamiento horizontal al tamaño verificado. Lint y build correctos.

- [Informe navegable](INCORPORACION.html).
- [Cotejo posterior](VERIFICACION.json).
- [Cotejo independiente de fuentes completas y celdas](COTEJO-FUENTES.json).
- [Comprobación en navegador](VERIFICACION-NAVEGADOR.json).
- [Fuentes oficiales y SHA-256](fuentes.json); [imágenes preservadas](imagenes.json).
- Respaldos inmutables: `antes-verificado/` y `despues-verificado/`.
- Por publicación: `*-revisado.json`, `*-carga.json` y `*-aplicar.sql`. Las trece altas ya se ejecutaron; no volver a aplicar el SQL.

La aplicación local cambia tres textos para describir el catálogo como acervo de instrumentos y versiones. No se desplegó el frontend alojado. Los datos ya están en Supabase. La tabla general de relaciones sigue pendiente; las notas editoriales permiten navegar estas versiones sin alterar las fuentes.

## Inventario posterior

El [inventario actualizado](../inventario-radar-2026-09-17/INVENTARIO.html) conserva 179 filas y 164 referencias sin repeticiones: **104 pendientes**, 29 cubiertas directamente, una parcial, 13 antecedentes o de efectos limitados, cuatro filas de proyectos, diez portales y tres publicaciones no localizadas. Son referencias bibliográficas, no 104 leyes. Hay 34 instrumentos del catálogo representados en la sección 12 del radar y cuatro fuera de ella.

El corte bibliográfico sigue siendo 14 de septiembre de 2026. La revisión cubre las trece publicaciones identificadas en el radar, sin búsqueda exhaustiva de actos posteriores al corte. Los perfiles son específicos para estas fuentes y no sustituyen la revisión de estructuras nuevas por el parser genérico.
