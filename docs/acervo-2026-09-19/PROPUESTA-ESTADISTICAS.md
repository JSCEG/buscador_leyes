# Propuesta de estadísticas del acervo

19 de septiembre de 2026. Propuesta de interfaz y datos; no implementada. No modifica Supabase ni contenido jurídico.

## Qué cambiar

Convertir Estadísticas en una entrada útil al mismo acervo: **qué contiene, cómo se distribuye y cómo abrir cada grupo**. Usar las colecciones compartidas del acervo, sin confundirlas con jerarquía normativa o cobertura de todo el sector energético.

El último cotejo guardado registra **41 instrumentos y 3,300 fragmentos** (`revision-acervo/incorporacion-autoconsumo-2026-09-18/VERIFICACION.json`). Son una referencia de esa revisión; los números de la pantalla deben calcularse del catálogo realmente cargado, nunca fijarse en HTML.

## Problemas actuales confirmados

- `showStatsView()` llama «Total de Leyes» a todos los instrumentos y «Artículos Totales» a todas las filas de la tabla `articulos` (`src/scripts/ui.js:3048–3054`). Esas filas también contienen preámbulos, resolutivos, anexos y notas editoriales: mostrar **Instrumentos** y **Fragmentos de consulta**. Una ayuda breve explica qué incluye este último total.
- Hay dos clasificaciones en la misma vista: la dona usa `classifyInstrument()` y seis categorías (`ui.js:394–408`), mientras el detalle usa prefijos del título y sólo tres grupos (`3027–3029`). No incorporan las siete colecciones del acervo nuevo.
- La dona y las barras repiten la misma distribución; leyenda y categorías no abren grupos. Las filas individuales sí abren instrumentos, pero son `div` con click (`3125–3129`), no enlaces o botones accesibles.
- «Densidad de Artículos por Documento» representa un conteo, no densidad (`3071–3086`). Su volumen depende de cómo se fragmentó cada fuente; no demuestra importancia jurídica ni exhaustividad.
- «Última actualización: Mayo 2025» está escrita a mano (`3041`). Además, `index.html:691` afirma cobertura nacional y actualización en tiempo real sin que el cálculo lo pruebe. Sustituir por información del **acervo incorporado** y fechas verificables.

## Una sola definición de grupos

Reutilizar `ACERVO_GROUPS` y el mismo resolvedor de pertenencia que la vista Acervo, en este orden:

| ID compartido | Nombre |
|---|---|
| `leyes` | Leyes |
| `reglamentos` | Reglamentos |
| `acuerdos` | Acuerdos |
| `dacg` | DACG |
| `convocatorias` | Convocatorias |
| `normas` | Normas |
| `otros` | Otros instrumentos |

Son colecciones para navegar. Una convocatoria publicada mediante acuerdo puede pertenecer a Convocatorias y conservar «Acuerdo» como forma jurídica en su ficha. No reclasificar el registro fuente para hacer coincidir una gráfica.

Para que los porcentajes sumen el catálogo, cada instrumento debe tener un grupo principal conforme al contrato del acervo. Si éste permite pertenencia múltiple, mostrar «presencias en colecciones», deduplicar el total por ID y evitar porcentajes de reparto exclusivos. No inventar un segundo resolvedor en Estadísticas.

## Pantalla propuesta

```text
Estadísticas del acervo                    [Ver todo el acervo]
Datos consultados: [fecha y hora de consulta exitosa]

[N instrumentos]     [N fragmentos de consulta]

Distribución por colección
Leyes           [barra proporcional]  [N]  [Ver leyes →]
Reglamentos     [barra proporcional]  [N]  [Ver reglamentos →]
Acuerdos        [barra proporcional]  [N]  [Ver acuerdos →]
DACG            [barra proporcional]  [N]  [Ver DACG →]
Convocatorias   [barra proporcional]  [N]  [Ver convocatorias →]
Normas          [barra proporcional]  [N]  [Ver normas →]
Otros           [barra proporcional]  [N]  [Ver otros →]

[Publicaciones por año]      [Fragmentos por instrumento]
 Fechas de las fuentes       Primeros 10 · [Ver todos]
 [Sin fecha registrada: N]   Cada fila abre el instrumento

Alcance: instrumentos incorporados; no representa todo el
marco jurídico nacional ni una certificación de vigencia.
```

