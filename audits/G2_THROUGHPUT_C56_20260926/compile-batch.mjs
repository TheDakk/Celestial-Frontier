import fs from 'node:fs';import path from 'node:path';
import {compileLibraryMaster} from '../../port/v2/tools/painted-creature/compile-library-master.mjs';
const names=["Clouded Leopard", "Caracal", "Coyote", "Bobcat", "Lynx", "Mink", "Marten", "Fisher", "Crow", "Raven", "Robin", "Cardinal", "Magpie", "Jay", "Dove", "Pigeon", "Tree Snake", "Rat Snake", "Cottonmouth", "Water Snake", "Mamba", "Mountain Viper", "Whip Snake", "Grass Snake", "Dung Beetle", "Cicada", "Ladybug", "Leafcutter Ant", "Cave Cricket", "Firefly", "Carrion Beetle", "Stick Insect"];
const rows=[];for(const [index,name] of names.entries()){
 const id=String(index+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-'),packet=path.relative(process.cwd(),path.join(import.meta.dirname,id));
 const result=await compileLibraryMaster(name,packet);rows.push({id,name,family:result.family,packet,master:packet+'/master.png'});console.log(id,result.family);
}
fs.writeFileSync(path.join(import.meta.dirname,'pilot.json'),JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
