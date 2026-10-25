# API de lectura de permisos CNE y SENER

Despliegue: **https://snier-permisos-api.azurewebsites.net**. Base de rutas: `/api/v1`.

Implementación ASP.NET Core 10, Dapper y Microsoft.Data.SqlClient. App Service Windows `snier-permisos-api`, grupo `GrupoSnier`, región Mexico Central, plan gratuito existente `PlanDesarrolloF1`. HTTPS obligatorio y TLS mínimo 1.2.

Se consultó `C:\Users\User\Integracion_front_SENER_JSC.md` y se contrastó con el esquema real de `BDPruebasSNIER` en `servidorsqljavidev.database.windows.net`. Aunque el encabezado del documento dice que la carga no se había ejecutado, las tablas y los datos ya existen.

## Autenticación y permisos

Todas las consultas de datos requieren la cabecera `X-Api-Key`. La clave nunca va en la URL ni en el JavaScript que se descarga al navegador. El proxy de `buscador-juridico.com` debe conservarla como secreto del servidor y llamar a esta API. El navegador no recibe credenciales SQL.

El cliente inicial es `buscador`, autorizado a los cinco alcances y a las 15 claves del catálogo. Su clave está en `.secrets/buscador.key`, archivo local con acceso limitado al usuario de Windows y excluido de Git y del paquete de despliegue. El servidor conserva únicamente su hash SHA-256 en App Settings y lo compara en tiempo constante.

| Alcance | Rutas autorizadas |
|---|---|
| `mapa:read` | `/puntos`, `/estados`, `/municipios` |
| `tablas:read` | `/permisos`, `/sin-ubicacion`, `/asignaciones/municipios`, `/catalogo`, `/health/ready` |
| `detalle:read` | `/detalle` |
| `documentos:read` | `/ligas` |
| `actualizaciones:read` | `/actualizaciones` |

Cada cliente tiene además `Datasets`, una lista explícita de claves de tabla. No hay autorización implícita a otras tablas. Una consulta unificada sólo incluye las tablas autorizadas al cliente; pedir expresamente una tabla ajena devuelve 403. Un cliente deshabilitado o una clave ausente/incorrecta devuelve 401. La API de datos no tiene endpoints administrativos.

CORS permite exclusivamente `https://buscador-juridico.com`, método GET y cabeceras `X-Api-Key`/`Content-Type`. Los preflight OPTIONS de ese origen se atienden sin clave. CORS limita el acceso desde navegadores; los clientes de servidor se autentican con su clave. Las respuestas autenticadas llevan `Cache-Control: no-store`. Hay un límite de 600 solicitudes/minuto por cliente; al excederlo se devuelve 429 con `Retry-After`.

Ejemplo de consumo desde PowerShell:

```powershell
$base = 'https://snier-permisos-api.azurewebsites.net/api/v1'
$headers = @{ 'X-Api-Key' = (Get-Content -Raw 'services/permisos-api/.secrets/buscador.key').Trim() }
Invoke-RestMethod "$base/permisos?autoridad=SENER&pageSize=25" -Headers $headers
```

## Catálogo de claves

| `tabla` | Tabla base | Autoridad |
|---|---|---|
| electricidad | dbo.Electricidad_autorizado | CNE |
| petroliferos | dbo.Expendios_autorizado | CNE |
| gas-lp | dbo.GasLP_autorizado | CNE |
| gas-natural | dbo.GasNatural_autorizado | CNE |
| transporte | dbo.Transporte_autorizado | CNE |
| comercializacion | dbo.Comercializacion_autorizado | CNE |
| infraestructura | dbo.Infraestructura_Hidrocarburos_autorizado | CNE |
| suministro | dbo.Suministro_Electrico_autorizado | CNE |
| terceros | dbo.Terceros_Acreditados_CNE | CNE |
| asignaciones | dbo.Asignaciones_SENER | SENER |
| comercio-exterior | dbo.ComercioExterior_SENER_autorizado | SENER |
| contratos-ee | dbo.Contratos_EE_SENER | SENER |
| pozos | dbo.Pozos_SENER | SENER |
| biocombustibles | dbo.Biocombustibles_SENER_autorizado | SENER |
| ligas | dbo.Ligas_Permisos_CNE, mediante `/ligas` | CNE |

Las relaciones de asignaciones se exponen mediante `/asignaciones/municipios`. Las fechas se leen de `Control_Actualizacion_CNE` y `Control_Actualizacion_SENER`. Se unen los catálogos `Entidades_Federativas` y `Municipios`; este último siempre por el par `EF_ID` + `MPO_ID` contra `MunicipioID`.

