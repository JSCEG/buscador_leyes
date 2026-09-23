# RLSH: sincronización con PDF oficial

23 de septiembre de 2026: 371 fragmentos vinculados al PDF de 88 páginas https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LSH.pdf.

Se coteja el texto completo ignorando espacios de maquetación, encabezados, folios y comillas rectas/curvas. Se conserva la huella del texto exacto para detectar cualquier cambio posterior. Excepción explícita del preámbulo: el encabezado inicial del DOF repite el título del decreto que figura al final del mismo fragmento; se vincula el bloque continuo de Diputados, que incluye ese título una sola vez. No se elimina contenido de Supabase.

Se corrigieron dos errores de extracción del artículo 272 en Supabase: `atestig√en` por `atestigüen`, cotejados visualmente en la página 72 del PDF. El UPDATE se limitó al UUID `356e0b40-f605-4471-ae21-f37ecf6c85ee`, la ley correspondiente y exactamente dos apariciones del error. La instantánea contiene el texto corregido.

El PDF se consulta desde Diputados mediante el proxy existente; no se publica una copia ni imágenes en Git. No se modifican archivos del frontend. El mapa conserva huellas del PDF y de cada fragmento. La correspondencia documental no certifica vigencia jurídica.

Reproducción: descargar en `.local/rlsh-sync/RLSH.pdf`, disponer de PyMuPDF (se admite `.local/lse-sync/python`), ejecutar `preparar.py` y `publicar.py`. Se exigen los 371 cotejos antes de publicar.
