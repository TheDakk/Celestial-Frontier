import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const MAIN_URL = new URL('../apps/game/src/main.ts', import.meta.url);
const CARD_URL = new URL('../apps/game/src/landing-card.ts', import.meta.url);

describe('Landing card Main wiring', () => {
  const source = readFileSync(MAIN_URL, 'utf8');
  const cardSource = readFileSync(CARD_URL, 'utf8');

  it('projects card copy from the same exact authority inputs as Landing', () => {
    const start = source.indexOf('function projectCurrentLandingCardState(');
    const end = source.indexOf('\nfunction presentPlanetSurvey(', start);
    const body = source.slice(start, end);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(body).toContain('readArc2EngineeringLoadout(runtime.extensions)');
    expect(body).toContain('loadDescentWaveOffAuthorityV1({');
    expect(body).toContain('projectWorldOpportunity(address)');
    expect(body).toContain('projectArc0DescentWeatherV1(address, opportunity) !== null');
    expect(body).toContain('hasCanonicalWorldLanded(worldIdentityState, address)');
    expect(body).not.toContain("save.techOwned.includes('hull1')");
    expect(body).toContain('projectLandingCardPresentationV1(policy, save.hp)');
  });

  it('surfaces exact chance and bounded wave-off damage without writing', () => {
    const start = cardSource.indexOf('export function landingCardActionHtml(');
    expect(start).toBeGreaterThanOrEqual(0);
    const body = cardSource.slice(start);
    expect(body).toContain('data-landing-success=');
    expect(body).toContain('data-landing-damage-min=');
    expect(body).toContain('data-landing-damage-max=');
    expect(body).toContain('aria-label=');
    expect(body).toContain('aria-describedby="landing-approach-disclosure"');
    expect(body).toContain('data-landing-disclosure');
    expect(body).toContain('>${esc(state.disclosure)}</span>');
    const titleOnly = body.replace('>${esc(state.disclosure)}</span>', '></span>');
    expect(titleOnly).not.toContain('>${esc(state.disclosure)}</span>');
    expect(body).not.toMatch(/commit|persist|mutate|save\.[A-Za-z_$][\w$]*\s*=/u);
    expect(source).toContain(': landingCardActionHtml(landingState, esc)) +');
  });
});
