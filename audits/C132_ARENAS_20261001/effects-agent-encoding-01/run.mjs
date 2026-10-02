import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const root=process.cwd(),base='audits/C132_ARENAS_20261001',out=base+'/effects-agent-encoding-01';
fs.mkdirSync(out,{recursive:true});
const require=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p));
const decoded=async p=>sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});
function mismatch(a,b){assert.equal(a.length,b.length);let bytes=0,rgb=0,alpha=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i]){bytes++;if(i%4===3)alpha++;else rgb++;}return {bytes,rgb,alpha};}
const control=Buffer.from([12,45,78,255,91,32,18,0]),rgbControl=Buffer.from(control),alphaControl=Buffer.from(control);rgbControl[4]++;alphaControl[7]++;
assert.deepEqual(mismatch(control,control),{bytes:0,rgb:0,alpha:0});
assert.deepEqual(mismatch(control,rgbControl),{bytes:1,rgb:1,alpha:0});
assert.deepEqual(mismatch(control,alphaControl),{bytes:1,rgb:0,alpha:1});
const rows=[];
for(const id of ['karst','blueice','hotglow']){
 const manifest=json(base+'/'+id+'/d29/delivery.pending.json');
 for(const role of ['far','mid','near']){
  const source=manifest.plates[role].runtime,sourceBytes=read(source),original=await decoded(source),stem=out+'/'+id+'-'+role;
  assert.equal(sha(sourceBytes),manifest.plates[role].runtimeSha256,'exact delivery source');
  const png=stem+'.png',webp=stem+'.webp';
  assert(!fs.existsSync(png)&&!fs.existsSync(webp),'immutable output');
  await sharp(sourceBytes).png({compressionLevel:9,adaptiveFiltering:true}).toFile(png);
  execFileSync('cwebp',['-lossless','-exact','-q','100','-m','6','-quiet',source,'-o',webp]);
  const encodings=[];
  for(const [codec,file] of [['PNG deflate9 adaptive',png],['WebP lossless exact q100 m6',webp]]){
   const result=await decoded(file);assert.equal(result.info.width,original.info.width);assert.equal(result.info.height,original.info.height);assert.equal(result.info.channels,4);
   const differences=mismatch(original.data,result.data);assert.equal(differences.bytes,0,'all decoded RGBA bytes identical, including hidden RGB');
   const bytes=read(file);encodings.push({codec,path:file,sha256:sha(bytes),bytes:bytes.length,ratio:bytes.length/sourceBytes.length,savedBytes:sourceBytes.length-bytes.length,decodedSha256:sha(result.data),differences});
  }
  assert.equal(sha(read(source)),sha(sourceBytes),'source unchanged');
  rows.push({id,role,source,sourceSha256:sha(sourceBytes),sourceBytes:sourceBytes.length,width:original.info.width,height:original.info.height,channels:4,decodedSha256:sha(original.data),encodings});
  console.log(JSON.stringify({id,role,sourceBytes:sourceBytes.length,encodings:encodings.map(e=>({codec:e.codec,bytes:e.bytes,ratio:Number(e.ratio.toFixed(4)),decodedRgbaIdentical:e.differences.bytes===0}))}));
 }
}
const sum=fn=>rows.reduce((n,r)=>n+fn(r),0),sourceTotal=sum(r=>r.sourceBytes),pngTotal=sum(r=>r.encodings[0].bytes),webpTotal=sum(r=>r.encodings[1].bytes);
const source20=131844864,shipped=68325367,cap=128*1024*1024;
const report={schema:'cf.c132-arena-lossless-feasibility/v1',date:'2026-10-02',sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Nine representative runtime layers only: detailed foliage/rock, smooth ice, and amber clouds. Exact-source copies; no original, registry, loader, package, cap or acceptance changes.',nativeRun:false,qualityAccepted:false,sourcePixelsModified:false,versions:{node:process.version,sharp:sharp.versions.sharp,vips:sharp.versions.vips,cwebp:execFileSync('cwebp',['-version'],{encoding:'utf8'}).trim()},commands:{webp:'cwebp -lossless -exact -q 100 -m 6 -quiet SOURCE.png -o COPY.webp',png:'sharp(source).png({compressionLevel:9,adaptiveFiltering:true})'},controls:{equalRgbaPass:true,changedHiddenRgbRefused:true,changedAlphaRefused:true},rows,sample:{layers:rows.length,sourceBytes:sourceTotal,pngBytes:pngTotal,webpBytes:webpTotal,pngRatio:pngTotal/sourceTotal,webpRatio:webpTotal/sourceTotal,pngRatioRange:[Math.min(...rows.map(r=>r.encodings[0].ratio)),Math.max(...rows.map(r=>r.encodings[0].ratio))],webpRatioRange:[Math.min(...rows.map(r=>r.encodings[1].ratio)),Math.max(...rows.map(r=>r.encodings[1].ratio))],allDecodedRgbaBytesIncludingAlphaIdentical:true},conditionalBudgetIllustration:{pending20SourceBytes:source20,currentShippedBytes:shipped,unchangedCapBytes:cap,pendingAllowance:cap-shipped,requiredPendingRatio:(cap-shipped)/source20,atWorstObservedWebpSampleRatio:Math.ceil(source20*Math.max(...rows.map(r=>r.encodings[1].ratio)))+shipped,notAnAllAssetPrediction:true,explanation:'Only a conditional illustration for the earlier 20-set count. Other pending sets increase the requirement. Actual admission requires encoding and exact pixel verification of every selected asset plus checking the full unchanged pack budget.'},limitations:['Sample savings cannot establish every-layer compression or pack admission.','Encoded copies have not been integrated or decoded in a native browser/iPhone epoch; no decode-time, memory or device compatibility proof.','Semantic arena holds remain unchanged; exact pixel compression preserves visible defects too.']};
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({report:out+'/report.json',sha256:sha(read(out+'/report.json')),sample:report.sample,conditionalBudgetIllustration:report.conditionalBudgetIllustration}));

