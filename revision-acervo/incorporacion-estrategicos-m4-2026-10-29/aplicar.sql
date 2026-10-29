BEGIN;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM leyes WHERE id='9fcd022a-e3ba-5c86-ba92-867526353891' OR siglas='CONV-ESTRATEGICOS-M4') THEN RAISE EXCEPTION 'Instrumento ya cargado'; END IF; END $$;
INSERT INTO leyes (id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,tipo,url_original,temas_clave) VALUES ('9fcd022a-e3ba-5c86-ba92-867526353891','Acuerdo por el que se emite la cuarta modificación a la Convocatoria para la atención de proyectos estratégicos de generación y almacenamiento de energía eléctrica, alineados a la planeación vinculante.','CONV-ESTRATEGICOS-M4','2026-10-29',NULL,NULL,'acuerdo','https://dof.gob.mx/nota_detalle.php?codigo=5802463&fecha=29/10/2026',ARRAY['Planeación vinculante','Proyectos estratégicos','Almacenamiento de energía eléctrica','SAEE','Modificación de convocatoria']);
INSERT INTO articulos (id,ley_id,identificador,contenido,orden,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre) VALUES ('2857a720-7490-5d63-bd54-588ddabccc41','9fcd022a-e3ba-5c86-ba92-867526353891','Nota editorial · versiones relacionadas','<p><strong>Nota editorial · versiones relacionadas</strong></p><p>Este registro reproduce la cuarta modificación publicada el 29 de octubre de 2026. Modifica la fracción II del numeral 3.1 y la etapa 2 del numeral 17.1 de la convocatoria existente; no crea una convocatoria nueva ni reabre el registro de generación.</p><p>El plazo para manifestaciones de interés y solicitudes de estudios de conexión de SAEE se amplía hasta el 1 de marzo de 2027. Las fechas de las actuaciones pueden corresponder a 2027. Entra en vigor el día de su publicación.</p><ul><li><a href="/#ley-24110e92-4d4c-5434-b02a-6a1794ee65ff">Texto original · 15/05/2026</a></li><li><a href="/#ley-373ce6df-4e78-59d9-aae5-54007a446c59">Modificación 1 · 26/05/2026</a></li><li><a href="/#ley-29886758-c194-5db4-86eb-8c96347f7aba">Modificación 2 · 10/07/2026</a></li><li><a href="/#ley-372339cc-7ed9-5e5c-8023-647e1a12c3b6">Modificación 3 · 02/09/2026</a></li><li><a href="/#ley-9fcd022a-e3ba-5c86-ba92-867526353891">Modificación 4 · 29/10/2026</a></li></ul><p>Esta nota es información editorial del buscador y no forma parte de la publicación oficial. No es un texto consolidado.</p>','0','complementario','Versiones relacionadas','Nota editorial',NULL);
INSERT INTO articulos (id,ley_id,identificador,contenido,orden,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre) VALUES ('7b6f2c34-d704-5cda-9f43-a2c5ff84db6b','9fcd022a-e3ba-5c86-ba92-867526353891','Preámbulo y considerandos','<h1> ACUERDO por el que se emite la cuarta modificación a la Convocatoria para la atención de proyectos estratégicos de generación y almacenamiento de energía eléctrica, alineados a la planeación vinculante.</h1>
<h2> Al margen un sello con el Escudo Nacional, que dice: Estados Unidos Mexicanos.- Secretaría de Energía.</h2>
<div> LUZ ELENA GONZÁLEZ ESCOBAR, Secretaria de Energía, con fundamento en lo dispuesto por los artículos 28, párrafo noveno, 90, párrafo primero de la Constitución Política de los Estados Unidos Mexicanos; 2o., fracción I, 14, párrafo primero, 26, fracción IX y 33, fracciones I, IV, V, XXIX y XXXI de la Ley Orgánica de la Administración Pública Federal; 4 de la Ley Federal de Procedimiento Administrativo; 2, 10, fracciones I, VI y XIV, 12, 16, 36 y 38 de la Ley del Sector Eléctrico; 2, fracción III de la Ley de Planeación y Transición Energética, y 2, fracción XXV, 3, 13 y 28 del Reglamento de la Ley del Sector Eléctrico, y</div>
<div> CONSIDERANDO<br/> </div>
<div> Que el 15 de mayo de 2026 se publicó en el Diario Oficial de la Federación la Convocatoria para la Atención de Proyectos Estratégicos de Generación y Almacenamiento de Energía Eléctrica, alineados  a la planeación vinculante, dirigida a las personas interesadas en desarrollar proyectos estratégicos de generación y almacenamiento de energía eléctrica alineados a la planeación vinculante del sector eléctrico, la cual fue modificada mediante Acuerdos publicados en el Diario Oficial de la Federación el 26 de mayo de 2026, el 10 de julio de 2026 y el 2 de septiembre de 2026.</div>
<div> Que la citada Convocatoria establece el mecanismo para la atención prioritaria de las solicitudes de obtención de permisos, estudios de interconexión y conexión y, en su caso, la celebración de los contratos correspondientes, a fin de articular el desarrollo de proyectos estratégicos de generación de energía eléctrica renovable y de sistemas de almacenamiento de energía eléctrica que se ejecuten bajo esquemas con la Comisión Federal de Electricidad, necesarios para fortalecer la confiabilidad, continuidad, eficiencia, seguridad y sostenibilidad del Sistema Eléctrico Nacional.</div>
<div> Que en el marco de los procedimientos para la atención de proyectos estratégicos de generación eléctrica, y con el propósito de incentivar una mayor concurrencia de propuestas viables, fortalecer el análisis técnico coordinado por parte de las autoridades del sector energético, optimizar los costos de los particulares y garantizar la eficiencia administrativa, resulta necesario ampliar el plazo para el registro de manifestaciones de interés relativas a los Sistemas de Almacenamiento de Energía Eléctrica y solicitudes de estudios  de conexión, por lo que he tenido a bien emitir el siguiente:</div>','1','preambulo','Cuarta modificación a la convocatoria de proyectos estratégicos','Preámbulo y considerandos',NULL);
INSERT INTO articulos (id,ley_id,identificador,contenido,orden,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre) VALUES ('3af2e416-7d3b-58c1-a540-aeb339b87f84','9fcd022a-e3ba-5c86-ba92-867526353891','Acuerdo ÚNICO','<div> ACUERDO POR EL QUE SE EMITE LA CUARTA MODIFICACIÓN A LA CONVOCATORIA PARA  LA ATENCIÓN DE<br/> PROYECTOS ESTRATÉGICOS DE GENERACIÓN Y ALMACENAMIENTO  DE ENERGÍA ELÉCTRICA, ALINEADOS A<br/> LA PLANEACIÓN VINCULANTE<br/> </div>
<div> ÚNICO. Se modifica la fracción II del numeral 3.1.y la etapa 2 del numeral 17.1. de la Convocatoria para la Atención de Proyectos Estratégicos de Generación y Almacenamiento de Energía Eléctrica, alineados a la planeación vinculante, para quedar como sigue:</div>
<div> "3.1. ...</div>
<div> II. Las fechas previstas en la Convocatoria de Proyectos Estratégicos deben entenderse comprendidas dentro de su año de publicación y del 2027, según corresponda. Asimismo, los días deben ser considerados como hábiles en términos de lo previsto en el artículo 28 de la Ley Federal de Procedimiento Administrativo, salvo que se indique expresamente que son naturales;</div>
<div> ...</div>
<div> 17.1. ...</div>
<div> ...</div>
<table><thead><tr> <th scope="col"> <div> No. de<br/> Etapa<br/> </div> </th> <th scope="col"> <div> Alcance<br/> </div> </th> <th scope="col"> <div> Fechas/plazos (días hábiles)<br/> </div> </th> <th scope="col"> <div> Descripción de la actividad<br/> </div> </th> </tr></thead><tbody><tr> <td> <div> 2<br/> </div> </td> <td> <div> ...</div> </td> <td> <div> Generación de energía eléctrica: ...</div> <div> Sistemas de Almacenamiento de Energía Eléctrica: 2 de junio de 2026 al 1 de marzo de 2027.</div> </td> <td> <div> ...</div> </td> </tr></tbody></table>
<div> ..."</div>','2','ordinario','Cuarta modificación a la convocatoria de proyectos estratégicos','Acuerdo ÚNICO',NULL);
INSERT INTO articulos (id,ley_id,identificador,contenido,orden,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre) VALUES ('d3b880ef-44f6-5438-9c48-e258c4c3935b','9fcd022a-e3ba-5c86-ba92-867526353891','Transitorio ÚNICO','<div> TRANSITORIOS<br/> </div>
<div> ÚNICO. El presente Acuerdo entra en vigor el mismo día de su publicación en el Diario Oficial  de la Federación.</div>
<div> Ciudad de México, a 26 de octubre de 2026.- La Secretaria de Energía, Luz Elena González Escobar.- Rúbrica.</div>','3','transitorio','Cuarta modificación a la convocatoria de proyectos estratégicos','Transitorio ÚNICO',NULL);
UPDATE articulos SET contenido=replace(contenido,chr(13),'') WHERE ley_id='9fcd022a-e3ba-5c86-ba92-867526353891';
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM articulos WHERE id='0dd37bbb-fac0-5863-818d-2e7ecd4d6451' AND md5(contenido)='d84d5549537c4a7f29b7a6f5b2445372') THEN RAISE EXCEPTION 'Nota editorial cambio desde cotejo'; END IF; END $$;
UPDATE articulos SET contenido=replace('### Nota editorial · versión publicada y documentos relacionados

Este registro reproduce la publicación del DOF de 15/05/2026. Se conserva el texto de esa publicación; las modificaciones se consultan en registros separados. No es un texto consolidado ni una indicación de que todos sus plazos permanezcan abiertos.

Documentos de la misma convocatoria incorporados al acervo:

- <a href="/#ley-24110e92-4d4c-5434-b02a-6a1794ee65ff" target="_blank" rel="noopener noreferrer">Texto original · 15/05/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5787666)
- <a href="/#ley-373ce6df-4e78-59d9-aae5-54007a446c59" target="_blank" rel="noopener noreferrer">Modificación 1 · 26/05/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5788508)
- <a href="/#ley-29886758-c194-5db4-86eb-8c96347f7aba" target="_blank" rel="noopener noreferrer">Modificación 2 · 10/07/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5793261)
- <a href="/#ley-372339cc-7ed9-5e5c-8023-647e1a12c3b6" target="_blank" rel="noopener noreferrer">Modificación 3 · 02/09/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5797703)

