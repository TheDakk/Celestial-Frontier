/** Hash existing packet bytes after evidence is written. No measurement or gate inference. */
import fs from'node:fs';import path from'node:path';import{createHash}from'node:crypto';
const root=import.meta.dirname;
function seal(directory){const destination=path.join(directory,'manifest.json'),files=[];
 const visit=folder=>{for(const entry of fs.readdirSync(folder,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(folder,entry.name);if(file===destination)continue;if(entry.isSymbolicLink())throw Error('Unexpected packet symlink: '+file);if(entry.isDirectory())visit(file);else if(entry.isFile()){const bytes=fs.readFileSync(file);files.push({path:path.relative(directory,file).split(path.sep).join('/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}};visit(directory);fs.writeFileSync(destination+'.new',JSON.stringify({files},null,2)+'\n');fs.renameSync(destination+'.new',destination);return{directory,files:files.length};
}
const item=path.resolve(process.argv[2]??'');if(!item.startsWith(root+path.sep)||path.dirname(item)!==root)throw Error('Supply one direct item directory in this repair packet');
console.log(JSON.stringify([seal(item),seal(root)]));
