BEGIN;
DO $repair$
DECLARE n integer;
BEGIN
  UPDATE public.articulos SET contenido = $text$<div>ACUERDO por el que se adiciona un conjunto de Indicadores clave en materia del Sector Energético al Catálogo Nacional de Indicadores.</div>
<div>Al margen un sello con el Escudo Nacional, que dice: Estados Unidos Mexicanos.- Instituto Nacional de Estadística y Geografía.- Junta de Gobierno.</div>
<div>Con fundamento en lo dispuesto en los artículos 26 apartado B de la Constitución Política de los Estados Unidos Mexicanos; 26, 27, 28, 33 fracción II, 56 y 77 fracción VII de la Ley del Sistema Nacional de Información Estadística y Geográfica; 5 fracción VII del Reglamento Interior del Instituto Nacional de Estadística y Geografía, y 18 de las Reglas para la integración, difusión y administración del Catálogo Nacional de Indicadores, y</div>
<div>CONSIDERANDO</div>
<div>Que la Ley del Sistema Nacional de Información Estadística y Geográfica (Ley del Sistema) establece que la Junta de Gobierno del Instituto Nacional de Estadística y Geografía (INEGI), debe aprobar los indicadores generados por los Subsistemas Nacionales de Información.</div>
<div>Que de conformidad con el último párrafo del artículo 27 de la Ley del Sistema, el Subsistema Nacional de Información Geográfica y del Medio Ambiente (ahora Subsistema Nacional de Información Geográfica y del Medio Ambiente, Ordenamiento Territorial y Urbano), deberá generar como mínimo indicadores sobre los siguientes temas: atmósfera, agua, suelo, flora, fauna, residuos peligrosos y residuos sólidos.</div>
<div>Que en términos de lo dispuesto por el artículo 28 de la Ley del Sistema, el Instituto elaborará, con la colaboración de las Unidades del Estado, los indicadores a partir de la información básica proveniente de:</div>
<ol type="I"><li>El Sistema Nacional de Información Ambiental y de Recursos Naturales;</li><li>Un sistema integrado de inventarios y encuestas sobre recursos naturales y medio ambiente, y</li><li>Los registros administrativos que permitan obtener Información en la materia.</li></ol>
<div>Que el INEGI, como organismo público responsable de normar y coordinar el Sistema Nacional de Información Estadística y Geográfica (SNIEG), tiene como uno de sus objetivos realizar las acciones tendientes a lograr que la Información de Interés Nacional se sujete a los principios de accesibilidad, transparencia, objetividad e independencia a efecto de coadyuvar al desarrollo nacional.</div>
<div>Que de acuerdo con lo dispuesto por el artículo 6 de la Ley del Sistema, la Información de Interés Nacional, producida y difundida por las Unidades del Estado que conforman el SNIEG, será oficial y de uso obligatorio para la Federación, las entidades federativas, los municipios y las demarcaciones territoriales de la Ciudad de México.</div>
<div>Que mediante Acuerdo 6ª/XI/2009, de fecha 24 de agosto de 2009, la Junta de Gobierno aprobó la creación del Comité Técnico Especializado de Información del Sector Energético (CTE-ISE), que tiene como objetivo coordinar los trabajos de carácter conceptual, metodológico y operativo, para la elaboración y revisión de las normas técnicas, lineamientos, metodologías y demás proyectos y procesos en materia de información del Sector Energético, que permitan generar y actualizar periódicamente la información requerida para diseñar y evaluar políticas públicas encaminadas al fortalecimiento del Sector.</div>
<div>Que el 20 de noviembre de 2014, se publicó en el Diario Oficial de la Federación el Acuerdo por el que se aprobó la inclusión al Catálogo Nacional de Indicadores de un conjunto de Indicadores Clave en materia del Sector Energético, por el cual se aprobaron los primeros ocho indicadores en la materia.</div>
<div>Que el 24 de diciembre de 2014 se publicó en el Diario Oficial de la Federación el Acuerdo por el que se adicionó un conjunto de cinco Indicadores Clave en materia del Sector Energético al Catálogo Nacional de Indicadores.</div>
<div>Que el 13 de diciembre de 2022 se publicó en el Diario Oficial de la Federación el Acuerdo por el que se eliminó un conjunto de cinco Indicadores Clave en materia del Sector Energético al Catálogo Nacional de Indicadores.</div>
<div>Que el 13 de diciembre de 2022 se publicó en el Diario Oficial de la Federación el Acuerdo por el que se adicionó un conjunto de cinco Indicadores Clave en materia del Sector Energético al Catálogo Nacional de Indicadores.</div>
<div>Que el Comité Ejecutivo del Subsistema Nacional de Información Geográfica, Medio Ambiente, Ordenamiento Territorial y Urbano, en su Segunda sesión ordinaria 2023, celebrada el 5 de diciembre de 2023, con base en el análisis del dictamen elaborado por el Comité Técnico Especializado de Información del Sector Energético, mediante el Acuerdo CESNIGMAOTU/2.4/2023, ratificó la pertinencia de incluir el conjunto de indicadores propuesto para ser incluidos en el Catálogo Nacional de Indicadores, los cuales son de gran relevancia al ser una referencia internacional para el monitoreo y evaluación del cumplimiento de las metas comprometidas por México y que forman parte del conjunto nacional de indicadores de los Objetivos de Desarrollo Sostenible.</div>$text$
  WHERE id = '0d632032-ea82-560a-87f8-d34c89e50852' AND ley_id = '6140ced6-da1b-5e8f-9124-9db9a94bb4c5'
    AND encode(sha256(convert_to(contenido, 'UTF8')), 'hex') = 'c2ce446af36ef1ad2e9a02013c9a43b9bb3996cb1dce8d31ffa6e66ed139bff4';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'El fragmento 0d632032-ea82-560a-87f8-d34c89e50852 cambió'; END IF;
  UPDATE public.articulos SET contenido = $text$<div>Por lo anterior, la Junta de Gobierno ha tenido a bien emitir el siguiente:</div>
