# Ejemplos reales de producción

Verificados el 22 de octubre de 2026 contra https://snier-permisos-api.azurewebsites.net.

118 comprobaciones HTTP correctas. Se recortan arrays al primer elemento y campos secundarios de `datos` para facilitar la lectura. Los totales y valores son de respuestas reales. El JSON íntegro está en `examples-production.json`.

Todas las consultas de datos requieren `X-Api-Key`; no se guardan claves en estos ejemplos.

## GET /health/ready

```json
{
  "status": "ok"
}
```

## GET /api/v1/catalogo

```json
{
  "tablas": [
    {
      "clave": "electricidad",
      "tabla": "dbo.Electricidad_autorizado",
      "autoridad": "CNE",
      "tieneVigencia": true
    }
  ],
  "mercados": [
    "Petrolíferos",
    "Gas natural",
    "Gas LP",
    "Petróleo crudo",
    "Petroquímicos",
    "Electricidad",
    "Varios",
    "Biocombustibles"
  ],
  "pageSizeMaximo": 500
}
```

## GET /api/v1/permisos?tabla=electricidad&pageSize=2

```json
{
  "total": 2582,
  "page": 1,
  "pageSize": 2,
  "nextPage": 2,
  "data": [
    {
      "tabla": "electricidad",
      "autoridad": "CNE",
      "id": "01/COG/94",
      "numero": "01/COG/94",
      "numeroNorm": "1/COG/94",
      "razonSocial": "Energía de Nuevo León, S.A. de C.V.",
      "mercado": "Electricidad",
      "mercadosAutorizados": null,
      "estatus": "No vigente",
      "estatusFuente": "No vigente",
      "efId": "19",
      "entidad": "NUEVO LEÓN",
      "mpoId": "039",
      "municipio": "Monterrey",
      "latitud": 25.680202,
      "longitud": -100.315258,
      "coordenadasValidas": true,
      "tipo": "Generación",
      "fuente": "CNE · Registro público de permisos",
      "fuenteUrl": "https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=eHh4eHh4eHgteHh4eC00eHh4LTMyMS14eHh4eHh4eHh4eHg=",
      "leyAplicable": null,
      "fechaCorte": null,
      "fechaActualizacion": null,
      "ligaPermiso": "https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=eHh4eHh4eHgteHh4eC00eHh4LTMyMS14eHh4eHh4eHh4eHg=",
      "ligaResolucion": "https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=eHh4eHh4eHgteHh4eC00eHh4LTI0LXh4eHh4eHh4eHh4eA==",
      "datos": {
        "numeroPermiso": "01/COG/94",
        "ubicacion": "Nuevo León",
        "efId": "19",
        "mpoId": "039",
        "direccion": "Av. Churubusco 1000, Industrias del Vidrio, Monterrey, Nuevo León, C. P. 64549",
        "razonSocial": "Energía de Nuevo León, S.A. de C.V.",
        "numeroDeExpediente": null,
        "modalidad": "COG."
      }
    }
  ]
}
```

## GET /api/v1/detalle?tabla=electricidad&numero=01%2FCOG%2F94