Los identificadores SQL salen de un catálogo cerrado y del esquema comprobado incluido en `schema.json`; nunca de un nombre proporcionado por el cliente. No se consultan vistas, respaldos ni tablas históricas con sufijos de fecha.

## Filtros y paginación

Las rutas de inventario y mapa admiten estos filtros opcionales, combinados con AND:

| Parámetro | Valores |
|---|---|
| `tabla` | Clave del catálogo; al omitirla se unen las 14 fuentes principales autorizadas |
| `autoridad` | `CNE` o `SENER` |
| `mercado` | `Petrolíferos`, `Gas natural`, `Gas LP`, `Petróleo crudo`, `Petroquímicos`, `Electricidad`, `Varios`, `Biocombustibles` |
| `estatus` | `Vigente` o `No vigente`; omitido devuelve ambos y los pozos sin vigencia jurídica |
| `ef` | Dos dígitos INEGI, o `--` para Sin entidad |
| `mpo` | Tres dígitos; requiere `ef` de dos dígitos |
| `tipo` | Valor exacto del tipo de permiso, asignación o pozo; en contratos, modalidad |
| `numero` | Identificador original o normalizado cuando existe en la tabla |
| `q` | Fragmento literal de número o razón social, de 2 a 120 caracteres; ignora mayúsculas y acentos |
| `ligero` | Sólo `/puntos`: `true` devuelve la proyección mínima; `false` u omitido conserva la respuesta completa |
| `page` | Entero desde 1; máximo 100000; predeterminado 1 |
| `pageSize` | Entero de 1 a 500; predeterminado 100 |

Un filtro `mercado=Gas natural` también encuentra títulos con `Mercado=Varios` cuya lista `Mercados_autorizados` contiene `Gas natural` como elemento completo separado por `;`.

`q` usa parámetros SQL y escapa `%`, `_`, `[` y el carácter de escape: esos símbolos son texto literal, no comodines introducidos por el cliente. Ejemplo: `/permisos?autoridad=SENER&q=petroleos%20mexicanos`. El conteo total se reutiliza entre páginas durante un máximo de 30 segundos; las filas de cada página se consultan en SQL. La caché está acotada y separada por fuentes autorizadas y filtros.

Los permisos antiguos de expendios y Gas LP mantienen su estatus original en `estatusFuente`. Para el filtro normalizado se consideran vigentes los valores Vigente, Operando, En construcción y Por iniciar operaciones/obras; los demás se agrupan como No vigente, siguiendo el criterio del mapa existente. Las tablas nuevas y SENER conservan el campo Estatus de origen. **Pozos no tiene Estatus de vigencia**: `estatus` es null y `estatusFuente` conserva En producción/Abandono permanente/Taponado. Por eso un filtro jurídico de vigencia excluye los pozos. No se recalculan vencimientos con el reloj de la API.

Cada colección responde:

```json
{"total":2781,"page":1,"pageSize":25,"nextPage":2,"data":[{"tabla":"transporte","numero":"…"}]}
```

`nextPage` es null al terminar. El orden del inventario es estable por tabla, número e identificador. Los ejemplos de abajo son fragmentos de la respuesta; `examples-production.json` contiene respuestas reales completas de la verificación.

## Endpoints y ejemplos

### GET /api/v1/permisos

Lista paginada con los filtros comunes. Incluye permisos con y sin ubicación. `datos` contiene todas las columnas de la tabla base, con nombres camelCase y sin quitar los valores null.

`/api/v1/permisos?tabla=comercio-exterior&estatus=Vigente&mercado=Petrolíferos&pageSize=25`

```json
{"total":1724,"page":1,"pageSize":25,"nextPage":2,"data":[{"tabla":"comercio-exterior","autoridad":"SENER","numero":"…","mercado":"Petrolíferos","estatus":"Vigente","efId":"--","entidad":"Sin entidad","latitud":null,"longitud":null,"fuenteUrl":"https://…","datos":{"fraccionArancelaria":"…","cantidadAutorizada":1,"unidad":"Litros"}}]}
```

El total del ejemplo es ilustrativo cuando se combinan filtros; consultar `total` de la respuesta real.

### GET /api/v1/puntos

Mismos filtros. Sólo registros con latitud de 10 a 36 y longitud de -121 a -82, ambas numéricas y no nulas. Se admiten puntos marinos sin entidad. Nunca se inventan coordenadas ni se convierten null en cero.

`/api/v1/puntos?tabla=pozos&pageSize=25`