<div>ACUERDO POR EL QUE SE ADICIONA UN CONJUNTO DE INDICADORES CLAVE EN MATERIA DEL SECTOR ENERGÉTICO AL CATÁLOGO NACIONAL DE INDICADORES</div>
<div>Primero.- Se aprueba la adición al Catálogo Nacional de Indicadores en el marco del Sistema Nacional de Información Estadística y Geográfica, del siguiente conjunto de Indicadores Clave en materia del Sector Energético:</div>
<table><thead><tr><th>No.</th><th>Indicador clave</th></tr></thead><tbody><tr><td>19</td><td>Intensidad energética medida en función de la energía primaria y el PIB.</td></tr><tr><td>20</td><td>Proporción de la energía renovable en el consumo energético total.</td></tr></tbody></table>$text$
  WHERE id = '14c4d1b6-207b-5444-adc3-ef804be67395' AND ley_id = '6140ced6-da1b-5e8f-9124-9db9a94bb4c5'
    AND encode(sha256(convert_to(contenido, 'UTF8')), 'hex') = '9ad922149508b26377a19cfff9c5b7f32610188b0a05dcb90a80ce30c44f5264';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'El fragmento 14c4d1b6-207b-5444-adc3-ef804be67395 cambió'; END IF;
  UPDATE public.articulos SET contenido = $text$<div>Transitorio.</div>
<div>Único.- El presente Acuerdo entrará en vigor al día siguiente de su publicación en el Diario Oficial de la Federación.</div>
<div>El presente Acuerdo, se aprobó en términos del Acuerdo 5ª/IV/2024, en la Quinta sesión 2024 de la Junta de Gobierno del Instituto Nacional de Estadística y Geografía, celebrada el 22 de marzo de 2024.- Presidenta, Graciela Márquez Colín.- Vicepresidentes, Paloma Merodio Gómez, Adrián Franco Barrios, Mauricio Márquez Corona y José Arturo Blancas Espejo.</div>
<div>Aguascalientes, Ags., a 22 de marzo de 2024.- Hace constar lo anterior el Coordinador General de Asuntos Jurídicos, Jorge Ventura Nevares, en ejercicio de la atribución que le confiere lo dispuesto por la fracción IV, del artículo 46 del Reglamento Interior del Instituto Nacional de Estadística y Geografía.- Rúbrica. (R.- 550392)</div>$text$
  WHERE id = 'c1ad6c39-ed03-51b3-9c16-f3a8c92698b2' AND ley_id = '6140ced6-da1b-5e8f-9124-9db9a94bb4c5'
    AND encode(sha256(convert_to(contenido, 'UTF8')), 'hex') = 'b073228a5343cd05e9df033fc026dce9652842118f9509143645aa42fb8b2f10';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'El fragmento c1ad6c39-ed03-51b3-9c16-f3a8c92698b2 cambió'; END IF;
END;
$repair$;
COMMIT;
