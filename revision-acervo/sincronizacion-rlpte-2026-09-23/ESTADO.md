# RLPTE: sincronización documental

23 de septiembre de 2026: 152 fragmentos cotejados contra el PDF oficial de 24 páginas: https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LPTE.pdf

Coincidencia única del texto completo ignorando espacios de maquetación y excluyendo encabezados y folios. Se conservan las huellas SHA-256 del PDF y del contenido exacto de cada fragmento. No se modificó el texto en Supabase.

Excepción explícita: el preámbulo del DOF repite al inicio el título del decreto que aparece al final del mismo preámbulo en Diputados. El mapa vincula ese bloque continuo sin duplicar el título; conserva la huella del contenido completo. Se revisó visualmente el preámbulo resaltado en la primera página. Las pruebas del lector verifican todos los fragmentos, sus páginas con resaltado y el rechazo de contenido modificado.

El proxy existente consulta la fuente remota y valida su huella; no se incorpora el PDF ni imágenes al repositorio. Esta correspondencia documental no certifica vigencia jurídica.

Reproducción: descargar el PDF en .local/rlpte-sync/RLPTE.pdf; ejecutar preparar.py con PyMuPDF disponible y después publicar.py. missing.json debe estar vacío antes de publicar.
