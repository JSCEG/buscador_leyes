# Auditoría de datos tabulares · 14 de octubre

Se revisaron 68 fragmentos del reporte de presentación y formularios de biocombustibles. Se cotejó cada tabla y cada celda con el HTML oficial: sólo se aplicaron cambios donde coincide el texto completo y el número de celdas.

Resultado aplicado: 59 fragmentos, 246 atributos de celdas combinadas restaurados y 311 tablas con encabezados semánticos confirmados. El numeral DACG-SAE 2.12 recupera dos tablas de normas; se elimina el rótulo «Norma» agregado por la conversión previa porque no aparece en la tabla oficial. El resto conserva íntegramente el texto, tras normalizar espacio y signos de marcado.

Las tablas anidadas de los siete formularios de permisos de biocombustibles coinciden con la estructura oficial. En DACG-ACCESO-REDES se confirman dos tablas contenedoras con anidación. Las rejillas y espacios vacíos cotejados de BENEFICIO-REDES se conservan; son campos y maquetación del formulario. MODELOS-INTERCONEXION conserva sus campos de firmas: no son una fila de títulos de columnas.

Pendientes: 29 tablas sin correspondencia automática exacta, detalladas por fragmento en cotejo.json. No se modificaron esas tablas; requieren cotejo manual de posibles divisiones, envoltorios o diferencias de extracción. No se declara concluida la auditoría completa del acervo.

Se actualizaron los 59 hashes del manifiesto, conservando páginas y coordenadas. No se cambia el frontend. aplicar.sql contiene el plan transaccional original; los parches individuales patch-N.sql representan la aplicación protegida por el hash previo, por diferencias de marcado para reducir el tamaño de las solicitudes.
