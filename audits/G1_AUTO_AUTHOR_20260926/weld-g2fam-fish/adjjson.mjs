/** C48/C49: the greedy weld search's candidate list for one automatic fish fit: every OBSERVED excluded adjacency of the fit's
 * pre-split binding whose two parts are both axial (body/spine/head/caudal), in the source-join probe's own order. Committed so the
 * search trajectory reproduces from tracked producers. Usage (repo root): node .../adjjson.mjs <fishId> */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..'); const { createSourceJoinProbe } = await import(root+'/port/v2/tools/quadruped-proof/source-join-continuity.mjs');
const req = createRequire(root + '/port/v2/package.json'), sharp = createRequire(req.resolve('free-tex-packer-core'))('sharp'); const id=process.argv[2];
const old=path.join(root,'audits/G1_AUTO_AUTHOR_20260926/auto-g2fam-v10',id,'fit'); const read=(n)=>JSON.parse(fs.readFileSync(path.join(old,n)));
const record=read('record.json'), binding=read('pre-split-binding.json'), manifest=read('parts/manifest.json'); const atlas=await sharp(path.join(old,'parts/atlas',manifest.creatureId+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.info.width,height:atlas.info.height}});
const axial=(n)=>/^(body|spine|head|caudal)/.test(n);
for (const e of probe.excluded) { const p=e.parts||e.pair||[e.a,e.b]; if (p.every(axial)) console.log(JSON.stringify(p)); }
