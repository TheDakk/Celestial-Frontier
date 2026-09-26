/** D17 supersedes the old phase-off/maximum-Command-margin diagnostic. */
import {createHash} from 'node:crypto';
import {POLICY, STANCES, policies, applyPolicy, win} from './s20-balance-contract.mjs';
export const hash = x => createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(x)).digest('hex');
export function planFromForecast(api, plan, samples = 16, forecastSeedBase = 120000000) {
  // Freeze public stats BEFORE substituting independent RNG seeds. Never forecast the battle's own seeds.
  const frozen = {...plan, defender: {...plan.defender, stats: api.battleStats(plan.defender.genome)},
    party: plan.party.map(f => ({...f, stats: api.battleStats(f.genome)}))};
  let score = -1, choice;
  for (const candidate of policies(plan.party.length)) {
    const p = applyPolicy(frozen, candidate); let wins = 0;
    for (let i = 0; i < samples; i++) {
      const seed = forecastSeedBase + i * 101;
      wins += win(api.runEncounterV1({...p, defender: {...p.defender, genome: {seed: seed + 71}},
        party: p.party.map((f, j) => ({...f, genome: {seed: seed + candidate.order[j] * 17}}))}));
    }
    if (wins > score) {score = wins; choice = candidate;}
  }
  return choice;
}
export function playCommand(api, plan, policy) {
  const decisions = []; let r = api.runEncounterV1({...plan, mode: 'command'});
  while (r.status === 'paused') {
    const b = r.pendingBreak; let choice = 'hold';
    if (b.options.includes('swap') && b.nextIndex !== null) {
      const next = api.battleStats(plan.party[b.nextIndex].genome), current = api.battleStats(plan.party[b.fighterIndex].genome);
      if (b.kind === 'low-hp' && b.defenderHp / b.defenderMax >= b.fighterHp / b.fighterMax * policy.lowRatio) choice = 'swap';
      if (b.kind === 'phase' && b.fighterHp / b.fighterMax <= policy.phaseHp && next.fer / current.fer >= policy.nextFerRatio) choice = 'swap';
    }
    if (!b.options.includes(choice)) throw Error('learned policy chose an unavailable option');
    decisions.push(choice); if (decisions.length > 16) throw Error('Command bound');
    r = api.runEncounterV1({...plan, mode: 'command'}, decisions);
  }
  return {result: r, decisions};
}
export function assessProduction(report, candidate, epoch) {
  const failures = [], fail = x => failures.push(x), declaration = report.purpose === 'training' ? epoch.training : epoch.evaluation, n = declaration.count;
  if (hash(epoch) !== '7fcaed142e2911c1fc375757d39eea11c8fbb7995d74ddfbea7a26074e4e539d' || report.epochHash !== hash(epoch)) fail('epoch authority');
  if (!['training','evaluation'].includes(report.purpose)) fail('purpose');
  if (report.scope?.dispatch !== 'production settlement planner') fail('production dispatch');
  if (report.productionCases !== n * 12 || report.productionMismatches !== 0 || report.phaseDispatchCases !== n * 8) fail('production transcript coverage');
  const count = x => Number.isSafeInteger(x) && x >= 0 && x <= n;
  if (report.schema !== 'cf-s4-production-evaluation/v1' || report.count !== n) fail('schema/count');
  if (report.candidateHash !== hash(candidate)) fail('candidate authority');
  if (report.seedBase !== declaration.seedBase || report.hookSeedBase !== declaration.hookSeedBase || report.forecastSeedBase !== epoch.forecast.seedBase) fail('disjoint seed authority');
  const rows = report.cohorts ?? [];
  if (rows.map(r => r.id).sort().join(',') !== 'easy,guardian,normal,titan') fail('cohort inventory');
  for (const r of rows) {
    if (![r.baselineWins, r.plannedWins, r.commandWins].every(count)) {fail(r.id + ': counts'); continue;}
    const gap = 100 * (r.plannedWins - r.baselineWins) / n;
    if (r.id === 'easy') {
      if (gap < 0 || gap >= 5 || r.baselineWins / n < .9) fail('easy: planning/readiness');
    } else {
      if (gap < 10 || gap > 20) fail(r.id + ': planning gap ' + gap);
      if ([r.baselineWins, r.plannedWins].some(x => x / n < .2 || x / n > .8)) fail(r.id + ': readiness');
    }
    if (['guardian', 'titan'].includes(r.id)) {
      // Learned, executable policy, NOT the future-aware oracle upper bound.
      if (100 * (r.commandWins - r.plannedWins) / n < 5) fail(r.id + ': playable Command edge');
      if (!count(r.oracleWins) || r.oracleWins < Math.max(r.commandWins, r.plannedWins)) fail(r.id + ': oracle bound');
      if (!(r.phaseNodes > 0 && r.withdrawnTerminals > 0 && r.swapEdges > 0)) fail(r.id + ': phase/swap/withdraw coverage');
      if (!count(r.solo?.v1Wins) || !count(r.solo?.phaseWins) || Math.abs(r.solo.phaseWins - r.solo.v1Wins) * 100 / n > 5) fail(r.id + ': solo v1 band');
    }
  }
  const threats = report.threats ?? [];
  if (candidate.threats.map(t => t.id).sort().join(',') !== POLICY.threats.map(t => t[0]).sort().join(',')) fail('candidate threat inventory');
  for (const [id, ab] of POLICY.threats) {
    const t = candidate.threats.find(t => t.id === id);
    if (!t || hash(t.ab) !== hash(ab) || !STANCES.slice(1).includes(t.right) || !STANCES.slice(1).includes(t.wrong) || t.right === t.wrong) fail(id + ': frozen threat authority');
  }
  if (threats.map(x => x.id).sort().join(',') !== candidate.threats.map(x => x.id).sort().join(',')) fail('threat inventory');
  for (const t of candidate.threats) {
    const r = threats.find(x => x.id === t.id);
    if (!r || !STANCES.every(s => count(r.wins?.[s])) || !(r.wins[t.right] > r.wins.balanced && r.wins[t.wrong] < r.wins.balanced)) fail(t.id + ': authored trade-off');
  }
  for (const s of STANCES.slice(1)) if (threats.length && threats.every(r => STANCES.every(t => r.wins?.[s] >= r.wins?.[t]))) fail(s + ': globally best');
  if (report.replayCases !== n * 4 || report.parityCases !== n * 2 || report.replayMismatches !== 0 || report.parityMismatches !== 0) fail('replay/phase-off parity');
  return {status: failures.length ? 'RED' : 'PASS', failures};
}
