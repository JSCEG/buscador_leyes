# LSE: sincronización con PDF oficial

Revisión del 22 de septiembre de 2026. Se cotejaron los 207 fragmentos actuales de Supabase con el PDF de 56 páginas de https://www.diputados.gob.mx/LeyesBiblio/pdf/LSE.pdf.

- 207 coincidencias únicas de texto completo; 0 sin correspondencia.
- El cotejo elimina espacios de maquetación, encabezados repetidos y folios. No elimina palabras, puntuación ni acentos.
- Cada fragmento conserva su UUID y SHA-256 del contenido exacto. Cada fuente conserva el SHA-256 del PDF; si cambia, el lector rechaza la sincronización hasta revisar la nueva edición.
- Los rectángulos corresponden a las líneas originales. Se revisaron visualmente muestras del artículo 1, artículo 3, artículo 185 y transitorio Décimo.
- El PDF se consulta mediante el proxy oficial existente; no se publica una copia del PDF ni imágenes en Git.

Reproducción desde la raíz: descargar el PDF en `.local/lse-sync/LSE.pdf`, instalar PyMuPDF (el script admite la instalación local en `.local/lse-sync/python`) y ejecutar `preparar.py`, luego `publicar.py`. La instantánea de artículos es pública y permite verificar sus hashes sin credenciales. `preparar.py` exige los 207 cotejos antes de poder publicar.

Esto verifica correspondencia documental, no certifica vigencia jurídica. No se modificó texto en Supabase.
