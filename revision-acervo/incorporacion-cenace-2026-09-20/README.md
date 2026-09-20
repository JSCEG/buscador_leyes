# Programa Institucional CENACE · 20 septiembre 2026

RAD-081 completada con el programa de 52 páginas. Se añadieron 33 fragmentos (32 apartados oficiales y una nota editorial), seis entradas de estructura, cinco estrategias y cuatro indicadores completos. El acervo cotejado pasó de 82 instrumentos / 4,528 fragmentos / 1,236 temas a 83 / 4,561 / 1,242.

La única modificación a un registro previo es el enlace editorial del aviso, documentado en `actualizacion-nota-aviso.json`. Los textos oficiales anteriores permanecen idénticos. La fecha de publicación se toma del aviso del 30 de abril de 2026; no se certifica vigencia.

## Evidencia

- `fuente.json`: URL oficial, fecha del aviso y SHA-256 de la edición.
- `COTEJO-PAGINAS.json`: cotejo de caracteres extraíbles por página. Se omiten encabezados, folios y decoración; no se hace OCR de imágenes.
- `COTEJO-CELDAS.json`: las 429 celdas de 20 tablas con sus coordenadas y combinaciones.
- `SEGMENTACION.json`: los 291 bloques asignados exactamente una vez a 32 apartados. Cada indicador conserva su ficha y sus metas.
- `COTEJO-FUENTE.json`: integridad de bloques/tablas y correspondencia exacta del mapa con el contenido.
- `VERIFICACION.json`: lectura posterior de Supabase, comparación íntegra con la carga y comprobación del catálogo anterior.
- `mapa-cenace.json`: páginas, coordenadas y huellas del contenido. El manifiesto de la aplicación conserva también las 48 correspondencias de la LCNE.

Los mapas (página 18) y las gráficas (19, 32 y 33) se consultan desde el PDF oficial remoto. Las dos tablas auxiliares de rótulos de las páginas 32 y 33 se identifican como editoriales. El detalle interno de los mapas y de la gráfica de la página 19 no tiene OCR. No se infieren cifras de la serie TOTAL.

## Reproducción

Se requiere Python con pdfplumber y una copia temporal del PDF en `fuentes/PROGRAMA-CENACE.pdf`. `extraer_pdf.py` comprueba su SHA-256 antes de extraer; `preparar.py` construye la carga y el mapa; `node cotejar.cjs` valida la conservación del contenido. `generar_sql.py` prepara una transacción con guardas contra duplicados y cambios en la nota anterior. **La carga ya se ejecutó: no volver a aplicarla.**

`exportar.cjs` obtiene instantáneas de lectura para `antes/` y `despues-verificacion/`; `verificar.py` las compara. Después, `publicar_mapa.py`, `actualizar_inventario.py` y `generar_reporte.py` generan los artefactos revisables. Los informes del 19 se mantienen como cortes históricos. El inventario actual está en `../inventario-radar-2026-09-20/` y conserva el corte documental del radar v4.18 del 18 de septiembre.

PDF, archivos temporales, instantáneas de Supabase y SQL de aplicación están excluidos de Git. El servicio sólo admite la URL DOF revisada y el manifiesto fija su SHA-256; una edición distinta produce un error de versión, nunca un resaltado con coordenadas antiguas.
