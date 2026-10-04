import fs from 'node:fs';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='audits/C183_REFERENCE_SUCCESSORS_20261002',sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const rows=[
 {id:'03-banana-slug-hold',source:'22-banana-slug',family:'gastropod',masterSha256:'34ebadd8a66f5562067da07cb3acf85082be3a04a4a6bfd2acde2ed5aee098bc',distinctFrom:'Snail',visible:['continuous foot and mantle','pneumostome','two ocular tentacles','two shorter sensory tentacles'],unproved:['mandatory mouth landmark: only an ambiguous small crease is visible'],sourceCorrection:'Expose the actual mouth independently from the two short sensory tentacles without adding invented anatomy.',observedRegions:[{id:'mantle-and-pneumostome',bounds:[632,530,1004,698]},{id:'ocular-tentacles',bounds:[968,401,1174,612]},{id:'short-sensory-tentacles',bounds:[1010,624,1113,702]}]},
 {id:'04-prawn-hold',source:'23-prawn',family:'crustacean-small',masterSha256:'69bb94310653a7500e21d784cbe6f0dcd4ac6a5fda4424c9e0f76d2a2043dd6b',distinctFrom:'Shrimp',visible:['abdomen and tail fan','rostrum and both eyes','long antennae and shorter antennules','ventral swimmerets','several genuine walking legs'],unproved:['ten complete thoracic root/knee/foot chains','identity of overlapping far roots'],sourceCorrection:'Separate all five genuine walking-leg pairs at their roots and along each complete chain; retain all swimmerets and head appendages. Preserve margins around antenna tips.',observedRegions:[{id:'thoracic-overlap',bounds:[777,499,1023,769]},{id:'ventral-swimmerets',bounds:[477,608,834,887]}]},
 {id:'05-crab-hold',source:'24-crab',family:'brachyuran',masterSha256:'d11ee0494e3d445f8100a87394857a104f893f6a9d631303ceaa7ea1a72ea699',distinctFrom:'Fiddler Crab',visible:['both eye stalks','both claws with fixed and moving fingers','carapace','several complete walking chains'],unproved:['eight independent walking root/knee/foot chains','posterior hidden attachments and chain identities'],sourceCorrection:'Expose and separate all four genuine walking-leg pairs while retaining both complete claws and eye stalks; do not invent a pair behind the carapace.',observedRegions:[{id:'posterior-left-occlusion',bounds:[307,338,512,507]},{id:'posterior-right-occlusion',bounds:[847,407,1042,552]}]}
];
for(const row of rows){
 const src='audits/C213_CREATURE_SUPPLY_20261002/'+row.source,out=base+'/'+row.id;
 assert(!fs.existsSync(out));assert.equal(sha(read(src+'/master.png')),row.masterSha256);
 const names=['master.png','subject-source.json','request.json','generation.json','prompt.txt'];
 const inputs=names.filter(n=>fs.existsSync(src+'/'+n)).map(n=>{const bytes=read(src+'/'+n);if(n!=='master.png')assert(!bytes.includes(Buffer.from(os.homedir())));return {name:n,bytes,sha256:sha(bytes)};});
 fs.mkdirSync(out);for(const x of inputs)fs.writeFileSync(out+'/'+x.name,x.bytes,{flag:'wx'});
 write(out+'/observation.json',{schema:'cf.c183-independent-source-hold/v1',...row,source:src,fullSizeInspected:true,imageSize:[1254,1254],coordinatesAre:'approximate source-coordinate diagnostic bounds, not authored ownership or joint landmarks',status:'HELD_ANATOMICAL_OBSERVATION',authoringCreated:false,presenceInvented:false,fitAttempted:false,sourcePixelsChanged:false,qualityAccepted:false,nativeRuns:0});
 write(out+'/retention-receipt.json',{schema:'cf.c183-source-retention/v1',writer:'audits/C183_REFERENCE_SUCCESSORS_20261002/retain-observation-holds.mjs',writerSha256:sha(read(import.meta.filename)),source:src,inputs:inputs.map(({bytes,...x})=>({...x,bytes:bytes.length})),sourceMasterUnchanged:sha(read(out+'/master.png'))===row.masterSha256});
 console.log(JSON.stringify({id:row.id,status:'HELD_ANATOMICAL_OBSERVATION',fitAttempted:false}));
}
