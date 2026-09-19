# Plan y mockups del buscador

Abrir con el servidor Vite del proyecto:

- `http://127.0.0.1:5317/docs/diseno-premium-2026-09-19/index.html`: recorrido visual del plan y diagnóstico.
- `http://127.0.0.1:5317/docs/diseno-premium-2026-09-19/prototipo.html`: prototipo navegable.
- `PLAN.md`: alcance, etapas, estimación y criterios de implementación.
- `AUDITORIA-CODIGO.md`: hallazgos del código existente con referencias.
- `capturas/01` a `06`: evidencia de la app antes de cambios, capturada el 19 de septiembre de 2026.
- `capturas/10` en adelante: imágenes de la propuesta, no de la aplicación productiva.
- `medicion-letra.json`: prueba del control actual (100% → 120% sin modificar los 14 px del párrafo).

El prototipo es una propuesta aislada con una muestra documental local. Las búsquedas y preferencias de demostración no escriben en Supabase. Los logos y las fuentes se sirven desde los recursos locales existentes del proyecto; no abrir como `file://`, porque usa rutas web y carga un fixture JSON.

La implementación en el buscador principal queda descrita en el plan. No se ha aplicado a `index.html`, `src/`, los datos jurídicos ni la configuración de producción.
