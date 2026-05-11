# Supabase — Buscador de Leyes Energía

Documento de referencia: arquitectura de la base de datos, cómo funciona cada pieza y estado actual del proyecto.

---

## 1. Proyecto Supabase

| Parámetro | Valor |
|---|---|
| URL | `https://carmfqhcfsqbzcwptqfz.supabase.co` |
| Proyecto ref | `carmfqhcfsqbzcwptqfz` |
| Región | (por confirmar en dashboard) |
| Clave anon | en `.env` como `VITE_SUPABASE_ANON_KEY` |

Las variables de entorno viven en `.env` en la raíz del proyecto. El frontend las consume vía `import.meta.env.VITE_*`. Los scripts Node de mantenimiento usan `SUPABASE_URL` / `SUPABASE_KEY` (mismo valor, distinto nombre).

---

## 2. Esquema de tablas

### 2.1 `leyes` — catálogo de leyes

```sql
id               uuid  PK  default gen_random_uuid()
titulo           text  NOT NULL
siglas           text  NULL
fecha_publicacion date  NULL
temas_clave      text[]  NULL    -- array con hasta 10 temas detectados en ingesta
created_at       timestamptz default now()
```

- Una fila por ley ingresada.
- `temas_clave` se rellena durante la ingesta a partir de los títulos/capítulos detectados por el parser.
- No tiene RLS activo (lectura pública para el rol `anon`).

### 2.2 `articulos` — texto de cada artículo

```sql
id              uuid  PK  default gen_random_uuid()
ley_id          uuid  FK → leyes(id) ON DELETE CASCADE
identificador   text  NOT NULL   -- "Artículo 1", "PRIMERO", etc.
contenido       text  NOT NULL   -- texto completo del artículo
tipo_articulo   text  NULL       -- 'ordinario' | 'transitorio' | 'titulo' | 'capitulo'
orden           int   NULL       -- posición secuencial dentro de la ley
fts             tsvector GENERATED ALWAYS AS (to_tsvector('spanish', contenido)) STORED
```

- La columna `fts` es un `tsvector` **generado automáticamente** por Postgres cada vez que se inserta o actualiza `contenido`.
- Tiene índice GIN sobre `fts` para búsquedas full-text rápidas.
- No tiene RLS activo (lectura pública para `anon`).

### 2.3 `temas` — índice jerárquico de cada ley

```sql
id      uuid  PK
ley_id  uuid  FK → leyes(id) ON DELETE CASCADE
nivel   text  -- 'titulo' | 'capitulo' | 'seccion'
nombre  text  -- ej. "TÍTULO PRIMERO - Del Servicio Público"
orden   int
```

- Se puebla durante la ingesta o con el script `backfill_temas.js`.
- Se usa para construir la tabla de contenidos (TOC) en la vista de detalle de ley.
- Actualmente **no todas las leyes tienen temas** — depende de si el PDF tenía estructura bien marcada.

### 2.4 `user_favorites` — favoritos por usuario

```sql
id           uuid  PK  default gen_random_uuid()
user_id      uuid  FK → auth.users(id) ON DELETE CASCADE  NOT NULL
articulo_id  text  NOT NULL   -- UUID del artículo en string
created_at   timestamptz default now()
UNIQUE (user_id, articulo_id)
```

- RLS activado: cada usuario solo ve y modifica sus propios favoritos.
- Grant: `SELECT, INSERT, DELETE` para rol `authenticated`.

### 2.5 `user_notes` — notas por usuario por artículo

```sql
id           uuid  PK  default gen_random_uuid()
user_id      uuid  FK → auth.users(id) ON DELETE CASCADE  NOT NULL
articulo_id  text  NOT NULL
nota         text  NOT NULL default ''
updated_at   timestamptz default now()
UNIQUE (user_id, articulo_id)
```

- RLS activado: cada usuario solo ve y modifica sus propias notas.
- Grant: `SELECT, INSERT, UPDATE, DELETE` para rol `authenticated`.
- Trigger `trg_user_notes_updated_at` actualiza `updated_at` automáticamente en cada UPDATE.
- La lógica de guardado usa `upsert`: si ya existe una nota para ese artículo/usuario, la actualiza; si el texto queda vacío, la borra.

---

## 3. Autenticación

Se usa **Supabase Auth con email/password**. No hay OAuth configurado aún.

| Función (auth.js) | Qué hace |
|---|---|
| `initAuth()` | Recupera la sesión actual al arrancar la app, suscribe al listener de cambios |
| `login(email, password)` | `signInWithPassword` — lanza error si falla |
| `register(email, password, fullName)` | `signUp` con metadata `full_name` |
| `logout()` | `signOut` |
| `getCurrentUser()` | Devuelve el objeto `user` actual o `null` |
| `isLoggedIn()` | Booleano |
| `onAuthChange(cb)` | Registra un callback que se llama cada vez que cambia la sesión |

