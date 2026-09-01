import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)), 'utf8');

function ordered(label: string, anchors: readonly string[]) {
  let cursor = -1;
  for (const anchor of anchors) {
    const next = source.indexOf(anchor, cursor + 1);
    if (next < 0) return `${label}: missing ${JSON.stringify(anchor)}`;
    if (next <= cursor) return `${label}: out of order ${JSON.stringify(anchor)}`;
    cursor = next;
  }
  return null;
}

describe('Slice Survey dependent-action causal order', () => {
  it('joins every receipt-bearing Survey and adjacent Share before its dependent action', () => {
    const failures = [
      ordered('desktop Charter', [
        'Charter non-Sol Survey predecessor F4 authority',
        "label: 'Charter non-Sol Survey'",
        'await clickDesktopPoint(gateTravel)',
      ]),
      ordered('desktop Sol', [
        'Sol Survey predecessor F4 authority',
        "label: 'Sol Survey'",
        'if (solSurvey.travel.ok)',
      ]),
      ordered('desktop Earth and Share', [
        'pointer Earth Survey predecessor F4 authority',
        "label: 'pointer Earth Survey'",
        "if (pointerEarthSurvey.cardOpen) await keyIn('Escape', 'Escape')",
        'keyboard Earth Survey predecessor F4 authority',
        "label: 'keyboard Earth Survey'",
        'const surveyCloseCheck =',
        'clipboard denial Share predecessor F4 authority',
        'clipboard denial Share settlement',
        "const deniedCopy = await waitDesktopValue('clipboard denial presentation'",
        'clipboard success Share predecessor F4 authority',
        'clipboard success Share settlement',
        "const acceptedCopy = await waitDesktopValue('clipboard success presentation'",
      ]),
      ordered('keyboard Sol', [
        'keyboard journey Sol Survey predecessor F4 authority',
        "label: 'keyboard journey Sol Survey'",
        "const kSystem = await waitK('keyboard enter Sol'",
      ]),
      ordered('keyboard Earth', [
        'keyboard journey Earth Survey predecessor F4 authority',
        "label: 'keyboard journey Earth Survey'",
        "const kSurface = await waitK('keyboard Earth Land'",
      ]),
      ordered('keyboard repeat Earth', [
        'keyboard journey repeat Earth Survey predecessor F4 authority',
        "label: 'keyboard journey repeat Earth Survey'",
        "await waitK('keyboard repeat Earth surface'",
      ]),
      ordered('phone Earth', [
        'phone Earth Survey predecessor F4 authority',
        "label: 'phone Earth Survey'",
        "const phoneLand = await evalNavPh(phoneCardActionCheck('landcta'))",
      ]),
      ordered('phone repeat Earth', [
        'phone repeat Earth Survey predecessor F4 authority',
        "label: 'phone repeat Earth Survey'",
        "const phoneReland = await evalNavPh(phoneCardActionCheck('landcta'))",
      ]),
      ordered('phone stage-0 fine star', [
        'phone stage-0 fine-star Survey predecessor F4 authority',
        "label: 'phone stage-0 fine-star Survey'",
        'if (blockedFineSurvey.travel.ok)',
      ]),
      ordered('phone stage-2 fine star', [
        'phone stage-2 fine-star Survey predecessor F4 authority',
        "label: 'phone stage-2 fine-star Survey'",
        'if (fineSurvey.travel.ok)',
      ]),
      ordered('collision named Search through Land', [
        'collision named Search ${index} predecessor F4 authority',
        'label: `collision named Search ${index}`',
        'const shareBeforeAuthority = searchAuthority',
        'label: `collision Share ${index}`',
        'const addBeforeAuthority = shareAuthority',
        'label: `collision Atlas Add ${index}`',
        'const landBeforeAuthority = addAuthority',
        'label: `collision Land ${index}`',
        'window.__CF_SLICE__.api.__smokePersistNow()',
      ]),
      ordered('collision settled Atlas travel', [
        'collision Atlas travel ${index} predecessor F4 authority',
        'label: `collision Atlas travel ${index}`',
        "expectedKinds: ['arc9-galaxy-arrival-v1']",
        "persistencePrefix: 'arc9-travel-committed:'",
        'collisionAtlasTravel.push(',
      ]),
      ordered('collision reload Search through Share', [
        'collision reload Search ${index} predecessor F4 authority',
        'label: `collision reload Search ${index}`',
        'const shareBeforeAuthority = searchAuthority',
        'label: `collision reload Share ${index}`',
        'collisionReloadSearches.push(',
      ]),
    ].filter((failure): failure is string => failure !== null);

    expect(failures).toEqual([]);
    expect(source).toContain('failSliceWithoutCascade(`${label.toUpperCase()}: Survey did not reach');
    expect(source).toContain('failSliceWithoutCascade(`${label.toUpperCase()}: keyboard Survey did not reach');
    expect(source).toContain('failSliceWithoutCascade(`${label.toUpperCase()}: phone Survey did not reach');
  });
});
