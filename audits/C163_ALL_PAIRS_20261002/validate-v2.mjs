import{validateManifest as previousManifest,validateSweep as previousSweep,jsonHash}from'./validate.mjs';
import{isCanonicalPath,expectedFitInputPaths}from'./input-contract.mjs';
export{CPU_LIMIT_MS,sha,jsonHash,prescribedRows,validatePairReport,sealCaptureFiles,validatePairFiles}from'./validate.mjs';
const need=(v,why)=>{if(!v)throw Error('All-pairs input contract: '+why);};
const validInput=s=>s&&isCanonicalPath(s.path)&&/^[a-f0-9]{64}$/.test(s.sha256??'')&&Number.isSafeInteger(s.bytes)&&s.bytes>0;
export function validateManifest(m){
 const result=previousManifest(m);need(Array.isArray(m.sources)&&m.sources.every(validInput),'null/noncanonical source input');
 const sources=new Map(m.sources.map(s=>[s.path,s]));need(sources.size===m.sources.length,'duplicate source input');
 const validateInputs=(inputs,where)=>{need(Array.isArray(inputs)&&inputs.length>0&&inputs.every(validInput),'null/noncanonical '+where+' input');const seen=new Set();for(const s of inputs){need(!seen.has(s.path),'duplicate '+where+' input');seen.add(s.path);need(jsonHash(sources.get(s.path))===jsonHash(s),'unbound '+where+' input');}return seen;};
 const fits=new Map();for(const f of m.fits){need(isCanonicalPath(f.dir)&&isCanonicalPath(f.markingsDir),'noncanonical fit directory');need(!f.declaration||isCanonicalPath(f.declarationPath),'missing declaration path');const inputs=validateInputs(f.inputs,'fit');need(jsonHash([...inputs].sort())===jsonHash(expectedFitInputPaths(f)),'incomplete exact fit inventory '+f.name);fits.set(f.name,f);}
 for(const p of m.pairs){const inputs=validateInputs(p.inputs,'pair');for(const[side,name]of[['left',p.left],['right',p.right]]){const f=fits.get(name);need(p.fitConfig[side].dir===f.dir&&p.fitConfig[side].markingsDir===f.markingsDir,'pair fit directory differs');for(const s of f.inputs)need(inputs.has(s.path),'missing required fit input '+name);}
  for(const file of[p.effectAnchors,...['recipe','far','mid','near'].map(k=>p.arena[k])])need(isCanonicalPath(file)&&inputs.has(file),'missing/canonical arena or effect input');
 }
 return result;
}
export function validateSweep(m,results){validateManifest(m);return previousSweep(m,results);}
