BEGIN;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM leyes WHERE id='91760bcd-1cdd-5281-905d-d88d49d8e7d9' OR siglas='RMF2026-ANEXO29-M2') THEN RAISE EXCEPTION 'Instrumento ya cargado'; END IF; END $$;
INSERT INTO leyes (id,titulo,siglas,tipo,fecha_publicacion,fecha_ultima_reforma,vigente,url_original,temas_clave) VALUES ('91760bcd-1cdd-5281-905d-d88d49d8e7d9','Segunda modificación al Anexo 29 de la Resolución Miscelánea Fiscal para 2026','RMF2026-ANEXO29-M2','acuerdo','2026-11-06',NULL,NULL,'https://dof.gob.mx/nota_detalle.php?codigo=5803159&fecha=06/11/2026',ARRAY['SAT','CFDI','L_CNE','Hidrocarburos','Petrolíferos']);
INSERT INTO articulos (id,ley_id,identificador,contenido,orden,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre) VALUES ('230e460d-a5e9-5f5c-a3f8-70cec2eaef2d','91760bcd-1cdd-5281-905d-d88d49d8e7d9','Presentación y contenido','<p> SEGUNDA MODIFICACIÓN AL ANEXO 29 DE LA RESOLUCIÓN MISCELÁNEA FISCAL PARA 2026<br/> </p>
<p> Disposiciones complementarias para los PCCFDI y los CFDI<br/> </p>
<p> ...</p>
<p> Contenido<br/> </p>
<p> I. a II. ...</p>
<p> III.      Especificaciones para la descarga y consulta de la LCO, LRFC y L_CNE.</p>
<p> IV. a V. ...</p>
<p> VI.      Validaciones adicionales al Anexo 20 y complementos de factura electrónica.</p>
<p> VII.     ...</p>
<p> ...</p>',1,'preambulo','Segunda modificación al Anexo 29 de la Resolución Miscelánea Fiscal para 2026','Segunda modificación',NULL);
INSERT INTO articulos (id,ley_id,identificador,contenido,orden,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre) VALUES ('124bd3a7-13d2-576f-9e80-8e45d5cf385e','91760bcd-1cdd-5281-905d-d88d49d8e7d9','III.1 · Listado de Contribuyentes Obligados (LCO)','<p> III.      Especificaciones para la descarga y consulta de la LCO, LRFC y L_CNE.</p>
<p> III.1    Listado de Contribuyentes Obligados (LCO).</p>
<p> ...</p>
<p> A.      ...</p>
<p> B.      Procedimiento.</p>
<p> 1.       ...</p>
<p> 2.       En caso de que los proveedores de certificación presenten alguna incidencia al consumir el servicio WEB de descarga de la LCO, deberán notificarlo inmediatamente al SAT, a través de la mesa de servicio SAT y al correo electrónico que la ACGSTME proporcione directamente a los proveedores.</p>
<p> 3. a 7. ...</p>
<p>          ...</p>
<p> C.      ...</p>
<p> D.      ...</p>',2,'ordinario','Segunda modificación al Anexo 29 de la Resolución Miscelánea Fiscal para 2026','III. Descarga y consulta de listas',NULL);
INSERT INTO articulos (id,ley_id,identificador,contenido,orden,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre) VALUES ('2bfabed7-38d1-5a26-9eaf-7ee74f56ddf7','91760bcd-1cdd-5281-905d-d88d49d8e7d9','III.2 · Lista de contribuyentes inscritos no cancelados (LRFC)','<p> III.2    Lista de contribuyentes inscritos no cancelados en el Registro Federal de Contribuyentes (LRFC).</p>
<p> ...</p>
<p> ...</p>
<p> ...</p>
<p> A.      ...</p>
<p> B.       Procedimiento.</p>
<p> 1.       ...</p>
<p> 2.       En caso de que los proveedores de certificación presenten alguna incidencia al consumir el servicio WEB de descarga de la LRFC, deberán notificarlo inmediatamente al SAT a través de la mesa de servicio SAT y al correo electrónico que la ACGSTME proporcione directamente a los proveedores.</p>
<p> 3. a 7. ...</p>
<p>          ...</p>
<p> C.       ...</p>',3,'ordinario','Segunda modificación al Anexo 29 de la Resolución Miscelánea Fiscal para 2026','III. Descarga y consulta de listas',NULL);
INSERT INTO articulos (id,ley_id,identificador,contenido,orden,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre) VALUES ('40273c3b-2517-5965-bae3-b59622b2506b','91760bcd-1cdd-5281-905d-d88d49d8e7d9','III.3 · Listado de la Comisión Nacional de Energía (L_CNE)','<p> III.3 Listado de la Comisión Nacional de Energía (L_CNE).</p>
<p> El artículo 29-A, fracción V, inciso f) del CFF establece que los CFDI deberán contener el número de permiso vigente concedido por la Comisión Nacional de Energía. Por su parte, el 29 Bis del CFF señala que los CFDI deben cumplir con las especificaciones que en materia de informática determine el SAT; en ese sentido, con la finalidad de que los proveedores de certificación autorizados por el SAT realicen la validación consistente en que la información asociada a los números de permisos otorgados por la autoridad competente al contribuyente, así como las claves de productos que se registran en el "Complemento Concepto para la facturación de Hidrocarburos y Petrolíferos" corresponda con la información que se encuentra en el listado L_CNE del día que se certifica el comprobante, asociado al RFC emisor; en este apartado se da a conocer el procedimiento para la consulta y descarga de la L_CNE, a efecto de que se realice la validación mencionada.</p>
<p> A.      ...</p>
<p> B.      Procedimiento.</p>
<p> 1.       ...</p>
<p> 2.       En caso de que los proveedores de certificación presenten alguna incidencia al consumir el servicio WEB de descarga de la L_CNE, deberán notificarlo inmediatamente al SAT a través de la mesa de servicio SAT y al correo electrónico que la ACGSTME proporcione directamente a los proveedores.</p>
<p> 3.       Descargar el archivo con la L_CNE del día, o bien la lista inmediata anterior cuando la del día en curso no esté publicada.</p>
<p> 4.       Desencriptar el archivo con el CSD que le fue otorgado por el SAT.</p>
<p> 5.       Actualizar los sistemas de validación con el insumo de la L_CNE.</p>
<p> 6.       Resguardar las listas de las descargas realizadas durante el plazo señalado en la regla 2.7.2.8., fracción XXIV.</p>
<p> C.      Integración de la L_CNE y aplicación de validaciones.</p>
<p>          La L_CNE se integra de 3 campos:</p>
<p> 1.       Número de permiso.- En este campo, se ubica el número de permiso otorgado por la autoridad competente asociado a un RFC, se expresa con una cadena alfanumérica de entre 15 y 35 posiciones, corresponde con la nomenclatura del número de permiso conforme al catálogo catHidroYPetro:c_TipoPermiso del "Complemento Concepto para la facturación de Hidrocarburos y Petrolíferos", en caso de que contenga un número de permiso diferente de los contenidos en la L_CNE del día que se certifica el comprobante, no se deberá certificar el CFDI.</p>
<p> 2.       RFC.- En este campo, se ubica la clave del RFC asociado al número de permiso otorgado por la autoridad competente y debe ser igual al RFC del emisor, en caso de que contenga un RFC diferente de los contenidos en la L_CNE del día que se certifica el comprobante, no se deberá certificar el CFDI.</p>
<p> 3.       Clave.- La información en este campo se utiliza para validar que la clave registrada en el atributo Conceptos:Concepto:ClaveProdServ sea igual a la registrada en la L_CNE, la cual debe estar asociada con el número de permiso otorgado por la autoridad competente y el RFC emisor debe ser igual al registrado en la L_CNE, en caso de que contenga un RFC o una clave diferente de los contenidos en la L_CNE del día que se certifica el comprobante, no se deberá certificar el CFDI.</p>
<p>          El contenido de la L_CNE se integrará de la siguiente manera:</p>
<p> NumeroPermiso|RFC|Clave</p>
<p> PL/(N° Consecutivo)/EXP/ES/(Año)|GARS7XXXXXXXX|00000000</p>
<p> PL/(N° Consecutivo)/EXP/ES/(Año)|GARS7XXXXXXXX|00000000</p>
<p> H/(N° Consecutivo)/COM/(Año)|SVF7XXXXXXXX|00000000</p>
<p> H/(N° Consecutivo)/COM/(Año)|SVF7XXXXXXXX|00000000</p>
<p> H/(N° Consecutivo)/COM/(Año)|SVF7XXXXXXXX|00000000</p>
<p> PL/(N° Consecutivo)/DIS/OM/(Año)|MPI0XXXXXXXX|00000000</p>
<p> PL/(N° Consecutivo)/EXP/ES/MM/(Año)|YHTSXXXXXXXX|00000000</p>
<p> PL/(N° Consecutivo)/EXP/ES/MM/(Año)|YHTSXXXXXXXX|00000000</p>
<p> PL/(N° Consecutivo)/EXP/ES/MM/(Año)|YHTSXXXXXXXX|00000000</p>
<p> CNE/PL/(N° Consecutivo)/EXP/ES/(Año)|OHAK7XXXXXXXX|00000000</p>
<p> CNE/PL/(N° Consecutivo)/EXP/ES/(Año)|OHAK7XXXXXXXX|00000000</p>
<p> CNE/H/(N° Consecutivo)/COM/(Año)|XRE77XXXXXXXX|00000000</p>
<p> CNE/H/(N° Consecutivo)/COM/(Año)|XRE77XXXXXXXX|00000000</p>
<p> CNE/H/(N° Consecutivo)/COM/(Año)|XRE77XXXXXXXX|00000000</p>
<p> CNE/PL/(N° Consecutivo)/DIS/OM/(Año)|JIX0XXXXXXXX|00000000</p>
<p> CNE/PL/(N° Consecutivo)/EXP/ES/MM/(Año)|MLPTXXXXXXXX|00000000</p>
<p> CNE/PL/(N° Consecutivo)/EXP/ES/MM/(Año)| MLPTXXXXXXXX|00000000</p>
<p> CNE/PL/(N° Consecutivo)/EXP/ES/MM/(Año)| MLPTXXXXXXXX|00000000</p>
<p> #[a-zA-Z0-9]|SETYXXXXXXXXX|00000000</p>
<p> F00.07.UH/(N°Consecutivo)/(Año)|TUILXXXXXXXX|00000000</p>',4,'ordinario','Segunda modificación al Anexo 29 de la Resolución Miscelánea Fiscal para 2026','III. Descarga y consulta de listas',NULL);
INSERT INTO articulos (id,ley_id,identificador,contenido,orden,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre) VALUES ('b4c6db35-a82b-5ad4-8ac8-3cae7a838d13','91760bcd-1cdd-5281-905d-d88d49d8e7d9','VI.3 · Servicio de cancelación de CFDI','<p> IV. a V. ...</p>
<p> VI.      Validaciones adicionales al Anexo 20 y complementos de factura electrónica.</p>
<p> VI.1    ...</p>
<p> VI.2    ...</p>
<p> VI.3    Servicio de cancelación.</p>
<p> 1.       Códigos de respuesta del servicio de cancelación para los CFDI.</p>
<p>          Se enlistan, en sustitución de los publicados en el Anexo 20, los códigos de respuesta que genera el servicio de cancelación para los CFDI.</p>
<p> Códigos de respuesta del comprobante fiscal digital por Internet<br/> </p>
<table> <tr> <th rowspan="11" scope="rowgroup"> <p> EstatusUUID<br/> </p> </th> <th scope="col"> <p> Descripción del código<br/> </p> </th> <th scope="col"> <p> Código<br/> </p> </th> </tr> <tr> <td> <p> Solicitud de cancelación recibida</p> </td> <td> <p> 201<br/> </p> </td> </tr> <tr> <td> <p> Folio Fiscal Previamente cancelado</p> </td> <td> <p> 202<br/> </p> </td> </tr> <tr> <td> <p> Folio Fiscal No encontrado o no corresponde al emisor</p> </td> <td> <p> 203<br/> </p> </td> </tr> <tr> <td> <p> Folio Fiscal No aplicable a cancelación</p> </td> <td> <p> 204<br/> </p> </td> </tr> <tr> <td> <p> Folio Fiscal No existe</p> </td> <td> <p> 205<br/> </p> </td> </tr> <tr> <td> <p> Folio Fiscal No corresponde a un CFDI del Sector Primario</p> </td> <td> <p> 206<br/> </p> </td> </tr> <tr> <td> <p> Folio Sustitución inválido</p> </td> <td> <p> 207<br/> </p> </td> </tr> <tr> <td> <p> La fecha de solicitud de cancelación es mayor a la fecha de declaración</p> </td> <td> <p> 208<br/> </p> </td> </tr> <tr> <td> <p> La fecha de solicitud de cancelación límite para factura global</p> </td> <td> <p> 209<br/> </p> </td> </tr> <tr> <td> <p> Relación no válida o inexistente</p> </td> <td> <p> 210<br/> </p> </td> </tr> <tr> <th rowspan="12" scope="rowgroup"> <p> EstatusPetición<br/> </p> </th> <th scope="col"> <p> Descripción del código<br/> </p> </th> <th scope="col"> <p> Código<br/> </p> </th> </tr> <tr> <td> <p> Usuario no válido</p> </td> <td> <p> 300<br/> </p> </td> </tr> <tr> <td> <p> XML mal formado</p> </td> <td> <p> 301<br/> </p> </td> </tr> <tr> <td> <p> Sello mal formado</p> </td> <td> <p> 302<br/> </p> </td> </tr> <tr> <td> <p> Certificado revocado o caduco</p> </td> <td> <p> 304<br/> </p> </td> </tr> <tr> <td> <p> Certificado inválido</p> </td> <td> <p> 305<br/> </p> </td> </tr> <tr> <td> <p> Certificado inválido</p> </td> <td> <p> 309<br/> </p> </td> </tr> <tr> <td> <p> CSD inválido</p> </td> <td> <p> 310<br/> </p> </td> </tr> <tr> <td> <p> Clave de motivo de cancelación no válida</p> </td> <td> <p> 311<br/> </p> </td> </tr> <tr> <td> <p> Folio Fiscal no relacionado de acuerdo a la clave de motivo de cancelación </p> </td> <td> <p> 312<br/> </p> </td> </tr> <tr> <td> <p> El folio fiscal no corresponde a una factura global</p> </td> <td> <p> 313<br/> </p> </td> </tr> <tr> <td> <p> El folio fiscal no corresponde a una factura global</p> </td> <td> <p> 314<br/> </p> </td> </tr> </table>
<p> 2.       Códigos de respuesta del servicio de cancelación para el CFDI de retenciones e información de pagos.</p>
<p>          Se enlistan, en sustitución de los publicados en el Anexo 20, los códigos de respuesta que genera el servicio de cancelación para los CFDI de retenciones e información de pagos.</p>
<p> Códigos de respuesta del comprobante fiscal digital por internet, que ampara retención e información de pagos<br/> </p>
<table> <tr> <th rowspan="5" scope="rowgroup"> <p> EstatusUUID<br/> </p> </th> <th scope="col"> <p> Descripción del código<br/> </p> </th> <th scope="col"> <p> Código<br/> </p> </th> </tr> <tr> <td> <p> Solicitud de cancelación recibida</p> </td> <td> <p> 1201<br/> </p> </td> </tr> <tr> <td> <p> Folio Fiscal Previamente cancelado</p> </td> <td> <p> 1202<br/> </p> </td> </tr> <tr> <td> <p> Folio Fiscal no corresponde al emisor</p> </td> <td> <p> 1203<br/> </p> </td> </tr> <tr> <td> <p> Folio Fiscal No existe</p> </td> <td> <p> 1205<br/> </p> </td> </tr> <tr> <th rowspan="16" scope="rowgroup"> <p> EstatusPetición<br/> </p> </th> <th scope="col"> <p> Descripción del código<br/> </p> </th> <th scope="col"> <p> Código<br/> </p> </th> </tr> <tr> <td> <p> Autenticación no válida</p> </td> <td> <p> 1300<br/> </p> </td> </tr> <tr> <td> <p> XML mal formado</p> </td> <td> <p> 1301<br/> </p> </td> </tr> <tr> <td> <p> Estructura de folios no válida</p> </td> <td> <p> 1302<br/> </p> </td> </tr> <tr> <td> <p> Estructura de RFC no válida </p> </td> <td> <p> 1303<br/> </p> </td> </tr> <tr> <td> <p> Estructura de fecha no válida</p> </td> <td> <p> 1304<br/> </p> </td> </tr> <tr> <td> <p> Certificado no corresponde al emisor</p> </td> <td> <p> 1305<br/> </p> </td> </tr> <tr> <td> <p> Certificado no vigente</p> </td> <td> <p> 1306<br/> </p> </td> </tr> <tr> <td> <p> Uso de FIEL no permitido</p> </td> <td> <p> 1307<br/> </p> </td> </tr> <tr> <td> <p> Certificado revocado o caduco</p> </td> <td> <p> 1308<br/> </p> </td> </tr> <tr> <td> <p> Firma mal formada o inválida</p> </td> <td> <p> 1309<br/> </p> </td> </tr> <tr> <td> <p> Clave de motivo de cancelación no válida</p> </td> <td> <p> 1310<br/> </p> </td> </tr> <tr> <td> <p> Folio Fiscal no relacionado de acuerdo a la clave de motivo de cancelación</p> </td> <td> <p> 1311<br/> </p> </td> </tr> <tr> <td> <p> Folio Sustitución no válido</p> </td> <td> <p> 1312<br/> </p> </td> </tr> <tr> <td> <p> Solicitud fuera del plazo de la declaración anual</p> </td> <td> <p> 1313<br/> </p> </td> </tr> <tr> <td> <p> Relación no válida</p> </td> <td> <p> 1314<br/> </p> </td> </tr> </table>
<p> VII.  ...</p>',5,'ordinario','Segunda modificación al Anexo 29 de la Resolución Miscelánea Fiscal para 2026','VI. Validaciones adicionales',NULL);
INSERT INTO articulos (id,ley_id,identificador,contenido,orden,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre) VALUES ('e1384b17-0c08-571a-93db-d8515dcf381e','91760bcd-1cdd-5281-905d-d88d49d8e7d9','Firma de la modificación','<p> Atentamente.</p>
<p> Ciudad de México, a 27 de octubre de 2026.- En suplencia por ausencia del Jefe del Servicio de Administración Tributaria, con fundamento en el artículo 4, primer párrafo del Reglamento Interior del Servicio de Administración Tributaria, firma el Administrador General Jurídico, Lic. Ricardo Carrasco Varona.- Rúbrica.</p>',6,'complementario','Segunda modificación al Anexo 29 de la Resolución Miscelánea Fiscal para 2026','Segunda modificación',NULL);
COMMIT;
