import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../../port/v2/node_modules/vite/dist/node/index.js';
const root=process.cwd();
const server=await createServer({root:path.join(root,'port/v2'),configFile:false,server:{middlewareMode:true,watch:null},appType:'custom'});
try{const {capture}=await server.ssrLoadModule(path.join(root,'audits/AV_PAINTED_MARS_20260908/fact-entry.ts'));const facts=capture();fs.writeFileSync('audits/AV_PAINTED_MARS_20260908/canonical-mars.json',JSON.stringify(facts,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(facts.request));}
finally{await server.close();}
