import fs from'node:fs';import{compileLibraryMaster}from'../../port/v2/tools/painted-creature/compile-library-master.mjs';
const names=['Elk','Moose','Bison','Raccoon','Badger','Wolverine','Starling','Vulture','Kingfisher','Water Snake','Mountain Viper','Ladybug'],rows=[];
for(const[name,i]of names.map((n,i)=>[n,i])){const id=String(i+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-'),packet='audits/G2_C59_20260926/'+id,r=await compileLibraryMaster(name,packet);rows.push({id,name,family:r.family,packet,master:packet+'/master.png'});console.log(id,r.family);}
fs.writeFileSync(new URL('./pilot.json',import.meta.url),JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
