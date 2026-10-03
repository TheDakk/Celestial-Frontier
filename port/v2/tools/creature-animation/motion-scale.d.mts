export type MotionScaleReference={readonly kind:'span';readonly axis:readonly [string,string]}|{readonly kind:'longest-chain';readonly origin:string};
export const MOTION_SCALE_REFERENCES:Readonly<Record<string,MotionScaleReference>>;
export function motionScaleReference(template:{readonly id?:string;readonly bodyAxis?:readonly [string,string]}):MotionScaleReference;
export function measureMotionScale(template:{readonly id?:string;readonly bodyAxis?:readonly [string,string];readonly graph:ReadonlyArray<readonly [string,string]>},landmarks:Readonly<Record<string,readonly [number,number]>>):{reference:MotionScaleReference;length:number};
