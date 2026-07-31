/* A mid-game save, built from the build's OWN makeGenome so every codex entry is
   a valid genome. Seeded only with what is safe to fabricate: the Compendium,
   cargo, essence and the onboarding flags. World state (landed/mined/conquered)
   is left empty — the bot reaches that by actually landing, which is the point. */
import M from './model9.mjs';
import fs from 'fs';
const { makeGenome } = M;
const codex = [];
// 14 fauna, 10 flora — enough for breed pairings, feed flavours and duels
for (let i=0;i<14;i++) codex.push({ g: makeGenome((770000+i*7919)>>>0, 'fauna', 0.5), f:'Veteran', w:null });
for (let i=0;i<10;i++) codex.push({ g: makeGenome((880000+i*7919)>>>0, 'flora', 0.5), f:'Veteran', w:null });
const save = {
  v:4, at:Date.now(), me:'Veteran', hp:100,
  pstats:{vit:120,fer:90,gra:85,cun:80,res:95},
  tut:1, guide:1,            // past onboarding
  land:[133], landings:1, scout:null,
  essence:9000,
  cargo:[['Fe',800],['Si',700],['Au',500],['Cu',600],['Ti',400],['C',900]],
  cgx:[], items:[], eq:{}, ea:{},
  codex, seen:[],
  chw:-1, chp:{}, chacc:[], chs:[],
  minedw:[], mx:[], skx:[], bx:[], tech:[],
  conq:[], surveyed:[], cont:[], log:[],
  xpf:[], ach:[], names:[],
  snd:1, fx:1, vce:1, cbx:1, tips:1,
};
fs.writeFileSync('/root/cf/v9out/veteran-save.json', JSON.stringify(save));
console.log('veteran save:', JSON.stringify(save).length, 'bytes ·', codex.length, 'codex entries',
  '(', codex.filter(c=>c.g.kingdom==='fauna').length, 'fauna /', codex.filter(c=>c.g.kingdom==='flora').length, 'flora )');
