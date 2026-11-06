# Incorporación CNE y SAT · 6 de noviembre de 2026

## CNE · DACG de comercialización

- Instrumento `e8aebfb8-d776-59d6-978f-623e4fb3e6af`, `DACG-COMERCIALIZACION-CNE`.
- Fuente HTML oficial, nota 5803022 del 5 de noviembre de 2026. PDF remoto `https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=05112026-MAT.pdf&repo=`.
- PDF de 232 páginas, 14,138,820 bytes, SHA-256 `cc1ae0579047108b9080a59da8f78f11a644bdb4a6d7f99a8b89803a29b58e7c`. La descarga oficial se volvió a cotejar antes de publicar.
- 80 fragmentos: preámbulo, artículo único del acuerdo, 54 artículos de las DACG, 12 transitorios, firma y 11 anexos. Conservados todos los nodos del texto oficial dentro de esos límites.
- Cuerpo en páginas 16–48. Los diez formularios escaneados están en páginas 49–89. Anexo XI en páginas 90–92.
- Los anexos I–X son guías editoriales al formulario e instructivo original, no transcripciones ni OCR. Cada mapa incluye todas sus páginas y un marcador del folio real extraído del PDF. Los campos escaneados no están indexados.
- Anexo XI: 12 tablas HTML, con `thead/th`, y 184 celdas cotejadas individualmente contra el PDF, quitando únicamente espacios y representando los círculos de opción con `○`. La tabla de logística continúa de página 91 a 92; se unió sin duplicar el encabezado repetido.

## SAT · Segunda modificación al Anexo 29 de la RMF 2026

- Instrumento `91760bcd-1cdd-5281-905d-d88d49d8e7d9`, `RMF2026-ANEXO29-M2`.
- Se incorporó únicamente la segunda modificación al Anexo 29 contenida en la nota oficial 5803159, no los demás anexos fiscales de esa nota ni un texto consolidado de la RMF.
- PDF remoto `https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=06112026-MAT.pdf&repo=`, 358 páginas, 17,373,874 bytes. SHA-256 `0d188b1c9bbf2a26b59dca07a189ca7403a8dfc884858e1977a1ecc2f13a11ba` confirmado con nueva descarga oficial.
- Seis fragmentos cubren íntegramente las páginas 229–232: presentación, III.1 LCO, III.2 LRFC, III.3 L_CNE, VI.3 cancelaciones y firma.
- Dos tablas de códigos conservan los `rowspan` originales. Encabezados `th scope=col` y grupos `th scope=rowgroup`; no se trasladan filas a `thead`, porque rompería las celdas que abarcan múltiples filas.
- Las barras `|` del ejemplo L_CNE son parte literal del formato de archivo publicado; se conservan. Las elipsis también pertenecen a la modificación publicada.
- No se afirma una fecha nueva de exigibilidad del complemento fiscal. El radar mantiene pendiente el cotejo de las condiciones transitorias aplicables; `vigente` queda sin inferencia.

## Validación y publicación

- Aplicadas ambas transacciones SQL. Supabase confirma 80/80 y 6/6 textos idénticos mediante MD5 y 86 entradas con índice de búsqueda.
- Los mapas usan SHA-256 del contenido exacto del lector y de cada edición oficial; no se incorporan PDFs ni imágenes al repositorio.
- Manifiesto de lector revisión 119; 108 fuentes remotas. Se verificó que ningún mapa anterior fuera alterado.
- 87 pruebas del lector y transporte aprobadas; lint y build aprobados.
- Paquete `preparar.py` reproduce carga, cotejo, SQL y mapas desde las fuentes oficiales guardadas temporalmente en `.local/cne-sat-nov6` y las ediciones del radar. `publicar.mjs cne` y `publicar.mjs sat` rechazan fuentes o fragmentos duplicados.
- Frontend sin cambios. Solo datos, mapas, documentación y dos URLs oficiales en la lista de fuentes permitidas del transporte.
