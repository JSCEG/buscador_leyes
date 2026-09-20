# Electricidad, redes y mercado · 19 septiembre 2026

14 publicaciones cotejadas y cargadas en Supabase: 407 fragmentos nuevos. El catálogo pasa de 68 instrumentos y 4,121 fragmentos a 82 y 4,528. `VERIFICACION.json` acredita la igualdad de los textos guardados y la conservación exacta de todos los registros anteriores.

Se cubren 13 referencias completas del radar. RAD-081 conserva cobertura parcial: se incorporó el aviso CENACE, pero el programa completo de 52 páginas todavía no está indexado. RAD-076 distingue su entrada en vigor futura del estado anotado originalmente en el radar.

## Evidencia

- `config.json` identifica las referencias del radar y el tipo de cada publicación.
- `fuentes.json`, `ediciones.json` e `imagenes.json` conservan las direcciones oficiales y las huellas de los documentos cotejados.
- `perfiles-fuentes.json` fija la versión y cantidad de bloques que acepta el segmentador.
- Los 14 archivos `*-carga.json` son los payloads finales, con notas editoriales separadas.
- `COTEJO-FUENTES.json` comprueba el texto íntegro, las 206 tablas, sus 4,328 celdas, combinaciones de celdas y 333 apariciones de imágenes (incluidos símbolos matemáticos).
- `ALCANCE-PDF.json` registra los límites cotejados contra las ediciones del DOF. Acceso a redes termina en la página 304, después del último folio del Anexo 5; su nota al pie pertenece a la página 251. Unidades de inspección termina en la página 117, incluido el Anexo G; no en la firma del Anexo F.

## Revisión y regeneración

1. Recuperar las publicaciones oficiales con `node descargar.cjs`. Utiliza las respuestas oficiales en `fuentes/*.nota.json` cuando existen; si falta una, consulta SIDOF y falla ante un error de red o una respuesta incompleta.
2. Recuperar las ediciones del DOF y verificar las imágenes contra sus fuentes antes de segmentar. Los originales y las muestras visuales son temporales y están excluidos de Git.
3. Ejecutar `node extraer_bloques.cjs`, `python preparar.py`, `node cotejar.cjs` y `python revisar_pdf.py`. Revisar los cierres y formularios en las muestras visuales; no basta localizar la última nota al pie.
4. `python generar_sql.py` regenera payloads y SQL con guardas contra duplicados, cotejo exacto de registros, FTS vacío y alteraciones. **No ejecutar las inserciones de nuevo:** las 14 publicaciones ya están cargadas. `leer-sql.cjs` sólo permite leer el SQL con la huella del manifiesto.
5. `exportar.cjs` hace únicamente consultas GET y exige un directorio nuevo. `verificar.py` coteja `antes/` con `despues-verificacion/`, cuyos respaldos permanecen locales.
6. `actualizar_catalogo.py` conserva las altas anteriores y actualiza las de este bloque. Ejecutar después el generador del inventario y `generar_reporte.py` para publicar las cifras verificadas.

## Validación de la entrega

162 pruebas, lint y build aprobados. Revisión del lector real con las 14 imágenes de fórmulas y símbolos del cargo de transmisión, todas cargadas; alineación dentro del texto corregida. El formulario de diagnóstico conserva sus cinco tablas, celdas combinadas y tres folios en un solo fragmento. El filtro del informe encuentra la publicación de electromovilidad.

Se conserva la publicación oficial sin certificar vigencia ni elaborar versiones consolidadas. Las figuras consultan URLs oficiales; no tienen OCR adicional. Sólo LCNE dispone de mapa para el PDF sincronizado.
