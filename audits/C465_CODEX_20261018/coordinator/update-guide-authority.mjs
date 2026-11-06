// Bounded constant-data evaluation; update only the matching draft bullet authority.
import fs from 'node:fs';import vm from 'node:vm';import{createHash}from'node:crypto';
const p='port/v2/apps/game/src/release-content.ts',q='port/v2/tools/slicesmoke.mjs';
const source=fs.readFileSync(p,'utf8'),marker='export const V2_DRAFT_RELEASE = ',start=source.indexOf(marker)+marker.length,end=source.indexOf('\n} as const satisfies V2DraftRelease);',start);
if(start<marker.length||end<start)throw Error('draft bounds');
const draft=vm.runInNewContext('('+source.slice(start,end)+'\n})'+')',{V2_DEVELOPMENT_VERSION:'2.0'},{timeout:1000}),bullets=draft.sections.flatMap(s=>s.bullets);
const code=fs.readFileSync(q,'utf8'),pattern=/const GUIDE_DRAFT_BULLET_AUTHORITY = Object\.freeze\(\{\s*count: (\d+),\s*sha256: '([a-f0-9]{64})'/,m=code.match(pattern);
if(!m||bullets.length!==121||Number(m[1])!==121||!bullets.every(x=>typeof x==='string'))throw Error('ordered bullet count/type');
const old='2ecf6f00ff8fb1458211a51473df02bdbda3dd9469b1e77c6c87cf373dc1f202';
if(m[2]!==old||code.split(old).length!==2)throw Error('unexpected predecessor authority');
const motion=bullets.filter(x=>x.includes('CREATURE MOTION STUDIES'));if(motion.length!==1||!motion[0].includes('keep the painted head and jaw in shape'))throw Error('motion note ownership');
const hash=createHash('sha256').update(JSON.stringify(bullets)).digest('hex');
fs.writeFileSync(q+'.tmp',code.replace(old,hash));fs.renameSync(q+'.tmp',q);
fs.writeFileSync('audits/C465_CODEX_20261018/coordinator/draft-pin-change.json',JSON.stringify({status:'PASS',draftBulletCount:121,oldSha256:old,newSha256:hash,changedBullet:'CREATURE MOTION STUDIES',noNewBulletOrVersion:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS',bullets:121,sha256:hash}));
