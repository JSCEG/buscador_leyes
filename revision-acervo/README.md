# Evidencia del acervo

Este directorio conserva el inventario, auditorías, fuentes textuales, perfiles de extracción, payloads revisados, respaldos de las tablas jurídicas y verificaciones de las cargas realizadas en septiembre de 2026.

El estado actual es **41 instrumentos / 3,300 fragmentos / 904 entradas de estructura**. La última carga está documentada en `incorporacion-autoconsumo-2026-09-18/INCORPORACION.html`. Consultar `FALTANTES_Y_ORDEN_DE_CARGA.md` y `inventario-radar-2026-09-17/INVENTARIO.html`. Los informes anteriores conservan los conteos de su momento; no deben sumarse entre sí.

Los SQL de reparación y carga **ya se aplicaron**. No ejecutarlos como una instalación nueva ni volver a aplicarlos sobre la base actual. Los scripts de cada expediente son herramientas de mantenimiento específicas para las fuentes revisadas; algunos incluyen operaciones de escritura y requieren revisión antes de ejecutarse. El arranque normal de la app no los ejecuta.

Los PDF oficiales descargados y las capturas de `revision-visual/` permanecen en la copia local y no se versionan. Sus referencias y huellas se conservan en los manifiestos de fuentes correspondientes. Para cotejarlos otra vez, descargar la fuente oficial identificada y comprobar su huella; una descarga posterior puede contener una versión diferente.

El inventario se generó desde el radar canónico externo, con corte 14 de septiembre de 2026, v4.17. Ese archivo externo no forma parte del repositorio; se incluyen las salidas JSON/CSV/Markdown/HTML del inventario y el generador. Los generadores que usan rutas locales deben ajustarse para otra máquina.
