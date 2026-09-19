export interface ProjectionRecord {readonly template:{readonly id:string};readonly projection?:string;readonly landmarks:Readonly<Record<string,readonly number[]>>;}
export function poseProjectionSigns(record:ProjectionRecord):Record<string,number>;
export function projectTemplateLimits<T>(template:T,record:ProjectionRecord):T;

export function poseProjectionScales(record:ProjectionRecord):Record<string,number>;