```json
{"total":64,"page":1,"pageSize":25,"nextPage":2,"data":[{"tabla":"pozos","autoridad":"SENER","numero":"…","estatus":null,"estatusFuente":"En producción","latitud":19.4,"longitud":-92.2,"coordenadasValidas":true,"datos":{"metodoUbicacion":"…","tipoContractual":"Asignacion","numeroTitulo":"…"}}]}
```

El popup puede mostrar `datos.metodoUbicacion`, como indica el documento de integración.

Para cargar los marcadores rápidamente usar `/api/v1/puntos?tabla=electricidad&pageSize=500&ligero=true`. Cada punto incluye exactamente `tabla`, `numero`, `razonSocial`, `estatus`, `estatusFuente`, `latitud`, `longitud`, `autoridad` y `tipo`; no consulta ni envía `datos` o PDFs. El popup completo se obtiene después mediante `/detalle?tabla=…&numero=…`. En SENER, usar la respuesta completa si el popup necesita `datos.metodoUbicacion`, o pedir el detalle al abrirlo.

### GET /api/v1/estados

Mismos filtros. Conteos por entidad. En asignaciones se usa la tabla hija y se cuenta una asignación distinta por entidad; no se cuenta una vez por cada municipio. Las asignaciones sin relación territorial aparecen en `--` como Sin entidad.

`/api/v1/estados?tabla=asignaciones&estatus=Vigente`

```json
{"total":2,"page":1,"pageSize":100,"nextPage":null,"data":[{"efId":"--","entidad":"Sin entidad","permisos":1},{"efId":"27","entidad":"TABASCO","permisos":10}]}
```

Los conteos anteriores ilustran la forma. En títulos multi-entidad, la suma de entidades puede superar el número de asignaciones únicas; es la semántica del documento de integración.

### GET /api/v1/municipios

Mismos filtros. Conteos por el par entidad/municipio. Las asignaciones se deduplican dentro de cada municipio mediante la tabla hija. Los registros sin municipio permanecen identificados con `mpoId:null`.

`/api/v1/municipios?tabla=asignaciones&estatus=Vigente&ef=27`

```json
{"total":1,"page":1,"pageSize":100,"nextPage":null,"data":[{"efId":"27","entidad":"TABASCO","mpoId":"001","municipio":"…","permisos":10}]}
```

### GET /api/v1/sin-ubicacion

Mismos filtros. Complemento de `/puntos`: coordenadas ausentes o fuera del rango válido. Se conserva la entidad si existe; sólo la entidad desconocida se etiqueta Sin entidad.

`/api/v1/sin-ubicacion?tabla=biocombustibles&pageSize=25`

```json
{"total":41,"page":1,"pageSize":25,"nextPage":2,"data":[{"tabla":"biocombustibles","autoridad":"SENER","numero":"…","efId":"--","entidad":"Sin entidad","latitud":null,"longitud":null,"coordenadasValidas":false,"datos":{"tipoTitulo":"Permiso"}}]}
```

### GET /api/v1/detalle

Requiere `tabla` y `numero`; también acepta filtros comunes. En asignaciones `numero` es NumeroAsignacion; en contratos, NumeroContrato; en pozos, NombrePozo. Devuelve un objeto o 404 si no existe. Los números heredados se presentan sin espacios/tabuladores externos, conservando el texto original dentro de `datos`.

`/api/v1/detalle?tabla=transporte&numero=CNE%2FPL%2F0922%2FTRA%2FOM%2F2026`

```json
{"tabla":"transporte","autoridad":"CNE","numero":"CNE/PL/0922/TRA/OM/2026","numeroNorm":"PL/922/TRA/OM/2026","razonSocial":"…","ligaPermiso":"https://…pdf","ligaResolucion":null,"fuenteUrl":"https://…pdf","datos":{"producto":"Diésel","capacidad":30000,"unidadCapacidad":"litros"}}
```

SENER devuelve `fuenteUrl` de Fuente_URL. CNE busca las ligas de la página en Ligas_Permisos_CNE y conserva null cuando no están publicadas. Los campos date son `yyyy-MM-dd`; `fechaActualizacion` es ISO 8601 UTC con Z. Los códigos INEGI se devuelven sin relleno nchar.

### GET /api/v1/ligas

Admite `numero`, `mercado`, `page`, `pageSize`; `tabla=ligas` y `autoridad=CNE` son opcionales. Busca el número original o su normalización CNE. Expone las cuatro columnas de documentos/resoluciones existentes; no abre ni descarga sus PDF.