La publicación original contiene dos bloques numerados 17.4, también visibles en las páginas 33 y 35 del PDF oficial. Se distinguen como primer bloque y segundo bloque, conservando la numeración de la fuente.

El formato de manifestación de interés se menciona mediante una liga a la VUPE. Se conserva esa referencia tal como se publicó; no se ha incorporado un formulario externo que no aparezca en la publicación.

Esta nota es información editorial del buscador y no forma parte de la publicación oficial. Referencias del radar con corte al 14 de septiembre de 2026, cotejadas para esta incorporación.

<p>Actualización editorial al 29/10/2026: <a href="/#ley-9fcd022a-e3ba-5c86-ba92-867526353891">Modificación 4 · 29/10/2026</a>. Amplía el registro de SAEE hasta el 1 de marzo de 2027; no reabre el registro de generación. <a href="https://dof.gob.mx/nota_detalle.php?codigo=5802463&fecha=29/10/2026">Fuente oficial</a>.</p>',chr(13),'') WHERE id='0dd37bbb-fac0-5863-818d-2e7ecd4d6451';
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM articulos WHERE id='2d20afe0-6f04-545b-bf6f-9251561c578b' AND md5(contenido)='b2be8c258336fba7714d664b5303b649') THEN RAISE EXCEPTION 'Nota editorial cambio desde cotejo'; END IF; END $$;
UPDATE articulos SET contenido=replace('### Nota editorial · versión publicada y documentos relacionados

Este registro reproduce la publicación del DOF de 26/05/2026. Se conserva el texto de esa publicación; las modificaciones se consultan en registros separados. No es un texto consolidado ni una indicación de que todos sus plazos permanezcan abiertos.

Documentos de la misma convocatoria incorporados al acervo:

- <a href="/#ley-24110e92-4d4c-5434-b02a-6a1794ee65ff" target="_blank" rel="noopener noreferrer">Texto original · 15/05/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5787666)
- <a href="/#ley-373ce6df-4e78-59d9-aae5-54007a446c59" target="_blank" rel="noopener noreferrer">Modificación 1 · 26/05/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5788508)
- <a href="/#ley-29886758-c194-5db4-86eb-8c96347f7aba" target="_blank" rel="noopener noreferrer">Modificación 2 · 10/07/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5793261)
- <a href="/#ley-372339cc-7ed9-5e5c-8023-647e1a12c3b6" target="_blank" rel="noopener noreferrer">Modificación 3 · 02/09/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5797703)