```json
{
  "tabla": "electricidad",
  "autoridad": "CNE",
  "id": "01/COG/94",
  "numero": "01/COG/94",
  "numeroNorm": "1/COG/94",
  "razonSocial": "Energía de Nuevo León, S.A. de C.V.",
  "mercado": "Electricidad",
  "mercadosAutorizados": null,
  "estatus": "No vigente",
  "estatusFuente": "No vigente",
  "efId": "19",
  "entidad": "NUEVO LEÓN",
  "mpoId": "039",
  "municipio": "Monterrey",
  "latitud": 25.680202,
  "longitud": -100.315258,
  "coordenadasValidas": true,
  "tipo": "Generación",
  "fuente": "CNE · Registro público de permisos",
  "fuenteUrl": "https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=eHh4eHh4eHgteHh4eC00eHh4LTMyMS14eHh4eHh4eHh4eHg=",
  "leyAplicable": null,
  "fechaCorte": null,
  "fechaActualizacion": null,
  "ligaPermiso": "https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=eHh4eHh4eHgteHh4eC00eHh4LTMyMS14eHh4eHh4eHh4eHg=",
  "ligaResolucion": "https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=eHh4eHh4eHgteHh4eC00eHh4LTI0LXh4eHh4eHh4eHh4eA==",
  "datos": {
    "numeroPermiso": "01/COG/94",
    "ubicacion": "Nuevo León",
    "efId": "19",
    "mpoId": "039",
    "direccion": "Av. Churubusco 1000, Industrias del Vidrio, Monterrey, Nuevo León, C. P. 64549",
    "razonSocial": "Energía de Nuevo León, S.A. de C.V.",
    "numeroDeExpediente": null,
    "modalidad": "COG.",
    "fechaOtorgamiento": "1994-03-10",
    "capacidadAutorizadaMW": 255.0,
    "generacionEstimadaAnual": 1072.0,
    "inversionEstimadaMdls": null,
    "fechaDeEntradaEnOperacion": null,
    "energeticoPrimario": "Gas Natural",
    "actividadEconomica": null,
    "tecnologia": "Ciclo combinado",
    "estatusInstalacion": null,
    "empresaLider": null,
    "paisDeOrigen": null,
    "subasta": null,
    "rfc": "S/D",
    "estatus": "No vigente",
    "fechaRecepcion": null,
    "tipoPermiso": "Generación",
    "inicioOperaciones": null,
    "latitudGEO": 25.680202,
    "longitudGEO": -100.315258,
    "comentarios": "Carga desde registro CNE (Permisos_CNE_v2) 09-oct-2026; coordenadas geocodificadas (Nominatim/OSM, precisión: centroide de municipio/localidad)",
    "tipoPlanta": null,
    "fuenteEnergia": "Convencional",
    "combustibleAutorizado": null,
    "clasificaMenu": "Ciclo combinado",
    "tipoEmpresa": "Privada",
    "inicioVigencia": null
  }
}
```

## GET /api/v1/puntos?tabla=electricidad&pageSize=2

```json
{
  "total": 2192,
  "page": 1,
  "pageSize": 2,
  "nextPage": 2,
  "data": [
    {
      "tabla": "electricidad",
      "autoridad": "CNE",
      "id": "01/COG/94",
      "numero": "01/COG/94",
      "numeroNorm": "1/COG/94",
      "razonSocial": "Energía de Nuevo León, S.A. de C.V.",
      "mercado": "Electricidad",
      "mercadosAutorizados": null,
      "estatus": "No vigente",
      "estatusFuente": "No vigente",
      "efId": "19",
      "entidad": "NUEVO LEÓN",
      "mpoId": "039",
      "municipio": "Monterrey",
      "latitud": 25.680202,
      "longitud": -100.315258,
      "coordenadasValidas": true,
      "tipo": "Generación",
      "fuente": "CNE · Registro público de permisos",
      "fuenteUrl": "https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=eHh4eHh4eHgteHh4eC00eHh4LTMyMS14eHh4eHh4eHh4eHg=",
      "leyAplicable": null,
      "fechaCorte": null,
      "fechaActualizacion": null,
      "ligaPermiso": "https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=eHh4eHh4eHgteHh4eC00eHh4LTMyMS14eHh4eHh4eHh4eHg=",
      "ligaResolucion": "https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=eHh4eHh4eHgteHh4eC00eHh4LTI0LXh4eHh4eHh4eHh4eA==",
      "datos": {
        "numeroPermiso": "01/COG/94",
        "ubicacion": "Nuevo León",
        "efId": "19",
        "mpoId": "039",
        "direccion": "Av. Churubusco 1000, Industrias del Vidrio, Monterrey, Nuevo León, C. P. 64549",
        "razonSocial": "Energía de Nuevo León, S.A. de C.V.",
        "numeroDeExpediente": null,
        "modalidad": "COG."
      }
    }
  ]
}
```

## GET /api/v1/sin-ubicacion?tabla=electricidad&pageSize=1

```json
{
  "total": 390,
  "page": 1,
  "pageSize": 1,
  "nextPage": 2,
  "data": [
    {
      "tabla": "electricidad",
      "autoridad": "CNE",
      "id": "02/AUT/94",
      "numero": "02/AUT/94",
      "numeroNorm": "2/AUT/94",
      "razonSocial": "Departamento del Distrito Federal",
      "mercado": "Electricidad",
      "mercadosAutorizados": null,
      "estatus": "No vigente",
      "estatusFuente": "No vigente",
      "efId": "15",
      "entidad": "MÉXICO",
      "mpoId": null,
      "municipio": null,
      "latitud": null,
      "longitud": null,
      "coordenadasValidas": false,
      "tipo": "Generación",
      "fuente": "CNE · Registro público de permisos",
      "fuenteUrl": "https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=eHh4eHh4eHgteHh4eC00eHh4LTMyMi14eHh4eHh4eHh4eHg=",
      "leyAplicable": null,
      "fechaCorte": null,
      "fechaActualizacion": null,
      "ligaPermiso": "https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=eHh4eHh4eHgteHh4eC00eHh4LTMyMi14eHh4eHh4eHh4eHg=",
      "ligaResolucion": "https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=eHh4eHh4eHgteHh4eC00eHh4LTEyLXh4eHh4eHh4eHh4eA==",
      "datos": {
        "numeroPermiso": "02/AUT/94",
        "ubicacion": "Estado de México",
        "efId": "15",
        "mpoId": null,
        "direccion": "Acueducto Lerma, Ramal Norte, Huixquilucan, Estado de México",
        "razonSocial": "Departamento del Distrito Federal",
        "numeroDeExpediente": null,
        "modalidad": "AUT."
      }
    }
  ]
}
```