`/api/v1/ligas?numero=PL%2F922%2FTRA%2FOM%2F2026`

```json
{"total":1,"page":1,"pageSize":100,"nextPage":null,"data":[{"numeroPermiso":"…","numeroPermisoNorm":"PL/922/TRA/OM/2026","ligaPermiso":"https://…pdf","ligaResolucion":null,"ligasResoluciones":null,"numerosResolucion":null,"fechaActualizacion":"2026-10-21T17:10:43.0000000Z"}]}
```

### GET /api/v1/asignaciones/municipios

Tabla hija paginada. Admite `numero` de asignación, `estatus`, `mercado`, `tipo`, `ef`, `mpo`, `page`, `pageSize`. Sólo SENER/asignaciones.

`/api/v1/asignaciones/municipios?numero=A-0001&pageSize=25`

```json
{"total":1,"page":1,"pageSize":25,"nextPage":null,"data":[{"numeroAsignacion":"A-0001","efId":"27","entidad":"TABASCO","mpoId":"001","municipio":"…","municipioFuente":"…","origenRelacion":"Excel SENER","nota":null,"fuenteUrl":"https://…","fechaCorte":"2026-10-20","fechaActualizacion":"2026-10-22T00:00:00.0000000Z"}]}
```

### GET /api/v1/actualizaciones

Admite `tabla`, `autoridad`, `page`, `pageSize`. Selecciona la carga más reciente por tabla y autoridad, incluyendo FechaCorteFuente y Filas de esa misma fila. Sólo devuelve tablas autorizadas al cliente; sin registro no inventa una fecha. Al consultar todas las fuentes incluye el control de la tabla hija de asignaciones si el cliente tiene acceso a asignaciones.

`/api/v1/actualizaciones?autoridad=SENER`

```json
{"total":1,"page":1,"pageSize":100,"nextPage":null,"data":[{"autoridad":"SENER","tabla":"Asignaciones_SENER","fechaActualizacion":"2026-10-22T00:00:00.0000000Z","fechaCorteFuente":"2026-10-20","filas":409,"fuente":"…"}]}
```

### GET /api/v1/catalogo

Sin parámetros. Devuelve las claves autorizadas al cliente, su tabla física, autoridad y si tienen vigencia jurídica. Es un catálogo pequeño acotado a 15 entradas.

```json
{"tablas":[{"clave":"pozos","tabla":"dbo.Pozos_SENER","autoridad":"SENER","tieneVigencia":false}],"mercados":["Gas natural","Petróleo crudo"],"pageSizeMaximo":500}
```

### Salud y errores

`GET /health/live` devuelve `{"status":"ok"}` sin autenticar y no consulta SQL. `GET /health/ready` requiere `tablas:read` y comprueba la conexión de lectura.

`/actualizaciones` conserva el campo físico `tabla` para compatibilidad y añade `clave`: por ejemplo `{"tabla":"Pozos_SENER","clave":"pozos"}`. La tabla hija usa `asignaciones-municipios`; las ligas usan `ligas`.

400: filtros, tabla o paginación inválidos; se rechazan parámetros repetidos/desconocidos. 401: clave ausente/incorrecta/deshabilitada. 403: alcance o tabla no autorizados. 404: detalle inexistente. 429: límite por cliente. 500: fallo de consulta con mensaje genérico y traceId, sin revelar errores SQL ni credenciales. No hay endpoints de escritura.

## Alta de otro cliente, rotación y revocación

Ejecutar con una cuenta Azure autorizada a editar App Settings:

```powershell
./services/permisos-api/tools/New-ApiClient.ps1 `
  -ClientId mapacne `
  -Scopes 'mapa:read' `
  -Datasets electricidad,petroliferos,gas-lp,gas-natural
```

El script genera una clave aleatoria, publica sólo el hash y la lista de permisos en App Settings, y entrega la clave en `.secrets/mapacne.key`. No imprime la clave. Rechaza clientes existentes para evitar sustituciones accidentales. Para rotar, crear un identificador nuevo, cambiar el secreto del consumidor y deshabilitar el anterior:

```powershell
az webapp config appsettings set --name snier-permisos-api --resource-group GrupoSnier `
  --settings ApiClients__mapacne__Enabled=false --only-show-errors -o none
```

No se necesitan nuevos usuarios SQL por cada consumidor: todos pasan por la autorización de la API y el único usuario técnico de lectura.

