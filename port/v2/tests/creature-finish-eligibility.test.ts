import {createHash} from 'node:crypto';
import {expect,it} from 'vitest';
import {compileCreatureFinishV1} from '../apps/game/src/landfall-conditioning.js';
// @ts-expect-error Shared worker JavaScript has no declaration file.
import {admitCreatureFinishJob,CREATURE_FINISH_SETTINGS} from '../../../tools/local-image-generation/creature-finish-math.mjs';
it('the compiled application and worker agree on D26 and give the retired policy a different identity',()=>{
 const ref={url:'/inputs/source.rgba',sha256:'a'.repeat(64),width:128,height:128};
 const job=compileCreatureFinishV1({recordRecipeHash:'b'.repeat(64),cutoutAssetHash:'c'.repeat(64),seed:42,width:128,height:128,master:ref,labels:ref});
 expect(job.settings).toEqual(CREATURE_FINISH_SETTINGS);
 expect(job.settings.interiorAlphaMin).toBe(250);
 expect(admitCreatureFinishJob(job,'Macintosh')).toBe(job);
 const {interiorAlphaMin:_,...retiredSettings}=job.settings;
 const digest=(settings:unknown)=>createHash('sha256').update(JSON.stringify({settings,prompt:job.prompt,seed:job.seed})).digest('hex');
 expect(digest(job.settings)).not.toBe(digest(retiredSettings));
 expect(()=>admitCreatureFinishJob({...job,settings:retiredSettings},'Macintosh')).toThrow(/settings/);
});
