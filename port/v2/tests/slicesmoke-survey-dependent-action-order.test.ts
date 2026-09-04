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
        "label: 'clipboard denial Share'",
        'assessSettlement: assessArc9ShareSendSettlement,',
        "const deniedCopy = await waitDesktopValue('clipboard denial presentation'",
        'clipboard success Share predecessor F4 authority',
        "label: 'clipboard success Share'",
        'assessSettlement: assessArc9ShareSendSettlement,',
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
        "document.querySelector('#guidepanel [data-pnx]').click()",
        'let phoneLandHeartbeatQuiescence = null',
        "'window.__CF_SLICE__.api.__smokeQuiesceF4Heartbeat()'",
        "phoneLandHeartbeatQuiescence?.schema !== 'cf-v2-f4-heartbeat-quiescence/v1'",
        'phoneLandHeartbeatQuiescence.documentToken !== freshPhoneDocumentToken',
        'phoneLandHeartbeatQuiescence.wasRunning !== true',
        'phoneLandHeartbeatQuiescence.stopped !== true',
        'phoneLandHeartbeatQuiescence.cycleSettled !== true',
        'phone Earth Land predecessor after Guide closure F4 authority',
        '{ allowFresh: true, expectedToken: freshPhoneDocumentToken }',
        "const phoneLand = await evalNavPh(phoneCardActionCheck('landcta'))",
        "phoneLand.state.landing?.actionCoordinator?.inFlight !== false",
        "phoneLand.state.landing?.actionCoordinator?.owner?.busy !== false",
        "phoneLand.state.landing?.actionCoordinator?.owner?.operation !== null",
        "await touchNav(phoneLand.x, phoneLand.y)",
        "'phone Earth landing'",
        '15_000',
        'phone Earth Land writable surface settlement',
        '} finally {',
        "'window.__CF_SLICE__.api.__smokeResumeF4Heartbeat()'",
        "phoneLandHeartbeatResume?.schema !== 'cf-v2-f4-heartbeat-resume/v1'",
        'phoneLandHeartbeatResume.documentToken !== freshPhoneDocumentToken',
        'phoneLandHeartbeatResume.running !== true',
        'phoneEarthLandAfterAuthority?.state?.landing?.actionCoordinator?.inFlight !== false',
        'phoneEarthLandAfterAuthority?.state?.landing?.actionCoordinator?.owner?.busy !== false',
        'phoneEarthLandAfterAuthority?.state?.landing?.actionCoordinator?.owner?.operation !== null',
        '`arc0-land-committed:${phoneEarthLandAfterAuthority?.raw?.revision}`',
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
    expect(source).toContain('label, expr, timeoutMs = 6000, accept = (value) => Boolean(value)');
    expect(source).toContain('if (accept(last)) return last;');
    expect(source).toContain('assessment, state: snapshot.state, raw: snapshot.raw, token: snapshot.token,');
    expect(source).toContain("ready:state.mode==='surface',state,landing:state.landing,persistence:state.persistence,");
    expect(source).toContain('runtimeRevision: phoneEarthLandBeforeAuthority.state?.persistence?.runtime?.revision');
    expect(source).toContain('lastOutcome: phoneEarthLandBeforeAuthority.state?.persistence?.lastOutcome');
    expect(source).toContain('(evidence) => evidence?.ready === true');

    const phoneLandStart = source.indexOf('let phoneLandHeartbeatQuiescence = null');
    const phoneLandEnd = source.indexOf("const phoneLeave = await evalNavPh(phoneCardActionCheck('leaveworld'))", phoneLandStart);
    expect(phoneLandStart).toBeGreaterThan(-1);
    expect(phoneLandEnd).toBeGreaterThan(phoneLandStart);
    const phoneLandBlock = source.slice(phoneLandStart, phoneLandEnd);
    expect(phoneLandBlock.match(/__smokeQuiesceF4Heartbeat/g)).toHaveLength(1);
    expect(phoneLandBlock.match(/__smokeResumeF4Heartbeat/g)).toHaveLength(1);
    expect(phoneLandBlock.match(/touchNav\(phoneLand\.x, phoneLand\.y\)/g)).toHaveLength(1);
    expect(phoneLandBlock).toContain('phoneEarthLandAfterAuthority = await waitNavPhF4Writable(');
  });
});
