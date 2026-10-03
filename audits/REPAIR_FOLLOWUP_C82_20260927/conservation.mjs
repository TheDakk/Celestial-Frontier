import fs from'node:fs';import{createRequire}from'node:module';import{createHash}from'node:crypto';
const req=createRequire(process.cwd()+'/port/v2/package.json'),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp'),sha=b=>createHash('sha256').update(b).digest('hex'),base=import.meta.dirname,rows=[];
for(const [name,id]of [['bobcat','bobcat-side-01'],['donkey','donkey-side-01'],['bobcat','bobcat-chain-02']]){
 const src='audits/LATE_REACTION_C70_20260927/'+name+'/fit',dst=base+'/'+id+'/fit',d=JSON.parse(fs.readFileSync(src+'/declaration.json')),a=await sharp(src+'/labels.png').ensureAlpha().raw().toBuffer(),b=await sharp(dst+'/labels.png').ensureAlpha().raw().toBuffer();if(a.length!==b.length)throw Error('Dimensions');let moved=0,foreign=0;
 for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]){moved++;if(!d.parts[a[i]-1]?.joint.startsWith('fore')||!d.parts[b[i]-1]?.joint.startsWith('fore'))foreign++;}
 if(foreign||!fs.readFileSync(src+'/record.json').equals(fs.readFileSync(dst+'/record.json')))throw Error('Protected source changed');const r=JSON.parse(fs.readFileSync(base+'/'+id+'/receipt.json'));if(moved!==r.gap.changedPixels||moved*4>r.gap.forelegPixels)throw Error('Count/25%guard');rows.push({name,id,moved,foreignChanges:foreign,recordBytesIdentical:true,sourceLabelSha256:sha(a),candidateLabelSha256:sha(b),admission:id==='bobcat-chain-02'?'REJECTED_STATIC_FOLDS':'DIAGNOSTIC_ONLY'});
}
fs.writeFileSync(base+'/conservation.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});console.log(rows);
