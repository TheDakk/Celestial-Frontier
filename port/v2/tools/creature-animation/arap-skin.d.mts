export interface ArapOptions {iterations?:number;globalIterations?:number;targetWeight?:number;pins?:ReadonlyArray<number>;orientationIterations?:number;minimumAreaRatio?:number;}
export interface ArapStats {rigid:boolean;maximumTargetErrorPx:number;rmsTargetErrorPx:number;maximumProjectionPx:number;flippedTriangles:number;minimumAreaRatio:number;orientationPasses:number;}
export interface ArapScratch {readonly sweepBackend:'wasm'|'js';readonly normalPasses:number;readonly robustFallbacks:number;readonly n:number;readonly width:number;readonly height:number;readonly stats:ArapStats;}
export function createArapScratch(vertices:ReadonlyArray<{x:number;y:number}>,triangles:ReadonlyArray<number>|Uint32Array,width:number,height:number,options?:ArapOptions):ArapScratch;
export function solveArapSkin(scratch:ArapScratch,targets:Float32Array|Float64Array,output:Float32Array|Float64Array):ArapStats;
