/** Read-only application of the existing canonical eight-percent margin. */
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {alphaBounds} from '../../../tools/local-image-generation/kit-contact-math.mjs';
const [original,canonical,out]=process.argv.slice(2);assert.equal(process.argv.length,5);assert(!fs.existsSync(out));
const req=createRequire(process.cwd()+'/port/v2/package.json'),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex');
const assess=(b,w,h)=>{const marginPixels={left:b.x,right:w-b.x-b.width,top:b.y,bottom:h-b.y-b.height};const marginFractions=Object.fromEntries(Object.entries(marginPixels).map(([k,v])=>[k,v/(k==='left'||k==='right'?w:h)]));return{marginPixels,marginFractions,pass:Object.values(marginFractions).every(v=>v>=.08)};};
const good={x:80,y:40,width:840,height:420};assert(assess(good,1000,500).pass);assert(!assess({...good,x:79,width:841},1000,500).pass);assert(assess(good,1000,500).pass);assert(!assess({...good,y:39,height:421},1000,500).pass);assert(assess(good,1000,500).pass);
const inputBytes=fs.readFileSync(original),canonicalBytes=fs.readFileSync(canonical),r=await sharp(canonicalBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),meta=await sharp(inputBytes).metadata();
assert.equal(meta.width,r.info.width);assert.equal(meta.height,r.info.height);
const alpha=Uint8Array.from({length:r.info.width*r.info.height},(_,i)=>r.data[i*4+3]),bounds=alphaBounds(alpha,r.info.width,r.info.height),result=assess(bounds,r.info.width,r.info.height);
assert.equal(sha(fs.readFileSync(original)),sha(inputBytes));assert.equal(sha(fs.readFileSync(canonical)),sha(canonicalBytes));
const v={status:result.pass?'PASS_CANONICAL_8_PERCENT_MARGIN':'HOLD_CANONICAL_8_PERCENT_MARGIN',canonicalMargin:.08,source:{path:original,sha256:sha(inputBytes)},canonicalKeyed:{path:canonical,sha256:sha(canonicalBytes)},dimensions:[r.info.width,r.info.height],bounds,...result,canonicalKeyedRgbaSha256:sha(r.data),controls:{exactBoundaryPass:true,onePixelHorizontalFail:true,onePixelVerticalFail:true,restoredPass:true,nonSquareDimensionsCovered:true},sourceUnchanged:true,rigIntakeStaticNativeAIRuns:0};
fs.writeFileSync(out,JSON.stringify(v,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(v));
