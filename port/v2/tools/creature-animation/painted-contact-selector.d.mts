export interface PaintedContactVertex {
 readonly triangle:readonly number[];
 readonly barycentric:readonly number[];
}
/** Exact historical runtime arithmetic. Empty surfaces return undefined. */
export function selectPaintedContactVertex<V extends PaintedContactVertex>(
 vertices:ReadonlyArray<{readonly x:number;readonly y:number}>,
 part:{readonly vertices:ReadonlyArray<V>},
 end:readonly [number,number],width:number,height:number
):{vertexIndex:number;rest:[number,number];distancePx:number;vertex:V}|undefined;