El estado del usuario vive en el módulo `auth.js` como variable de módulo (`currentUser`). La UI escucha cambios vía `onAuthChange`.

**Pendiente en Dashboard de Supabase:**
- `Authentication → URL Configuration`: agregar dominio local (`http://localhost:5173`) y el dominio de producción a **Site URL** y **Redirect URLs**.
- Decidir si el registro requiere confirmación por correo (actualmente puede estar desactivado).

---

## 4. Búsqueda full-text (FTS)

El motor de búsqueda en `search-engine.js` tiene dos estrategias en cascada:

### Estrategia 1 — FTS con `tsvector` (español)

```js
supabase.from('articulos')
    .select('...', { count: 'exact' })
    .textSearch('fts', 'vinculante & norma', { config: 'spanish' })
    .range(from, to)
```

- Las palabras se unen con `&` (AND obligatorio).
- Postgres aplica stemming en español: "vinculante" → raíz `vincul`, por lo que encuentra "vinculantes", "vinculación", etc.
- **Bug conocido de PostgREST**: cuando se usa `count: 'exact'` junto con `textSearch`, la primera respuesta puede devolver `count = null` aunque haya datos. El código maneja esto con:

```js
const hasResults = !error && (count > 0 || (data && data.length > 0));
const total = (count !== null && count !== undefined) ? count : data.length;
```

### Estrategia 2 — Fallback `ilike` (siempre funciona)

Si FTS no devuelve resultados, se hace una búsqueda `ilike` palabra por palabra:

```js
for (const word of words) {
    if (word.length > 2) q = q.ilike('contenido', `%${word}%`);
}
```

- No aplica stemming, es búsqueda exacta de substring.
- Más lenta pero nunca falla.

### Paginación

- `limit = 20` por defecto.
- `from / to` calculados con `(page - 1) * limit` → `from + limit - 1`.
- El total real de resultados se devuelve en `{ data, total }`.

---

## 5. Ingesta de PDFs

El flujo completo de carga de una ley nueva:

```
PDF  →  legal-ingest-pipeline.js  →  chunks[]  →  Supabase (leyes + articulos + temas)
```

### 5.1 Desde el frontend (admin panel)

`src/scripts/admin-ingest.js` — drag-and-drop de PDF en el panel admin:
- Parsea el PDF con **pdf.js** en el navegador.
- Extrae texto página por página y lo trocea en artículos usando expresiones regulares.
- Llama a Supabase directamente desde el browser para insertar `leyes` y `articulos`.
- Requiere que el usuario esté autenticado (aunque actualmente la tabla no tiene RLS).

### 5.2 Desde la línea de comandos (recomendado para leyes largas)

```bash
# Desde la carpeta del proyecto:
node ingestar_pdf.js "ruta/al/archivo.pdf" "Título Exacto de la Ley" [SIGLAS] [--dry-run]
```

- Usa `legal-ingest-pipeline.js` que llama al binario `pdf2md` (Rust, instalado en `~/.cargo/bin/`).
- Detecta automáticamente artículos ordinarios, transitorios, títulos, capítulos y secciones.
- Inserta en lotes de 100 artículos para evitar límites de payload.
- `--dry-run` procesa el PDF pero no escribe en Supabase (útil para revisar chunks).
- `--markdown-out ruta.md` guarda el texto convertido a markdown para inspección.

### 5.3 Scripts de mantenimiento

| Script | Propósito |
|---|---|
| `cleanup_bd.js` | Borra todo (user_favorites → user_notes → articulos → temas → leyes) en orden correcto para respetar FK |
| `rechunk_leyes.js` | Re-procesa leyes ya existentes con un parser mejorado |
| `fix_rechunk.js` | Correcciones puntuales post-rechunk |
| `backfill_temas.js` | Rellena la tabla `temas` desde los JSONs de `public/data/` |

> **Nota**: Estos scripts Node.js deben ejecutarse desde tu máquina local (tienen acceso a internet). La VM del sandbox no tiene conectividad a Supabase.

---

## 6. Funciones exportadas de `search-engine.js`

