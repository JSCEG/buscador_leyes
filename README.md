# Buscador de Leyes Energía

Buscador jurídico del sector energético construido como SPA con JavaScript, Vite, Tailwind, Supabase y D3. El catálogo y los textos consultados por la aplicación residen en Supabase.

## Desarrollo local

1. Instalar las dependencias con `npm ci`.
2. Copiar `.env.example` a `.env` y completar la URL y la clave pública de Supabase. No usar claves de servicio en variables `VITE_*`.
3. Ejecutar `npm run dev` (puerto 5173). En Windows, `./iniciar-local.ps1` inicia o verifica el servicio en `http://127.0.0.1:5317/`, dejando sus registros en `.local/`.

Validación: `npm test -- --run`, `npm run lint` y `npm run build`.

## Estado del acervo

Al 20 de septiembre de 2026: **83 instrumentos, 4,561 fragmentos y 1,242 entradas de estructura** verificados en Supabase. La entrega más reciente completa el Programa Institucional CENACE 2026-2030, con 20 tablas, cinco estrategias, cuatro indicadores y acceso al PDF oficial sincronizado. Se conserva el aviso como publicación independiente vinculada al programa.

- [Inventario actual y sus límites](revision-acervo/inventario-radar-2026-09-20/INVENTARIO.md).
- [Entrega CENACE y evidencia de cotejo](revision-acervo/incorporacion-cenace-2026-09-20/README.md).

- [Contexto técnico y de las incorporaciones](CONTEXTO_BUSCADOR_RADAR.md).
- [Inventario del radar y próximos bloques](revision-acervo/FALTANTES_Y_ORDEN_DE_CARGA.md).
- [Evidencia y precauciones de reproducción](revision-acervo/README.md).
- [Referencia de Supabase](SUPABASE.md), con información histórica que debe contrastarse con el contexto actualizado.

El radar utilizado tiene corte documental del 18 de septiembre de 2026 (v4.18): 73 referencias cargadas y 62 pendientes de cotejo, sin referencias parcialmente incorporadas en este corte. Las 62 pendientes no equivalen necesariamente a 62 instrumentos nuevos. Antecedentes, portales, proyectos y publicaciones no localizadas se contabilizan por separado. Los informes anteriores conservan sus cifras históricas; para el estado vigente del acervo se utiliza el inventario del 20 de septiembre. La incorporación y la revisión de relaciones jurídicas continúan por bloques cotejados.

## Explorador y lector

Desde el 19 de septiembre de 2026, **Temas Transversales** utiliza un catálogo parametrizable publicado en Supabase: **5 colecciones, 38 entidades y 33 relaciones editoriales**, con mapa/lista, búsqueda, fundamentos y enlaces a artículos. Los administradores pueden preparar borradores, revisar y publicar nuevas versiones con historial; el radar no publica cambios automáticamente. [Funcionamiento y permisos del explorador](docs/explorador-parametrizable.md).

El lector comparte tamaño de letra, interlineado y fondo entre instrumentos y artículos, conservándolos en este navegador. Permite alternar **Texto / PDF original** y consultar ambos en pantallas amplias. La sincronización cubre **48 fragmentos de LCNE y 32 apartados del Programa Institucional CENACE**, con verificación del texto y del PDF oficial antes de mostrar resaltados. Las cuatro fichas de indicadores CENACE conservan juntas sus dos páginas; mapas y gráficos se consultan en el original. Los demás instrumentos ofrecen su fuente oficial cuando está disponible; su mapeo preciso sigue pendiente. [Funcionamiento del lector](docs/lector-2026-09-19/README.md) · [Cobertura y cotejo CENACE](revision-acervo/incorporacion-cenace-2026-09-20/README.md).

## Publicación

La aplicación pública se despliega en [Cloudflare Pages](https://buscador-leyes-jav.pages.dev/), proyecto `buscador-leyes-jav`, desde `main`: directorio raíz del repositorio, comando `npm run build` y salida `dist`. Las vistas previas incluyen las ramas de código y excluyen `gh-pages`, que contiene archivos ya compilados y no tiene `package.json`.

La aplicación necesita `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` **durante la compilación**. En Cloudflare, ambas se configuran en el entorno de producción y deben corresponder al mismo proyecto Supabase. El acervo actual pertenece a `carmfqhcfsqbzcwptqfz`. El `.env` local no se sube a GitHub; al cambiar variables de Cloudflare es necesario volver a compilar.

Existe además un workflow de GitHub Actions que publica en la rama `gh-pages`. Ese flujo es independiente de Cloudflare y necesita sus propias variables de compilación si se desea utilizar su sitio generado. No debe usarse `gh-pages` como entrada de un nuevo build de Vite. Un build exitoso por sí solo no verifica la conexión al acervo: comprobar el listado y una búsqueda en la URL publicada.

## Archivos locales

Se excluyen credenciales, dependencias, compilados, cachés, logs, capturas temporales de revisión y PDF descargados de trabajo. Las fuentes oficiales, sus huellas y la evidencia textual de las incorporaciones se conservan en `revision-acervo/`. El lector publica su manifiesto de páginas y coordenadas en `public/reader-sources/`; obtiene los PDFs de Diputados y del DOF mediante fuentes permitidas y coteja su SHA-256, sin almacenar PDFs ni imágenes en Git. Graphify mantiene el grafo del código en `graphify-out/`; su caché es regenerable.
