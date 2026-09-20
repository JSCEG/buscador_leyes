"""Extrae la edición revisada por geometría; verifica que cada carácter se use una vez."""
from pathlib import Path
from collections import Counter
import json,hashlib,html,re,pdfplumber
from pdfplumber.table import Table
from pdfplumber.utils import extract_text,cluster_objects
R=Path(__file__).resolve().parent
PDF=R/'fuentes/PROGRAMA-CENACE.pdf'
SHA='39fe5ad916c3f322183d5ee7f5ce4bf238699988ef67fbfd55f78afd4e51fea3'
assert hashlib.sha256(PDF.read_bytes()).hexdigest()==SHA
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
esc=html.escape
def inside(c,b):
 x=(c['x0']+c['x1'])/2;y=(c['top']+c['bottom'])/2
 return b[0]<=x<b[2] and b[1]<=y<b[3]
def chars_text(chars):return extract_text(chars,x_tolerance=2,y_tolerance=3)or''
def compact(s):return re.sub(r'\s+','',s)
def tables_for(p,n):
 if n==8:
  xs=[85.1,170.06,527.13];ys=[175.82,204.14,221.42,238.34,255.41,272.45,289.37,306.41,323.69]
  return [Table(p,[(xs[x],ys[y],xs[x+1],ys[y+1])for y in range(8)for x in range(2)])]
 if n==34:
  xs=[78.02,304.85,418.27,531.69];ys=[177.14,207.62,258.05,322.25,387.89]
  cells=[(xs[x],ys[0],xs[x+1],ys[1])for x in range(3)]+[(xs[0],ys[1],xs[1],ys[-1])]
  cells += [(xs[x],ys[y],xs[x+1],ys[y+1])for y in range(1,4)for x in range(1,3)]
  return [Table(p,cells)]
 if n not in list(range(36,43))+list(range(44,52)):return []
 borders=[r for r in p.rects if min(r['width'],r['height'])<1 and max(r['width'],r['height'])>5 and r['top']>100 and r['bottom']<735]
 lines=[]
 for r in borders:
  x=(r['x0']+r['x1'])/2 if r['width']<1 else r['x0'];xx=x if r['width']<1 else r['x1']
  y=(r['top']+r['bottom'])/2 if r['height']<1 else r['top'];yy=y if r['height']<1 else r['bottom']
  lines.append(dict(object_type='line',x0=x,x1=xx,top=y,bottom=yy,width=xx-x,height=yy-y))
 return p.find_tables(dict(vertical_strategy='explicit',horizontal_strategy='explicit',explicit_vertical_lines=lines,explicit_horizontal_lines=lines,snap_tolerance=1,join_tolerance=1,intersection_tolerance=1))
blocks=[];checks=[];cells_audit=[]
with pdfplumber.open(PDF)as d:
 assert len(d.pages)==52
 for n,p in enumerate(d.pages,1):
  # Portada conserva su título; el resto omite sólo encabezados y folios repetidos.
  body=[c for c in p.chars if (n==1 or c['top']>=110)and c['bottom']<735]
  tables=tables_for(p,n);used=set();local=[]
  for table in tables:
   xs=sorted(set(v for c in table.cells for v in [c[0],c[2]]));ys=sorted(set(v for c in table.cells for v in [c[1],c[3]]))
   rows=[];alltext=[];cellnotes=[]
   for y in ys[:-1]:
    row=[]
    for cell in sorted([c for c in table.cells if c[1]==y]):
     ids=[i for i,c in enumerate(body)if inside(c,cell)]
     assert not set(ids)&used,(n,cell,'celda solapada')
     used.update(ids);text=chars_text([body[i]for i in ids]);alltext.append(text)
     colspan=xs.index(cell[2])-xs.index(cell[0]);rowspan=ys.index(cell[3])-ys.index(cell[1])
     attrs=(f' colspan="{colspan}"'if colspan>1 else'')+(f' rowspan="{rowspan}"'if rowspan>1 else'')
     row.append('<td'+attrs+'>'+esc(' '.join(text.split()))+'</td>')
     cellnotes.append(dict(pagina=n,bbox=cell,texto=text,colspan=colspan,rowspan=rowspan))
    rows.append('<tr>'+''.join(row)+'</tr>')
   local.append(dict(pagina=n,bbox=table.bbox,tipo='tabla',texto='\n'.join(alltext),html='<table><tbody>'+''.join(rows)+'</tbody></table>',caracteres=len([i for i,c in enumerate(body)if inside(c,table.bbox)])))
   cells_audit.extend(cellnotes)
  remaining=[(i,c)for i,c in enumerate(body)if i not in used]
  # Lines preserve source reading order outside tables; paragraph grouping does not
  # infer missing words, consolidate values or repair source typographical errors.
  linegroups=cluster_objects(remaining,lambda pair:pair[1]['top'],3)
  paras=[]
  for group in linegroups:
   cs=[x[1]for x in group];text=chars_text(cs)
   if not compact(text):used.update(i for i,c in group);continue
   top=min(c['top']for c in cs);bottom=max(c['bottom']for c in cs);size=max(c['size']for c in cs)
   x0=min(c['x0']for c in cs);x1=max(c['x1']for c in cs)
   heading=size>=13 or bool(re.match(r'^(?:\d+(?:\.\d+)+\.?\s|Estrategia \d|Indicador \d)',text))
   if paras and not heading and not paras[-1]['heading'] and top-paras[-1]['bbox'][3]<9 and abs(x0-paras[-1]['bbox'][0])<18:
    paras[-1]['texto']+=' '+text;paras[-1]['bbox'][2]=max(x1,paras[-1]['bbox'][2]);paras[-1]['bbox'][3]=bottom;paras[-1]['ids']+= [i for i,c in group]
   else:paras.append(dict(pagina=n,bbox=[x0,top,x1,bottom],tipo='parrafo',heading=heading,texto=text,ids=[i for i,c in group]))
  for b in paras:
   assert not set(b['ids'])&used
   used.update(b.pop('ids'));b['html']='<p>'+esc(' '.join(b['texto'].split()))+'</p>';local.append(b)
  assert used==set(range(len(body))),(n,'caracteres sin cubrir')
  local.sort(key=lambda b:(b['bbox'][1],b['bbox'][0]))
  actual=Counter(compact(''.join(b['texto']for b in local)));expected=Counter(compact(''.join(c['text']for c in body)))
  assert actual==expected,(n,actual-expected,expected-actual)
  for b in local:b['id']=len(blocks);blocks.append(b)
  checks.append(dict(pagina=n,caracteres_cotejados=sum(expected.values()),tablas=len(tables),bloques=len(local),cobertura_exacta=True))
save(R/'fuentes/bloques.json',blocks);save(R/'COTEJO-PAGINAS.json',checks);save(R/'COTEJO-CELDAS.json',cells_audit)
save(R/'fuente.json',dict(nombre='PROGRAMA-CENACE',url='https://dof.gob.mx/2026/CENACE/ProgramaInstitucional.pdf',sha256=SHA,paginas=52,fecha_publicacion='2026-04-30',aviso_url='https://sidof.segob.gob.mx/notas/docFuente/5786368',radar='RAD-081'))
(R/'fuentes/indice-bloques.txt').write_text('\n'.join(f"{b['id']} p{b['pagina']} {b['tipo']} {b['texto'][:170]}"for b in blocks),encoding='utf8')
print(json.dumps(dict(bloques=len(blocks),tablas=sum(x['tablas']for x in checks),celdas=len(cells_audit),paginas=52,caracteres=sum(x['caracteres_cotejados']for x in checks)),ensure_ascii=False))
