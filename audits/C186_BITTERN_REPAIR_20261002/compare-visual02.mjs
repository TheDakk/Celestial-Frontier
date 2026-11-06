import fs from 'node:fs';import {createRequire} from 'node:module';import {record,bindings,card,at} from './context.mjs';
const {createPaintPublication}=await import('../C132_FAINT_GROUND_20261002/paint-publication.mjs');const {rasterPaint}=await import('../C132_FAINT_GROUND_20261002/render-mesh.mjs');
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{PNG}=require('pngjs'),base='audits/C186_BITTERN_REPAIR_20261002',s=at(1504),atlas=PNG.sync.read(fs.readFileSync(base+'/original-atlas.png')),f=createPaintPublication(record,bindings.painter,card.realm).publish(s.pose,s.context);
fs.writeFileSync(base+'/original-neighbour-1504.png',PNG.sync.write(rasterPaint(record,bindings.painter,atlas,f.positions)),{flag:'wx'});