**Tres visualizaciones como máximo:** barras horizontales por colección, publicaciones por año y diez instrumentos con más fragmentos. La distribución por colección es la principal; las otras dos pueden ir en paneles desplegables en móvil. Evitar dona y barras duplicadas. Etiquetas y números permanecen visibles, sin depender de color, hover o animación.

Para la variante visual solicitada, probar un **mosaico proporcional por colección (treemap)** junto al listado de conteos y accesos, una **línea temporal de publicaciones** con puntos por instrumento y un **gráfico de puntos** para comparar fragmentos de los diez instrumentos. Usar D3, ya presente en la aplicación; no hace falta incorporar una segunda librería ni 3D. El mosaico expresa cantidad de instrumentos, no jerarquía jurídica; la línea usa fechas de publicación. En móvil, priorizar la lista accesible cuando las áreas del mosaico no permitan etiquetas legibles. Esta alternativa sustituye las barras del wireframe; no duplica los mismos datos en varias gráficas simultáneas.

Pulsar «Ver convocatorias» abre Acervo con `group=convocatorias` en el estado de navegación existente, muestra ese filtro activo y conserva la vía de regreso a Estadísticas. Usar exactamente los mismos IDs, orden, nombres y conteos. No suponer una sintaxis de URL distinta: integrarse con el mecanismo que implemente el acervo.

## Datos y fechas honestos

`search-engine.js:42–61` ya entrega `id`, título, tipo, fecha de publicación, fecha de última reforma, fuente, temas y conteo de filas. Esto basta para totales, grupos, volumen por instrumento y publicaciones por año, sin descargar todos los textos.

- **Publicaciones por año** usa `fecha_publicacion`; incluye un conteo «Sin fecha registrada». No llamarlo crecimiento del acervo, incorporaciones o reformas.
- **Datos consultados** es el momento en que terminó correctamente la consulta. Si la consulta falla, mostrar error o la fecha de la copia disponible; nunca refrescar la fecha aparentando éxito.
- **Última actualización del acervo** sólo puede mostrarse con una fecha de incorporación/revisión registrada y verificable. Mientras no esté disponible, omitir ese indicador. La fecha máxima de publicación, la fecha del build y la fecha actual no lo sustituyen.
- `explorer_catalog.updated_at` corresponde a la publicación de la configuración del explorador, no a la revisión del contenido jurídico. Tampoco `created_at` de una ley registra necesariamente sus posteriores correcciones.
- Contar artículos normativos o excluir notas editoriales exige una clasificación validada de unidades, no disponible en `summaries`; dejarlo fuera de esta entrega y mantener el rótulo neutral «fragmentos».

## Implementación posterior y aceptación

1. Extraer un agregador puro que reciba `summaries` y las definiciones compartidas del acervo. Sustituir las clasificaciones locales de estadísticas y las fechas fijas.
2. Rehacer una sola vista de estadísticas, con enlaces a grupos e instrumentos por ID; después añadir las dos visualizaciones secundarias.
3. Validar que conteos y filtros coinciden con Acervo, incluidos grupos vacíos, tipos desconocidos, catálogo vacío y fechas ausentes. Un grupo vacío muestra 0 y «Sin instrumentos incorporados», sin navegación engañosa.

En móvil: una columna a 320px, etiquetas sin truncar, números alineados, controles de al menos 44px como objetivo del producto y sin scroll horizontal de página. En escritorio: resumen compacto y gráficas secundarias en dos columnas. Soportar zoom, tema oscuro, teclado y movimiento reducido; ofrecer los mismos datos como texto o tabla accesible. No afirmar que toda la interfaz es accesible hasta verificarlo.

**Cierre:** el total de instrumentos coincide con los IDs únicos; el de fragmentos coincide con la suma de los conteos cargados; cada grupo abre exactamente su colección; ninguna fecha o etiqueta implica una actualización, una cobertura o una vigencia no demostrada.
