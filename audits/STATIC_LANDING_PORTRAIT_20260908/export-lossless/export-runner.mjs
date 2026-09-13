import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=process.cwd(), out=path.join(root,'audits/STATIC_LANDING_PORTRAIT_20260908/export-lossless');
fs.mkdirSync(out);
const src=path.join(root,'audits/STATIC_LANDING_PORTRAIT_20260908/civet-landing-original.png');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={status:'RUNNING',source:{path:src,sha256:hash(fs.readFileSync(src))},commands:[],authority:'Nick explicitly approved ImageMagick resize/encode and asked to preserve visual quality; fullresolution original retained.',qualification:'Lossless compression preserves the resized reference pixels; resampling reduces spatial detail relative to fullresolution original.'};
const run=args=>{const r=spawnSync('/opt/homebrew/bin/magick',args,{encoding:'utf8'});report.commands.push({args,status:r.status,stdout:r.stdout,stderr:r.stderr});if(r.status!==0)throw Error(r.stderr);return r.stdout;};
const record=file=>{const b=fs.readFileSync(file);return{path:path.relative(root,file),bytes:b.length,sha256:hash(b)};};
try{
 report.version=run(['-version']);
 // Source aspect differs by only0.1percent. Contain without cropping/stretching;
 // replicated edge extends the tiny residual dimension into exactacceptedcanvas.
 const ref=path.join(out,'display-reference.png'), webp=path.join(out,'earth-civet-landing-v1.webp');
 run([src,'-filter','Lanczos','-resize','960x430','-virtual-pixel','edge','-gravity','center','-background','black','-extent','960x430','-strip',ref]);
 run([ref,'-define','webp:lossless=true','-define','webp:method=6','-quality','100',webp]);
 report.reference=record(ref);report.export=record(webp);
 report.dimensions=run(['identify','-format','%w %h %[channels]',webp]);
 const decoded=path.join(out,'decoded.rgb'), referenceRaw=path.join(out,'reference.rgb');
 run([webp,'-depth','8','RGB:'+decoded]);run([ref,'-depth','8','RGB:'+referenceRaw]);
 const a=fs.readFileSync(decoded),b=fs.readFileSync(referenceRaw);report.pixelEquality=a.equals(b);report.rawBytes=a.length;
 report.budget={maxBytes:512*1024,within:report.export.bytes<=512*1024};
 if(!report.pixelEquality)throw Error('Lossless export altered referenceRGB');
 report.status=report.budget.within?'PASS':'ENCODING_EXACT_BUT_OVER_RUNTIME_BUDGET';
}catch(e){report.status='FAIL';report.error=String(e);process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
