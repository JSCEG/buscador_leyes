"""Apartados, indicadores completos y mapa de páginas del programa CENACE."""
from pathlib import Path
import json,hashlib,uuid,html
R=Path(__file__).resolve().parent;load=lambda p:json.loads(p.read_text(encoding='utf8'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
b=load(R/'fuentes/bloques.json');source=load(R/'fuente.json');assert len(b)==291
uid=lambda label:str(uuid.uuid5(uuid.NAMESPACE_URL,'buscador-sener/instrumento/PROGRAMA-CENACE/'+label))
lid=uid('ley');aviso='f17cb3b7-0f09-5a97-8c90-47812c921dbd'
esc=html.escape
profiles=[(0,'Portada'),(4,'1. Índice'),(24,'2. Siglas y acrónimos'),(27,'3. Conceptos básicos'),(51,'4. Señalamiento del origen de los recursos del programa'),(58,'5. Fundamento normativo'),(87,'6. Diagnóstico · 6.1.1. Contexto general del sector eléctrico mexicano'),(113,'6.1.2. Identificación del problema público'),(123,'6.1.3. Causas y efectos del problema'),(143,'6.1.4. Orientación del marco normativo vigente y pertinencia institucional'),(148,'6.1.5. Capacidad de control y monitoreo de red'),(155,'6.1.6. Ciberseguridad en sistemas críticos'),(157,'6.1.7. Marco normativo y nuevo entorno de la planeación y del mercado'),(170,'6.1.8. Talento humano y formación especializada'),(173,'6.1.9. Estructura organizacional y procesos'),(179,'6.1.10. Financiamiento institucional y restricciones presupuestales'),(184,'6.2. Visión de Largo Plazo'),(191,'6.3. Misión'),(196,'7. Objetivo'),(199,'7.1. Relevancia del Objetivo'),(240,'7.2. Vinculación de los objetivos del Programa Institucional del CENACE 2026-2030'),(247,'8. Estrategias y líneas de acción'),(250,'Estrategia 1 y sus líneas de acción'),(253,'Estrategia 2 y sus líneas de acción'),(257,'Estrategia 3 y sus líneas de acción'),(260,'Estrategia 4 y sus líneas de acción'),(263,'Estrategia 5 y sus líneas de acción'),(267,'9. Indicadores y metas'),(270,'Indicador 1.1 y sus metas'),(273,'Indicador 1.2 y sus metas'),(279,'Indicador 2.1 y sus metas'),(285,'Indicador 3.1 y sus metas')]
note=f'''<h3>Nota editorial · alcance y lectura del programa</h3><p>Esta nota pertenece al buscador, no al texto oficial. Se incorpora el Programa Institucional del CENACE 2026-2030, documento de 52 páginas vinculado desde el <a href="/#ley-{aviso}">aviso de publicación del 30 de abril de 2026</a>. La fecha de esta ficha corresponde a la publicación del aviso.</p><p>La transcripción omite únicamente encabezados, folios y decoración repetidos. Conserva los apartados, las celdas combinadas, las cinco estrategias y los cuatro indicadores con sus metas. Los errores o inconsistencias del original no se corrigen silenciosamente.</p><p>Los mapas de la página 18 y las gráficas de las páginas 19, 32 y 33 se consultan en la vista PDF original. Se conserva el texto extraíble de sus rótulos; el detalle interno de los mapas y de la gráfica de la página 19 no tiene OCR. Las dos tablas de datos rotulados de las páginas 32 y 33 son ayudas de lectura del buscador, cotejadas visualmente; no agregan valores a la serie TOTAL, que carece de etiquetas numéricas.</p><p>Todos los apartados del texto están vinculados al PDF oficial y a la huella de esta edición. No se certifica vigencia ni se construye un texto consolidado. Revisión: 20 de septiembre de 2026.</p>'''
law=dict(id=lid,titulo='Programa Institucional del Centro Nacional de Control de Energía 2026-2030',siglas='PROGRAMA-CENACE',fecha_publicacion='2026-04-30',fecha_ultima_reforma=None,vigente=None,temas_clave=['Planeación del sector','CENACE','Indicadores y metas'],url_original=source['url'],tipo='programa')
def row(label,content,n,chapter,kind='anexo'):
 return dict(id=uid(label),ley_id=lid,identificador=label,contenido=content,tipo_articulo=kind,titulo_nombre='Programa Institucional CENACE 2026-2030',capitulo_nombre=chapter,seccion_nombre=None,orden=n)
articles=[row('Nota editorial · alcance y lectura',note,0,'Información editorial','complementario')]
maps={};coverage=[];sid='cenace-'+source['sha256'][:12]
for i,(a,label)in enumerate(profiles):
 z=profiles[i+1][0]if i+1<len(profiles)else len(b);bb=b[a:z];parts=[]
 chapter='Indicadores y metas'if a>=267 else'Estrategias y líneas de acción'if a>=247 else'Objetivo y vinculación'if a>=196 else'Diagnóstico y visión'if a>=87 else'Apartados iniciales'
 j=a
 while j<z:
  if j in [210,227]:
   end=224 if j==210 else 239;pn=32 if j==210 else 33
   heading='Generación neta inyectada al SEN, 2018-2025'if j==210 else'Porcentaje de participación de la CFE en la generación neta inyectada al SEN, 2018-2025'
   parts.append('<p><strong>'+heading+'</strong></p><p><em>Ayuda de lectura del buscador: datos rotulados en la gráfica original, página '+str(pn)+'.</em></p>')
   if pn==32:
    values=list(zip(range(2018,2026),['165,301','150,824','121,624','127,961','137,178','145,220','192,800','202,532'],['68,021','68,592','80,275','93,125','91,836','80,363','82,426','86,730']))
    parts.append('<table><thead><tr><th>Año</th><th>CFE (GWh)</th><th>Energía limpia (GWh)</th></tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+str(x)+'</td>'for x in r)+'</tr>'for r in values)+'</tbody></table>')
   else:
    values=list(zip(range(2018,2026),['53.2','47.5','38.9','39.6','41.1','41.9','54.7','57.2']))
    parts.append('<table><thead><tr><th>Año</th><th>CFE + FONADIN (%)</th></tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+str(x)+'</td>'for x in r)+'</tr>'for r in values)+'</tbody></table>')
   parts.append('<details><summary>Rótulos extraídos de la gráfica original, incluida la escala</summary>'+''.join(x['html']for x in b[j:end])+'</details>');j=end;continue
  parts.append(b[j]['html'])
  if j in [131,138]:parts.append('<p><em>Nota de lectura: consulta '+('los mapas'if j==131 else'la gráfica')+' en la página '+str(b[j]['pagina'])+' de la vista PDF original.</em></p>')
  j+=1
 content='<!-- Transcripción revisada del PDF oficial; las ayudas de lectura se identifican expresamente. -->\n'+'\n'.join(parts)
 art=row(label,content,i+1,chapter);articles.append(art)
 pages=sorted({x['pagina']for x in bb});anchors=[]
 for pn in pages:
  bounds=[x['bbox']for x in bb if x['pagina']==pn]
  anchors.append(dict(page=pn,bbox=[max(0,min(c[0]for c in bounds)-2),max(0,min(c[1]for c in bounds)-2),min(612,max(c[2]for c in bounds)+2),min(792,max(c[3]for c in bounds)+2)]))
 maps[art['id']]=dict(sourceId=sid,label=label,contentSha256=hashlib.sha256(content.encode()).hexdigest(),pageNumbers=pages,anchors=anchors)
 coverage.extend(range(a,z))
assert coverage==list(range(len(b)))
themes=[dict(nivel='capitulo',nombre=n,orden=i)for i,n in enumerate(dict.fromkeys(a['capitulo_nombre']for a in articles))]
payload=dict(ley=law,articulos=articles,temas=themes,fuente=source)
save(R/'PROGRAMA-CENACE-carga.json',payload)
save(R/'mapa-cenace.json',dict(source=dict(id=sid,title=law['titulo'],lawId=lid,sha256=source['sha256'],transport='remote-pdf',pdfUrl='/api/reader/'+sid,originalUrl=source['url'],pageCount=52,pages=[dict(number=n,width=612.0,height=792.0)for n in range(1,53)]),articles=maps))
save(R/'SEGMENTACION.json',dict(bloques=291,cobertura_total=True,sin_solapamientos=True,apartados=len(profiles),fragmentos=len(articles),tablas_fuente=20,tablas_auxiliares_de_rotulos=2,celdas_fuente=429,indicadores_completos=4,estrategias_completas=5,mapas_originales_paginas=[18],graficas_originales_paginas=[19,32,33],rangos=[dict(inicio=p[0],fin=profiles[i+1][0]if i+1<len(profiles)else 291,titulo=p[1])for i,p in enumerate(profiles)]))
print(json.dumps(dict(id=lid,fragmentos=len(articles),apartados_mapeados=len(maps),tablas_fuente=20,celdas=429),ensure_ascii=False))
