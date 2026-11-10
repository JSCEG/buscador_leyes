BEGIN;

-- Una ficha de seguimiento dentro de la convocatoria original.
DO $carga$
DECLARE
  convocatoria constant uuid := '2dde9c74-5c23-507b-a0ae-5d3b4722d927';
  ficha constant uuid := '318122de-134d-5cbd-ad24-751d6eed81b0';
  titulo constant text := 'Resultados de la Segunda Convocatoria de generación e interconexión';
  cuerpo constant text := replace($html$<p data-publicacion="resultados">Resultados publicados el <time datetime="2026-11-06">6 de noviembre de 2026</time> en <a href="https://ventanilla.energia.gob.mx/resultados2daConv">Ventanilla Energía</a>.</p>
<p>La CNE recibió 57 solicitudes de permiso. La publicación identifica seis folios aprobados con una capacidad agregada de 649 MW.</p>
<table><caption>Folios aprobados</caption>
<thead><tr><th scope="col">Folio VUPE</th><th scope="col">Folio OPE</th><th scope="col">Gerencia de Control Regional</th><th scope="col">Estatus del permiso</th></tr></thead>
<tbody>
<tr><td>VUPE-C2-0540-2026</td><td>V-104108</td><td>NORESTE</td><td>APROBADO</td></tr>
<tr><td>VUPE-C2-0197-2026</td><td>V-105455</td><td>OCCIDENTE</td><td>APROBADO</td></tr>
<tr><td>VUPE-C2-0419-2026</td><td>V-104634</td><td>ORIENTAL</td><td>APROBADO</td></tr>
<tr><td>VUPE-C2-0211-2026</td><td>V-104629</td><td>ORIENTAL</td><td>APROBADO</td></tr>
<tr><td>VUPE-C2-0139-2026</td><td>V-105275</td><td>OCCIDENTE</td><td>APROBADO</td></tr>
<tr><td>VUPE-C2-0291-2026</td><td>V-105504</td><td>OCCIDENTE</td><td>APROBADO</td></tr>
</tbody></table>
<table><caption>Capacidad por Gerencia de Control Regional</caption>
<thead><tr><th scope="col">Región</th><th scope="col">Folios aprobados</th><th scope="col">Capacidad (MW)</th></tr></thead>
<tbody>
<tr><td>Occidental</td><td>3</td><td>350</td></tr>
<tr><td>Oriental</td><td>2</td><td>289</td></tr>
<tr><td>Noreste</td><td>1</td><td>10</td></tr>
<tr><th scope="row">Total</th><td>6</td><td>649</td></tr>
</tbody></table>
<p>Ventanilla Energía denomina «Occidente» a la región en la lista de folios y «Occidental» en el resumen de capacidad. Los MW corresponden al conjunto de folios de cada región. Los títulos y las notificaciones individuales quedan pendientes de cotejo.</p>$html$, chr(13), '');
BEGIN
  PERFORM 1 FROM public.leyes WHERE id = convocatoria AND siglas = 'CONV-GEN-2' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Falta la convocatoria original'; END IF;
  IF EXISTS (SELECT 1 FROM public.articulos WHERE id = ficha AND ley_id = convocatoria AND identificador = titulo AND contenido = cuerpo) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.articulos WHERE id = ficha OR (ley_id = convocatoria AND (identificador = titulo OR contenido LIKE '%VUPE-C2-0540-2026%'))) THEN
    RAISE EXCEPTION 'Ya existe una ficha de resultados distinta. Cotejar antes de actualizar.';
  END IF;
  INSERT INTO public.articulos (id, ley_id, identificador, contenido, orden, tipo_articulo, titulo_nombre, capitulo_nombre)
  SELECT ficha, convocatoria, titulo, cuerpo, coalesce(max(orden), 0) + 1, 'complementario', 'Seguimiento de la convocatoria', 'Resultados publicados'
  FROM public.articulos WHERE ley_id = convocatoria;
END
$carga$;
COMMIT;
