export interface ArapPassInput {rest:Float64Array;rows:Uint32Array;neighbours:Uint32Array;reciprocals:Float64Array;starts:Uint32Array;deltas:Float64Array;lambda:Float64Array;}
export interface WasmArapPass {readonly kind:'wasm';readonly position:Float64Array;readonly target:Float64Array;readonly rotation:Float64Array;readonly rhs:Float64Array;readonly byteLength:number;readonly normalPasses:number;readonly robustFallbacks:number;runPass(sweeps:number):boolean;}
export function createWasmArapPass(input:ArapPassInput,runtime?:typeof WebAssembly|null):WasmArapPass|null;
