export function admitManualPhoneStart(c,started,ending,largest){
 if(started||ending||!c?.secureContext||!c.crossOriginIsolated||!c.adapterAvailable||!c.shaderF16||!Number.isFinite(c.maxBufferSize)||c.maxBufferSize<largest||typeof c.userAgent!=='string'||!c.userAgent.includes('iPhone'))throw Error('Single secure phone start refused');
}
export function admitManualPhoneResult(d,textRequests){
 if(d?.sessionCreates?.text!==0||['encode','denoise','decode'].some(k=>d.sessionCreates[k]!==1)||d.organismPasses!==0||d.measurements?.length!==1||!Number.isFinite(d.elapsedMs)||d.elapsedMs<=0||textRequests.length)throw Error('Three-session result refused');
}