| Función | Parámetros | Devuelve |
|---|---|---|
| `initSearch()` | — | Emite evento `search-ready` con metadatos |
| `performSearch(query, page, limit, filters)` | query: string, filtros de ley/tipo/artNum | `{ data: Item[], total: number }` |
| `getSearchCountsByLaw(query)` | query: string | `[{ ley, count }]` ordenado desc |
| `getArticleById(id)` | uuid string | `Item` o `null` |
| `getArticlesByLaw(lawName)` | nombre exacto de ley | `Item[]` ordenados por `orden` |
| `getLawMetadata(lawName)` | nombre exacto de ley | objeto con id, título, fecha, total_articulos |
| `getLawTemas(lawId)` | uuid de ley | `[{ nivel, nombre, orden }]` |
| `getThemesByLawName(lawName)` | nombre exacto de ley | `[{ nivel, nombre, orden }]` |

El objeto `Item` que devuelven todas las funciones tiene esta forma:

```js
{
    id: string,
    ley_origen: string,       // título de la ley
    fecha_publicacion: string | null,
    articulo_label: string,   // "Artículo 3", "PRIMERO", etc.
    tipo_articulo: string,    // 'ordinario' | 'transitorio' | ...
    titulo_nombre: '',        // actualmente vacío (no se guarda en BD aún)
    capitulo_nombre: '',      // actualmente vacío (no se guarda en BD aún)
    texto: string,            // contenido completo del artículo
    score: number             // posición inversa en los resultados (100, 99, 98...)
}
```

---

## 7. Estado actual y pendientes

### ✅ Funcionando

- Tablas `leyes`, `articulos`, `temas` con datos reales.
- FTS en español con fallback ilike — bug de `count = null` corregido.
- Tabla `user_favorites` con RLS y funciones CRUD en `auth.js`.
- Tabla `user_notes` con RLS, upsert/delete y trigger de `updated_at`.
- Auth email/password: login, register, logout, persistencia de sesión.
- Frontend admin para subir PDFs directamente desde el browser.
- Script CLI `ingestar_pdf.js` para ingesta robusta desde la terminal.

### 🔧 Pendientes técnicos

- **`titulo_nombre` y `capitulo_nombre` vacíos**: el parser los detecta durante la ingesta pero no se guardan en la tabla `articulos` (no existen esas columnas). Se pierden. Si se quiere mostrarlos en la UI habría que agregar las columnas y re-ingestar.

- **Configurar URL Configuration en Supabase Auth**: agregar `http://localhost:5173` y el dominio de producción para que los redirects de confirmación de email funcionen.

- **Confirmar RLS en `articulos` y `leyes`**: actualmente tienen RLS **desactivado** (toda la lectura es pública). Si en el futuro se quiere restringir el acceso a usuarios autenticados, habría que activar RLS y crear policies de `SELECT` para `authenticated`.

- **Artículo 3 de la LSE (glosario)**: tiene ~3,088 palabras, lo que lo convierte en un chunk muy grande. El FTS lo encuentra bien, pero en la UI se muestra como un bloque enorme. Considerar dividirlo por definición.

- **Accessibility**: 6 elementos `<label>` en el HTML no tienen `for` asociado a un campo. No bloquea nada pero genera warnings en consola.

### 📋 Leyes en la BD (sesión actual)

Después de limpiar y re-ingestar, la única ley cargada es:

- **Ley del Sector Eléctrico (LSE)** — ingresada via panel admin del frontend.

Las demás leyes que estaban antes (Ley de la Industria Eléctrica, Ley de Hidrocarburos, etc.) se borraron en la limpieza de BD. Hay PDFs disponibles en `Leyes_en_pdf/` para re-ingestarlas cuando se quiera.

---

## 8. Cómo agregar una ley nueva

```bash
# 1. Desde tu terminal local (no desde la VM)
cd "ruta/al/proyecto"

# 2. Opcional: ver cómo quedan los chunks sin escribir nada
node ingestar_pdf.js "Leyes_en_pdf/nombre.pdf" "Título Exacto" --dry-run

# 3. Ingestar de verdad
node ingestar_pdf.js "Leyes_en_pdf/nombre.pdf" "Título Exacto" SIGLAS

# 4. Si algo salió mal, limpiar esa ley específica desde Supabase SQL Editor:
#    DELETE FROM leyes WHERE titulo = 'Título Exacto';
#    (los artículos se borran en cascada)
```

---

## 9. Cómo limpiar toda la BD

Desde **Supabase Dashboard → SQL Editor**:

```sql
TRUNCATE leyes CASCADE;
-- Esto borra en cascada: articulos, temas, y las referencias en user_favorites/user_notes
-- (user_favorites y user_notes usan articulo_id como text, no FK, así que NO borran en cascada)

-- Si también quieres limpiar favoritos y notas:
TRUNCATE user_favorites;
TRUNCATE user_notes;
```

O desde la terminal local con `node cleanup_bd.js`.
