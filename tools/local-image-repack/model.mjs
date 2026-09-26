import {createHash} from 'node:crypto';
import {parseFields,encodeField,concatFields} from './protobuf.mjs';

export const SOURCE_GRAPH_SHA256='1c56c0b6ce5ce474a5ae5cc126ec3201516540e7f743de308dc07c9e72fb6102';
export const DATA_FILE='repacked-scale-zero.data';
export const MAX_GRAPH_BYTES=8*1024*1024;
const fail=message=>{throw Error(message);};
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const fields=bytes=>parseFields(bytes,{maxBytes:MAX_GRAPH_BYTES});
const select=(bytes,n)=>fields(bytes).filter(f=>f.number===n);
function one(bytes,n,wire,optional=false){
  const found=select(bytes,n);
  if(found.length!==1){if(optional&&found.length===0)return undefined;fail(`Expected unique field${n}`);}
  if(found[0].wire!==wire)fail(`Wrong wire for field${n}`);
  return wire===0?found[0].value:found[0].payload;
}
const str=(bytes,n,optional=false)=>{const b=one(bytes,n,2,optional);if(b===undefined)return undefined;
  const s=b.toString('utf8');if(!Buffer.from(s).equals(b))fail('Invalid UTF8 metadata');return s;};
const safeInt=x=>{const n=Number(x);if(!Number.isSafeInteger(n)||n<0)fail('Invalid unsigned integer');return n;};
const product=ds=>{const n=ds.reduce((a,b)=>a*b,1);if(!Number.isSafeInteger(n)||n<=0)fail('Invalid tensor size');return n;};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const safeFile=s=>typeof s==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(s)&&!['.','..'].includes(s);
function dimensions(bytes){
  const dims=[];for(const f of select(bytes,1)){
    if(f.wire===0)dims.push(safeInt(f.value));
    else if(f.wire===2){
      // Read packed uint64 values through the same strict wire parser, retaining
      // the original raw fields when no edit is requested.
      let i=0;while(i<f.payload.length){let end=i;while(end<f.payload.length&&(f.payload[end]&128))end++;
        if(end===f.payload.length)fail('Truncated packed dimensions');
        const value=fields(Buffer.concat([Buffer.from([8]),f.payload.subarray(i,end+1)]))[0].value;
        dims.push(safeInt(value));i=end+1;}
    }else fail('Wrong dimensions wire');
  }
  // Scalar/empty non-target initializers are legal; target geometry is checked separately.
  if(dims.length>8)fail('Invalid dimensions');return dims;
}
function metadata(tensor){
  const name=str(tensor,8),dims=dimensions(tensor),dataType=safeInt(one(tensor,2,0));
  if(!name)fail('Empty initializer name');
  const external={};for(const f of select(tensor,13)){
    if(f.wire!==2)fail('External metadata wire');const k=str(f.payload,1),v=str(f.payload,2);
    if(Object.hasOwn(external,k))fail('Duplicate external key');external[k]=v;
  }
  return {name,dims,dataType,external,raw:tensor};
}
function checkedExternal(tensor,expectedBytes){
  const ex=tensor.external;
  if(!same(Object.keys(ex).sort(),['length','location','offset']))fail('Unsupported external-data metadata keys');
  if(!safeFile(ex.location)||!/^\d+$/.test(ex.offset??'')||!/^\d+$/.test(ex.length??''))fail('Invalid external range');
  const offset=Number(ex.offset),length=Number(ex.length);
  if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(length)||length!==expectedBytes
    ||!Number.isSafeInteger(offset+length))fail('External length/range mismatch');
  if(safeInt(one(tensor.raw,14,0))!==1)fail('Expected external tensor');
  if([4,5,6,7,9,10,11].some(n=>select(tensor.raw,n).length))fail('Ambiguous inline/external tensor data');
  return {location:ex.location,offset,length};
}
export function inspectModel(bytes,{expectedSha256=SOURCE_GRAPH_SHA256,nodeCount=103,blockSize=128}={}){
  if(!Buffer.isBuffer(bytes)||bytes.length>MAX_GRAPH_BYTES)fail('Model byte limit');
  if(expectedSha256!==null&&sha256(bytes)!==expectedSha256)fail('Parent graph SHA mismatch');
  if(![32,128].includes(blockSize)||!Number.isInteger(nodeCount)||nodeCount<1||nodeCount>103)fail('Invalid inspection contract');
  const graph=one(bytes,7,2),opsets=new Map();
  for(const f of select(bytes,8)){
    const domain=str(f.payload,1,true)??'',version=safeInt(one(f.payload,2,0));
    if(opsets.has(domain))fail('Duplicate opset');opsets.set(domain,version);
  }
  if(opsets.size!==2||opsets.get('')!==18||opsets.get('com.microsoft')!==1)fail('Unsupported opsets');
  const tensors=new Map();for(const f of select(graph,5)){
    const t=metadata(f.payload);if(tensors.has(t.name))fail('Duplicate initializer');tensors.set(t.name,t);
  }
  const nodes=select(graph,1),users=new Map(),names=new Set(),targets=[];
  for(const f of nodes){
    const node=f.payload,inputs=select(node,1).map(x=>x.payload.toString('utf8'));
    for(const input of inputs)users.set(input,(users.get(input)??0)+1);
    const name=str(node,3,true)??'',op=str(node,4),domain=str(node,7,true)??'';
    if(name&&names.has(name))fail('Duplicate node name');names.add(name);
    if(op!=='MatMulNBits')continue;
    const outputs=select(node,2);
    if(domain!=='com.microsoft'||!name||inputs.length!==4||inputs.some(x=>!x)||outputs.length!==1||!outputs[0].payload.length)fail('Unsupported MatMulNBits inputs/domain');
    const attrs={};for(const a of select(node,5)){
      const key=str(a.payload,1);if(Object.hasOwn(attrs,key))fail('Duplicate node attribute');
      if(safeInt(one(a.payload,20,0))!==2)fail('Expected integer attribute');attrs[key]=safeInt(one(a.payload,3,0));
    }
    if(!same(Object.keys(attrs).sort(),['K','N','bits','block_size'])||attrs.bits!==8||attrs.block_size!==blockSize
      ||!attrs.K||attrs.K%128!==0||!attrs.N)fail('Unsupported Q8 geometry/attributes');
    const {K,N}=attrs,c=K/blockSize,B=tensors.get(inputs[1]),S=tensors.get(inputs[2]),Z=tensors.get(inputs[3]);
    if(!B||!S||!Z)fail('Missing explicit B/scale/zero initializer');
    if(B.dataType!==2||!same(B.dims,[N,c,blockSize])||S.dataType!==10||!same(S.dims,[N,c])
      ||Z.dataType!==2||!same(Z.dims,[N,c]))fail('Unsupported initializer dtype/shape');
    const ranges={B:checkedExternal(B,N*K),S:checkedExternal(S,2*N*c),Z:checkedExternal(Z,N*c)};
    targets.push({name,raw:node,inputs,K,N,B,S,Z,ranges});
  }
  if(targets.length!==nodeCount)fail('MatMulNBits count mismatch');
  const changed=new Set();for(const t of targets)for(const tensor of [t.B,t.S,t.Z]){
    if(users.get(tensor.name)!==1||changed.has(tensor.name))fail('Shared modified initializer');changed.add(tensor.name);
  }
  // The pinned graph has no target initializer in input/output/value_info. Refuse
  // a newly annotated model instead of retaining conflicting dimension metadata.
  for(const n of [11,12,13])for(const f of select(graph,n))if(changed.has(str(f.payload,1)))fail('Conflicting initializer type annotation');
  return {bytes,graph,targets,tensors,changed,opsets:[...opsets]};
}
export function makePlan(model){
  let offset=0;const tensors=[];
  for(const t of model.targets)for(const role of ['S','Z']){
    const source=t.ranges[role],width=role==='S'?2:1,length=source.length*4;
    if(offset%16!==0||length%16!==0)fail('Unexpected parameter alignment');
    tensors.push({nodeName:t.name,name:t[role].name,role,width,source:{...source},
      output:{location:DATA_FILE,offset,length},dims:[t.N,t.K/32]});offset+=length;
  }
  if(!Number.isSafeInteger(offset)||offset>347332608)fail('Derivative capacity exceeded');
  return {tensors,totalBytes:offset};
}
function rewriteMessage(bytes,fn){return concatFields(fields(bytes).map(f=>fn(f)??f.raw));}
function replaceDims(tensor,newDims){
  const old=select(tensor,1);let index=0;
  if(old.length===1&&old[0].wire===2){
    const payload=Buffer.concat(newDims.map(d=>encodeField(1,0,d).subarray(1)));
    return rewriteMessage(tensor,f=>f.number===1?encodeField(1,2,payload):undefined);
  }
  if(old.length!==newDims.length||old.some(f=>f.wire!==0))fail('Unsupported mixed dimension encoding');
  return rewriteMessage(tensor,f=>f.number===1?encodeField(1,0,newDims[index++]):undefined);
}
function replaceExternal(tensor,output){
  return rewriteMessage(tensor,f=>{
    if(f.number!==13)return undefined;const key=str(f.payload,1);
    if(!['location','offset','length'].includes(key))return undefined;
    return encodeField(13,2,rewriteMessage(f.payload,v=>v.number===2?encodeField(2,2,Buffer.from(String(output[key]))):undefined));
  });
}
export function validatePlan(model,plan){
  if(!plan||!Array.isArray(plan.tensors)||plan.tensors.length!==model.targets.length*2)fail('Invalid parameter plan count');
  let index=0,offset=0;
  for(const old of model.targets)for(const role of ['S','Z']){
    const p=plan.tensors[index++],length=old.ranges[role].length*4;
    if(p.nodeName!==old.name||p.name!==old[role].name||p.role!==role||p.width!==(role==='S'?2:1)
      ||!same(p.source,old.ranges[role])||!same(p.dims,[old.N,old.K/32])
      ||!same(p.output,{location:DATA_FILE,offset,length}))fail('Parameter plan source/range mismatch');
    offset+=length;
  }
  if(plan.totalBytes!==offset)fail('Parameter plan size mismatch');
}
export function deriveGraph(model,plan){
  validatePlan(model,plan);
  const byName=new Map(plan.tensors.map(x=>[x.name,x])),targets=new Map(model.targets.map(t=>[t.name,t]));
  const graph=rewriteMessage(model.graph,f=>{
    if(f.number===1){
      const t=targets.get(str(f.payload,3,true));if(!t)return undefined;
      return encodeField(1,2,rewriteMessage(f.payload,a=>{
        if(a.number!==5||str(a.payload,1)!=='block_size')return undefined;
        return encodeField(5,2,rewriteMessage(a.payload,v=>v.number===3?encodeField(3,0,32):undefined));
      }));
    }
    if(f.number===5){
      const name=str(f.payload,8);if(!model.changed.has(name))return undefined;
      const p=byName.get(name);let result;
      if(p)result=replaceExternal(replaceDims(f.payload,p.dims),p.output);
      else {const t=model.targets.find(x=>x.B.name===name);result=replaceDims(f.payload,[t.N,t.K/32,32]);}
      return encodeField(5,2,result);
    }
  });
  return rewriteMessage(model.bytes,f=>f.number===7?encodeField(7,2,graph):undefined);
}
// Independently compare the serialized result, including raw unknown fields and
// ordering. Only named node block_size and309 initializer dimensions/ranges vary.
function pairs(a,b,visit){
  const x=fields(a),y=fields(b);if(x.length!==y.length)fail('Unexpected protobuf field count change');
  for(let i=0;i<x.length;i++){
    if(x[i].number!==y[i].number||x[i].wire!==y[i].wire)fail('Unexpected protobuf field ordering change');
    if(!visit(x[i],y[i])&&!x[i].raw.equals(y[i].raw))fail('Unexpected preserved-field mutation');
  }
}
export function validateDerivedGraph(parent,derivedBytes,plan){
  validatePlan(parent,plan);
  const derived=inspectModel(derivedBytes,{expectedSha256:null,nodeCount:parent.targets.length,blockSize:32});
  const originalByName=new Map(parent.targets.map(x=>[x.name,x])),plans=new Map(plan.tensors.map(x=>[x.name,x]));
  for(const t of derived.targets){
    const old=originalByName.get(t.name);if(!old||!same(t.inputs,old.inputs)||t.K!==old.K||t.N!==old.N)fail('Derived node identity mismatch');
    if(!same(t.ranges.B,old.ranges.B))fail('B bytes/range changed');
    for(const role of ['S','Z'])if(!same(t.ranges[role],plans.get(t[role].name)?.output))fail('Derived parameter range mismatch');
  }
  pairs(parent.bytes,derivedBytes,(a,b)=>{
    if(a.number!==7)return false;
    pairs(a.payload,b.payload,(g,h)=>{
      if(g.number===1&&originalByName.has(str(g.payload,3,true))){
        pairs(g.payload,h.payload,(n,m)=>{
          if(n.number!==5||str(n.payload,1)!=='block_size')return false;
          pairs(n.payload,m.payload,(u,v)=>u.number===3&&u.value===128n&&v.value===32n);return true;
        });return true;
      }
      if(g.number===5&&parent.changed.has(str(g.payload,8))){
        const name=str(g.payload,8),p=plans.get(name);pairs(g.payload,h.payload,(n,m)=>{
          if(n.number===1)return true; // exact dimensions independently checked above
          if(n.number===13&&p){
            pairs(n.payload,m.payload,(u,v)=>u.number===2&&['location','offset','length'].includes(str(n.payload,1)));return true;
          }
          return false;
        });return true;
      }
      return false;
    });return true;
  });
  return derived;
}

export function expandFour(source,width){
  if(!Buffer.isBuffer(source)||![1,2].includes(width)||source.length%width)fail('Invalid expansion chunk');
  const output=Buffer.allocUnsafe(source.length*4);
  for(let at=0;at<source.length;at+=width)for(let byte=0;byte<width;byte++){
    const value=source[at+byte],base=at*4+byte;
    output[base]=value;output[base+width]=value;output[base+width*2]=value;output[base+width*3]=value;
  }
  return output;
}
// Used against bytes independently re-read from the new output file. No call to
// expandFour; address the old block by floor(newBlock/4), including every byte.
export function verifyParameterExpansion(original,repacked,width){
  if(!Buffer.isBuffer(original)||!Buffer.isBuffer(repacked)||![1,2].includes(width)
    ||original.length%width||repacked.length!==original.length*4)fail('Parameter verification shape mismatch');
  for(let i=0;i<repacked.length;i++){
    const newElement=Math.floor(i/width),byte=i%width,oldElement=Math.floor(newElement/4);
    if(repacked[i]!==original[oldElement*width+byte])fail(`Repacked parameter mismatch at byte${i}`);
  }
  return repacked.length;
}
