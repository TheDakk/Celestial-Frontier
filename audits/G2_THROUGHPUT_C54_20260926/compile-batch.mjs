import fs from 'node:fs';import path from 'node:path';
import {compileLibraryMaster} from '../../port/v2/tools/painted-creature/compile-library-master.mjs';
const names=['Dingo','Jackal','Hyena','Lion','Tiger','Leopard','Jaguar','Snow Leopard','Ocelot','Serval','Stoat','Weasel','Duck','Goose','Quail','Partridge','Python','Boa','Racer','Garter Snake','Cockroach','Locust','Beetle','Termite'];
const rows=[];for(const [index,name] of names.entries()){
 const id=String(index+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-'),packet=path.relative(process.cwd(),path.join(import.meta.dirname,id));
 const result=await compileLibraryMaster(name,packet);rows.push({id,name,family:result.family,packet,master:packet+'/master.png'});console.log(id,result.family);
}
fs.writeFileSync(path.join(import.meta.dirname,'pilot.json'),JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
