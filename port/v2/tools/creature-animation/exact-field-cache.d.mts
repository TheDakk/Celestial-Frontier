/** A single owner-private exact Float32 field entry; changed input always invokes solve. */
export function createExactFieldCache(
  length:number,
  solve:(target:Float32Array,output:Float32Array)=>void,
):(target:Float32Array,output:Float32Array)=>void;
