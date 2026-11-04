import fs from 'node:fs';import {rebindFinished} from '../../AI_FINISH_C121_20261001/rebind-batch.mjs';
const base='audits/C234_PROGRAM_20261011/phase1';
for(const [list,finish,out]of [['refinish-subjects.json','finish-01','rebound-new'],['retained-subjects.json','retained-finish','rebound-retained']]){const result=await rebindFinished(JSON.parse(fs.readFileSync(base+'/'+list)),base+'/'+finish,base+'/'+out);console.log(result.map(r=>({id:r.id,status:r.status,error:r.error})));if(result.some(r=>r.status!=='PASS'))process.exit(1);}
