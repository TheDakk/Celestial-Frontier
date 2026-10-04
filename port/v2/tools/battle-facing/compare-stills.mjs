/** Compare the same explicit-time native poses across two lifecycle paths.
 * Exit nonzero on any difference; preserve both source files and report. */
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
const [before,after,out]=process.argv.slice(2);if(!before||!after||!out||fs.existsSync(out))throw Error('Usage: compare-stills.mjs BEFORE_DIR AFTER_DIR NEW_REPORT');
const rows=[];for(const id of ['civet','fox','procedural'])for(const frame of ['idle','anticipation','strike','impact-hold','hit']){
 const file=id+'-'+frame+'.png',a=fs.readFileSync(path.join(before,file)),b=fs.readFileSync(path.join(after,file)),p=PNG.sync.read(a),q=PNG.sync.read(b);
 if(p.width!==q.width||p.height!==q.height)throw Error('Different canvas: '+file);let changedChannels=0,maxDelta=0;
 for(let i=0;i<p.data.length;i++)if(p.data[i]!==q.data[i]){changedChannels++;maxDelta=Math.max(maxDelta,Math.abs(p.data[i]-q.data[i]));}
 rows.push({file,sameBytes:a.equals(b),changedChannels,maxDelta,beforeSha256:createHash('sha256').update(a).digest('hex'),afterSha256:createHash('sha256').update(b).digest('hex')});
}
const report={status:rows.every(r=>r.changedChannels===0)?'PASS':'FAIL',before,after,rows};fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,images:rows.length,changedChannels:rows.reduce((n,r)=>n+r.changedChannels,0)}));if(report.status==='FAIL')process.exitCode=1;
