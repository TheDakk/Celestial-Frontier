(()=>{const schedule=window.setTimeout.bind(window),cancel=window.clearTimeout.bind(window);window.__timerTrace=[];
window.setTimeout=(fn,ms,...args)=>{const r={kind:'timer',ms,scheduled:performance.now(),stack:new Error().stack,source:String(fn).slice(0,200),fired:null,canceled:null};const id=schedule(typeof fn==='function'?()=>{r.fired=performance.now();return fn(...args)}:fn,ms);r.id=id;window.__timerTrace.push(r);return id};
window.clearTimeout=id=>{for(const r of window.__timerTrace)if(r.id===id)r.canceled=performance.now();return cancel(id)};
})()
window.__keyTrace={count:0,byKey:{},last:[]};document.addEventListener('keydown',e=>{const k=window.__keyTrace;k.count++;k.byKey[e.key]=(k.byKey[e.key]||0)+1;k.last.push({key:e.key,code:e.code,repeat:e.repeat,trusted:e.isTrusted,keyCode:e.keyCode,target:e.target?.id,time:e.timeStamp});if(k.last.length>16)k.last.shift();},true);
