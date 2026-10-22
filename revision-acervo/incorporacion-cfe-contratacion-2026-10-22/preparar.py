import sys,json,hashlib,uuid,html,re,collections
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'.local/lse-sync/python'))
import pymupdf
ROOT=Path(__file__).resolve().parent
PDF=Path(sys.argv[1]);raw=PDF.read_bytes();sha=hashlib.sha256(raw).hexdigest()
assert sha=='b0d0ebd53552a59d1707e6897f5bf013d2f23f73b38a209bb591f2ac6bd7879b'
doc=pymupdf.open(PDF);assert len(doc)==224
URL='https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=22102026-MAT.pdf&repo='
CONFIG=[
 ('CFE-0400-CAAAT-0011-2026',155,396.08,'581504','Modernización del regulador de velocidad de la unidad auxiliar de la C.H. Zimapán','2026-10-19','2026-12-14','11:00','Generación · Zimapán'),
 ('CFE-0001-CASAN-0047-2026',156,58.22,'581550','Servicio de seguridad y vigilancia para las instalaciones de la Coordinación Nuclear','2026-10-20','2026-11-23','14:30','Seguridad y vigilancia · Coordinación Nuclear'),
 ('CFE-0900-CAAAT-0048-2026',156,393.80,'581505','Inversor de corriente para Unidad 6 20LNA de la C.T. Presidente Adolfo López Mateos','2026-10-22','2026-11-23','08:00','Generación · Presidente Adolfo López Mateos'),
 ('CFE-0001-CASAT-0063-2026',157,58.22,'581471','Desmontaje, maniobras y traslado de piezas del motor de la Unidad 5 de la C.C.I. Baja California Sur','2026-10-19','2026-12-16','14:00','Generación · Baja California Sur'),
 ('CFE-0001-CASAT-0064-2026',157,393.74,'581549','Estrategias de apagado seguro post-incendio y actualización del programa de protección contra incendios','2026-10-20','2026-12-14','13:00','Seguridad · Protección contra incendios'),
 ('CFE-0001-CAAAT-0179-2026',158,58.22,'581466','Draga marina','2026-10-19','2026-12-07','13:00','Equipamiento · Draga marina'),
 ('CFE-0700-CASAN-0048-2026',158,390.20,'581448','Mantenimiento a transformadores de potencia de la Unidad 3 de la C.T. Carbón II','2026-10-19','2026-10-29','11:00','Generación · Carbón II'),
 ('CFE-0500-CAAAT-0029-2026',159,58.22,'581475','Posicionadores para válvulas neumáticas y válvulas solenoides de la C.G. Los Azufres','2026-10-22','2026-12-14','12:00','Generación · Los Azufres'),
 ('CFE-0500-CAAAT-0030-2026',159,390.50,'581499','Adquisición e instalación de analizador de hidrógeno para la Unidad 7 de la C.G. Los Azufres','2026-10-22','2026-11-17','12:00','Generación · Los Azufres'),
]
sourceid='dof-cfe-contratacion-20261022-'+sha[:12]
instruments=[];mapped={};audits=[];metas=[]
norm=lambda s:re.sub(r'\s+','',s)
def esc(t):return html.escape(t,quote=False).replace('\n','<br>')
for code,num,y0,ref,obj,micro,fallo,hora,activo in CONFIG:
    page=doc[num-1];alllines=[]
    for bi,b in enumerate(page.get_text('dict')['blocks']):
        for l in b.get('lines',[]):
            txt=''.join(s['text']for s in l['spans']).strip()
            if txt:alllines.append({'text':txt,'bbox':list(l['bbox']),'block':bi})
    last=next(l for l in alllines if '(R.- '+ref+')' in l['text']);y1=last['bbox'][3]+0.1
    lines=[l for l in alllines if l['bbox'][1]>=y0-0.15 and l['bbox'][3]<=y1]
    found=[t for t in page.find_tables().tables if t.bbox[1]>=y0 and t.bbox[3]<=y1]
    assert len(found)==1,(code,'table count',len(found))
    table=found[0];tr=table.extract();rows=[]
    for row in tr:
        values=[]
        for cell in row:
            if cell and cell.strip() and (not values or cell!=values[-1]):values.append(cell.strip())
        if not values:continue
        if len(values)==1 and rows and len(rows[-1])==2:
            rows[-1][0]+='\n'+values[0]
        else:rows.append(values)
    assert all(len(r)in[1,2]for r in rows),code
    tablelines=[l for l in lines if table.bbox[1]-1<=(l['bbox'][1]+l['bbox'][3])/2<=table.bbox[3]+1]
    expected=collections.Counter(norm(''.join(l['text']for l in tablelines)))
    actual=collections.Counter(norm(''.join(''.join(r)for r in rows)))
    assert expected==actual,(code,'table transcription',expected-actual,actual-expected)
    heads=[];body=[]
    for row in rows:
        if len(row)==1:
            assert not body
            heads.append('<tr><th colspan="2">'+esc(row[0])+'</th></tr>')
        else:body.append('<tr><th scope="row">'+esc(row[0])+'</th><td>'+esc(row[1])+'</td></tr>')
    tablehtml='<table>'+('<thead>'+''.join(heads)+'</thead>'if heads else '')+'<tbody>'+''.join(body)+'</tbody></table>'
    parts=[];paragraph=[];previous=None;inserted=False
    def flush():
        if paragraph:parts.append('<p>'+esc('\n'.join(paragraph))+'</p>');paragraph.clear()
    for line in lines:
        if line in tablelines:
            flush()
            if not inserted:parts.append(tablehtml);inserted=True
            continue
        if previous!=line['block']:flush()
        paragraph.append(line['text']);previous=line['block']
    flush();content='\n'.join(parts)
    lid=str(uuid.uuid5(uuid.NAMESPACE_URL,URL+'#'+code));aid=str(uuid.uuid5(uuid.NAMESPACE_URL,URL+'#'+code+'#aviso'))
    ley={'id':lid,'titulo':'Convocatoria de contratación CFE · '+code+' · '+obj,'siglas':code,'fecha_publicacion':'2026-10-22','fecha_ultima_reforma':None,'vigente':None,'temas_clave':['Contratación de CFE','Convocatoria de contratación',activo],'url_original':URL+'#page='+str(num),'tipo':'convocatoria'}
    nota='<p><strong>Nota editorial · Convocatoria de contratación de CFE</strong></p><p>Procedimiento '+code+'. Publicación en el DOF: 22 de octubre de 2026. Publicación en el micrositio de CFE indicada en el aviso: '+micro+'.</p><p>Etapa acreditada al corte del 22 de octubre de 2026: publicación de convocatoria/concurso. El calendario del aviso prevé el fallo para '+fallo+' a las '+hora+'. Son fechas previstas, sujetas al procedimiento; no acreditan un fallo emitido, adjudicación, contrato, ejecución ni entrada en operación. No es una convocatoria de permisos ni una disposición normativa general.</p>'
    if code=='CFE-0001-CAAAT-0179-2026':nota+='<p>El aviso no identifica la central o activo de destino de la draga marina; no se le asigna uno por inferencia.</p>'
    if code=='CFE-0001-CASAN-0047-2026':nota+='<p>Este aviso corresponde a seguridad y vigilancia de instalaciones, no a una obra de generación.</p>'
    articles=[{'id':str(uuid.uuid5(uuid.NAMESPACE_URL,URL+'#'+code+'#nota')),'ley_id':lid,'identificador':'Nota editorial · Convocatoria de contratación CFE','contenido':nota,'tipo_articulo':'complementario','orden':0,'titulo_nombre':'Convocatoria de contratación de CFE','capitulo_nombre':'Identificación y alcance','seccion_nombre':None},
      {'id':aid,'ley_id':lid,'identificador':'Convocatoria · '+code,'contenido':content,'tipo_articulo':'convocatoria','orden':1,'titulo_nombre':'Convocatoria de contratación de CFE','capitulo_nombre':obj,'seccion_nombre':None}]
    mapped[aid]={'sourceId':sourceid,'label':articles[1]['identificador'],'type':'convocatoria','contentSha256':hashlib.sha256(content.encode()).hexdigest(),'pageNumbers':[num],'anchors':[{'page':num,'bbox':l['bbox']}for l in lines]}
    instruments.append({'ley':ley,'articulos':articles})
    audits.append({'procedimiento':code,'pagina':num,'registro_dof':ref,'rango_vertical':[y0,y1],'anclas':len(lines),'filas_tabla':len(rows),'cotejo_caracteres_tabla':True,'texto_fuera_tabla_completo':True})
    metas.append({'id':lid,'procedimiento':code,'categoria':'convocatoria_contratacion_cfe','institucion':'CFE','activo_o_alcance':activo,'fecha_publicacion_dof':'2026-10-22','fecha_micrositio':micro,'etapa_acreditada':'convocatoria_concurso','fecha_fallo_prevista':fallo,'hora_fallo_prevista':hora,'adjudicacion_acreditada':False,'ejecucion_acreditada':False,'fuente':ley['url_original']})
