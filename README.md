# Buscador de Leyes Energía

Buscador jurídico del sector energético construido como SPA con JavaScript, Vite, Tailwind, Supabase y D3. El catálogo y los textos consultados por la aplicación residen en Supabase.

## Desarrollo local

1. Instalar las dependencias con `npm ci`.
2. Copiar `.env.example` a `.env` y completar la URL y la clave pública de Supabase. No usar claves de servicio en variables `VITE_*`.
3. Ejecutar `npm run dev` (puerto 5173). En Windows, `./iniciar-local.ps1` inicia o verifica el servicio en `http://127.0.0.1:5317/`, dejando sus registros en `.local/`.

Validación: `npm test -- --run`, `npm run lint` y `npm run build`.

## Estado del acervo

Al 18 de septiembre de 2026: **38 instrumentos, 3,237 fragmentos y 831 entradas de estructura** verificados en Supabase. Las tres convocatorias de generación y sus diez modificaciones se conservan como publicaciones independientes, enlazadas mediante notas editoriales.

- [Contexto técnico y de las incorporaciones](CONTEXTO_BUSCADOR_RADAR.md).
- [Inventario del radar y próximos bloques](revision-acervo/FALTANTES_Y_ORDEN_DE_CARGA.md).
- [Evidencia y precauciones de reproducción](revision-acervo/README.md).
- [Referencia de Supabase](SUPABASE.md), con información histórica que debe contrastarse con el contexto actualizado.

El radar utilizado tiene corte del 14 de septiembre de 2026 (v4.17). Quedan 104 referencias por cotejar e incorporar; no equivalen necesariamente a 104 instrumentos nuevos. También están pendientes la tabla general de relaciones y la ampliación de los temas transversales editoriales.

## Publicación

El workflow existente se activa con los pushes a `main` y publica el build en la rama `gh-pages`. La aplicación necesita `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` **durante la compilación**. El `.env` local no se sube a GitHub: el workflow debe recibir esas variables del entorno de publicación. Un workflow exitoso por sí solo no verifica que el acervo alojado se conecte a Supabase.

## Archivos locales

Se excluyen credenciales, dependencias, compilados, cachés, logs, capturas de revisión y PDF descargados. Las fuentes oficiales, sus huellas y la evidencia textual de las incorporaciones se conservan en `revision-acervo/`. Graphify mantiene el grafo del código en `graphify-out/`; su caché es regenerable.
