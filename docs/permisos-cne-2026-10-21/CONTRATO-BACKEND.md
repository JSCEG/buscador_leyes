# Contrato: 5 tablas nuevas de permisos CNE (DGMESNIE → Buscador)

**Para:** Codex (backend DGMESNIE). **Front:** Claude, en `buscador_leyes`; ya consume este contrato.
**Base:** Azure SQL `BDPruebasSNIER`, esquema `dbo`. **Solo lectura:** únicamente `SELECT`, sin DDL ni DML.

El navegador nunca llama a DGMESNIE. Llama a `/api/mapa/<endpoint>` (Cloudflare, `server/mapa-proxy.js`), que valida
los parámetros, reenvía a DGMESNIE y guarda en caché. Por eso no hace falta CORS.

## Tablas y clave

El parámetro `tabla` solo acepta estas cinco claves. Resuélvelas con un `switch`, como `ViewName`; nunca
interpoles texto del usuario.

| `tabla` | Tabla SQL |
|---|---|
| `transporte` | `dbo.Transporte_autorizado` |
| `comercializacion` | `dbo.Comercializacion_autorizado` |
| `infraestructura` | `dbo.Infraestructura_Hidrocarburos_autorizado` |
| `suministro` | `dbo.Suministro_Electrico_autorizado` |
| `terceros` | `dbo.Terceros_Acreditados_CNE` (no mezclar con `dbo.Laboratorios_UV`) |

Cualquier otro valor responde `400`. Usa Dapper con `DefaultConnection`, igual que `RepositorioPermisosEnergeticos`.

## Endpoints

Todos son `GET`, devuelven `application/json` con propiedades en camelCase y se exponen con `[AllowAnonymous]`, como los
endpoints de mapa existentes.

### 1. `GET /DashboardProyectos/PermisosEnergeticos/Tablas/Lista?tabla=<clave>[&estatus=][&ef=][&tipo=]`

Filtros opcionales, siempre con parámetros SQL:
- `estatus`: `Vigente` o `No vigente`; si falta, devuelve todos.
- `ef`: dos dígitos INEGI (`09`).
- `tipo`: valor exacto de `Tipo_permiso`.

El Buscador hoy lo llama **sin filtros** y filtra en el navegador; la tabla más grande tiene 2,781 filas.

```sql
SELECT t.Id, t.NumeroPermiso, t.NumeroPermisoNorm, t.Mercado, t.Codigo_actividad, t.Tipo_permiso,
       t.[Razón_social] AS Razon_social, t.RFC, t.Numero_de_Expediente,
       t.FechaOtorgamiento, t.Inicio_vigencia, t.Termino_vigencia,
       t.Estatus, t.Estatus_CNE, t.Estatus_instalacion,
       t.EF_ID, ef.EF_Nombre, t.MPO_ID, m.Municipio_Nombre,
       t.Calle_num_ES, t.Colonia_ES, t.Codigo_Postal, t.Latitud_GEO, t.Longitud_GEO,
       t.Inversion_estimada, t.Comentarios, t.FechaActualizacion,
       l.LigaPermiso, l.LigaResolucionOtorgamiento
       /* + columnas propias de la tabla (ver abajo) */
FROM dbo.<Tabla> t
LEFT JOIN dbo.Entidades_Federativas ef ON ef.EF_ID = t.EF_ID
LEFT JOIN dbo.Municipios m ON m.EF_ID = t.EF_ID AND m.MunicipioID = t.MPO_ID
LEFT JOIN dbo.Ligas_Permisos_CNE l ON l.NumeroPermisoNorm = t.NumeroPermisoNorm
WHERE (@Estatus IS NULL OR t.Estatus = @Estatus)
  AND (@EF_ID IS NULL OR t.EF_ID = @EF_ID)
  AND (@Tipo IS NULL OR t.Tipo_permiso = @Tipo)
ORDER BY t.FechaOtorgamiento DESC, t.Id;
```

Columnas propias:
- **transporte:** `Producto, Medio_transporte, Modalidad, Capacidad, Unidad_capacidad, Numero_unidades, Trayecto, Longitud_km, Cobertura`
- **comercializacion:** `Producto, Modalidad`
- **infraestructura:** `Producto, Capacidad, Unidad_capacidad, Zona_geografica, Longitud_sistema_km, Cobertura`
- **suministro:** `Modalidad, Cobertura`
- **terceros:** `Ambito`

Respuesta:

```json
{
  "tabla": "transporte",
  "filas": [{
    "id": 1, "numeroPermiso": "CNE/PL/0922/TRA/OM/2026", "numeroPermisoNorm": "PL/922/TRA/OM/2026",
    "mercado": "Petrolíferos", "codigoActividad": "TRA", "tipoPermiso": "Transporte por medios distintos a ductos",
    "razonSocial": "…", "rfc": "…", "expediente": "…",
    "fechaOtorgamiento": "2026-03-04", "inicioVigencia": "2026-03-04", "terminoVigencia": "2056-03-04",
    "estatus": "Vigente", "estatusCne": "…", "estatusInstalacion": "…",
    "efId": "09", "entidad": "Ciudad de México", "mpoId": "015", "municipio": "Cuauhtémoc",
    "calle": "…", "colonia": "…", "codigoPostal": "06000", "latitud": null, "longitud": null,
    "inversionEstimada": null, "comentarios": null, "fechaActualizacion": "2026-10-21T16:05:00Z",
    "ligaPermiso": "https://…pdf", "ligaResolucion": null,
    "producto": "Diésel", "medioTransporte": "Autotanque/semirremolque", "modalidad": "…",
    "capacidad": 30000, "unidadCapacidad": "litros", "numeroUnidades": 4, "trayecto": null, "longitudKm": null, "cobertura": "Nacional"
  }]
}
```