source={'id':sourceid,'title':'DOF · 22 de octubre de 2026 · Convocatorias de contratación de CFE','instrumentIds':[i['ley']['id']for i in instruments],'sha256':sha,'transport':'remote-pdf','pdfUrl':'/api/reader/'+sourceid,'originalUrl':URL,'pageCount':len(doc),'pages':[{'number':p.number+1,'width':p.rect.width,'height':p.rect.height}for p in doc]}
for name,data in [('carga.json',instruments),('map.json',{'source':source,'articles':mapped}),('metadatos-contratacion.json',metas),('cotejo.json',{'fecha':'2026-10-22','pdf_sha256':sha,'pdf_bytes':len(raw),'pdf_paginas':len(doc),'fuente_pdf':URL,'inspeccion_visual':[155,156,157,158,159],'avisos':audits})]:
    (ROOT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def lit(v):return 'NULL'if v is None else "'"+str(v).replace("'","''")+"'"
sql=['BEGIN;']
for ins in instruments:
    l=ins['ley'];sql.append('DO $$ BEGIN IF EXISTS (SELECT 1 FROM leyes WHERE id='+lit(l['id'])+' OR siglas='+lit(l['siglas'])+") THEN RAISE EXCEPTION 'Convocatoria ya cargada'; END IF; END $$;")
    sql.append('INSERT INTO leyes ('+','.join(l)+') VALUES ('+','.join('ARRAY['+','.join(lit(t)for t in v)+']'if isinstance(v,list)else lit(v)for v in l.values())+');')
    for a in ins['articulos']:sql.append('INSERT INTO articulos ('+','.join(a)+') VALUES ('+','.join(lit(v)for v in a.values())+');')
sql.append('COMMIT;');(ROOT/'aplicar.sql').write_text('\n'.join(sql)+'\n',encoding='utf-8')
print(json.dumps({'instrumentos':len(instruments),'fragmentos_oficiales':len(mapped),'notas_editoriales':9,'fuente':sourceid,'sha256':sha}))
