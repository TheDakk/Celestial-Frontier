import fs from 'node:fs';import path from 'node:path';import {spawn,execFileSync} from 'node:child_process';
const dir=import.meta.dirname,plan=JSON.parse(fs.readFileSync(dir+'/cases.json')).filter(r=>r.name==='shark').map(r=>({...r,script:dir+'/shark-script-02.json'})),producer=JSON.parse(fs.readFileSync(dir+'/producer.json'));const results=[];
for(const row of plan){
 const head=execFileSync('git',['-C',producer.sourceRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim();if(head!==producer.sourceHead)throw Error('actual branch changed; no mixed source batch');
 const dirty=execFileSync('git',['-C',producer.sourceRoot,'status','--porcelain','--','port/v2'],{encoding:'utf8'}).trim();if(dirty)throw Error('Claude runtime source is dirty');
 const out=path.join(dir,row.name+'-actual-02');if(fs.existsSync(out))throw Error('no unchanged retry: '+out);
 const fd=fs.openSync(out+'.log','wx'),host=[];const sample=()=>{const ps=execFileSync('ps',['-axo','pid=,comm=,args='],{encoding:'utf8'}).split('\n').filter(s=>s.includes(producer.sourceRoot)&&/\b(node|vitest|vite|tsc|ffmpeg)\b/.test(s));host.push({at:new Date().toISOString(),processes:ps});};sample();const interval=setInterval(sample,1000);
 console.log('START '+row.name);
 const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[dir+'/native-actual-runner.mjs',row.fit,row.fit,out,row.script],{cwd:path.resolve(dir,'../..'),env:{...process.env,CF_CPU_THROTTLE:'4'},stdio:['ignore',fd,fd]});child.on('error',reject);child.on('close',resolve);});clearInterval(interval);fs.closeSync(fd);sample();fs.writeFileSync(out+'-host.json',JSON.stringify(host,null,2)+'\n');
 const r=JSON.parse(fs.readFileSync(out+'/report.json'));results.push({name:row.name,code,status:r.status,error:r.error??null});fs.writeFileSync(dir+'/batch-results-02.json',JSON.stringify(results,null,2)+'\n');console.log('END '+row.name+' '+r.status+' '+JSON.stringify(r.capture?.refusalsAtEnd));
}
