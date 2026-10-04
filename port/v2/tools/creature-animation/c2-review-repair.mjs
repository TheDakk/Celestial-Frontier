/** Pack 7's two bounded authored-data corrections. No curve or rig changes. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {hashBytes,hashJSON,sealRecord,admitRecord} from './quadruped-template.mjs';
import {addJointPatches} from './joint-patches.mjs';
import {buildAuthoredParts} from './build-authored-parts.mjs';
const root=path.resolve(import.meta.dirname,'../../../..'),output=path.resolve(process.argv[2]);
if(!process.argv[2]||fs.existsSync(output))throw Error('New output directory required');
const read=n=>JSON.parse(fs.readFileSync(path.join(root,n))),require=createRequire(import.meta.url),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const base='audits/C2_PARTS_ATLAS_20260913/',oldFoxPath='audits/CIVET_2D_PROOF_20260912/fox.landmarks.json';
const oldFox=read(oldFoxPath),oldPatch=read(base+'civet.joint-patches-v2.json');
const oldHashes=new Map([oldFoxPath,base+'civet.joint-patches-v2.json','audits/ART_KIT_ENGINE_FIRST_20260912/masters/family-mammal-quadruped.png','audits/CIVET_ANIMATION_PROOF_20260912/civet-turnaround-01.png'].map(n=>[n,fs.readFileSync(path.join(root,n))]));
fs.mkdirSync(output,{recursive:true});
const write=(n,v)=>fs.writeFileSync(path.join(output,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const {declarationHash,...patch}=structuredClone(oldPatch);
if(patch.patches.filter(p=>p.joint==='head'&&p.radius===.025).length!==1||patch.patches.some(p=>p.joint==='neck'))throw Error('Unexpected original Civet declaration');
patch.patches.find(p=>p.joint==='head').radius=.045;
patch.patches.push({joint:'neck',radius:.040,sourceCentre:[.35,.49]});
write('civet.joint-patches.json',{...patch,declarationHash:await hashJSON(patch)});
const civet=await addJointPatches({baseDirectory:path.join(root,base+'civet-v2'),recordFile:path.join(root,'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json'),turnaroundFile:path.join(root,'audits/CIVET_ANIMATION_PROOF_20260912/civet-turnaround-01.png'),patchFile:path.join(output,'civet.joint-patches.json'),output:path.join(output,'civet-patched')});
// Re-observed visible carpal/tarsal bends in the same authored fox master.
// Hind-far already has 4.23% slack and remains unchanged. Only three knee points
// change; roots, ankles, paws, masks, master, materials and clip set stay bound.
const changes={hindNearKnee:[.328,.775],foreFarKnee:[.782,.670],foreNearKnee:[.663,.680]};
const {recipeHash,boundsCheck,...body}=structuredClone(oldFox);Object.assign(body.landmarks,changes);
const fox=await sealRecord(body),master=fs.readFileSync(path.join(root,oldFox.source));
const {data,info}=await sharp(path.join(root,base+'fox/keyed.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const alpha=Uint8Array.from({length:info.width*info.height},(_,i)=>data[i*4+3]);await admitRecord(fox,master,alpha);
const bl=Math.hypot(fox.landmarks.chest[0]-fox.landmarks.pelvis[0],fox.landmarks.chest[1]-fox.landmarks.pelvis[1]);
const slack={};for(const leg of ['hindFar','foreFar','hindNear','foreNear']){const r=fox.landmarks[leg+'Root'],k=fox.landmarks[leg+'Knee'],a=fox.landmarks[leg+'Ankle'],sum=Math.hypot(k[0]-r[0],k[1]-r[1])+Math.hypot(a[0]-k[0],a[1]-k[1]);slack[leg]=(Math.sqrt(sum*sum-(a[0]-r[0])**2)-(a[1]-r[1]))/bl;if(slack[leg]<.03)throw Error('Fox observation lacks 3% rest slack: '+leg);}
write('fox.landmarks.json',fox);
const {declarationHash:oldMaskHash,...mask}=read(base+'fox.part-masks.json');mask.recordRecipeHash=fox.recipeHash;
write('fox.part-masks.json',{...mask,declarationHash:await hashJSON(mask)});
const foxAtlas=await buildAuthoredParts({id:'fox',recordFile:path.join(output,'fox.landmarks.json'),masterFile:path.join(root,oldFox.source),declarationFile:path.join(output,'fox.part-masks.json'),output:path.join(output,'fox')});
const sources=[];for(const[n,b]of oldHashes){if(!fs.readFileSync(path.join(root,n)).equals(b))throw Error('Changed protected original: '+n);sources.push({path:n,sha256:await hashBytes(b)});}
write('receipt.json',{status:'OFFLINE_ADMITTED_NATIVE_GATES_PENDING',civet,foxAtlas,changes,foxRestSlackBL:slack,sourceImagesUnchanged:true,sources,scope:'Pack 7 exact patch radii plus re-observed fox knee points; no clip edits, no compression-bound change'});
console.log(JSON.stringify({civet,foxAtlas,slack},null,2));
