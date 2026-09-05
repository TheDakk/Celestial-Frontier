import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getGuideCatalogue } from '../apps/game/src/guide-content.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const glassSource = readFileSync(path.join(here, '..', 'tools', 'glassmatrix.mjs'), 'utf8');

const DISCOVER_LIFE_REQUIRED = Object.freeze([
  'living planet’s Survey card offers Discover Life before or after landing',
  'Ordinary card inspection remains write-free',
  'records that exact living world and resolves one deterministic hazard draw',
  "On ordinary worlds, it catalogues no species and spends no Biosphere Yield",
  "At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record",
  "It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield",
  "Repeat sightings add no duplicate record or discovery reward",
  "Binder Claim becomes available at ten exact Paragons and pays its established 120 Stardust once",
  "discovering a Paragon never pays that Set reward automatically",
  "A development save that recorded a Paragon home before this feature keeps its already-recorded Bioscan refusal; returning does not backfill the Paragon",
  'assigned Field Scout takes the nonlethal wound and is capped at Critical',
  'otherwise the explorer remains at or above 1 HP',
]);

const BIOSCAN_REQUIRED = Object.freeze([
  'first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol',
  'banks that world’s one Chapter 2 life-discovery tick in the same capture transaction',
  'A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing',
  'Chapter 2 capture milestone is separate from the live Discover Life action',
  'accepted Discover Life Starter Charter completes only from a later explicit Bioscan',
  'in that same receipt',
  'older Surveys and capture do not count',
  'Weekly bioscan Charters remain protected until their separate lifecycle is complete',
]);

const BIOSCAN_CONTRADICTIONS = Object.freeze([
  'Capture completes an accepted or weekly bioscan Charter.',
  'Ordinary Survey inspection records the living world.',
  'Discover Life catalogues one species.',
  'Discover Life spends 1 Biosphere Yield.',
  'A safe Discover Life scan grants survivor.',
  'A Scout-intercepted hostile Discover Life scan grants no survivor.',
]);

const DISCOVER_LIFE_CONTRADICTION =
  'An older Survey completes the accepted Discover Life Starter Charter retroactively.';

