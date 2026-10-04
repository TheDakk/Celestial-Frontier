import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer } from '../../../port/v2/node_modules/vite/dist/node/index.js';
const root=process.cwd(), packet='audits/MIDGAME_ART_DIRECTION_20260908/alien-source';
const server=await createServer({root:path.join(root,'port/v2'),configFile:false,optimizeDeps:{noDiscovery:true},server:{middlewareMode:true,watch:null,hmr:false,ws:false},appType:'custom'});
try {
  const {capture}=await server.ssrLoadModule(path.join(root,packet,'fact-entry.ts'));
  const facts=capture();
  fs.writeFileSync(path.join(packet,'known-system.json'),JSON.stringify(facts,null,2)+'\n',{flag:'wx'});
  const sourcePaths=['fact-entry.ts','capture-facts.mjs'].map(p=>path.join(packet,p)).concat(['port/v2/apps/game/src/world-roster.ts','port/v2/apps/game/src/biome-vista-surface.ts','port/v2/packages/art/src/proceduraloverrides.ts','port/v2/packages/domain/speciestraits/src/speciestraits.verbatim.js']);
  const sources=sourcePaths.map(p=>{const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};});
  const receipt={recordedUTC:new Date().toISOString(),scope:'One known procedural system from world-roster.test.ts, epoch 0. Pure roster/presentation projection; no canvas, browser, tests, genome/domain/runtime mutation or seed sweep.',command:'node tools/with-toolchain-lock.mjs --label alien-landfall-source -- node audits/MIDGAME_ART_DIRECTION_20260908/alien-source/capture-facts.mjs',sources,planets:facts.planets.map(p=>({seed:p.planet.seed,name:p.planet.name,worldKey:p.roster.worldKey,biosphere:p.roster.biosphereKey,biome:p.roster.biomeProfileKey,profile:p.roster.biomeProfile,rows:p.roster.view.total,kingdoms:p.presentation.map(r=>r.genome.kingdom),owners:p.presentation.map(r=>typeof r.owner==='object'?r.owner?.kind:r.owner)}))};
  fs.writeFileSync(path.join(packet,'derivation-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(receipt,null,2));
} finally { await server.close(); }
