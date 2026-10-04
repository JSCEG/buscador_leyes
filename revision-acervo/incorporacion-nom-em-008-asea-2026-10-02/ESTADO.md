# Incorporación: NOM-EM-008-ASEA-2026

## Estado

Cotejada contra el HTML oficial y la edición PDF del DOF; cargada en Supabase, mapeada al PDF oficial y visible en el acervo publicado.

| Dato | Resultado |
|---|---|
| Publicación DOF | 2 de octubre de 2026 |
| Entrada en vigor | 6 de octubre de 2026 |
| Vigencia | Seis meses, conforme al transitorio Primero |
| Fuente oficial | [SIDOF, nota 5800169](https://sidof.segob.gob.mx/notas/docFuente/5800169) |
| Edición PDF | [DOF matutino, 2 de octubre](https://sidof.segob.gob.mx/notas/getNewsletter/02-10-2026/Matutina/329985) |
| Fragmentos en Supabase | 148 (incluye nota editorial; numerales y subnumerales en segmentos propios) |
| Fragmentos oficiales con mapa | 147; la nota editorial local se conserva sin página |
| Páginas del ejemplar | 224 totales; la NOM ocupa las páginas impresas 26–61 |
| Anclas | 2,382 coordenadas; texto verificado en 146 fragmentos completos y marcador cotejado para el numeral 2 |
| Transitorios | 6, mapeados por separado |
| Apéndice | A normativo, separado; incluye tablas preservadas y mapeo de sus páginas |
| Figuras | 2, enlazadas a SIDOF |
| Supabase | 148 fragmentos y 24 temas; sin texto vacío ni registros sin índice FTS |
| Acervo publicado | 90 instrumentos y 4,959 artículos/disposiciones; la NOM aparece como última publicación del 2 de octubre de 2026 |
| PDF en Git | No; el lector lo solicita a SIDOF mediante el proxy de la aplicación y valida su SHA-256 |

## Criterio de fragmentación

Se conserva la estructura normativa propia: preámbulo, numerales/subnumerales, Apéndice A y transitorios por separado. El índice de contenido repetido se omite. La norma no se mezcla con la NOM-EM-006-ASEA-2025; la nota editorial explica que sus dictámenes previos se reconocen hasta su vencimiento.

## Mapeo y verificación

`map.json` contiene páginas, coordenadas y huellas del texto; `cotejo-mapa.json` registra el cotejo por fragmento; `preparar_mapa_pdf.py` reconstruye el mapa desde el PDF temporal oficial; `publicar_mapa_pdf.mjs` valida la cobertura y agrega los datos al manifiesto del lector. Se cotejaron visualmente las páginas impresas 29 (numerales 1 y 2), 54 (Apéndice A.1 y tablas) y 61 (transitorios).

El mapa está incorporado en el manifiesto local en la revisión 44. El PDF de 4,704,900 bytes no se guarda en Git. El proxy sólo admite la URL oficial revisada y comprueba el SHA-256 del ejemplar antes de servirlo. El cambio debe desplegarse para que las páginas sincronizadas aparezcan en el lector público.

## Carga de contenido

La transacción SQL se aplicó a Supabase para el instrumento `864ee23b-19ea-5c44-9b01-bd77e0320b11`. La consulta posterior confirmó 148 fragmentos, seis transitorios, tres apartados del Apéndice A, 24 temas, orden completo y FTS en todos los fragmentos. El acervo público confirmó la presencia del instrumento y el incremento del total.