## GET /api/v1/estados?tabla=electricidad

```json
{
  "total": 33,
  "page": 1,
  "pageSize": 100,
  "nextPage": null,
  "data": [
    {
      "efId": "--",
      "entidad": "Sin entidad",
      "permisos": 230
    }
  ]
}
```

## GET /api/v1/asignaciones/municipios?pageSize=1

```json
{
  "total": 814,
  "page": 1,
  "pageSize": 1,
  "nextPage": 2,
  "data": [
    {
      "id": 80,
      "numeroAsignacion": "A-0002",
      "efId": "30",
      "entidad": "VERACRUZ DE IGNACIO DE LA LLAVE",
      "mpoId": "124",
      "municipio": "Papantla",
      "municipioFuente": "Papantla",
      "origenRelacion": "Excel SENER + datos.gob.mx",
      "nota": null,
      "fuenteUrl": "https://asignaciones.energia.gob.mx/_doc/Excel/Asignaciones.xlsx",
      "fechaCorte": "2026-10-22",
      "fechaActualizacion": "2026-10-23T03:42:20.0000000Z"
    }
  ]
}
```

## GET /api/v1/municipios?tabla=asignaciones&ef=30

```json
{
  "total": 92,
  "page": 1,
  "pageSize": 100,
  "nextPage": null,
  "data": [
    {
      "efId": "30",
      "entidad": "VERACRUZ DE IGNACIO DE LA LLAVE",
      "mpoId": "003",
      "municipio": "Acayucan",
      "permisos": 2
    }
  ]
}
```

## GET /api/v1/ligas?pageSize=1

```json
{
  "total": 29975,
  "page": 1,
  "pageSize": 1,
  "nextPage": 2,
  "data": [
    {
      "id": 89900,
      "numeroPermiso": "01/COG/94",
      "numeroPermisoNorm": "1/COG/94",
      "mercado": "Electricidad",
      "ligaPermiso": "https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=eHh4eHh4eHgteHh4eC00eHh4LTMyMS14eHh4eHh4eHh4eHg=",
      "ligaResolucion": "https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=eHh4eHh4eHgteHh4eC00eHh4LTI0LXh4eHh4eHh4eHh4eA==",
      "ligasResoluciones": "https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=eHh4eHh4eHgteHh4eC00eHh4LTI0LXh4eHh4eHh4eHh4eA==;https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=eHh4eHh4eHgteHh4eC00eHh4LTY1LXh4eHh4eHh4eHh4eA==;https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=eHh4eHh4eHgteHh4eC00eHh4LTEyMTEteHh4eHh4eHh4eHh4;https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=eHh4eHh4eHgteHh4eC00eHh4LTEzNjYteHh4eHh4eHh4eHh4;https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=eHh4eHh4eHgteHh4eC00eHh4LTE3MjgteHh4eHh4eHh4eHh4",
      "numerosResolucion": "RES/003/1994;RES/007/1996;RES/144/1997;RES/170/1998;RES/232/1998",
      "fechaActualizacion": "2026-10-15T05:39:56.0000000Z"
    }
  ]
}
```

## GET /api/v1/actualizaciones

```json
{
  "total": 15,
  "page": 1,
  "pageSize": 100,
  "nextPage": null,
  "data": [
    {
      "autoridad": "CNE",
      "tabla": "Comercializacion_autorizado",
      "fechaActualizacion": "2026-10-22T01:07:05.0000000Z",
      "fechaCorteFuente": "2026-10-21",
      "filas": 937,
      "fuente": "Registro CNE 21-oct-2026 (revisión diaria tablas nuevas)",
      "clave": "comercializacion"
    }
  ]
}
```