- Nombres fijos de propiedades: `razonSocial` (de `[Razón_social]`), `expediente` (de `Numero_de_Expediente`),
  `entidad` (`EF_Nombre`), `municipio` (`Municipio_Nombre`), `ligaPermiso` y `ligaResolucion` (`LigaResolucionOtorgamiento`).
  Las propias: `producto, medioTransporte, modalidad, capacidad, unidadCapacidad, numeroUnidades, trayecto, longitudKm,
  cobertura, zonaGeografica, longitudSistemaKm, ambito`.
- `NULL` se envía como `null`; no lo conviertas en `""` ni en `0`. `efId` y `mpoId` van recortados (son `nchar`).
- Fechas `date` como `yyyy-MM-dd`. `fechaActualizacion` en ISO 8601 **UTC con `Z`**.
- No calcules totales: el front no suma `Capacidad` sin `Unidad_capacidad` ni usa `Inversion_estimada` en indicadores.

### 2. `GET …/Tablas/Estados?tabla=<clave>` (coroplético, vigentes)

```sql
SELECT COALESCE(ef.EF_ID, N'--') AS EF_ID, COALESCE(ef.EF_Nombre, N'Sin entidad') AS Entidad, COUNT(*) AS Permisos
FROM dbo.<Tabla> t
LEFT JOIN dbo.Entidades_Federativas ef ON ef.EF_ID = t.EF_ID
WHERE t.Estatus = N'Vigente'
GROUP BY ef.EF_ID, ef.EF_Nombre;
```

```json
{ "tabla": "transporte", "estados": [{ "efId": "09", "entidad": "Ciudad de México", "permisos": 120 }, { "efId": "--", "entidad": "Sin entidad", "permisos": 720 }] }
```

### 3. `GET …/Tablas/Puntos?tabla=<clave>` (solo con coordenadas, vigentes)

```sql
SELECT NumeroPermiso, [Razón_social] AS Razon_social, Tipo_permiso, Latitud_GEO, Longitud_GEO
FROM dbo.<Tabla>
WHERE Latitud_GEO IS NOT NULL AND Longitud_GEO IS NOT NULL AND Estatus = N'Vigente';
```

```json
{ "tabla": "transporte", "puntos": [{ "numeroPermiso": "…", "razonSocial": "…", "tipoPermiso": "…", "latitud": 19.43, "longitud": -99.13 }] }
```

### 4. `GET …/Tablas/Actualizacion?tabla=<clave>`

```sql
SELECT TOP 1 FechaActualizacion, FechaCorteFuente, Filas
FROM dbo.Control_Actualizacion_CNE WHERE Tabla = @Tabla   -- 'Transporte_autorizado', etc.
ORDER BY FechaActualizacion DESC;
```

```json
{ "tabla": "transporte", "disponible": true, "fechaActualizacion": "2026-10-21T16:05:00Z", "fechaCorteFuente": "2026-10-20", "filas": 2781 }
```

Sin registro: `{ "tabla": "transporte", "disponible": false }`. El front convierte `fechaActualizacion` a la hora de Ciudad de México.

## Errores

- `400`: `tabla` desconocida o parámetros inválidos (`ef` que no sean dos dígitos, `estatus` fuera de los dos valores).
- `500`: error de base de datos, sin mensaje interno.

El proxy los traduce a `502` y el front muestra "No se pudo cargar…".

## Lo que el front ya hace (no se requiere en backend)

- **Número de permiso:** lo normaliza igual que la base: mayúsculas, sin espacios, sin `CNE/` y sin ceros a la
  izquierda por segmento. Compara contra `numeroPermisoNorm`.
- **Filtros:** estatus (por omisión `Vigente`), tipo, mercado, estado y búsqueda en todas las tablas, más los filtros
  propios de cada una.
- **Ligas:** oculta los botones cuando `ligaPermiso` o `ligaResolucion` vienen `null`.
- **Datos que se vayan llenando:** toma automáticamente los estados, municipios y coordenadas nuevos, sin cambios de
  código. Los puntos fuera de México se ignoran.

## Nota del front (21 oct 2026): menú por mercado

El mapa agrupa estas tablas por mercado (Electricidad, Petrolíferos, Gas LP, Gas natural y «Petróleo crudo,
petroquímicos y otros hidrocarburos») usando `mercado` de `/Tablas/Lista`. El mapa por estado y los puntos se calculan
en el navegador a partir de esa lista (vigentes con `efId` o coordenadas), por lo que `/Tablas/Estados` y
`/Tablas/Puntos` quedan disponibles pero el front ya no los necesita. Las capas aparecen solas cuando la extracción
llene `EF_ID`, `MPO_ID` y coordenadas.

## Pendiente del back (21 oct 2026): `mercadosAutorizados`

`Mercados_autorizados` ya existe en las 5 tablas (texto separado por `;`, p. ej. `Gas natural;Petróleo crudo`;
NULL cuando el permiso tiene un solo mercado). Falta agregarla al `SELECT` de `/Tablas/Lista` como
`t.Mercados_autorizados` → JSON `mercadosAutorizados`. El front ya la lee: un permiso cuenta en cada mercado listado,
y `Mercado = 'Varios'` solo en los listados. Mientras no llegue, «Varios» se muestra en «Petróleo crudo,
petroquímicos y otros hidrocarburos».