function exactSpan(source: string, start: string, end: string): string | null {
  const startIndex = source.indexOf(start);
  if (startIndex < 0 || startIndex !== source.lastIndexOf(start)) return null;
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (endIndex < 0 || endIndex !== source.lastIndexOf(end)) return null;
  return source.slice(startIndex, endIndex);
}

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function glassBioscanCopyContract(source: string): boolean {
  const ingress = exactSpan(
    source,
    'const renderedGuideIngress = await evalIn',
    'const guideReleaseBaseline = await evalIn',
  );
  const assessment = exactSpan(
    source,
    'const developmentDetailCheck = `',
    'const developmentDetail = await evalIn(developmentDetailCheck);',
  );
  const controls = exactSpan(
    source,
    'const detailControls = await evalIn',
    'if (!detailControls.ok)',
  );
  if (!ingress || !assessment || !controls) return false;

  const discoverOwner = exactSpan(ingress, 'const discoverLifeRequired=[', '],bioscanRequired=[');
  const renderedGuideContract = discoverOwner !== null && ingress.includes("name:'discover-bioscan'")
    && occurrences(ingress,
      'requiredControls:[...discoverLifeRequired,...bioscanRequired]') === 1
    && occurrences(ingress,
      "requiredControls:[...bioscanRequired,...breedCharterRequired,...[\"At an exact fixed Paragon home, that same Bioscan can also add only the exact Paragon catalogue record\", \"it creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield\", \"This catalogue exception does not count as the Chapter 2 capture milestone\"]]") === 2
    && DISCOVER_LIFE_REQUIRED.every((copy) => discoverOwner!.includes(copy))
    && BIOSCAN_REQUIRED.every((copy) => ingress.includes(copy))
    && BIOSCAN_CONTRADICTIONS
      .every((copy) => ingress.includes(copy))
    && !ingress.includes("required:['Capture never banks the Charter’s separate bioscan milestone")
    && !ingress.includes("required:['Planetside capture is separate and never banks the Charter’s bioscan milestone")
    && !ingress.includes("required:['Planetside capture never banks the Charter’s separate bioscan milestone")
    && !ingress.includes('v2’s current replacement for v1.8.9’s separate Discover Life action')
    && !ingress.includes('Survey Records and accepted or weekly bioscan Charters remain unavailable');

  const releaseAssessmentContract = assessment.includes('captureBioscanContradiction=')
    && assessment.includes('discoverLifeContradiction=')
    && assessment.includes("captureText.includes('living planet’s Survey card offers explicit Discover Life before or after landing')")
    && assessment.includes("captureText.includes('Ordinary inspection stays write-free')")
    && assessment.includes("captureText.includes('On ordinary worlds, the action records that exact world and resolves one shown deterministic hazard without cataloguing a species or spending Biosphere Yield')")
    && assessment.includes("captureText.includes('Any hostile outcome owns survivor in that same receipt whether Scout or explorer absorbs the wound')")
    && assessment.includes("captureText.includes('safe scans do not')")
    && assessment.includes("captureText.includes('Capture remains a separate landed action')")
    && assessment.includes("captureText.includes('first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol also banks that world’s one Chapter 2 life-discovery tick in the same capture transaction')")
    && assessment.includes("captureText.includes('That Chapter 2 milestone is separate from Discover Life')")
    && assessment.includes("captureText.includes('accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt')")
    && assessment.includes("captureText.includes('older Surveys and capture do not count')")
    && assessment.includes("captureText.includes('Weekly bioscan Charters remain protected until their separate lifecycle is complete')")
    && assessment.includes('||captureBioscanContradiction')
    && assessment.includes('&&!captureContradiction&&!discoverLifeContradiction')
    && assessment.includes('honest=!overclaim&&!captureContradiction&&!discoverLifeContradiction')
    && assessment.includes('captureBioscanContradiction,discoverLifeContradiction')
    && !assessment.includes('discoverLifeAvailabilityContradiction=')
    && !assessment.includes('v2’s current replacement for v1.8.9’s separate Discover Life action');

  const releaseControlContract = controls.includes('captureLimitControls.length===16')
    && controls.includes('captureContradictions.length===5')
    && controls.includes('bioscanContradictions.length===19')
    && controls.includes('living planet’s Survey card offers explicit Discover Life before or after landing')
    && controls.includes('Any hostile outcome owns survivor in that same receipt whether Scout or explorer absorbs the wound')
    && controls.includes('Capture remains a separate landed action')
    && controls.includes('accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt')
    && controls.includes('older Surveys and capture do not count')
    && controls.includes('Weekly bioscan Charters remain protected until their separate lifecycle is complete')
    && BIOSCAN_CONTRADICTIONS.every((copy) => controls.includes(copy))
    && occurrences(controls, DISCOVER_LIFE_CONTRADICTION) === 2
    && controls.includes('row.result?.discoverLifeContradiction===true')
    && controls.includes('discoverLifeChanged&&discoverLifeContradictory?.ok===false')
    && controls.includes('discoverLifeContradictory?.discoverLifeContradiction===true')
    && !controls.includes('discoverLifeAvailabilityContradiction')
    && !controls.includes('v2’s current replacement for v1.8.9’s separate Discover Life action');

  return renderedGuideContract && releaseAssessmentContract && releaseControlContract;
}


interface GuideReplayResult {
  readonly ok: boolean;
  readonly error: string | null;
  readonly product: { readonly ok: boolean; readonly expectedCount: number } | null;
  readonly instrument: { readonly ok: boolean } | null;
  readonly baselineRows: readonly { readonly id: string; readonly current: { readonly ok: boolean } }[];
  readonly rows: readonly {
    readonly id: string;
    readonly controlRejected: boolean;
    readonly requiredControlsRejected: boolean;
    readonly contradictionRejected: boolean;
    readonly restored: boolean;
  }[];
}

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options: Record<string, unknown>) => {
    readonly window: {
      readonly document: Document;
      eval(source: string): unknown;
      close(): void;
    };
  };
};