Esta nota es información editorial del buscador y no forma parte de la publicación oficial. Referencias del radar con corte al 14 de septiembre de 2026, cotejadas para esta incorporación.

<p>Actualización editorial al 29/10/2026: <a href="/#ley-9fcd022a-e3ba-5c86-ba92-867526353891">Modificación 4 · 29/10/2026</a>. Amplía el registro de SAEE hasta el 1 de marzo de 2027; no reabre el registro de generación. <a href="https://dof.gob.mx/nota_detalle.php?codigo=5802463&fecha=29/10/2026">Fuente oficial</a>.</p>',chr(13),'') WHERE id='2d20afe0-6f04-545b-bf6f-9251561c578b';
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM articulos WHERE id='22635122-f6db-5ea6-9241-e0e09c228814' AND md5(contenido)='891041d1f05d184dd20ffc40da3954e7') THEN RAISE EXCEPTION 'Nota editorial cambio desde cotejo'; END IF; END $$;
UPDATE articulos SET contenido=replace('### Nota editorial · versión publicada y documentos relacionados

Este registro reproduce la publicación del DOF de 10/07/2026. Se conserva el texto de esa publicación; las modificaciones se consultan en registros separados. No es un texto consolidado ni una indicación de que todos sus plazos permanezcan abiertos.

Documentos de la misma convocatoria incorporados al acervo:

- <a href="/#ley-24110e92-4d4c-5434-b02a-6a1794ee65ff" target="_blank" rel="noopener noreferrer">Texto original · 15/05/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5787666)
- <a href="/#ley-373ce6df-4e78-59d9-aae5-54007a446c59" target="_blank" rel="noopener noreferrer">Modificación 1 · 26/05/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5788508)
- <a href="/#ley-29886758-c194-5db4-86eb-8c96347f7aba" target="_blank" rel="noopener noreferrer">Modificación 2 · 10/07/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5793261)
- <a href="/#ley-372339cc-7ed9-5e5c-8023-647e1a12c3b6" target="_blank" rel="noopener noreferrer">Modificación 3 · 02/09/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5797703)

