-- Migración administrativa, repetible. No modifica datos ni amplía permisos del usuario de API.
-- Índices estrechos para inventarios heredados y búsqueda paginada de ligas.
SET LOCK_TIMEOUT 10000;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Electricidad_autorizado') AND name=N'IX_PermisosApi_Electricidad_Numero')
 CREATE NONCLUSTERED INDEX IX_PermisosApi_Electricidad_Numero ON dbo.Electricidad_autorizado(NumeroPermiso)
 INCLUDE(EF_ID,MPO_ID,Latitud_GEO,Longitud_GEO,Estatus,Tipo_permiso,[Razón_social]);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Expendios_autorizado') AND name=N'IX_PermisosApi_Expendios_Territorio')
 CREATE NONCLUSTERED INDEX IX_PermisosApi_Expendios_Territorio ON dbo.Expendios_autorizado(EF_ID,MPO_ID)
 INCLUDE(NumeroPermiso,Latitud_GEO,Longitud_GEO,Estatus,Tipo_permiso,[Razón_social]);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.GasLP_autorizado') AND name=N'IX_PermisosApi_GasLP_Territorio')
 CREATE NONCLUSTERED INDEX IX_PermisosApi_GasLP_Territorio ON dbo.GasLP_autorizado(EF_ID,MPO_ID)
 INCLUDE(NumeroPermiso,Latitud_GEO,Longitud_GEO,Estatus,Tipo_permiso,[Razón_social]);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Ligas_Permisos_CNE') AND name=N'IX_PermisosApi_Ligas_Numero')
 CREATE NONCLUSTERED INDEX IX_PermisosApi_Ligas_Numero ON dbo.Ligas_Permisos_CNE(NumeroPermiso)
 INCLUDE(NumeroPermisoNorm,FechaActualizacion,LigaPermiso,LigaResolucionOtorgamiento);