El límite de 600 solicitudes/minuto es el valor por omisión. Es configurable para cada cliente con `ApiClients__<cliente>__RequestsPerMinute` (1–10000), o `-RequestsPerMinute` al ejecutar New-ApiClient.ps1. Una clave del proxy representa a todo el sitio, por lo que comparte ese límite. No se elevó automáticamente el del cliente buscador ni se cambió el plan F1.

## Optimización del 22 de octubre

Se pagina sobre identificadores estrechos y después se materializan los campos completos de las filas seleccionadas. Los conteos territoriales se agregan dentro de cada tabla antes de unir las fuentes. El modo ligero omite los joins de catálogos y las consultas de ligas en el recorrido de puntos. Se añadieron cuatro índices administrativos en Electricidad_autorizado, Expendios_autorizado, GasLP_autorizado y Ligas_Permisos_CNE, mediante `sql/20261022-performance-indexes.sql`; el usuario de ejecución mantiene únicamente SELECT. La creación de índices no modificó los datos.

Las mediciones antes/después y la carga completa de generación eléctrica se documentan en `RENDIMIENTO.md`. F1 conserva sus limitaciones de cuota; la base SQL también está en Basic de 5 DTU. No se cambió ningún nivel con coste.

## SQL, credenciales y firewall

Usuario contenido: `api_permisos_lectura`, exclusivamente en BDPruebasSNIER. Tiene SELECT explícito sobre las 20 tablas necesarias y DENY INSERT/UPDATE/DELETE sobre ellas. Carece de permisos CREATE/ALTER de base/esquema y no pertenece a db_owner ni db_datareader. La auditoría efectiva se guardó en `permission-audit.json`: SELECT permitido en las 20 tablas; cero permisos DML/DDL y cero tablas adicionales legibles.

La conexión está en App Settings `ConnectionStrings__ReadOnly`, con cifrado obligatorio, certificado verificado y ApplicationIntent=ReadOnly. La seguridad efectiva procede de los permisos SQL, no de ApplicationIntent. La aplicación publicada sólo ejecuta SELECT parametrizados. La herramienta local `tools/DbAdmin` se usó para crear la identidad y conceder permisos; no forma parte del paquete servido.

IP de salida actuales de esta App Service que deben estar permitidas en el firewall del servidor SQL:

- **68.155.80.161**
- **158.23.105.1**

El servidor ya tiene `AllowAllWindowsAzureIps` (0.0.0.0–0.0.0.0), que permite conexiones desde servicios Azure. Esa regla existente ya hace posible esta conexión; no se modificaron las reglas compartidas con las otras aplicaciones. Permitir las dos IP indicadas basta para la salida actual si posteriormente se retira la regla global, tras revisar las demás aplicaciones.

La app usa la salida compartida del plan; no tiene NAT ni IP de salida dedicada. `azure-resource.json` contiene tanto `outboundIpAddresses` como el conjunto completo `possibleOutboundIpAddresses`. Si cambia la asignación del plan, revisar esa lista antes de restringir el firewall. Consulta reproducible:

```powershell
az webapp show --name snier-permisos-api --resource-group GrupoSnier `
  --query '{actuales:outboundIpAddresses,posibles:possibleOutboundIpAddresses}' -o json
```

## Reproducción y validación

```powershell
dotnet build services/permisos-api/Permisos.Api.csproj -c Release
./services/permisos-api/tests/start-local.ps1 -SettingsPath '<archivo privado de App Settings>'
python services/permisos-api/tests/integration.py http://127.0.0.1:5197 '<clave privada>' services/permisos-api/tests/reference-counts.json '<clave restringida local>'
./services/permisos-api/tools/Deploy.ps1
```

El paquete excluye `.secrets`, herramientas de administración y pruebas. La publicación usa ZIP en modo Run From Package, conserva la configuración en Azure y puede repetirse con Deploy.ps1.

Pruebas locales: **110 comprobaciones HTTP correctas**. Pruebas contra Azure: **107 comprobaciones HTTP correctas**, realizadas el 22 de octubre de 2026. Incluyen las 14 fuentes, la tabla hija, las ligas, los dos controles, conteos SQL de referencia, filtros, paginación, números heredados con tabuladores y CORS. Las tres pruebas adicionales locales comprueban un cliente restringido por tabla y alcance, que nunca se dio de alta en producción. Las respuestas reales están en `examples-production.json`; sus fragmentos legibles se presentan en `EJEMPLOS-REALES.md`.

Esta entrega crea la API separada. La migración del proxy del frontend a esta URL y la retirada de rutas públicas heredadas deben coordinarse con el consumidor; no se alteró DGMESNIE ni su contrato anterior durante este despliegue.
