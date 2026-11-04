// Literal current source membership; no audit/shadow copies are test targets.
export default {test:{environment:'node',maxWorkers:2,include:[
 'port/v2/apps/game/src/motion/dry-serpent-victory.test.ts',
 'port/v2/apps/game/src/motion/aquatic-serpent-victory.test.ts',
 'port/v2/apps/game/src/motion/serpent-victory.test.ts'
]}};
