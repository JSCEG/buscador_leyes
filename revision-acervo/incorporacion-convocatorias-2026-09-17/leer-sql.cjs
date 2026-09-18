const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const name=process.argv[2],offset=Number(process.argv[3]||0),config=JSON.parse(fs.readFileSync(path.join(__dirname,'config.json'),'utf8'));
if(!config.some(c=>c.name===name)||!Number.isInteger(offset)||offset<0)throw Error('Parámetros inválidos');
const text=fs.readFileSync(path.join(__dirname,name+'-aplicar.sql'),'utf8');
console.log(JSON.stringify({length:text.length,sha256:crypto.createHash('sha256').update(text).digest('hex'),offset,text:text.slice(offset,offset+20000)}));