Esta nota es información editorial del buscador y no forma parte de la publicación oficial. Referencias del radar con corte al 14 de septiembre de 2026, cotejadas para esta incorporación.

<p>Actualización editorial al 29/10/2026: <a href="/#ley-9fcd022a-e3ba-5c86-ba92-867526353891">Modificación 4 · 29/10/2026</a>. Amplía el registro de SAEE hasta el 1 de marzo de 2027; no reabre el registro de generación. <a href="https://dof.gob.mx/nota_detalle.php?codigo=5802463&fecha=29/10/2026">Fuente oficial</a>.</p>',chr(13),'') WHERE id='22635122-f6db-5ea6-9241-e0e09c228814';
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM articulos WHERE id='48ecb9f4-d1cc-59eb-a074-36b02a68f326' AND md5(contenido)='1a3583efa38e6da84a26c41e91d5725b') THEN RAISE EXCEPTION 'Nota editorial cambio desde cotejo'; END IF; END $$;
UPDATE articulos SET contenido=replace('### Nota editorial · versión publicada y documentos relacionados

Este registro reproduce la publicación del DOF de 02/09/2026. Se conserva el texto de esa publicación; las modificaciones se consultan en registros separados. No es un texto consolidado ni una indicación de que todos sus plazos permanezcan abiertos.

Documentos de la misma convocatoria incorporados al acervo:

- <a href="/#ley-24110e92-4d4c-5434-b02a-6a1794ee65ff" target="_blank" rel="noopener noreferrer">Texto original · 15/05/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5787666)
- <a href="/#ley-373ce6df-4e78-59d9-aae5-54007a446c59" target="_blank" rel="noopener noreferrer">Modificación 1 · 26/05/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5788508)
- <a href="/#ley-29886758-c194-5db4-86eb-8c96347f7aba" target="_blank" rel="noopener noreferrer">Modificación 2 · 10/07/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5793261)
- <a href="/#ley-372339cc-7ed9-5e5c-8023-647e1a12c3b6" target="_blank" rel="noopener noreferrer">Modificación 3 · 02/09/2026</a> · [fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5797703)

Esta nota es información editorial del buscador y no forma parte de la publicación oficial. Referencias del radar con corte al 14 de septiembre de 2026, cotejadas para esta incorporación.

<p>Actualización editorial al 29/10/2026: <a href="/#ley-9fcd022a-e3ba-5c86-ba92-867526353891">Modificación 4 · 29/10/2026</a>. Amplía el registro de SAEE hasta el 1 de marzo de 2027; no reabre el registro de generación. <a href="https://dof.gob.mx/nota_detalle.php?codigo=5802463&fecha=29/10/2026">Fuente oficial</a>.</p>',chr(13),'') WHERE id='48ecb9f4-d1cc-59eb-a074-36b02a68f326';
COMMIT;
