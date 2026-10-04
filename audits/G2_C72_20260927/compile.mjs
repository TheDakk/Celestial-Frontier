import fs from'node:fs';import{compileLibraryMaster}from'../../port/v2/tools/painted-creature/compile-library-master.mjs';
const names=JSON.parse(fs.readFileSync(new URL('./queued-names.json',import.meta.url),'utf8')).names,rows=[];
for(const[name,i]of names.map((n,i)=>[n,i])){const id=String(i+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-'),packet='audits/G2_C72_20260927/'+id,r=await compileLibraryMaster(name,packet);rows.push({id,name,family:r.family,packet,master:packet+'/master.png'});console.log(id,r.family);}
fs.writeFileSync(new URL('./pilot.json',import.meta.url),JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
