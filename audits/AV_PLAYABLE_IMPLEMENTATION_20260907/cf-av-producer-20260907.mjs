import fs from 'node:fs';
import { collectCurrentProducerAuthorities } from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/print-producer-authorities.mjs';
const report = collectCurrentProducerAuthorities();
fs.writeFileSync('/private/tmp/cf-av-producer-20260907.json', JSON.stringify(report,null,2)+'\n', {flag:'wx'});
console.log(JSON.stringify({compendium:report.compendium.producer.sha256,measurement:report.compendium.measurement.sha256,measurementMatches:report.compendium.measurementBudgetMatches,producerMatches:report.compendium.producerBudgetMatches,sceneMemoryMatches:report.sceneMemory.budgetMatches}));