// Replay the existing browser expression unchanged. Only search/topic mounting
// is supplied here; every copy carrier, mutation, and restoration check remains
// the actual Glass owner, using the current authored Guide bodies.
async function replayRenderedGuideControls(source: string): Promise<GuideReplayResult> {
  const helpers = exactSpan(source,
    'function guideRequiredControlRejected(',
    '/* Reconstruct the exact generated Shipyard predicate');
  const owner = exactSpan(source,
    'const renderedGuideIngress = await evalIn(`',
    '          recordRenderedGuideIngressResult({');
  expect(helpers).not.toBeNull();
  expect(owner).not.toBeNull();
  if (!helpers || !owner) throw new Error('Guide replay owner missing');
  const template = owner.slice('const renderedGuideIngress = await evalIn('.length).trim();
  expect(template.endsWith(');')).toBe(true);
  const expression = Function(`${helpers}\nreturn (${template.slice(0, -2)});`)() as string;
  const topics = new Map<string, ReturnType<typeof getGuideCatalogue>[number]['topics'][number]>(getGuideCatalogue().flatMap((category) =>
    category.topics.map((topic) => [topic.id, topic] as const)));
  const dom = new JSDOM('<input id="guidesearch"><div id="guidepanel"></div>',
    { runScripts: 'outside-only' });
  const document = dom.window.document;
  const input = document.querySelector<HTMLInputElement>('#guidesearch');
  const panel = document.querySelector<HTMLElement>('#guidepanel');
  if (!input || !panel) throw new Error('Guide replay DOM missing');
  input.addEventListener('input', () => {
    panel.replaceChildren();
    const topic = topics.get(input.value);
    if (!topic) return;
    const row = document.createElement('button');
    row.dataset.guideTopic = topic.id;
    row.addEventListener('click', () => {
      panel.innerHTML = `<article class="guide-topic">${topic.body}</article>`;
    });
    panel.append(row);
  });
  try {
    return await dom.window.eval(expression) as GuideReplayResult;
  } finally {
    dom.window.close();
  }
}

function failedGuideControls(result: GuideReplayResult): string[] {
  return result.rows.filter((row) => !row.controlRejected || !row.requiredControlsRejected
    || !row.contradictionRejected || !row.restored).map((row) => row.id);
}

