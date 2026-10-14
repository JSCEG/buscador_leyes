import { readFileSync } from 'node:fs';
import { expect,it } from 'vitest';
const data=JSON.parse(readFileSync('revision-acervo/correccion-hiip-tablas-2026-10-14/carga.json','utf8'));
it('preserves official cell text, merged title and all annex rows with semantic headers',()=>{
    for(const [order,rows,columns] of [[3,2,4],[4,53,4],[9,100,5],[10,97,5]]){
        const a=data.articulos.find(a=>a.orden===order);
        const root=document.createElement('div');root.innerHTML=a.contenido;
        const t=root.querySelector('table');
        expect(t.tBodies[0].rows.length).toBe(rows);
        expect(t.tHead.rows[t.tHead.rows.length-1].cells.length).toBe(columns);
        expect(t.tHead.querySelectorAll('td').length).toBe(0);
        expect(root.textContent).not.toContain('|');
    }
    const table=document.createElement('div');table.innerHTML=data.articulos.find(a=>a.orden===3).contenido;
    expect(table.querySelector('thead th').colSpan).toBe(4);
    const annex=data.articulos.filter(a=>a.orden>=9).flatMap(a=>{
        const root=document.createElement('div');root.innerHTML=a.contenido;
        return [...root.querySelectorAll('tbody tr')].map(r=>Number(r.cells[0].textContent.trim()));
    });
    expect(annex).toEqual(Array.from({length:197},(_,i)=>i+1));
});
