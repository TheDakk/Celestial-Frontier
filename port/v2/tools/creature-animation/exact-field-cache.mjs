/** One exact Float32 field entry, private to one immutable admitted rig.
 * This is memoization of a pure solve, never a previous-pose warm start.
 * Changed input invalidates before work; refused solves are never retained. */
export function createExactFieldCache(length,solve){
 if(!Number.isInteger(length)||length<1||length>80000||typeof solve!=='function')throw Error('Exact field cache: invalid owner');
 const input=new Float32Array(length),result=new Float32Array(length);let valid=false;
 return function(target,output){
  if(!(target instanceof Float32Array)||!(output instanceof Float32Array)||target.length!==length||output.length!==length)throw Error('Exact field cache: Float32 field required');
  if(target.buffer===output.buffer&&target.byteOffset<output.byteOffset+output.byteLength&&output.byteOffset<target.byteOffset+target.byteLength)throw Error('Exact field cache: separate input/output required');
  let same=valid;
  if(same)for(let i=0;i<length;i++)if(!Object.is(target[i],input[i])){same=false;break;}
  if(same){output.set(result);return;}
  valid=false;
  solve(target,output);
  input.set(target);result.set(output);valid=true;
 };
}