describe('Glass Charter bioscan Guide/copy source contract', () => {

  it('executes all current rendered Guide carrier, removal, contradiction, and restoration controls', async () => {
    const result = await replayRenderedGuideControls(glassSource);
    expect(result.error).toBeNull();
    expect(result.product).toMatchObject({ ok: true, expectedCount: 23 });
    expect(result.baselineRows).toHaveLength(23);
    expect(result.baselineRows.every((row) => row.current.ok)).toBe(true);
    expect(result.rows).toHaveLength(23);
    expect(failedGuideControls(result)).toEqual([]);
    expect(result.instrument?.ok).toBe(true);
    expect(result.ok).toBe(true);
  });

  it.each([
    ['bioscan', ['discover-bioscan', 'charters', 'ascent']],
    ['audio', ['discover-audio']],
  ] as const)('rejects the historical %s false-green predicate and restores every topic', async (kind, failedIds) => {
    const marker = kind === 'bioscan'
      ? "              'Capture completes an accepted or weekly bioscan Charter',\n"
      : "              'Creature calls and inhabited-world signals are not available in this development slice',\n";
    expect(occurrences(glassSource, marker)).toBe(1);
    let mutant = glassSource.replace(marker, '');
    if (kind === 'audio') {
      const currentTarget = "name:'discover-audio',paragraph:5";
      expect(occurrences(mutant, currentTarget)).toBe(1);
      mutant = mutant.replace(currentTarget, "name:'discover-audio',paragraph:4");
    }
    const result = await replayRenderedGuideControls(mutant);
    expect(result.error).toBeNull();
    expect(result.product?.ok).toBe(true);
    expect(failedGuideControls(result)).toEqual(failedIds);
    expect(result.rows.every((row) => row.restored)).toBe(true);
    expect(result.instrument?.ok).toBe(false);
    expect(result.ok).toBe(false);
  });

  it('binds rendered Guide and release evidence to the durable non-Sol first-success rule', () => {
    expect(glassBioscanCopyContract(glassSource)).toBe(true);
  });

  it('fails closed when any required rule, contradiction, or independent availability control is removed', () => {
    const mutationMarkers = [
      "name:'discover-bioscan'",
      ...DISCOVER_LIFE_REQUIRED,
      ...BIOSCAN_REQUIRED,
      ...BIOSCAN_CONTRADICTIONS,
      DISCOVER_LIFE_CONTRADICTION,
      'captureBioscanContradiction=',
      'discoverLifeContradiction=',
      'captureLimitControls.length===16',
      'bioscanContradictions.length===19',
      'discoverLifeChanged&&discoverLifeContradictory?.ok===false',
      'discoverLifeContradictory?.discoverLifeContradiction===true',
    ];
    for (const [index, marker] of mutationMarkers.entries()) {
      const mutated = glassSource.replace(marker, `glass-bioscan-mutation-${index}`);
      expect(mutated, marker).not.toBe(glassSource);
      expect(glassBioscanCopyContract(mutated), marker).toBe(false);
    }
  });

  it('keeps the Paragon Guide/release clauses and their existing omission/restoration controls mandatory', () => {
    const bounds = [["const renderedGuideIngress = await evalIn", "const guideReleaseBaseline = await evalIn"], ["const developmentDetailCheck = `", "const developmentDetail = await evalIn(developmentDetailCheck);"], ["const detailControls = await evalIn", "if (!detailControls.ok)"]] as const;
    const markers = ["At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record", "It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "Repeat sightings add no duplicate record or discovery reward", "A development save that recorded a Paragon home before this feature keeps its already-recorded Bioscan refusal; returning does not backfill the Paragon", "which opens that exact existing Compendium record without travel or acquisition", "Missing silhouettes plot their source-proven homes, while found entries use Inspect to open the exact Compendium record without travel", "Seeker of Legends is a separate Binder Claim at ten exact Paragons for 120 Stardust once", "Discover Life at an exact fixed home adds only that Paragon catalogue record in the same verified save", "Seeker of Legends becomes claimable after ten exact Paragons through a separate Binder Claim and pays its established 120 Stardust once", "Found Paragons plot a course instead of opening Inspect.", "Missing silhouettes open Inspect instead of plotting a course.", "Discover Life on any world adds a Paragon catalogue record.", "An ordinary-world Bioscan catalogues a species.", "A Paragon sighting creates an owned companion.", "A Paragon sighting creates a specimen.", "A Paragon sighting grants Capture credit.", "A Paragon sighting spends 1 Biosphere Yield.", "A Paragon sighting automatically pays 120 Stardust.", "Seeker of Legends is claimable after one Paragon.", "Repeat Paragon sightings add a discovery reward.", "A prior Paragon-set claim can pay again.", "Returning to a previously recorded Paragon home backfills its catalogue record.", "paragonCopyMissing.length===14", "paragonCopyContradictions.length===13", "paragon?.textContent===paragonText"] as const;
    const contract = (input: string): boolean => {
      const bodies: string[] = [];
      for (const [start, end] of bounds) {
        if (input.split(start).length !== 2 || input.split(end).length !== 2) return false;
        const left = input.indexOf(start), right = input.indexOf(end, left + start.length);
        if (right <= left) return false;
        bodies.push(input.slice(left, right));
      }
      const owned = bodies.join('\n');
      return markers.every((marker) => owned.includes(marker));
    };
    expect(contract(glassSource)).toBe(true);
    for (const marker of markers) {
      const changed = glassSource.split(marker).join('Paragon consumer control omitted');
      expect(changed, marker).not.toBe(glassSource);
      expect(contract(changed), marker).toBe(false);
      expect(contract(glassSource), marker + ' restored').toBe(true);
    }
  });
});
