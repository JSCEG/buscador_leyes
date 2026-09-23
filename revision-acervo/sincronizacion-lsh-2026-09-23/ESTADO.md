# LSH: sincronización con PDF oficial

23 de septiembre de 2026: 194 fragmentos actuales de Supabase cotejados con coincidencia única y completa en el PDF de 61 páginas de https://www.diputados.gob.mx/LeyesBiblio/pdf/LSH.pdf.

El cotejo elimina únicamente espacios de maquetación, encabezados repetidos y folios. Conserva palabras, puntuación y acentos. Cada UUID mantiene el SHA-256 del texto exacto; la fuente mantiene la huella del PDF. Si cambia la edición o el texto, el lector rechaza la sincronización hasta revisar la nueva versión.

Revisión visual de artículo 1, continuación del artículo 3 y firmas. Pruebas de todos los fragmentos y sus páginas, navegación multipágina y rechazo de texto modificado. No se modifica Supabase ni se publican PDF o imágenes en Git: el lector consulta la fuente mediante el proxy existente.

Para reproducir desde la raíz: descargar el PDF en `.local/lsh-sync/LSH.pdf`, disponer de PyMuPDF (también se admite `.local/lse-sync/python`), ejecutar `preparar.py` y después `publicar.py`. Se exigen 194 cotejos antes de publicar. Esta verificación es de correspondencia documental, no de vigencia jurídica.
