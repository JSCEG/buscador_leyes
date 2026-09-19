# Gestión del explorador del marco normativo

El contenido de Temas Transversales se administra como un catálogo: entidades, relaciones documentadas y temas. La vista pública consume un catálogo validado; un borrador local no reemplaza automáticamente la publicación.

## Flujo editorial

1. Abrir **Gestionar contenido** con una cuenta autorizada (en desarrollo también se puede preparar un borrador local).
2. Elegir Entidades, Relaciones o Temas. Seleccionar una ficha existente o **Nueva ficha**.
3. Capturar los campos. Una entidad puede ser concepto, instrumento o autoridad; los alias facilitan encontrarla. El ID es estable y no cambia al editar el título.
4. Agregar referencias por UUID real de fragmento y/o URL oficial. Las referencias heredadas pendientes se conservan explícitamente. Una relación marcada «verificada» necesita una fuente localizable; una asociación temática continúa identificada como editorial.
5. **Guardar ficha en borrador** antes de cambiar de selección. Los cambios se guardan en este navegador. Si el navegador impide guardarlos, el editor informa el fallo y permite exportar JSON.
6. **Ver vista previa** aplica el borrador a la vista pública de esta sesión con una advertencia visible. No lo publica para otros usuarios.
7. Revisar las explicaciones, relaciones y fuentes. Marcar la revisión editorial y **Publicar revisión compartida**. El servidor verifica los permisos y la revisión base en una transacción.

Un nuevo tema sólo necesita seleccionar entidades existentes, elegir una raíz y guardar su título e introducción. No requiere editar `analisis.js`. Antes de eliminar una entidad, se deben quitar sus referencias de temas y relaciones: el validador impide dejar vínculos rotos.

## Importación, respaldo e historial

El editor exporta un JSON que puede compartirse o conservarse como respaldo. Importar JSON lo valida y crea un borrador; la revisión del archivo no sustituye la revisión base de la sesión, para impedir sobrescrituras accidentales. El límite es 2 MB.

**Consultar historial** muestra las últimas 30 publicaciones al administrador. Recuperar una revisión crea un borrador. Publicarlo genera una nueva revisión; nunca elimina publicaciones anteriores. Si otra persona publicó después de cargar el editor, se rechaza la operación y se conserva el borrador para conciliar los cambios.

Si una ficha tiene campos pendientes, el editor bloquea cambiar de ficha, cerrar, importar, exportar, previsualizar o publicar hasta **Guardar ficha en borrador** o **Descartar cambios de esta ficha**. Las fichas guardadas se conservan localmente y el editor ofrece recuperarlas de forma explícita.

## Persistencia y permisos

`src/lib/explorer-store.js` expone:

- `loadExplorerCatalog()` → `{catalog, source: 'supabase' | 'bundled', warning?}`.
- `saveDraft(catalog, baseRevision)`, `getDraft()` y `clearDraft()`.
- `canPublishExplorer()` consulta la autorización real del servidor.
- `publishExplorerCatalog(catalog, expectedRevision)` devuelve el catálogo confirmado, con nueva revisión.
- `listExplorerRevisions()` y `getExplorerRevision(revision)` requieren permiso editorial.

El catálogo incluido está en `src/data/explorer-catalog.json`. Si el backend no está disponible, falta la migración o el documento compartido es inválido, la lectura conserva el catálogo incluido y expone un diagnóstico. La publicación falla explícitamente; no simula éxito ni convierte un borrador en publicación.

La migración `supabase/migrations/202609190001_explorer_catalog.sql` agrega únicamente las tablas del explorador, historial, permisos y funciones. La fila inicial representa la revisión 1 incluida en la aplicación. La primera publicación compartida será la revisión 2 si no se carga previamente el catálogo inicial.

Los clientes anónimos sólo pueden leer el catálogo publicado. Los cambios se ejecutan mediante una función transaccional; los clientes no reciben permisos directos de escritura. Los administradores se validan por UUID en `explorer_editors` o por `raw_app_meta_data` controlado por el servidor, siempre con correo confirmado. **`user_metadata` no otorga permisos en el servidor.** La migración incorpora los dos correos administrativos ya presentes en la app sólo si sus cuentas existen y están confirmadas.

No se necesita ni debe incluirse una clave `service_role` en el navegador. Para conceder acceso editorial a otra persona, el administrador del backend agrega su UUID a `explorer_editors` o configura `app_metadata` mediante un entorno privilegiado.

## Radar regulatorio

Esta entrega permite incorporar contenidos mediante formularios o importar un catálogo preparado y validado. **No conecta ni modifica la tarea diaria del radar y no publica sus hallazgos automáticamente.** Cada hallazgo requiere cotejo del instrumento, estructura, numeración y fundamento; después puede convertirse en una ficha o relación revisada.

Las relaciones del catálogo expresan lo registrado por el editor y deben distinguir asociación temática de una relación jurídica verificada. Coincidir en palabras clave no crea automáticamente una relación jurídica.

## Verificación

`tests/explorer-store.test.js` cubre la separación entre borrador y publicación, fallos de almacenamiento/red, catálogo remoto inválido, referencias inseguras, permisos, conflicto de revisiones y ausencia de migración. La validación del contrato y navegación del grafo se prueban en las pruebas del modelo.

La migración se aplicó el 19 de septiembre de 2026 en el proyecto `buscador-leyes`, con autorización explícita del usuario. Se cargó la revisión inicial: 5 colecciones, 38 entidades y 33 relaciones editoriales; se conserva también como revisión 1 del historial.

Verificación real en Supabase: lectura anónima permitida, administrador anónimo falso, INSERT/UPDATE y ejecución de publicación denegados a visitantes. Una publicación con la identidad de un administrador existente y una revisión concurrente se probaron dentro de una transacción revertida; la revisión persistente continúa en 1. El cliente local recupera el catálogo compartido sin recurrir a la copia incluida. No se modificaron leyes ni artículos.

Pasaron 72 pruebas automatizadas, ESLint y el build de producción. La corrección posterior de los listeners duplicados del modo oscuro pasó su regresión focal y un build final. Se verificaron anchos CSS 320, 390, 768, 1024, 1440, 1920 y 2560, además del modo oscuro y el regreso desde un artículo. La prueba manual creó una entidad, una colección y una relación mediante formularios, comprobó su vista previa y retiró el borrador temporal sin publicarlo. Evidencia: [verificacion.json](explorador-2026-09-19/verificacion.json), [escritorio](explorador-2026-09-19/explorador-escritorio.png), [móvil](explorador-2026-09-19/explorador-movil.png).

Las 7 referencias heredadas que no se pudieron vincular a artículos reales permanecen identificadas en los datos y sin botones internos rotos. Los textos originales se conservaron íntegros en `src/data/legacy-temas.json`; el catálogo no presenta paráfrasis heredadas como citas verificadas. Las asociaciones iniciales son editoriales, no una nueva interpretación de jerarquías jurídicas.

Esta entrega corresponde al explorador parametrizable y se agrupa para publicación con el [lector y cotejo documental](lector-2026-09-19/README.md): ajustes Aa compartidos y sincronización inicial de la LCNE. Los nuevos gráficos estadísticos, el adaptador del radar y el mapeo del original para los demás instrumentos siguen pendientes.
