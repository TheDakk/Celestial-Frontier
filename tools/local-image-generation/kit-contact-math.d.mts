export function erodeAlpha(alpha:Uint8Array,w:number,h:number,r?:number):Uint8Array;
export const pinkExcess:(r:number,g:number,b:number)=>number;
export function alphaBounds(alpha:Uint8Array,w:number,h:number):{x:number;y:number;width:number;height:number};
export function keyAndDespill(rgba:Uint8ClampedArray,w:number,h:number,options?:{terrainLayer?:boolean}):{rgba:Uint8ClampedArray;alpha:Uint8Array;bounds:{x:number;y:number;width:number;height:number};receipt:{erodedPixels:number;despilledPixels:number;unresolvedEdgePixels:number}};
