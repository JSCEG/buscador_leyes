# Mejora de rendimiento — 22 de octubre de 2026

Publicado en https://snier-permisos-api.azurewebsites.net. Se mantiene la autenticación y el usuario SQL de sólo lectura.

## Medición en Azure

Solicitudes realizadas desde el mismo equipo, con la misma clave. Tiempos de pared completos, no sólo CPU SQL. Son mediciones individuales, no un SLA; incluyen red y pueden variar con carga, caché y arranque en frío de F1.

| Consulta | Antes | Después | Tamaño después |
|---|---:|---:|---:|
| `/permisos?pageSize=1`, sin tabla | 25.952 s | 2.465 s | 1,921 bytes |
| `/estados`, sin tabla | 10.688 s | 1.342 s | 1,801 bytes |
| `/puntos?tabla=electricidad&pageSize=500`, completo | 14.340 s | 15.242 s | 1,024,573 bytes |
| `/puntos?tabla=electricidad&pageSize=500&ligero=true` | no existía | **0.264 s** | **120,918 bytes** |
| `/puntos?pageSize=500&ligero=true`, sin tabla | no existía | **1.616 s** | 120,919 bytes |

La respuesta completa de puntos sigue siendo pesada y no mostró mejora en esta medición. Se conserva por compatibilidad. La reducción de carga para los marcadores se obtiene usando explícitamente `ligero=true`: la página pesa un 88.2% menos que la completa.

**Carga completa en producción: 2,192 puntos de electricidad, cinco páginas de hasta 500, en 0.65 segundos**, sin duplicados ni puntos omitidos. Este recorrido se midió después de otras consultas de verificación, con la aplicación caliente y el conteo reutilizable. El primer acceso puede tardar más.

Los datos brutos están en `tests/performance-before.json` y `tests/performance-after.json`.

## Cambios para el consumidor

1. Marcadores CNE: `GET /api/v1/puntos?autoridad=CNE&pageSize=500&ligero=true`. También puede especificarse `tabla=electricidad`, etc. Seguir `nextPage` hasta null.
2. Los puntos ligeros contienen `tabla`, `numero`, `razonSocial`, `estatus`, `estatusFuente`, `latitud`, `longitud`, `autoridad` y `tipo`. No contienen `datos`, catálogos territoriales ni PDFs. Abrir el popup completo mediante `/detalle?tabla=<clave>&numero=<número codificado>`.
3. Búsqueda: `/permisos?q=petroleos%20mexicanos`, combinable con autoridad, tabla, mercado, estatus y filtros territoriales. Busca fragmentos del número o razón social, sin distinguir mayúsculas ni acentos. `numero` sigue siendo exacto. `%`, `_` y `[` se buscan como texto literal. `q` debe tener entre 2 y 120 caracteres.
4. `/actualizaciones` añade `clave`, manteniendo `tabla`: `{"tabla":"Pozos_SENER","clave":"pozos",...}`. No hace falta mantener la traducción física en el frontend si se usa `clave`. La hija de asignaciones usa `asignaciones-municipios`.

## Cambios de consultas e índices

- La consulta de inventario pagina únicamente identificadores; las columnas extensas y su JSON se leen después, sólo para la página seleccionada.
- El modo ligero no consulta ligas ni materializa JSON de detalle o joins de catálogos.
- Las agregaciones territoriales se hacen dentro de cada tabla antes de unir las fuentes. En asignaciones se mantiene `COUNT(DISTINCT NumeroAsignacion)` por entidad/municipio, usando la tabla hija.
- Caché acotada del conteo durante 30 segundos, compartida entre páginas del mismo filtro y separada por las tablas autorizadas al cliente. Las filas siguen consultándose en SQL. Los totales pueden reflejar una carga nueva con hasta 30 segundos de demora.
- Se crearon cuatro índices, sin cambiar datos ni permisos: `IX_PermisosApi_Electricidad_Numero`, `IX_PermisosApi_Expendios_Territorio`, `IX_PermisosApi_GasLP_Territorio` y `IX_PermisosApi_Ligas_Numero`. La migración repetible está en `sql/20261022-performance-indexes.sql`.

## Plan, cuota y límite del proxy

Se mantuvo el plan gratuito F1; no se generó un cambio a un nivel de pago. La aplicación figuraba Running/Normal durante la comprobación y no estaba bloqueada por cuota. La respuesta de Azure a la consulta de uso no ofreció un límite numérico utilizable; no se interpreta como ausencia de cuota.

La base SQL está en Basic de 5 DTU. El tiempo de espera de SQL y el tiempo de CPU de App Service son métricas distintas; una petición de 15 segundos no equivale por sí misma a 15 segundos de CPU F1. La optimización reduce el trabajo y el tráfico, pero F1 conserva sus restricciones y sus posibles arranques en frío.

Se conservan las 600 solicitudes/minuto del cliente `buscador`. Ahora puede fijarse un valor por cliente con `ApiClients__buscador__RequestsPerMinute` (de 1 a 10000) o `New-ApiClient.ps1 -RequestsPerMinute`. Una clave compartida por el proxy sigue teniendo un límite compartido por todo el sitio. No se elevó el límite automáticamente.

## Verificación

121 comprobaciones locales y 118 contra producción, incluidas las 14 fuentes, compatibilidad del detalle completo, paginación, autorización por fuente/alcance, búsqueda y escape de comodines, claves de actualización, agregación territorial y carga íntegra de los 2,192 puntos. Las dependencias no presentaron vulnerabilidades conocidas en la comprobación de NuGet. El frontend no fue modificado.
