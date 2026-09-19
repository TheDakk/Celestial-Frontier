#!/usr/bin/env node
// Diagnostic of the external oracle, not a replacement acceptance gate.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawnSync} from 'node:child_process';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
const [oracle]=process.argv.slice(2);if(!oracle||process.argv.length!==3)throw Error('Usage: node seam-oracle-audit.mjs /absolute/path/to/seam-oracle.mjs');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-seam-ruler-audit-'));
try{
 const W=200,H=200,record=path.join(scratch,'record.json');
 fs.writeFileSync(record,JSON.stringify({landmarks:{earFarRoot:[.5,.4]}}));
 const rows=[];
 for(const [name,dx,split] of [['rest',0,false],['rigid-translation',-18,false],['actual-gap',0,true]]){
  const image=new PNG({width:W,height:H});
  // One rigid painted rectangle with an authored exterior notch, not two torn parts.
  for(let y=60;y<140;y++)for(let x=40;x<160;x++){
   if(x>=116&&x<122&&y<94)continue;
   if(split&&x>=98&&x<102)continue;
   const i=(y*W+x+dx)*4;image.data.set([81,55,31,255],i);
  }
  const file=path.join(scratch,name+'.png');fs.writeFileSync(file,PNG.sync.write(image));
  const p=spawnSync(process.execPath,[path.resolve(oracle),file,record,'--disc=0.06','--joints=earFarTip'],{encoding:'utf8',timeout:30000});
  if(p.error||p.status!==0)throw Error(p.error??p.stderr);const result=JSON.parse(p.stdout);rows.push({name,dx,split,seamPixels:result.perJoint.earFarTip.seamPixels});
 }
 const baseline=rows[0].seamPixels;for(const row of rows)row.delta=row.seamPixels-baseline;
 if(!(rows[1].delta>0&&rows[2].delta>0))throw Error('Counterexample did not reproduce; retain as instrument failure');
 console.log(JSON.stringify({schema:'cf.seam-oracle-counterexample/v1',oracleSha256:createHash('sha256').update(fs.readFileSync(oracle)).digest('hex'),rows,conclusion:'A rigid shape with no new tear becomes red when an existing notch enters the fixed rest-pivot disc. The actual-gap control is also red. Positive pose-minus-rest is not sufficient to attribute a tear.',acceptanceGateChanged:false},null,2));
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
