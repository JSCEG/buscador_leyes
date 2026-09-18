from pathlib import Path
import pymupdf
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent
out=ROOT/'revision-visual';out.mkdir(exist_ok=True)
profiles={'LSH':[1,58,61],'LEPECFE':[1,42,45,46],'LEPEPM':[1,41,44],'LBio':[1,21,22,23],'LGeo':[1,21,22]}
for name,pages in profiles.items():
    doc=pymupdf.open(ROOT/'fuentes'/f'{name}.pdf')
    sheets=[]
    for pn in pages:
        pix=doc[pn-1].get_pixmap(matrix=pymupdf.Matrix(1.5,1.5));im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
        label=Image.new('RGB',(im.width,im.height+34),'white');label.paste(im,(0,34));ImageDraw.Draw(label).text((15,10),f'{name} — página {pn}',fill='black');sheets.append(label)
    contact=Image.new('RGB',(sheets[0].width*len(sheets),max(im.height for im in sheets)),'white')
    for i,im in enumerate(sheets):contact.paste(im,(i*im.width,0))
    contact.save(out/f'{name}.png')
print('Vistas de cotejo generadas')
