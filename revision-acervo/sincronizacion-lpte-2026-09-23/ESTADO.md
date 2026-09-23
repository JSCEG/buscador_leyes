# LPTE: sincronización documental

23 de septiembre de 2026: 113 fragmentos cotejados contra el PDF oficial de 23 páginas: https://www.diputados.gob.mx/LeyesBiblio/pdf/LPTE.pdf

Coincidencia única del texto completo ignorando espacios de maquetación y excluyendo encabezados y folios. Se conservan las huellas SHA-256 del PDF y del contenido exacto de cada fragmento. No se modificó el texto en Supabase.

El preámbulo y el articulado se cotejan con el contenido existente. Se revisó visualmente el preámbulo resaltado en la primera página. Las pruebas del lector verifican todos los fragmentos, sus páginas con resaltado y el rechazo de contenido modificado.

El proxy existente consulta la fuente remota y valida su huella; no se incorpora el PDF ni imágenes al repositorio. Esta correspondencia documental no certifica vigencia jurídica.

Reproducción: descargar el PDF en .local/lpte-sync/LPTE.pdf; ejecutar preparar.py con PyMuPDF disponible y después publicar.py. missing.json debe estar vacío antes de publicar.
